import { TILE_SIZE } from '../utils/constants.js';

export default class FireBlast extends Phaser.GameObjects.Sprite {

  constructor(game, cell) {
    super(game, (cell.col * TILE_SIZE) + TILE_SIZE / 2, (cell.row * TILE_SIZE) + TILE_SIZE / 2, cell.type, 0);

    this.game = game
    this.gridCol = cell.col;
    this.gridRow = cell.row;

    let animKey = 'blast_' + cell.type;
    if (!game.anims.exists(animKey)) {
      game.anims.create({
        key: animKey,
        frames: game.anims.generateFrameNumbers(cell.type, { start: 0, end: 4 }),
        frameRate: 15,
        repeat: 0
      });
    }

    this.game.add.existing(this);
    this.game.physics.add.existing(this);
    this.body.moves = false;
    this.setDepth(5);

    this.on('animationcomplete', () => this.destroy());
    this.anims.play(animKey);
  }

}
