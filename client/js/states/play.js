import { Text, createCircularAvatar } from '../helpers/elements.js';
import { findFrom, findAndDestroyFrom } from '../utils/utils.js';
import {
  TILE_SIZE, GAME_WIDTH, GAME_HEIGHT,
  EMPTY_CELL, NON_DESTRUCTIBLE_CELL, DESTRUCTIBLE_CELL,
  WALL_FRAME, BALK_FRAME, FLOOR_FRAME
} from '../utils/constants.js';

import Player from '../entities/player.js';
import EnemyPlayer from '../entities/enemy_player.js';
import Bomb from '../entities/bomb.js';
import Spoil from '../entities/spoil.js';
import FireBlast from '../entities/fire_blast.js';
import Bone from '../entities/bone.js';

class Play extends Phaser.Scene {

  constructor () {
    super('Play');
  }

  init({ game, observer, match }) {
    this.match = match || null;
    this.socket = this.registry.get('socketIO');
    this.currentGame = game;
    this.observer = observer;
  }

  create() {
    createCircularAvatar(this, 'avatar28', 'avatar_mask28', 'avatarCircle28', 28);

    this.createMap();
    this.createPlayers();
    this.createBombsAndSpoils();
    this.createColliders();
    this.createRoundTimer();
    this.setEventHandlers();

    this.registry.get('Sound').playMusic(this, 'bgMusic03');

    if (this.observer) {
      new Text({
        game: this,
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        text: 'Observing the current game ...',
        style: { font: '30px Arial', fill: '#FFFFFF' }
      }).setAlpha(0.5).setDepth(11);
    }

    this.events.on('shutdown', this.onShutdown, this);
  }

  update() {
    if (this.player && this.player.alive) {
      this.player.update();
      this.player.syncLabel();
    }

    for (let enemy of this.enemies.getChildren()) {
      enemy.syncLabel();
    }

    this.syncRoundTimer();
  }

  // The server tells us how much round time is left; we count it down locally.
  createRoundTimer() {
    let remaining = this.currentGame.roundRemainingMs;
    if (remaining == null) { return }

    this.roundEndsAt = Date.now() + remaining;

    // Same plate style as the top-left HUD strip, mirrored to the top-right.
    let plateX = GAME_WIDTH - 105;
    this.add.image(plateX, 2, 'placeholder_timer').setOrigin(0, 0).setDepth(10);
    this.timerText = this.add.text(plateX + 34, 2 + 7, '', {
      font: '14px Arial',
      fill: '#ffffff'
    }).setDepth(10);

    if (this.match) {
      this.add.text(plateX - 12, 2 + 7, 'Round ' + this.match.currentRound + ' / ' + this.match.totalRounds, {
        font: '14px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(1, 0).setDepth(10);
    }

    this.syncRoundTimer();
  }

  syncRoundTimer() {
    if (!this.timerText) { return }

    let secondsLeft = Math.max(0, Math.ceil((this.roundEndsAt - Date.now()) / 1000));
    let label = Math.floor(secondsLeft / 60) + ':' + String(secondsLeft % 60).padStart(2, '0');

    if (label !== this.timerText.text) {
      this.timerText.setText(label);
      this.timerText.setColor(secondsLeft <= 30 ? '#ff5555' : '#ffffff');
    }
  }

  // The map arrives from the server: players get layerInfo (the pristine map),
  // observers get shadowMap (the current, partially destroyed state).
  cellMatrix() {
    if (this.observer && this.currentGame.shadowMap) {
      return this.currentGame.shadowMap
    }

    let layerInfo = this.currentGame.layerInfo;
    let { wall, balk } = layerInfo.properties;

    let matrix = [];
    let i = 0;
    for (let row = 0; row < layerInfo.height; row++) {
      matrix.push([]);
      for (let col = 0; col < layerInfo.width; col++) {
        let gid = layerInfo.data[i];
        matrix[row][col] = (gid === wall) ? NON_DESTRUCTIBLE_CELL : (gid === balk) ? DESTRUCTIBLE_CELL : EMPTY_CELL;
        i++;
      }
    }
    return matrix
  }

  createMap() {
    this.walls = this.physics.add.staticGroup();
    this.balks = this.physics.add.staticGroup();
    this.balkSprites = new Map();
    this.solidBodies = new Map();

    let matrix = this.cellMatrix();
    this.solidGrid = matrix;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        let x = col * TILE_SIZE + TILE_SIZE / 2;
        let y = row * TILE_SIZE + TILE_SIZE / 2;

        this.add.image(x, y, 'tiles', FLOOR_FRAME);

        if (matrix[row][col] === NON_DESTRUCTIBLE_CELL) {
          let wall = this.walls.create(x, y, 'tiles', WALL_FRAME);
          this.solidBodies.set(row + '_' + col, wall);
        } else if (matrix[row][col] === DESTRUCTIBLE_CELL) {
          let balk = this.balks.create(x, y, 'tiles', BALK_FRAME);
          this.balkSprites.set(row + '_' + col, balk);
          this.solidBodies.set(row + '_' + col, balk);
        }
      }
    }

    this.refreshTileFaces();

    this.player  = null;
    this.bones   = this.add.group();
    this.bombs   = this.add.group();
    this.spoils  = this.add.group();
    this.blasts  = this.add.group();
    this.enemies = this.add.group();
  }

  isSolidCell(row, col) {
    if (row < 0 || col < 0 || row >= this.solidGrid.length || col >= this.solidGrid[0].length) { return true }
    return this.solidGrid[row][col] !== EMPTY_CELL
  }

  // Disable collision on tile faces that abut another solid tile (what Phaser
  // tilemap layers do natively). Without this, a body sliding along a flat
  // wall catches on the seam between every pair of adjacent tile bodies.
  refreshTileFaces() {
    for (let [key, sprite] of this.solidBodies) {
      let [row, col] = key.split('_').map(Number);
      let cc = sprite.body.checkCollision;
      cc.up    = !this.isSolidCell(row - 1, col);
      cc.down  = !this.isSolidCell(row + 1, col);
      cc.left  = !this.isSolidCell(row, col - 1);
      cc.right = !this.isSolidCell(row, col + 1);
      cc.none  = !(cc.up || cc.down || cc.left || cc.right);
    }
  }

  createPlayers() {
    for (let player of Object.values(this.currentGame.players)) {
      if (!player.isAlive) {
        this.bones.add(new Bone(this, Math.floor(player.position.x / TILE_SIZE), Math.floor(player.position.y / TILE_SIZE)));
        continue
      }

      if (!this.observer && player.id === this.socket.id) {
        this.player = new Player({ game: this, id: player.id, position: player.position, name: player.name });
      } else {
        this.enemies.add(new EnemyPlayer({ game: this, id: player.id, position: player.position, name: player.name }));
      }
    }
  }

  // Observers join mid-game: rebuild in-flight bombs and uncollected spoils.
  createBombsAndSpoils() {
    for (let bomb of (this.currentGame.bombs || [])) {
      this.bombs.add(new Bomb(this, bomb.id, bomb.ownerId, bomb.col, bomb.row));
    }
    for (let spoil of (this.currentGame.spoils || [])) {
      this.spoils.add(new Spoil(this, spoil));
    }
  }

  createColliders() {
    if (!this.player) { return }

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.balks);

    // You can walk off the bomb you are standing on, but never back onto a bomb.
    this.physics.add.collider(this.player, this.bombs, null, (player, bomb) => {
      return !(player.currentCol() === bomb.gridCol && player.currentRow() === bomb.gridRow)
    });

    this.physics.add.overlap(this.player, this.spoils, this.onPlayerVsSpoil, null, this);
    this.physics.add.overlap(this.player, this.blasts, this.onPlayerVsBlast, null, this);
  }

  setEventHandlers() {
    this.handlers = {
      'player-position-changed': this.onPlayerPositionChanged.bind(this),
      'bomb-show':               this.onBombShow.bind(this),
      'bomb-detonate':           this.onBombDetonate.bind(this),
      'spoil-destroy':           this.onSpoilDestroy.bind(this),
      'spoil-picked-up':         this.onSpoilPickedUp.bind(this),
      'bones-show':              this.onBonesShow.bind(this),
      'player-left':             this.onPlayerLeft.bind(this),
      'round-ended':             this.onRoundEnded.bind(this),
      'match-ended':             this.onMatchEnded.bind(this)
    };

    for (let [event, handler] of Object.entries(this.handlers)) {
      this.socket.on(event, handler);
    }
  }

  onShutdown() {
    for (let [event, handler] of Object.entries(this.handlers)) {
      this.socket.off(event, handler);
    }
    this.events.off('shutdown', this.onShutdown, this);
  }

  onPlayerVsSpoil(player, spoil) {
    this.socket.emit('player-spoil-pick-up', { spoilId: spoil.id });
    this.spoils.remove(spoil, true, true);
  }

  onPlayerVsBlast(player, blast) {
    if (!player.alive) { return }
    if (player.currentCol() !== blast.gridCol || player.currentRow() !== blast.gridRow) { return }

    this.socket.emit('player-dead', { col: player.currentCol(), row: player.currentRow() });
    player.becomesDead();
    this.registry.get('Sound').playSound(this, 'FxDeath01');
  }

  onPlayerPositionChanged({ playerId, x, y }) {
    let enemy = findFrom(playerId, this.enemies);
    if (!enemy) { return }

    enemy.goTo({ x: x, y: y })
  }

  onBombShow({ id, ownerId, col, row }) {
    if (this.player && ownerId === this.player.id) {
      this.player.activeBombs += 1;
    }
    this.bombs.add(new Bomb(this, id, ownerId, col, row));
  }

  onBombDetonate({ id, blastedCells }) {
    let bomb = findFrom(id, this.bombs);
    if (bomb && this.player && bomb.ownerId === this.player.id && this.player.activeBombs > 0) {
      this.player.activeBombs -= 1;
    }
    findAndDestroyFrom(id, this.bombs)

    this.registry.get('Sound').playSound(this, 'FxBoom01');

    for (let cell of blastedCells) {
      this.blasts.add(new FireBlast(this, cell));
    }

    let destroyedAny = false;
    for (let cell of blastedCells) {
      if (!cell.destroyed) { continue }

      let balk = this.balkSprites.get(cell.row + '_' + cell.col);
      if (balk) {
        this.balkSprites.delete(cell.row + '_' + cell.col);
        this.solidBodies.delete(cell.row + '_' + cell.col);
        this.solidGrid[cell.row][cell.col] = EMPTY_CELL;
        destroyedAny = true;
        this.balks.remove(balk);
        this.tweens.add({
          targets: balk,
          alpha: 0,
          duration: 300,
          onComplete: () => balk.destroy()
        });
      }
    }

    // Destroyed crates re-expose the previously interior faces of their neighbors.
    if (destroyedAny) { this.refreshTileFaces() }

    for (let cell of blastedCells) {
      if (!cell.destroyed || !cell.spoil) { continue }

      this.spoils.add(new Spoil(this, cell.spoil));
    }
  }

  onSpoilDestroy({ spoils }) {
    for (let spoil of spoils) {
      findAndDestroyFrom(spoil.id, this.spoils)
    }
  }

  onSpoilPickedUp({ playerId, spoilId, spoilType }) {
    if (this.player && playerId === this.player.id) {
      this.player.pickSpoil(spoilType);
      this.registry.get('Sound').playSound(this, 'FxPickup01');
    }

    findAndDestroyFrom(spoilId, this.spoils)
  }

  onBonesShow({ playerId, col, row }) {
    this.bones.add(new Bone(this, col, row));

    let enemy = findFrom(playerId, this.enemies);
    if (enemy) {
      enemy.removeLabel();
      findAndDestroyFrom(playerId, this.enemies);
    }
    this.registry.get('Sound').playSound(this, 'FxDeath01');
  }

  onPlayerLeft({ playerId }) {
    let enemy = findFrom(playerId, this.enemies);
    if (enemy) {
      enemy.removeLabel();
      findAndDestroyFrom(playerId, this.enemies);
    }
  }

  // Navigation rides these (not player-won/timer-ended): the server emits the
  // round outcome in the same batch, and Win's handlers only exist after its
  // create() runs — navigating here guarantees the payload arrives with us.
  onRoundEnded(payload) {
    this.scene.start('Win', { mode: 'round', ...payload });
  }

  onMatchEnded(payload) {
    this.scene.start('Win', { mode: 'match', ...payload });
  }
}

export default Play;
