export class Text extends Phaser.GameObjects.Text {

  constructor({ game: scene, x, y, text, style }) {
    super(scene, x, y, text, style);
    this.setOrigin(0.5, 0.5);

    scene.add.existing(this);
  }

}

/**
 * Floating "+1 SPEED" / "+1 BOMB" / "+1 POWER" banner shown on spoil pickup.
 * Rises 25px while fading out over 600ms, then destroys itself.
 */
export class BonusNotification extends Phaser.GameObjects.Image {

  constructor({ scene, asset, x, y }) {
    super(scene, x, y - 20, asset);

    scene.add.existing(this);

    scene.tweens.add({
      targets: this,
      y: this.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: () => this.destroy()
    });
  }

}

/**
 * Build a circular avatar texture by masking a source image, the same way
 * the original game masked profile pictures. Returns the output texture key.
 */
export function createCircularAvatar(scene, srcKey, maskKey, outKey, size) {
  if (scene.textures.exists(outKey)) { return outKey }

  let canvasTexture = scene.textures.createCanvas(outKey, size, size);
  let ctx = canvasTexture.getContext();

  let src = scene.textures.get(srcKey).getSourceImage();
  let mask = scene.textures.get(maskKey).getSourceImage();

  ctx.drawImage(src, 0, 0, size, size);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';

  canvasTexture.refresh();
  return outKey
}

/**
 * Create a virtual Joystick (movement stick + fire button) for touch devices.
 */
export class Virtualjoystick extends Phaser.GameObjects.Group {

  constructor({ scene, x, y, xx, yy }) {
    super(scene)

    this.scene = scene;

    var graphic1 = this.scene.add.graphics({
      x: 0,
      y: 0,

      lineStyle: {
           width: 3,
           color: 0xffffff,
           alpha: 1
       },
       fillStyle: {
           color: 0x888888,
           alpha: 0.2
       },

      add: true
    });
    var graphic2 = this.scene.add.graphics({
      x: 0,
      y: 0,

      lineStyle: {
           width: 3,
           color: 0xffffff,
           alpha: 1
       },
       fillStyle: {
           color: 0xcccccc,
           alpha: 0.5
       },

      add: true
    });

    //Add Fire button
    var graphics = this.scene.add.graphics({ fillStyle: { color: 0x888888, alpha: 0.2 } });
    var circle = new Phaser.Geom.Circle(xx, yy, 100, 0x888888);
    this.button01 = graphics.fillCircleShape(circle);
    this.button01.setInteractive(new Phaser.Geom.Circle(
      xx, // center x
      yy, // center y
      100 // radius
    ), Phaser.Geom.Circle.Contains);
    this.button01.on('pointerdown', this.onButton01Pointerdown, this);
    this.scene.joystickButton01Key = '';
    this.scene.add.existing(this.button01);

    //Add JoyStick
    this.joyStick = this.scene.plugins.get('rexvirtualjoystickplugin').add(this.scene, {
      x: x,
      y: y,
      radius: 100,
      base: graphic1.fillCircleShape(this.scene.add.circle(0, 0, 100, 0x888888, 0)),
      thumb: graphic2.fillCircleShape(this.scene.add.circle(0, 0, 50, 0xcccccc, 0)),
      forceMin: 0
    }).on('update', this.dumpJoyStickState, this);
    this.scene.joystickKey = '';
    this.scene.add.existing(this.joyStick);

    this.dumpJoyStickState();
  }

  onButton01Pointerdown() {
    this.scene.joystickButton01Key = 'down';
  }

  dumpJoyStickState() {
    var joystickKeys = this.joyStick.createCursorKeys();
    this.scene.joystickKey = '';
    for (var name in joystickKeys) {
        if (joystickKeys[name].isDown) {
          this.scene.joystickKey += name;
        }
    }
  }
}
