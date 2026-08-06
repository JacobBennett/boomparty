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

    // Animated backdrop: looping muted video, cover-scaled (1280x720 x 0.8,
    // crops 64px per side). Its own first frame sits underneath as a poster
    // while the video loads. A full-canvas scrim keeps text readable on top.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'lobbyPoster').setScale(0.8);
    this.bgVideo = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'lobbyBg');
    this.bgVideo.setMute(true);
    // setScale, not setDisplaySize: the video has no texture frame until the
    // first frame decodes, and setDisplaySize throws on a frameless video.
    this.bgVideo.setScale(0.8); // 1280x720 -> 1024x576, covers the canvas
    this.bgVideo.play(true);

    // Browsers may refuse to autoplay even muted video in background tabs
    // ("video-only background media"). Retry on the first interaction; until
    // then the static splash underneath keeps the screen intact.
    let resumeVideo = () => {
      if (this.bgVideo && !this.bgVideo.isPlaying()) { this.bgVideo.play(true) }
    };
    this.input.on('pointerdown', resumeVideo);
    this.input.keyboard.on('keydown', resumeVideo);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.4);

    createCircularAvatar(this, 'avatar64', 'avatar_mask64', 'avatarCircle64', 64);

    this.statusText = new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: 120,
      text: '',
      style: { font: '28px Arial', fill: '#ffffff', align: 'center' }
    });

    this.startText = null;
    this.lineup = [];
    this.knownPlayers = 0;

    // Invite links carry the room code as ?room=CODE.
    let urlCode = (new URLSearchParams(window.location.search).get('room') || '').toUpperCase();
    this.urlRoomCode = /^[A-Z0-9]{6}$/.test(urlCode) ? urlCode : null;

    this.musicFading = false;
    this.registry.get('Sound').playMusic(this, 'bgMusicLobby');

    this.setEventHandlers();

    // Registry name = same-session rematch (rejoin instantly). Stored name =
    // returning visitor (greet them). Neither = first visit (ask).
    let playerName = this.registry.get('playerName');
    let storedName = this.loadStoredName();
    if (playerName) {
      this.enterGame(playerName);
    } else if (storedName) {
      this.showWelcomeBack(storedName);
    } else {
      this.showNameForm();
    }

    this.events.on('shutdown', this.onShutdown, this);
  }

  loadStoredName() {
    try {
      return (localStorage.getItem('boomparty.playerName') || '').trim() || null
    } catch (error) {
      return null
    }
  }

  saveStoredName(name) {
    try {
      localStorage.setItem('boomparty.playerName', name);
    } catch (error) { /* private browsing etc. — just don't persist */ }
  }

  // Swaps in a name-entry DOM fragment; the video's baked-in branding fills
  // the upper half of the screen, so no logo overlay is drawn.
  showEntryScreen(statusMessage, html) {
    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    this.statusText.setPosition(GAME_WIDTH / 2, 420);
    this.statusText.setText(statusMessage);
    this.nameForm = this.add.dom(GAME_WIDTH / 2, 495).createFromHTML(html);
    return this.nameForm;
  }

  leaveEntryScreen(name) {
    this.registry.set('playerName', name);
    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    this.enterGame(name);
  }

  showWelcomeBack(name) {
    let safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let form = this.showEntryScreen('Welcome back, ' + name + '!', `
      <div class='name-form'>
        <button type='button' name='playButton' class='game-button'>PLAY</button>
        <a class='change-name-link' name='changeName'>Not ${safeName}? Change name</a>
      </div>
    `);

    form.addListener('click');
    form.on('click', (event) => {
      if (event.target.name === 'playButton') { this.leaveEntryScreen(name) }
      if (event.target.name === 'changeName') { this.showNameForm(name) }
    });
  }

  showNameForm(prefill) {
    let form = this.showEntryScreen('What is your name?', `
      <div class='name-form'>
        <input type='text' name='playerName' maxlength='16' placeholder='Your name' autocomplete='off'/>
        <button type='button' name='playButton'>PLAY</button>
      </div>
    `);

    let input = form.getChildByName('playerName');
    if (prefill) { input.value = prefill; }
    input.focus();
    if (prefill) { input.select(); }

    let submit = () => {
      let name = input.value.trim();
      if (!name) { input.focus(); return }

      this.saveStoredName(name);
      this.leaveEntryScreen(name);
    };

    form.addListener('click');
    form.on('click', (event) => {
      if (event.target.name === 'playButton') { submit() }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { submit() }
    });
  }

  enterGame(name) {
    this.statusText.setPosition(GAME_WIDTH / 2, 120);
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

    // Fade the lobby music across the countdown so it ends as the game starts.
    if (!this.musicFading) {
      this.musicFading = true;
      this.registry.get('Sound').fadeOutMusic(this, 2500);
    }

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

    // The button row is re-derived on every update, so a promoted guest grows
    // a Start button automatically. Hidden during countdown. Everyone who has
    // joined gets an Invite button; only the host also gets Start.
    if (this.startText) { this.startText.destroy(); this.startText = null }
    if (countdown === null && joined) {
      let url = window.location.origin + '/?room=' + this.registry.get('roomCode');
      this.startText = this.add.dom(GAME_WIDTH / 2, 460).createFromHTML(`
        <div class='lobby-buttons'>
          <button type='button' name='inviteButton' class='game-button'>Invite</button>
          ${isHost ? "<button type='button' name='startButton' class='game-button'>▶ Start game</button>" : ''}
        </div>
      `);
      this.startText.addListener('click');
      this.startText.on('click', (event) => {
        if (event.target.name === 'startButton') { this.socket.emit('host-start') }
        if (event.target.name === 'inviteButton') { this.copyInviteLink(url, event.target) }
      });
    }
  }

  copyInviteLink(url, button) {
    let onCopied = () => {
      button.textContent = 'Copied URL';
      // Wall-clock timeout, not the Phaser clock: the game loop is throttled
      // in background tabs, but this label swap should always revert on time.
      setTimeout(() => {
        // The row may have been rebuilt by a lobby update; only touch a live button.
        if (button.isConnected) { button.textContent = 'Invite' }
      }, 3000);
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
      game: this, x: centerX, y: 158, text: players.length + ' / ' + maxPlayers + ' players',
      style: { font: '15px Arial', fill: '#aaaaaa' }
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
          game: this, x: x, y: 218, text: '★ host',
          style: { font: '14px Arial', fill: '#41a4f5' }
        }));
      }
      this.lineup.push(this.add.image(x, 265, 'avatarCircle64'));
      this.lineup.push(new Text({
        game: this, x: x, y: 315, text: player.name,
        style: player.id === this.socket.id
          ? { font: '15px Arial', fill: '#ffff00' }
          : { font: '14px Arial', fill: '#ffffff' }
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
    this.registry.get('Sound').stopFadedMusic();
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Lobby;
