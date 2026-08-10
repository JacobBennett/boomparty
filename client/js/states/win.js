import { Text } from '../helpers/elements.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

// Between-rounds and end-of-match screen. Round mode shows the round result
// plus scores and auto-advances when the server starts the next round; match
// mode shows the final standings and waits for input to return to the lobby.
class Win extends Phaser.Scene {

  constructor () {
    super('Win');
  }

  init(data = {}) {
    this.mode = data.mode || 'match';
    this.result = data;
  }

  create() {
    this.socket = this.registry.get('socketIO');
    let d = this.result;
    let centerX = GAME_WIDTH / 2;

    let headline, subline;
    if (this.mode === 'round') {
      headline = 'Round ' + d.currentRound + ' of ' + d.totalRounds;
      subline = d.timeUp ? 'Time is up! Nobody won this round.'
        : d.winnerName ? `"${d.winnerName}" wins the round!`
        : 'You all died!';
    } else {
      headline = d.tie ? "It's a tie!" : `"${d.matchWinnerName}" wins the match!`;
      subline = d.timeUp ? 'Time ran out in the final round.'
        : d.lastWinnerName ? `"${d.lastWinnerName}" won the final round.`
        : '';
    }

    new Text({
      game: this, x: centerX, y: 150, text: headline,
      style: { font: 'bold 36px Arial', fill: '#ffffff', align: 'center' }
    });
    new Text({
      game: this, x: centerX, y: 200, text: subline,
      style: { font: '20px Arial', fill: '#cccccc', align: 'center' }
    });

    let rows = (this.mode === 'round' ? d.scores : d.standings) || [];
    rows.forEach((row, index) => {
      new Text({
        game: this, x: centerX, y: 260 + index * 28,
        text: row.name + '  —  ' + row.wins + (row.wins === 1 ? ' win' : ' wins'),
        style: { font: '18px Arial', fill: '#ffffff' }
      });
    });

    if (this.mode === 'round') {
      this.nextRoundAt = Date.now() + (d.nextRoundIn || 10) * 1000;
      this.countText = new Text({
        game: this, x: centerX, y: 480, text: '',
        style: { font: '22px Arial', fill: '#41a4f5' }
      });

      // The next round arrives from the server with no input needed.
      this.socket.on('start-game', this.boundStart = ({ game, match }) => {
        this.scene.start('Play', { game: game, observer: false, match: match });
      });
      this.socket.on('observe-game', this.boundObserve = ({ game, match }) => {
        this.scene.start('Play', { game: game, observer: true, match: match });
      });
    } else {
      new Text({
        game: this, x: centerX, y: 480, text: 'Press Enter to return to the lobby',
        style: { font: '20px Arial', fill: '#41a4f5' }
      });
      this.input.keyboard.on('keydown-ENTER', this.returnToLobby, this);
      this.input.on('pointerdown', this.returnToLobby, this);
    }

    if (this.mode === 'round') {
      // Lobby music during the round summary, fading out over the last two
      // seconds before the next round. Wall-clock timer: the Phaser clock is
      // throttled in background tabs, but the server's schedule isn't.
      this.registry.get('Sound').playMusic(this, 'bgMusicLobby');
      let fadeDelay = Math.max(0, ((d.nextRoundIn || 10) - 2) * 1000);
      this.fadeTimeout = setTimeout(() => {
        this.registry.get('Sound').fadeOutMusic(this, 2000);
      }, fadeDelay);
    } else {
      this.registry.get('Sound').playMusic(this, 'bgMusic01');
    }

    this.events.on('shutdown', this.onShutdown, this);
  }

  update() {
    if (this.mode === 'round' && this.countText) {
      let seconds = Math.max(0, Math.ceil((this.nextRoundAt - Date.now()) / 1000));
      let label = 'Next round in ' + seconds + ' ...';
      if (label !== this.countText.text) { this.countText.setText(label) }
    }
  }

  returnToLobby() {
    this.scene.start('Lobby');
  }

  onShutdown() {
    if (this.boundStart) { this.socket.off('start-game', this.boundStart); this.boundStart = null }
    if (this.boundObserve) { this.socket.off('observe-game', this.boundObserve); this.boundObserve = null }
    if (this.fadeTimeout) { clearTimeout(this.fadeTimeout); this.fadeTimeout = null }
    this.registry.get('Sound').stopFadedMusic();
    this.input.keyboard.off('keydown-ENTER', this.returnToLobby, this);
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Win;
