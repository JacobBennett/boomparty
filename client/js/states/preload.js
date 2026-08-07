export class Preload extends Phaser.Scene {

  constructor () {
      super('Preload');
  }

  preload() {
    // Lobby:
    this.load.image('lobbyPoster', 'images/menu/lobby-bg-poster.png');
    this.load.video('lobbyBg', 'video/lobby2-bg.mp4', true);

    // Map tiles (frame 0 = wall, 1 = balk, 2 = floor):
    this.load.spritesheet('tiles', 'maps/tileset.png', { frameWidth: 32, frameHeight: 32 });

    // Game:
    this.load.spritesheet('explosion_center',     'images/game/explosion_center.png',     { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_horizontal', 'images/game/explosion_horizontal.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_vertical',   'images/game/explosion_vertical.png',   { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_up',         'images/game/explosion_up.png',         { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_right',      'images/game/explosion_right.png',      { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_down',       'images/game/explosion_down.png',       { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('explosion_left',       'images/game/explosion_left.png',       { frameWidth: 32, frameHeight: 32 });

    this.load.spritesheet('spoil_tileset', 'images/game/spoil_tileset.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('bomb_tileset',  'images/game/bombs.png',         { frameWidth: 32, frameHeight: 32 });
    this.load.image('bone_tileset', 'images/game/bone_tileset.png');

    // Avatars + masks (circular profile pictures):
    this.load.image('avatar28', 'images/game/avatar28.png');
    this.load.image('avatar32', 'images/game/avatar32.png');
    this.load.image('avatar64', 'images/game/avatar64.png');
    this.load.image('avatar_mask28', 'images/game/avatar_mask28.png');
    this.load.image('avatar_mask32', 'images/game/avatar_mask32.png');
    this.load.image('avatar_mask64', 'images/game/avatar_mask64.png');

    // HUD plates + pickup banners:
    this.load.image('placeholder_speed', 'images/game/placeholder_speed.png');
    this.load.image('placeholder_power', 'images/game/placeholder_power.png');
    this.load.image('placeholder_bomb',  'images/game/placeholder_bomb.png');
    this.load.image('placeholder_timer', 'images/game/placeholder_timer.png');

    this.load.image('speed_up_bonus', 'images/game/speed_up_bonus.png');
    this.load.image('power_up_bonus', 'images/game/power_up_bonus.png');
    this.load.image('bomb_up_bonus',  'images/game/bomb_up_bonus.png');

    this.registry.get('Sound').preload(this);
  }

  create() {
    this.scene.start('Lobby');
  }
}

export default Preload;
