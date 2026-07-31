import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

// Top-left HUD strip: three label plates with live counters, plus the
// giant translucent "You died" overlay.
export default class Info {

  constructor({ game, player }) {
    this.game = game;
    this.player = player;

    this.style = { font: '14px Arial', fill: '#ffffff', align: 'left' }

    this.game.add.image(5, 2, 'placeholder_speed').setOrigin(0, 0).setDepth(10);
    this.speedText = this.game.add.text(5 + 32, 2 + 7, this.speedLabel(), this.style).setDepth(10);

    this.game.add.image(110, 2, 'placeholder_power').setOrigin(0, 0).setDepth(10);
    this.powerText = this.game.add.text(110 + 32, 2 + 7, this.powerLabel(), this.style).setDepth(10);

    this.game.add.image(215, 2, 'placeholder_bomb').setOrigin(0, 0).setDepth(10);
    this.bombsText = this.game.add.text(215 + 32, 2 + 7, this.bombsLabel(), this.style).setDepth(10);

    this.deadText = this.game.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'You died', {
      font: '130px Arial',
      fill: '#ffffff'
    });
    this.deadText.setOrigin(0.5, 0.5);
    this.deadText.setAlpha(0.3);
    this.deadText.setDepth(11);
    this.deadText.visible = false;
  }

  refreshStatistic() {
    this.speedText.text = this.speedLabel();
    this.powerText.text = this.powerLabel();
    this.bombsText.text = this.bombsLabel();
  }

  showDeadInfo() {
    this.deadText.visible = true
  }

  speedLabel() {
    return `x ${this.player.speedLevel}`
  }

  powerLabel() {
    return `x ${this.player.power}`
  }

  bombsLabel() {
    return `x ${this.player.totalBombs}`
  }
}
