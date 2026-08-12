// Temporarily muted: remaining tracks/effects are placeholders awaiting
// replacement. Restore to taste (music was 0.5, effects 0.8).
const MUSIC_VOLUME = 0;
const SOUND_VOLUME = 0;

// Replaced tracks/effects get their real volume here; everything else stays muted.
const MUSIC_VOLUMES = {
  bgMusicLobby: 0.25
};

const SOUND_VOLUMES = {
  FxPickup01: 0.4,
  FxBoom01: 0.4,
  FxClick01: 0.5,
  FxDeath01: 0.8
};

// Effects that can fire in bursts (e.g. chain-reaction bombs arrive in one
// frame) suppress repeats inside their window so they play once per burst.
const SOUND_DEBOUNCE_MS = {
  FxBoom01: 100
};

export class Sound {
  constructor() {
    this._soundOn = true;
    this._musicOn = true;
    this._bgMusicPlaying = false;
    this._currentMusic=null;
    this._musicSound=null;
    this._fadingSound=null;
    this._lastPlayedAt={};
    this._musicBaseVolume = 0;

    // User-facing master levels (0-1); they multiply the per-key base volumes
    // above and persist across visits.
    let levels = this.loadStoredLevels();
    this._soundLevel = levels.sound;
    this._musicLevel = levels.music;
  }

  loadStoredLevels() {
    try {
      // The binary mute toggle predates the volume sliders; carry it over once.
      if (localStorage.getItem('boomparty.muted') === 'true') {
        localStorage.removeItem('boomparty.muted');
        localStorage.setItem('boomparty.soundVolume', '0');
        localStorage.setItem('boomparty.musicVolume', '0');
        return { sound: 0, music: 0 };
      }
      localStorage.removeItem('boomparty.muted');
      return {
        sound: this.clampLevel(localStorage.getItem('boomparty.soundVolume')),
        music: this.clampLevel(localStorage.getItem('boomparty.musicVolume'))
      };
    } catch (error) {
      return { sound: 1, music: 1 };
    }
  }

  clampLevel(value) {
    let level = parseFloat(value);
    return Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 1;
  }

  get soundLevel() { return this._soundLevel }
  get musicLevel() { return this._musicLevel }

  setSoundLevel(level) {
    this._soundLevel = Math.min(1, Math.max(0, level));
    this.persistLevel('boomparty.soundVolume', this._soundLevel);
  }

  setMusicLevel(level) {
    this._musicLevel = Math.min(1, Math.max(0, level));
    this.persistLevel('boomparty.musicVolume', this._musicLevel);
    // Adjust the playing track live (but leave a mid-fade track alone).
    if (this._musicSound && this.bgMusicPlaying === true) {
      this._musicSound.setVolume(this._musicBaseVolume * this._musicLevel);
    }
  }

  persistLevel(key, level) {
    try { localStorage.setItem(key, String(level)) } catch (error) { /* private browsing etc. */ }
  }

  // Only audible (nonzero-volume) sounds are loaded; muted placeholder keys
  // are still referenced by the scenes but no-op in playMusic/playSound until
  // a real track lands here with a volume entry above.
  preload(scene){
    scene.load.audio('bgMusicLobby', ['sound/Musics/Iron Siege.mp3']);

    scene.load.audio('FxPickup01', ['sound/Effects/quirky-coin.mp3']);
    scene.load.audio('FxClick01', ['sound/Effects/explosion.m4a']);
    scene.load.audio('FxBoom01', ['sound/Effects/explosion.m4a']);
    scene.load.audio('FxDeath01', ['sound/Effects/death.mp3']);
  }

  playMusic(scene,soundId){
    // Muted placeholder keys aren't loaded at all; skip them quietly.
    if (!scene.cache.audio.exists(soundId)) { return }
    if (this.bgMusicPlaying === true && !(this._currentMusic==soundId)){
      scene.sound.stopByKey(this._currentMusic);
      //scene.sound.stopAll();
      this.bgMusicPlaying = false;
      scene.registry.set('Sound', this);
    }
    if (this.musicOn === true && this.bgMusicPlaying === false) {
      let baseVolume = MUSIC_VOLUMES[soundId] !== undefined ? MUSIC_VOLUMES[soundId] : MUSIC_VOLUME;
      this._musicBaseVolume = baseVolume;
      this._musicSound = scene.sound.add(soundId, { volume: baseVolume * this._musicLevel, loop: true });
      this._musicSound.play();
      this.bgMusicPlaying = true;
      this._currentMusic=soundId;
      scene.registry.set('Sound', this);
    }
  }

  // Fades the current music to silence, then stops it and resets the
  // bookkeeping so the next playMusic call starts fresh.
  fadeOutMusic(scene, duration) {
    if (!this._musicSound || this.bgMusicPlaying !== true) { return }

    let sound = this._musicSound;
    this.bgMusicPlaying = false;
    this._currentMusic = null;
    this._musicSound = null;
    this._fadingSound = sound;
    scene.registry.set('Sound', this);

    scene.tweens.add({
      targets: sound,
      volume: 0,
      duration: duration,
      onComplete: () => {
        sound.destroy();
        if (this._fadingSound === sound) { this._fadingSound = null }
      }
    });
  }

  // The fade tween dies with its scene; call this on scene shutdown so a
  // partially-faded track can't keep looping quietly in the background.
  stopFadedMusic() {
    if (this._fadingSound) {
      this._fadingSound.destroy();
      this._fadingSound = null;
    }
  }

  playSound(scene,soundId){
    // Muted placeholder keys aren't loaded at all; skip them quietly.
    if (!scene.cache.audio.exists(soundId)) { return }
    // Burst suppression: repeats of a debounced key inside its window no-op.
    let debounce = SOUND_DEBOUNCE_MS[soundId];
    if (debounce) {
      let now = Date.now();
      if (this._lastPlayedAt[soundId] && now - this._lastPlayedAt[soundId] < debounce) { return }
      this._lastPlayedAt[soundId] = now;
    }

    // Effects overlap freely (a pickup shouldn't cut off an explosion); each
    // one is its own sound instance, destroyed when it finishes.
    if (this.soundOn === true) {
      let baseVolume = SOUND_VOLUMES[soundId] !== undefined ? SOUND_VOLUMES[soundId] : SOUND_VOLUME;
      let effect = scene.sound.add(soundId, { volume: baseVolume * this._soundLevel, loop: false });
      effect.once('complete', () => effect.destroy());
      effect.play();
    }
  }

  set musicOn(value) {
    this._musicOn = value;
  }

  get musicOn() {
    return this._musicOn;
  }

  set soundOn(value) {
    this._soundOn = value;
  }

  get soundOn() {
    return this._soundOn;
  }

  set bgMusicPlaying(value) {
    this._bgMusicPlaying = value;
  }

  get bgMusicPlaying() {
    return this._bgMusicPlaying;
  }
}
