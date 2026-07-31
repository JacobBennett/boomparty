import { PING } from '../utils/constants.js';
import { Text } from '../helpers/elements.js';

export default class EnemyPlayer extends Phaser.GameObjects.Sprite {

  constructor({ game, id, position, name }) {
    super(game, position.x, position.y, 'avatarCircle28');

    this.game = game
    this.id = id;
    this.name = name;

    this.game.add.existing(this);
    this.game.physics.add.existing(this);
    this.body.pushable = false;
    this.body.immovable = true;
    this.body.moves = false;
    this.body.setCircle(13, 1, 1);
    this.setDepth(4);

    this.defineSelf(name)
  }

  goTo(newPosition) {
    this.tween = this.game.tweens.add({
      targets: this,
      x: newPosition.x,
      y: newPosition.y,
      duration: PING
    });
  }

  defineSelf(name) {
    this.nameText = new Text({
      game: this.game,
      x: this.x,
      y: this.y - 26,
      text: name,
      style: {
        font: '14px Arial',
        fill: '#FFFFFF',
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

  removeLabel() {
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }
  }
}
