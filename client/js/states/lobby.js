import { Text } from '../helpers/elements.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants.js';

// Host/guest lobby: the first player to enter hosts the room, watches the
// roster fill up, and decides when the game starts. Everyone else waits.
export class Lobby extends Phaser.Scene {

  constructor () {
    super('Lobby');
  }

  create() {
    this.socket = this.registry.get('socketIO');

    // Animated backdrop: looping muted video, pre-rendered at the canvas's
    // native 896x576. The 2x poster (1792x1152) sits underneath while the
    // video loads. A bottom scrim keeps text readable on top.
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'lobbyPoster').setScale(0.5);
    this.bgVideo = this.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'lobbyBg');
    this.bgVideo.setMute(true);
    this.bgVideo.play(true);

    // Browsers may refuse to autoplay even muted video in background tabs
    // ("video-only background media"). Retry on the first interaction; until
    // then the static splash underneath keeps the screen intact.
    let resumeVideo = () => {
      if (this.bgVideo && !this.bgVideo.isPlaying()) { this.bgVideo.play(true) }
    };
    this.input.on('pointerdown', resumeVideo);
    this.input.keyboard.on('keydown', resumeVideo);

    // Bottom gradient scrim: transparent at its top, dark at the screen edge,
    // so the UI text reads clearly while the artwork above stays undimmed.
    this.createScrimTexture();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT, 'lobbyScrim').setOrigin(0.5, 1);

    this.createSoundButton();

    this.statusText = new Text({
      game: this,
      x: GAME_WIDTH / 2,
      y: 396,
      text: '',
      style: { font: '24px Arial', fill: '#ffffff', align: 'center' }
    });

    this.lobbyModal = null;
    this.knownPlayers = 0;
    this.hostSettings = { rounds: 3, roundTime: 180 };

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

  createScrimTexture() {
    if (this.textures.exists('lobbyScrim')) { return }

    let height = GAME_HEIGHT / 2;
    let canvasTexture = this.textures.createCanvas('lobbyScrim', GAME_WIDTH, height);
    let ctx = canvasTexture.getContext();

    let gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, height);

    canvasTexture.refresh();
  }

  createSoundButton() {
    this.soundModal = null;
    this.soundButton = new Text({
      game: this,
      x: GAME_WIDTH - 28,
      y: 28,
      text: this.soundButtonIcon(),
      style: { font: '22px Arial' }
    });
    this.soundButton.setDepth(20);
    this.soundButton.setInteractive({ useHandCursor: true });
    this.soundButton.on('pointerdown', () => {
      if (this.soundModal) { this.closeSoundSettings() } else { this.showSoundSettings() }
    });
  }

  soundButtonIcon() {
    let sound = this.registry.get('Sound');
    return (sound.soundLevel === 0 && sound.musicLevel === 0) ? '🔇' : '🔊';
  }

  showSoundSettings() {
    let sound = this.registry.get('Sound');
    let soundPct = Math.round(sound.soundLevel * 100);
    let musicPct = Math.round(sound.musicLevel * 100);

    this.soundModal = this.add.dom(GAME_WIDTH / 2, GAME_HEIGHT / 2).createFromHTML(`
      <div class='lobby-modal sound-settings'>
        <h2>Sound Settings</h2>
        <div class='lobby-panel host-settings'>
          <label>Sound <span class='slider-value' name='soundValue'>${soundPct}%</span>
            <input type='range' name='soundRange' min='0' max='100' step='5' value='${soundPct}'/>
          </label>
          <label>Music <span class='slider-value' name='musicValue'>${musicPct}%</span>
            <input type='range' name='musicRange' min='0' max='100' step='5' value='${musicPct}'/>
          </label>
        </div>
        <div class='lobby-buttons'>
          <button type='button' name='closeButton' class='game-button'>Close</button>
        </div>
      </div>
    `);

    this.soundModal.addListener('input');
    this.soundModal.on('input', (event) => {
      let level = parseInt(event.target.value, 10) / 100;
      if (event.target.name === 'soundRange') {
        sound.setSoundLevel(level);
        this.soundModal.node.querySelector("span[name='soundValue']").textContent = event.target.value + '%';
      }
      if (event.target.name === 'musicRange') {
        // The playing lobby track follows the drag live.
        sound.setMusicLevel(level);
        this.soundModal.node.querySelector("span[name='musicValue']").textContent = event.target.value + '%';
      }
      this.soundButton.setText(this.soundButtonIcon());
    });

    // 'change' fires when a slider is released: preview the effect loudness.
    this.soundModal.addListener('change');
    this.soundModal.on('change', (event) => {
      if (event.target.name === 'soundRange') { sound.playSound(this, 'FxBoom01') }
    });

    this.soundModal.addListener('click');
    this.soundModal.on('click', (event) => {
      if (event.target.name === 'closeButton') { this.closeSoundSettings() }
    });
  }

  closeSoundSettings() {
    if (this.soundModal) { this.soundModal.destroy(); this.soundModal = null }
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
      if (event.target.name === 'playButton' || event.target.name === 'changeName') {
        this.registry.get('Sound').playSound(this, 'FxClick01');
      }
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

      this.registry.get('Sound').playSound(this, 'FxClick01');
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
    this.statusText.setPosition(GAME_WIDTH / 2, 396);
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

    if (players.length > this.knownPlayers && this.knownPlayers > 0) {
      this.registry.get('Sound').playSound(this, 'FxNewUser01');
    }
    this.knownPlayers = players.length;

    if (this.lobbyModal) { this.lobbyModal.destroy(); this.lobbyModal = null }

    if (countdown !== null) {
      this.statusText.setText('Get ready, game starts in ' + countdown);
      return
    }

    this.statusText.setText('');
    this.renderLobbyModal(hostId, maxPlayers, players, isHost, joined);
  }

  // The modal is rebuilt from scratch on every lobby update; slider values
  // live in this.hostSettings (updated on input), so rebuilds can't lose them.
  renderLobbyModal(hostId, maxPlayers, players, isHost, joined) {
    let escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let playerRows = players.map(player => {
      let classes = 'player-row' + (player.id === this.socket.id ? ' me' : '');
      let crown = player.id === hostId ? ' 👑' : '';
      return `<div class='${classes}'>${escape(player.name)}${crown}</div>`;
    }).join('');

    let middlePanel;
    if (isHost) {
      middlePanel = `
        <div class='lobby-panel host-settings'>
          <h3>Host Settings</h3>
          <label>Number of rounds <span class='slider-value' name='roundsValue'>${this.hostSettings.rounds}</span>
            <input type='range' name='roundsRange' min='1' max='5' step='1' value='${this.hostSettings.rounds}'/>
          </label>
          <label>Timer <span class='slider-value' name='roundTimeValue'>${this.formatSeconds(this.hostSettings.roundTime)}</span>
            <input type='range' name='roundTimeRange' min='60' max='300' step='15' value='${this.hostSettings.roundTime}'/>
          </label>
        </div>`;
    } else if (joined) {
      middlePanel = `<div class='waiting-note'>Waiting for the host to start the game ...</div>`;
    } else {
      middlePanel = `<div class='waiting-note'>Game is full — you will watch this round</div>`;
    }

    this.lobbyModal = this.add.dom(GAME_WIDTH / 2, GAME_HEIGHT / 2).createFromHTML(`
      <div class='lobby-modal'>
        <h2>Party Lobby</h2>
        <div class='player-count'>${players.length} / ${maxPlayers} players</div>
        <div class='lobby-panel player-list'>${playerRows}</div>
        ${middlePanel}
        <div class='lobby-buttons'>
          <button type='button' name='inviteButton' class='game-button'>Invite</button>
          ${isHost ? "<button type='button' name='startButton' class='game-button'>▶ Start game</button>" : ''}
        </div>
      </div>
    `);

    let url = window.location.origin + '/?room=' + this.registry.get('roomCode');
    this.lobbyModal.addListener('click');
    this.lobbyModal.on('click', (event) => {
      if (event.target.name === 'startButton' || event.target.name === 'inviteButton') {
        this.registry.get('Sound').playSound(this, 'FxClick01');
      }
      if (event.target.name === 'startButton') {
        this.socket.emit('host-start', {
          rounds: this.hostSettings.rounds,
          roundTime: this.hostSettings.roundTime
        });
      }
      if (event.target.name === 'inviteButton') { this.copyInviteLink(url, event.target) }
    });

    if (isHost) {
      this.lobbyModal.addListener('input');
      this.lobbyModal.on('input', (event) => {
        // node.querySelector, not getChildByName: the latter only matches form
        // elements (name doesn't reflect as a DOM property on spans).
        if (event.target.name === 'roundsRange') {
          this.hostSettings.rounds = parseInt(event.target.value, 10);
          this.lobbyModal.node.querySelector("span[name='roundsValue']").textContent = this.hostSettings.rounds;
        }
        if (event.target.name === 'roundTimeRange') {
          this.hostSettings.roundTime = parseInt(event.target.value, 10);
          this.lobbyModal.node.querySelector("span[name='roundTimeValue']").textContent = this.formatSeconds(this.hostSettings.roundTime);
        }
      });
    }
  }

  formatSeconds(totalSeconds) {
    return Math.floor(totalSeconds / 60) + ':' + String(totalSeconds % 60).padStart(2, '0')
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

  onStartGame({ game, match }) {
    this.scene.start('Play', { game: game, observer: false, match: match });
  }

  onObserveGame({ roomCode, game, match }) {
    this.rememberRoom(roomCode);
    this.scene.start('Play', { game: game, observer: true, match: match });
  }

  // Joining a room between rounds of a running match: wait out the window;
  // the server sends start-game/observe-game itself when the round begins.
  onWaitNextRound({ roomCode, currentRound, totalRounds }) {
    this.rememberRoom(roomCode);
    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    if (this.lobbyModal) { this.lobbyModal.destroy(); this.lobbyModal = null }
    this.statusText.setText('Match in progress — round ' + (currentRound + 1) + ' of ' + totalRounds + ' starts shortly ...');
  }

  setEventHandlers() {
    this.socket.on('lobby-update',         this.boundLobby = this.onLobbyUpdate.bind(this));
    this.socket.on('start-game-countdown', this.boundCountdown = this.onCountdown.bind(this));
    this.socket.on('start-game',           this.boundStart = this.onStartGame.bind(this));
    this.socket.on('observe-game',         this.boundObserve = this.onObserveGame.bind(this));
    this.socket.on('room-not-found',       this.boundNotFound = this.onRoomNotFound.bind(this));
    this.socket.on('wait-next-round',      this.boundWait = this.onWaitNextRound.bind(this));
  }

  onShutdown() {
    this.socket.off('lobby-update',         this.boundLobby);
    this.socket.off('start-game-countdown', this.boundCountdown);
    this.socket.off('start-game',           this.boundStart);
    this.socket.off('observe-game',         this.boundObserve);
    this.socket.off('room-not-found',       this.boundNotFound);
    this.socket.off('wait-next-round',      this.boundWait);

    if (this.nameForm) { this.nameForm.destroy(); this.nameForm = null }
    if (this.lobbyModal) { this.lobbyModal.destroy(); this.lobbyModal = null }
    this.closeSoundSettings();
    this.registry.get('Sound').stopFadedMusic();
    this.events.off('shutdown', this.onShutdown, this);
  }
}

export default Lobby;
