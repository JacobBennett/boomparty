import { Text } from '../helpers/elements.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

class Win extends Phaser.Scene {

  constructor () {
    super('Win');
  }

  init({ name, timeUp } = {}) {
    this.winnerName = name;
    this.timeUp = timeUp;
  }

  create() {
    new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      text: this.winnerText(),
      style: { font: '30px Arial', fill: '#FFFFFF', align: 'center' }
    })

    this.input.keyboard.on('keydown-ENTER', this.returnToLobby, this);
    this.input.on('pointerdown', this.returnToLobby, this);

    this.registry.get('Sound').playMusic(this, 'bgMusic01');
  }

  returnToLobby() {
    this.input.keyboard.off('keydown-ENTER', this.returnToLobby, this);
    this.scene.start('Lobby');
  }

  winnerText() {
    if (this.timeUp) {
      return 'Time is up! Nobody won.\nPress Enter to start a new game.'
    }
    if (this.winnerName) {
      return `Player "${this.winnerName}" won!\nPress Enter to start a new game.`
    }
    return 'You all died!\nPress Enter to start a new game.'
  }
}

export default Win;
