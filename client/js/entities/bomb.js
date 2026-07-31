import { TILE_SIZE, EXPLOSION_TIME } from '../utils/constants.js';

export default class Bomb extends Phaser.GameObjects.Sprite {

  constructor(game, id, ownerId, col, row) {
    super(game, (col * TILE_SIZE) + TILE_SIZE / 2, (row * TILE_SIZE) + TILE_SIZE / 2, 'bomb_tileset');
    this.game = game
    this.id = id;
    this.ownerId = ownerId;
    this.gridCol = col;
    this.gridRow = row;

    this.game.add.existing(this);
    this.game.physics.add.existing(this);
    this.body.pushable = false;
    this.body.immovable = true;
    this.body.moves = false;
    this.setDepth(3);

    // The slow swell is the fuse tell: the bomb reaches 1.2x right as it blows.
    this.game.tweens.add({
      targets: this,
      scale: 1.2,
      ease: 'Sine.inOut',
      duration: EXPLOSION_TIME
    });

    if (!this.game.anims.exists('bomb')) {
      this.game.anims.create({
        key: 'bomb',
        frames: this.game.anims.generateFrameNumbers('bomb_tileset', { start: 0, end: 13 }),
        frameRate: 6,
        repeat: -1
      });
    }

    this.anims.play('bomb');
  }

}
