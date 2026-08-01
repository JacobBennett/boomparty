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
