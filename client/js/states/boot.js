import { Sound } from '../helpers/sound.js';

export class Boot extends Phaser.Scene {

  constructor () {
    super('Boot');
  }

  create() {
    // The game must keep reacting to server messages even when the window
    // doesn't have focus (two-windows multiplayer testing).
    this.registry.set('Sound', new Sound());
    this.registry.set('socketIO', io());
    this.scene.start('Preload');
  }

}

export default Boot;
