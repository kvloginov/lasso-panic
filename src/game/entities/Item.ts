import type Phaser from 'phaser';

export enum ItemState {
  Preview = 'preview',
  Active = 'active'
}

export interface ItemInit {
  readonly id: number;
  readonly typeId: string;
  readonly frameKeys: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly previewDurationSec: number;
}

export class Item {
  public readonly id: number;

  public readonly typeId: string;

  public readonly sprite: Phaser.GameObjects.Sprite;

  public state: ItemState;

  public previewRemainingSec: number;

  private readonly scene: Phaser.Scene;

  private readonly frameKeys: readonly string[];

  private baseScale: number;

  private frameTimerSec = 0;

  private frameIndex = 0;

  private readonly frameStepSec: number;

  private previewTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, init: ItemInit) {
    this.scene = scene;
    this.id = init.id;
    this.typeId = init.typeId;
    this.frameKeys = init.frameKeys;
    this.baseScale = init.scale;
    this.previewRemainingSec = init.previewDurationSec;
    this.frameStepSec = 0.24 + (init.id % 5) * 0.03;

    this.sprite = scene.add.sprite(init.x, init.y, this.frameKeys[0]);
    this.sprite.setOrigin(0.5);

    this.state = ItemState.Preview;
    this.setPreview();
  }

  public getCenter(): { readonly x: number; readonly y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public setPreview(): void {
    this.state = ItemState.Preview;
    this.sprite.setAlpha(0.35);
    this.sprite.setScale(this.baseScale * 0.9);

    this.previewTween?.remove();
    this.previewTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.26, to: 0.48 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  public activate(): void {
    if (this.state === ItemState.Active) {
      return;
    }

    this.state = ItemState.Active;
    this.previewRemainingSec = 0;
    this.previewTween?.remove();
    this.previewTween = undefined;

    this.sprite.setAlpha(1);
    this.sprite.setScale(this.baseScale);

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 1.15,
      scaleY: this.baseScale * 1.15,
      duration: 70,
      yoyo: true,
      ease: 'Quad.Out'
    });
  }

  public setScale(scale: number): void {
    this.baseScale = scale;
    const multiplier = this.state === ItemState.Preview ? 0.9 : 1;
    this.sprite.setScale(this.baseScale * multiplier);
  }

  public tick(dtSec: number): boolean {
    this.frameTimerSec += dtSec;
    if (this.frameTimerSec >= this.frameStepSec && this.frameKeys.length > 1) {
      this.frameTimerSec -= this.frameStepSec;
      this.frameIndex = (this.frameIndex + 1) % this.frameKeys.length;
      this.sprite.setTexture(this.frameKeys[this.frameIndex]);
    }

    if (this.state === ItemState.Preview) {
      this.previewRemainingSec -= dtSec;
      if (this.previewRemainingSec <= 0) {
        this.activate();
        return true;
      }
    }

    return false;
  }

  public destroy(): void {
    this.previewTween?.remove();
    this.previewTween = undefined;
    this.sprite.destroy();
  }
}
