import Boot from './states/boot.js';
import Preload from './states/preload.js';
import Lobby from './states/lobby.js';
import Play from './states/play.js';
import Win from './states/win.js';

import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';

var config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  audio: {
    noAudio: false
  },
  fps: {
    // Keep the loop running via setTimeout even when the window is hidden,
    // so the game still reacts to server messages in a background window.
    forceSetTimeOut: true,
    target: 60
  },
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Never scale past native resolution; smaller windows still shrink to fit.
    maxWidth: GAME_WIDTH,
    maxHeight: GAME_HEIGHT,
  },
  scene: [Boot, Preload, Lobby, Play, Win],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  }
};

var game = new Phaser.Game(config);

// Phaser's own resize pass measures the parent only after scaling, so a single
// resize event (device rotation, programmatic resize) lands one frame behind.
// Re-measure first, then refresh, so the canvas settles immediately.
window.addEventListener('resize', function () {
  game.scale.getParentBounds();
  game.scale.refresh();
});

// Handy for debugging from the browser console.
window.game = game;
