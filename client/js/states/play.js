import { Virtualjoystick, Text, createCircularAvatar } from '../helpers/elements.js';
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

  init({ game, observer }) {
    this.socket = this.registry.get('socketIO');
    this.currentGame = game;
    this.observer = observer;
  }

  preload() {
    this.load.plugin('rexvirtualjoystickplugin', '/phaser3-rex-plugins/dist/rexvirtualjoystickplugin.min.js', false);
  }

  create() {
    createCircularAvatar(this, 'avatar28', 'avatar_mask28', 'avatarCircle28', 28);

    this.createMap();
    this.createPlayers();
    this.createBombsAndSpoils();
    this.createColliders();
    this.setEventHandlers();

    this.registry.get('Sound').playMusic(this, 'bgMusic03');

    if (!this.observer) {
      this.virtualJoyStick = new Virtualjoystick({ scene: this, x: 740, y: 430, xx: 150, yy: 430 });
    } else {
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

    let matrix = this.cellMatrix();

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        let x = col * TILE_SIZE + TILE_SIZE / 2;
        let y = row * TILE_SIZE + TILE_SIZE / 2;

        this.add.image(x, y, 'tiles', FLOOR_FRAME);

        if (matrix[row][col] === NON_DESTRUCTIBLE_CELL) {
          this.walls.create(x, y, 'tiles', WALL_FRAME);
        } else if (matrix[row][col] === DESTRUCTIBLE_CELL) {
          let balk = this.balks.create(x, y, 'tiles', BALK_FRAME);
          this.balkSprites.set(row + '_' + col, balk);
        }
      }
    }

    this.player  = null;
    this.bones   = this.add.group();
    this.bombs   = this.add.group();
    this.spoils  = this.add.group();
    this.blasts  = this.add.group();
    this.enemies = this.add.group();
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
    this.physics.add.collider(this.player, this.enemies);

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
      'player-won':              this.onPlayerWon.bind(this),
      'timer-ended':             this.onTimerEnded.bind(this)
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

    this.registry.get('Sound').playSound(this, 'FxExplosion01');

    for (let cell of blastedCells) {
      this.blasts.add(new FireBlast(this, cell));
    }

    for (let cell of blastedCells) {
      if (!cell.destroyed) { continue }

      let balk = this.balkSprites.get(cell.row + '_' + cell.col);
      if (balk) {
        this.balkSprites.delete(cell.row + '_' + cell.col);
        this.balks.remove(balk);
        this.tweens.add({
          targets: balk,
          alpha: 0,
          duration: 300,
          onComplete: () => balk.destroy()
        });
      }
    }

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
      this.registry.get('Sound').playSound(this, 'FxPickItem01');
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

  onPlayerWon({ name }) {
    this.scene.start('Win', { name: name });
  }

  onTimerEnded() {
    this.scene.start('Win', { timeUp: true });
  }
}

export default Play;
