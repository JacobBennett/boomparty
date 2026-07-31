import { SPEED, POWER, BOMBS, TILE_SIZE } from '../utils/constants.js';

export default class Spoil extends Phaser.GameObjects.Sprite {

  constructor(game, spoil) {
    // spoil_tileset frames: 0 = bomb-up, 1 = power-up, 2 = speed-up
    let frame = 2;
    if (spoil.spoilType === BOMBS) { frame = 0 }
    if (spoil.spoilType === POWER) { frame = 1 }
    if (spoil.spoilType === SPEED) { frame = 2 }

    super(game, (spoil.col * TILE_SIZE) + TILE_SIZE / 2, (spoil.row * TILE_SIZE) + TILE_SIZE / 2, 'spoil_tileset', frame);

    this.id = spoil.id

    game.add.existing(this);
    game.physics.add.existing(this);
    this.body.moves = false;
    this.setDepth(2);
  }

}
