import {
  PING, TILE_SIZE, SPEED, POWER, BOMBS,
  INITIAL_SPEED, STEP_SPEED, INITIAL_POWER, INITIAL_BOMBS, BOMB_COOLDOWN
} from '../utils/constants.js';

import Info from './info.js';
import { BonusNotification, Text } from '../helpers/elements.js';

const DIRECTIONS = {
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 }
};

const DIRECTION_NAMES = ['left', 'right', 'up', 'down'];

// Grid coordinates are in tile units: 0 is the centre of the first tile, 1 the
// centre of the second, and so on. A player is "on a lane" when the grid
// coordinate of the axis it is not travelling along is a whole number.
const EPSILON = 0.0001;

const isOnLane = (grid) => Math.abs(grid - Math.round(grid)) < EPSILON;
const centreOf = (index) => index * TILE_SIZE + TILE_SIZE / 2;

// A frame this long is a stall (tab restore, GC pause); walking the whole gap
// in one go would read as a teleport.
const MAX_FRAME_MS = 50;

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

    // Held directions, most recently pressed first.
    this.dirStack = [];

    this.game.add.existing(this);
    this.game.physics.add.existing(this);
    // The body exists only so spoils and blasts can overlap-test against it.
    // Walls, crates and bombs are resolved by the grid walk below — Arcade
    // separation is what used to jitter and snag on tile corners.
    this.body.moves = false;
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

  update(delta) {
    if (this.alive) {
      this.handleMoves(delta)
      this.handleBombs()
    }
  }

  currentSpeed() {
    return INITIAL_SPEED + STEP_SPEED * (this.speedLevel - 1)
  }

  defineKeyboard() {
    this.cursorKeys = this.game.input.keyboard.createCursorKeys();
    this.wasdKeys = this.game.input.keyboard.addKeys({ up: 'W', left: 'A', down: 'S', right: 'D' });
  }

  gridX() { return (this.x - TILE_SIZE / 2) / TILE_SIZE }
  gridY() { return (this.y - TILE_SIZE / 2) / TILE_SIZE }

  currentCol() { return Math.round(this.gridX()) }
  currentRow() { return Math.round(this.gridY()) }

  canEnter(col, row) {
    // The tile you are standing on is always yours to leave — that is what
    // lets you step off a bomb you just dropped (but never back onto it).
    if (col === this.currentCol() && row === this.currentRow()) { return true }
    if (this.game.isSolidCell(row, col)) { return false }
    if (this.game.bombAt(col, row)) { return false }
    return true
  }

  // The tile the player walks into next when travelling in `dir`.
  nextCell(dir) {
    let gx = this.gridX();
    let gy = this.gridY();

    if (dir.x !== 0) {
      return {
        col: dir.x > 0 ? Math.floor(gx + EPSILON) + 1 : Math.ceil(gx - EPSILON) - 1,
        row: Math.round(gy)
      }
    }

    return {
      col: Math.round(gx),
      row: dir.y > 0 ? Math.floor(gy + EPSILON) + 1 : Math.ceil(gy - EPSILON) - 1
    }
  }

  refreshDirStack() {
    let pressed = {
      left:  this.cursorKeys.left.isDown  || this.wasdKeys.left.isDown,
      right: this.cursorKeys.right.isDown || this.wasdKeys.right.isDown,
      up:    this.cursorKeys.up.isDown    || this.wasdKeys.up.isDown,
      down:  this.cursorKeys.down.isDown  || this.wasdKeys.down.isDown
    };

    for (let name of DIRECTION_NAMES) {
      let index = this.dirStack.indexOf(name);

      if (pressed[name] && index === -1) { this.dirStack.unshift(name) }
      if (!pressed[name] && index !== -1) { this.dirStack.splice(index, 1) }
    }
  }

  // A held direction can be walked right now when the player already sits on
  // its lane and the tile ahead is free.
  walkableDir() {
    for (let name of this.dirStack) {
      let dir = DIRECTIONS[name];
      let lane = dir.x !== 0 ? this.gridY() : this.gridX();

      if (!isOnLane(lane)) { continue }

      let cell = this.nextCell(dir);
      if (this.canEnter(cell.col, cell.row)) { return dir }
    }

    return null
  }

  // Nothing is walkable yet, but a held direction opens up once the player
  // slides onto its lane. Returns that slide — this is the corner assist that
  // replaces sliding along a wall until the physics lets go.
  laneAlignment() {
    for (let name of this.dirStack) {
      let dir = DIRECTIONS[name];
      let axis = dir.x !== 0 ? 'y' : 'x';
      let lane = axis === 'x' ? this.gridX() : this.gridY();

      if (isOnLane(lane)) { continue }

      let along = axis === 'x' ? Math.round(this.gridY()) : Math.round(this.gridX());
      let near = Math.round(lane);
      let far = (near === Math.floor(lane)) ? Math.ceil(lane) : Math.floor(lane);

      for (let index of [near, far]) {
        let col = axis === 'x' ? index : along;
        let row = axis === 'x' ? along : index;

        if (!this.canEnter(col, row)) { continue }
        if (!this.canEnter(col + dir.x, row + dir.y)) { continue }

        return { axis: axis, target: centreOf(index) }
      }
    }

    return null
  }

  // Walk `budget` pixels in `dir`, stopping at the next tile centre. Every
  // centre is a decision point, so a blocked tile always leaves the player
  // parked exactly on the last free centre — never wedged against a corner.
  stepAlong(dir, budget) {
    let axis = dir.x !== 0 ? 'x' : 'y';
    let sign = dir.x !== 0 ? dir.x : dir.y;
    let cell = this.nextCell(dir);
    let index = axis === 'x' ? cell.col : cell.row;

    if (!this.canEnter(cell.col, cell.row)) { index -= sign }

    let position = this[axis];
    let limit = centreOf(index);
    let target = position + sign * budget;

    target = sign > 0 ? Math.min(target, limit) : Math.max(target, limit);
    // A tile that turned solid under us (a bomb dropped next door) must not
    // drag us backwards.
    if ((target - position) * sign < 0) { target = position }

    this[axis] = target;
    return Math.abs(target - position)
  }

  handleMoves(delta) {
    this.refreshDirStack();

    let budget = this.currentSpeed() * (Math.min(delta, MAX_FRAME_MS) / 1000);

    while (budget > EPSILON) {
      let dir = this.walkableDir();

      if (dir) {
        let walked = this.stepAlong(dir, budget);
        if (walked <= EPSILON) { break }

        budget -= walked;
        continue
      }

      let alignment = this.laneAlignment();
      if (!alignment) { break }

      let position = this[alignment.axis];
      let distance = Math.abs(alignment.target - position);
      let slide = Math.min(budget, distance);

      this[alignment.axis] = (slide >= distance)
        ? alignment.target
        : position + Math.sign(alignment.target - position) * slide;

      budget -= slide;
      if (slide < distance) { break }
    }

    this.body.reset(this.x, this.y);
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
