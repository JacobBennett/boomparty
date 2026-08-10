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

// Decorative frame around the canvas: scale the frame image (independently on
// each axis) so its black window coincides exactly with the live canvas rect.
// Measured from images/menu/border-boomparty.png.
const FRAME = { imgWidth: 2048, imgHeight: 1338, holeX: 459, holeY: 288, holeWidth: 1141, holeHeight: 689 };

function positionCanvasFrame() {
  let frame = document.getElementById('canvas-frame');
  let canvas = document.querySelector('#game-container canvas');
  if (!frame || !canvas) { return }

  let rect = canvas.getBoundingClientRect();
  if (rect.width === 0) { return }

  let scaleX = rect.width / FRAME.holeWidth;
  let scaleY = rect.height / FRAME.holeHeight;

  frame.style.width = (FRAME.imgWidth * scaleX) + 'px';
  frame.style.height = (FRAME.imgHeight * scaleY) + 'px';
  frame.style.left = (rect.left - FRAME.holeX * scaleX) + 'px';
  frame.style.top = (rect.top - FRAME.holeY * scaleY) + 'px';
  frame.style.display = 'block';
}

// The canvas appears asynchronously during boot; poll briefly until it exists.
let framePoll = setInterval(function () {
  positionCanvasFrame();
  if (document.querySelector('#game-container canvas')) { clearInterval(framePoll) }
}, 100);

// Phaser's own resize pass measures the parent only after scaling, so a single
// resize event (device rotation, programmatic resize) lands one frame behind.
// Re-measure first, then refresh, so the canvas settles immediately.
window.addEventListener('resize', function () {
  game.scale.getParentBounds();
  game.scale.refresh();
  positionCanvasFrame();
});

// Handy for debugging from the browser console.
window.game = game;
