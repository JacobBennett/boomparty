import {
  PING, TILE_SIZE, SPEED, POWER, BOMBS,
  INITIAL_SPEED, STEP_SPEED, INITIAL_POWER, INITIAL_BOMBS, BOMB_COOLDOWN
} from '../utils/constants.js';

import Info from './info.js';
import { BonusNotification, Text } from '../helpers/elements.js';

export default class Player extends Phaser.GameObjects.Sprite {

  constructor({ game, id, position, name }) {
    super(game, position.x, position.y, 'avatarCircle28');

    this.game = game;
    this.id = id;
    this.name = name;

    this.prevPosition = { x: position.x, y: position.y };

    this.speedLevel  = 1;
    this.power       = INITIAL_POWER;
    this.totalBombs  = INITIAL_BOMBS;
    this.activeBombs = 0;
    this._lastBombTime = 0;

    this.game.add.existing(this);
    this.game.physics.add.existing(this);
    this.body.pushable = false;
    // Square body: Arcade's circle-vs-rect corner separation catches on the
    // seams between adjacent wall tiles when sliding diagonally along a wall.
    this.body.setSize(24, 24);
    this.setDepth(4);

    this.game.time.addEvent({
      delay: PING,
      callback: this.positionUpdaterLoop.bind(this),
      callbackScope: this,
      loop: true
    });

    this.info = new Info({ game: this.game, player: this });

    this.defineKeyboard()
    this.defineSelf(name)
    this.socket = this.game.registry.get('socketIO');
    this.alive = true;
  }

  update() {
    if (this.alive) {
      this.handleMoves()
      this.handleBombs()
    }
  }

  currentSpeed() {
    return INITIAL_SPEED + STEP_SPEED * (this.speedLevel - 1)
  }

  defineKeyboard() {
    this.cursorKeys = this.game.input.keyboard.createCursorKeys();
  }

  handleMoves() {
    this.body.setVelocity(0);
    let speed = this.currentSpeed();

    if (this.cursorKeys.left.isDown) {
      this.body.setVelocityX(-speed);
    } else if (this.cursorKeys.right.isDown) {
      this.body.setVelocityX(speed);
    }

    if (this.cursorKeys.up.isDown) {
      this.body.setVelocityY(-speed);
    } else if (this.cursorKeys.down.isDown) {
      this.body.setVelocityY(speed);
    }
  }

  handleBombs() {
    if (this.cursorKeys.space.isDown) {
      let now = this.game.time.now;

      if (now <= this._lastBombTime) { return }
      if (this.activeBombs >= this.totalBombs) { return }

      this._lastBombTime = now + BOMB_COOLDOWN;

      this.socket.emit('player-bomb-create', { col: this.currentCol(), row: this.currentRow() });
    }
  }

  currentCol() {
    return Math.floor(this.x / TILE_SIZE)
  }

  currentRow() {
    return Math.floor(this.y / TILE_SIZE)
  }

  positionUpdaterLoop() {
    let newPosition = { x: this.x, y: this.y }

    if (this.prevPosition.x !== newPosition.x || this.prevPosition.y !== newPosition.y) {
      this.socket.emit('player-position-update', newPosition);
      this.prevPosition = newPosition;
    }
  }

  becomesDead() {
    this.alive = false;
    this.info.showDeadInfo()
    if (this.nameText) { this.nameText.destroy() }
    this.destroy();
  }

  pickSpoil(spoilType) {
    if (spoilType === SPEED) { this.increaseSpeed() }
    if (spoilType === POWER) { this.increasePower() }
    if (spoilType === BOMBS) { this.increaseBombs() }
  }

  increaseSpeed() {
    this.speedLevel += 1;
    this.info.refreshStatistic();
    new BonusNotification({ scene: this.game, asset: 'speed_up_bonus', x: this.x, y: this.y })
  }

  increasePower() {
    this.power += 1;
    this.info.refreshStatistic();
    new BonusNotification({ scene: this.game, asset: 'power_up_bonus', x: this.x, y: this.y })
  }

  increaseBombs() {
    this.totalBombs += 1;
    this.info.refreshStatistic();
    new BonusNotification({ scene: this.game, asset: 'bomb_up_bonus', x: this.x, y: this.y })
  }

  defineSelf(name) {
    this.nameText = new Text({
      game: this.game,
      x: this.x,
      y: this.y - 26,
      text: `✮ ${name} ✮`,
      style: {
        font: '15px Arial',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }
    })
    this.nameText.setDepth(6);
  }

  syncLabel() {
    if (this.nameText) {
      this.nameText.setPosition(this.x, this.y - 26);
    }
  }
}
