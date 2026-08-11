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
      let volume = MUSIC_VOLUMES[soundId] !== undefined ? MUSIC_VOLUMES[soundId] : MUSIC_VOLUME;
      this._musicSound = scene.sound.add(soundId, { volume: volume, loop: true });
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
      let volume = SOUND_VOLUMES[soundId] !== undefined ? SOUND_VOLUMES[soundId] : SOUND_VOLUME;
      let effect = scene.sound.add(soundId, { volume: volume, loop: false });
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
