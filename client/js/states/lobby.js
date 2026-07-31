import { Text, createCircularAvatar } from '../helpers/elements.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

// Single auto-matchmaking lobby, modeled on the original deployed game:
// type your name once, then every visit goes straight into the queue.
export class Lobby extends Phaser.Scene {

  constructor () {
    super('Lobby');
  }

  create() {
    this.socket = this.registry.get('socketIO');

    this.add.image(GAME_WIDTH / 2, 110, 'banner').setScale(0.85);

    createCircularAvatar(this, 'avatar64', 'avatar_mask64', 'avatarCircle64', 64);

    this.statusText = new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: 300,
      text: '',
      style: { font: '35px Arial', fill: '#ffffff', align: 'center' }
    });

    this.soloText = null;
    this.lineup = [];
    this.knownPlayers = 0;

    this.registry.get('Sound').playMusic(this, 'bgMusic02');

    this.setEventHandlers();

    let playerName = this.registry.get('playerName');
    if (playerName) {
      this.enterGame(playerName);
    } else {
      this.showNameForm();
    }

    this.events.on('shutdown', this.onShutdown, this);
  }

  showNameForm() {
    this.statusText.setText('What is your name?');

    this.nameForm = this.add.dom(GAME_WIDTH / 2, 390).createFromHTML(`
      <div class='name-form'>
        <input type='text' name='playerName' maxlength='16' placeholder='Your name' autocomplete='off'/>
        <button type='button' name='playButton'>PLAY</button>
      </div>
    `);

    let input = this.nameForm.getChildByName('playerName');
    input.focus();

    let submit = () => {
      let name = input.value.trim();
      if (!name) { input.focus(); return }

      this.registry.set('playerName', name);
      this.nameForm.destroy();
      this.nameForm = null;
      this.enterGame(name);
    };

    this.nameForm.addListener('click');
    this.nameForm.on('click', (event) => {
      if (event.target.name === 'playButton') { submit() }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { submit() }
    });
  }

  enterGame(name) {
    this.statusText.setText('Waiting for another player ...');

    this.soloText = new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: 480,
      text: '▶ Start without waiting',
      style: { font: '20px Arial', fill: '#41a4f5' }
    });
    this.soloText.setInteractive({ useHandCursor: true });
    this.soloText.on('pointerdown', () => this.socket.emit('force-start'));

    this.socket.emit('enter-game', { name: name });
  }

  onCountdown({ countdown, players }) {
    this.statusText.setText('Get ready, game starts in ' + countdown);

    if (this.soloText) { this.soloText.destroy(); this.soloText = null }

    if (players.length > this.knownPlayers && this.knownPlayers > 0) {
      this.registry.get('Sound').playSound(this, 'FxNewUser01');
    }
    this.knownPlayers = players.length;

    this.buildLineup(players);
  }

  buildLineup(players) {
    for (let item of this.lineup) { item.destroy() }
    this.lineup = [];

    let me = players.find(player => player.id === this.socket.id);
    let enemies = players.filter(player => player.id !== this.socket.id);

    let centerX = GAME_WIDTH / 2;

    if (me) {
      this.lineup.push(this.add.image(centerX, 380, 'avatarCircle64'));
      this.lineup.push(new Text({
        game: this, x: centerX, y: 425, text: me.name,
        style: { font: '15px Arial', fill: '#ffff00' }
      }));
    }

    if (enemies.length === 0) {
      this.lineup.push(new Text({
        game: this, x: centerX, y: 470, text: 'Starting game in single player mode',
        style: { font: '20px Arial', fill: '#ffffff' }
      }));
      return
    }

    this.lineup.push(new Text({
      game: this, x: centerX, y: 460, text: 'vs',
      style: { font: '20px Arial', fill: '#ffffff' }
    }));

    let pitch = Math.min(90, (GAME_WIDTH - 100) / enemies.length);
    let startX = centerX - (pitch * (enemies.length - 1)) / 2;

    enemies.forEach((enemy, index) => {
      let x = startX + index * pitch;
      this.lineup.push(this.add.image(x, 510, 'avatarCircle64').setScale(0.75));
      this.lineup.push(new Text({
        game: this, x: x, y: 545, text: enemy.name,
        style: { font: '13px Arial', fill: '#ffffff' }
      }));
    });
  }

  onWaiting() {
    this.knownPlayers = 0;
    for (let item of this.lineup) { item.destroy() }
    this.lineup = [];
    this.statusText.setText('Waiting for another player ...');
  }

  onStartGame({ game }) {
    this.scene.start('Play', { game: game, observer: false });
  }

  onObserveGame({ game }) {
    this.scene.start('Play', { game: game, observer: true });
  }

  setEventHandlers() {
    this.socket.on('start-game-countdown', this.boundCountdown = this.onCountdown.bind(this));
    this.socket.on('waiting-for-players',  this.boundWaiting = this.onWaiting.bind(this));
    this.socket.on('start-game',           this.boundStart = this.onStartGame.bind(this));
    this.socket.on('observe-game',         this.boundObserve = this.onObserveGame.bind(this));
  }

  onShutdown() {
    this.socket.off('start-game-countdown', this.boundCountdown);
    this.socket.off('waiting-for-players',  this.boundWaiting);
    this.socket.off('start-game',           this.boundStart);
    this.socket.off('observe-game',         this.boundObserve);

    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Lobby;
