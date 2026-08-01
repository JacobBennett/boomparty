import { Text, createCircularAvatar } from '../helpers/elements.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

// Host/guest lobby: the first player to enter hosts the room, watches the
// roster fill up, and decides when the game starts. Everyone else waits.
export class Lobby extends Phaser.Scene {

  constructor () {
    super('Lobby');
  }

  create() {
    this.socket = this.registry.get('socketIO');

    // Full-canvas splash backdrop (1408x768 art, cover-scaled: crops 80px per
    // side, keeps the logo intact). The UI lives below it, over a dark scrim.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'splash').setDisplaySize(1056, 576);
    this.add.rectangle(GAME_WIDTH / 2, 480, GAME_WIDTH, 192, 0x000000, 0.5);

    createCircularAvatar(this, 'avatar64', 'avatar_mask64', 'avatarCircle64', 64);

    this.statusText = new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: 405,
      text: '',
      style: { font: '24px Arial', fill: '#ffffff', align: 'center' }
    });

    this.startText = null;
    this.lineup = [];
    this.knownPlayers = 0;

    this.registry.get('Sound').playMusic(this, 'bgMusic02');

    this.setEventHandlers();

    // The name lives only in the Phaser registry: a page reload shows the form
    // again and (server-side) hands host duties to the next-oldest player.
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

    this.nameForm = this.add.dom(GAME_WIDTH / 2, 480).createFromHTML(`
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
    this.statusText.setText('Joining ...');
    this.socket.emit('enter-game', { name: name });
  }

  onLobbyUpdate({ hostId, maxPlayers, players }) {
    this.renderLobby(hostId, maxPlayers, players, null);
  }

  onCountdown({ countdown, hostId, maxPlayers, players }) {
    this.renderLobby(hostId, maxPlayers, players, countdown);
  }

  renderLobby(hostId, maxPlayers, players, countdown) {
    let isHost = hostId === this.socket.id;
    let joined = players.some(player => player.id === this.socket.id);

    if (countdown !== null) {
      this.statusText.setText('Get ready, game starts in ' + countdown);
    } else if (isHost) {
      this.statusText.setText('You are the host — start when ready');
    } else if (joined) {
      this.statusText.setText('Waiting for the host to start the game ...');
    } else {
      this.statusText.setText('Game is full — you will watch this round');
    }

    if (players.length > this.knownPlayers && this.knownPlayers > 0) {
      this.registry.get('Sound').playSound(this, 'FxNewUser01');
    }
    this.knownPlayers = players.length;

    this.buildLineup(players, hostId, maxPlayers);

    // The Start button is re-derived on every update, so a promoted guest
    // grows one automatically. Never shown once the countdown is running.
    if (this.startText) { this.startText.destroy(); this.startText = null }
    if (countdown === null && isHost) {
      this.startText = new Text({
        game: this,
        x: GAME_WIDTH / 2,
        y: 550,
        text: '▶ Start game',
        style: { font: '20px Arial', fill: '#41a4f5' }
      });
      this.startText.setInteractive({ useHandCursor: true });
      this.startText.on('pointerdown', () => this.socket.emit('host-start'));
    }
  }

  buildLineup(players, hostId, maxPlayers) {
    for (let item of this.lineup) { item.destroy() }
    this.lineup = [];

    let centerX = GAME_WIDTH / 2;

    this.lineup.push(new Text({
      game: this, x: centerX, y: 430, text: players.length + ' / ' + maxPlayers + ' players',
      style: { font: '14px Arial', fill: '#aaaaaa' }
    }));

    // One row: self first (yellow name), everyone else after.
    let me = players.filter(player => player.id === this.socket.id);
    let others = players.filter(player => player.id !== this.socket.id);
    let lineup = me.concat(others);

    let pitch = Math.min(90, (GAME_WIDTH - 100) / lineup.length);
    let startX = centerX - (pitch * (lineup.length - 1)) / 2;

    lineup.forEach((player, index) => {
      let x = startX + index * pitch;
      if (player.id === hostId) {
        this.lineup.push(new Text({
          game: this, x: x, y: 452, text: '★ host',
          style: { font: '13px Arial', fill: '#41a4f5' }
        }));
      }
      this.lineup.push(this.add.image(x, 484, 'avatarCircle64').setScale(0.75));
      this.lineup.push(new Text({
        game: this, x: x, y: 518, text: player.name,
        style: player.id === this.socket.id
          ? { font: '14px Arial', fill: '#ffff00' }
          : { font: '13px Arial', fill: '#ffffff' }
      }));
    });
  }

  onStartGame({ game }) {
    this.scene.start('Play', { game: game, observer: false });
  }

  onObserveGame({ game }) {
    this.scene.start('Play', { game: game, observer: true });
  }

  setEventHandlers() {
    this.socket.on('lobby-update',         this.boundLobby = this.onLobbyUpdate.bind(this));
    this.socket.on('start-game-countdown', this.boundCountdown = this.onCountdown.bind(this));
    this.socket.on('start-game',           this.boundStart = this.onStartGame.bind(this));
    this.socket.on('observe-game',         this.boundObserve = this.onObserveGame.bind(this));
  }

  onShutdown() {
    this.socket.off('lobby-update',         this.boundLobby);
    this.socket.off('start-game-countdown', this.boundCountdown);
    this.socket.off('start-game',           this.boundStart);
    this.socket.off('observe-game',         this.boundObserve);

    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    this.startText = null;
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Lobby;
