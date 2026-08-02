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
    this.inviteText = null;
    this.lineup = [];
    this.knownPlayers = 0;

    // Invite links carry the room code as ?room=CODE.
    let urlCode = (new URLSearchParams(window.location.search).get('room') || '').toUpperCase();
    this.urlRoomCode = /^[A-Z0-9]{6}$/.test(urlCode) ? urlCode : null;

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

    // A remembered room (rematch) or an invite link joins; otherwise create.
    let code = this.registry.get('roomCode') || this.urlRoomCode;
    if (code) {
      this.socket.emit('join-room', { roomCode: code, name: name });
    } else {
      this.socket.emit('create-room', { name: name });
    }
  }

  // Keep the room code in the registry (survives the Win -> Lobby rematch
  // loop) and in the address bar (makes the host's own URL shareable).
  rememberRoom(roomCode) {
    if (!roomCode) { return }
    this.registry.set('roomCode', roomCode);
    history.replaceState(null, '', '/?room=' + roomCode);
  }

  onLobbyUpdate({ roomCode, hostId, maxPlayers, players }) {
    this.rememberRoom(roomCode);
    this.renderLobby(hostId, maxPlayers, players, null);
  }

  onCountdown({ roomCode, countdown, hostId, maxPlayers, players }) {
    this.rememberRoom(roomCode);
    this.renderLobby(hostId, maxPlayers, players, countdown);
  }

  onRoomNotFound({ roomCode }) {
    this.registry.remove('roomCode');
    this.urlRoomCode = null;
    history.replaceState(null, '', '/');
    this.statusText.setText('Room ' + roomCode + ' not found — creating a new room ...');
    this.time.delayedCall(2000, () => {
      this.socket.emit('create-room', { name: this.registry.get('playerName') });
    });
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

    // The invite link and Start button are re-derived on every update, so a
    // promoted guest grows a button automatically. Hidden during countdown.
    if (this.inviteText) { this.inviteText.destroy(); this.inviteText = null }
    if (countdown === null && joined) {
      let url = window.location.origin + '/?room=' + this.registry.get('roomCode');
      this.inviteText = new Text({
        game: this,
        x: GAME_WIDTH / 2,
        y: 532,
        text: 'Invite: ' + url + '  (click to copy)',
        style: { font: '13px Arial', fill: '#41a4f5' }
      });
      this.inviteText.setInteractive({ useHandCursor: true });
      this.inviteText.on('pointerdown', () => this.copyInviteLink(url));
    }

    if (this.startText) { this.startText.destroy(); this.startText = null }
    if (countdown === null && isHost) {
      this.startText = new Text({
        game: this,
        x: GAME_WIDTH / 2,
        y: 556,
        text: '▶ Start game',
        style: { font: '20px Arial', fill: '#41a4f5' }
      });
      this.startText.setInteractive({ useHandCursor: true });
      this.startText.on('pointerdown', () => this.socket.emit('host-start'));
    }
  }

  copyInviteLink(url) {
    let onCopied = () => {
      if (!this.inviteText) { return }
      this.inviteText.setText('Copied!');
      this.time.delayedCall(1500, () => {
        if (this.inviteText) { this.inviteText.setText('Invite: ' + url + '  (click to copy)') }
      });
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onCopied).catch(() => this.fallbackCopy(url, onCopied));
    } else {
      this.fallbackCopy(url, onCopied);
    }
  }

  // For non-secure origins where the async clipboard API is unavailable.
  fallbackCopy(url, onCopied) {
    let area = document.createElement('textarea');
    area.value = url;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); onCopied(); } catch (error) {}
    area.remove();
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

  onObserveGame({ roomCode, game }) {
    this.rememberRoom(roomCode);
    this.scene.start('Play', { game: game, observer: true });
  }

  setEventHandlers() {
    this.socket.on('lobby-update',         this.boundLobby = this.onLobbyUpdate.bind(this));
    this.socket.on('start-game-countdown', this.boundCountdown = this.onCountdown.bind(this));
    this.socket.on('start-game',           this.boundStart = this.onStartGame.bind(this));
    this.socket.on('observe-game',         this.boundObserve = this.onObserveGame.bind(this));
    this.socket.on('room-not-found',       this.boundNotFound = this.onRoomNotFound.bind(this));
  }

  onShutdown() {
    this.socket.off('lobby-update',         this.boundLobby);
    this.socket.off('start-game-countdown', this.boundCountdown);
    this.socket.off('start-game',           this.boundStart);
    this.socket.off('observe-game',         this.boundObserve);
    this.socket.off('room-not-found',       this.boundNotFound);

    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    this.startText = null;
    this.inviteText = null;
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Lobby;
