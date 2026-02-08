import type Phaser from 'phaser';

import { CONFIG } from '../../config';

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

  private readonly anchorX: number;

  private readonly anchorY: number;

  private baseScale: number;

  private frameTimerSec = 0;

  private frameIndex = 0;

  private readonly frameStepSec: number;

  private lifetimeSec = 0;

  private activationBurstSec = 0;

  private readonly motionPhase: number;

  private readonly motionSpeedHz: number;

  private previewTween?: Phaser.Tweens.Tween;

  private collectTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, init: ItemInit) {
    this.scene = scene;
    this.id = init.id;
    this.typeId = init.typeId;
    this.frameKeys = init.frameKeys;
    this.anchorX = init.x;
    this.anchorY = init.y;
    this.baseScale = init.scale;
    this.previewRemainingSec = init.previewDurationSec;
    this.frameStepSec = 0.24 + (init.id % 5) * 0.03;
    this.motionPhase = (init.id * 0.77) % (Math.PI * 2);
    this.motionSpeedHz = CONFIG.itemHoverSpeedHz + (init.id % 4) * 0.08;

    this.sprite = scene.add.sprite(init.x, init.y, this.frameKeys[0]);
    this.sprite.setOrigin(0.5);

    this.state = ItemState.Preview;
    this.setPreview();
    this.updateTransform();
  }

  public getCenter(): { readonly x: number; readonly y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public setPreview(): void {
    this.state = ItemState.Preview;
    this.sprite.setAlpha(0.35);

    this.previewTween?.remove();
    this.previewTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.26, to: 0.48 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this.updateTransform();
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
    this.activationBurstSec = CONFIG.itemActivationBurstDurationSec;
    this.updateTransform();
  }

  public setScale(scale: number): void {
    this.baseScale = scale;
    this.updateTransform();
  }

  public collect(): void {
    this.previewTween?.remove();
    this.previewTween = undefined;
    this.collectTween?.remove();

    const spin = this.id % 2 === 0 ? 24 : -24;
    this.collectTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.18,
      scaleY: this.sprite.scaleY * 1.18,
      alpha: 0,
      angle: this.sprite.angle + spin,
      duration: CONFIG.itemCollectDurationMs,
      ease: 'Cubic.In',
      onComplete: () => this.destroy()
    });
  }

  public tick(dtSec: number): boolean {
    this.lifetimeSec += dtSec;
    if (this.activationBurstSec > 0) {
      this.activationBurstSec = Math.max(0, this.activationBurstSec - dtSec);
    }

    this.frameTimerSec += dtSec;
    if (this.frameTimerSec >= this.frameStepSec && this.frameKeys.length > 1) {
      this.frameTimerSec -= this.frameStepSec;
      this.frameIndex = (this.frameIndex + 1) % this.frameKeys.length;
      this.sprite.setTexture(this.frameKeys[this.frameIndex]);
    }

    let activated = false;
    if (this.state === ItemState.Preview) {
      this.previewRemainingSec -= dtSec;
      if (this.previewRemainingSec <= 0) {
        this.activate();
        activated = true;
      }
    }

    this.updateTransform();
    return activated;
  }

  public destroy(): void {
    this.previewTween?.remove();
    this.previewTween = undefined;
    this.collectTween?.remove();
    this.collectTween = undefined;
    this.sprite.destroy();
  }

  private updateTransform(): void {
    const previewMultiplier = this.state === ItemState.Preview ? 1.22 : 1;
    const phase = this.lifetimeSec * Math.PI * 2 * this.motionSpeedHz + this.motionPhase;
    const hoverY = Math.sin(phase) * CONFIG.itemHoverAmplitudePx * previewMultiplier;
    const swayX = Math.sin(phase * 0.76 + this.motionPhase * 0.5) * CONFIG.itemHoverAmplitudePx * 0.52 * previewMultiplier;
    const pulse = this.state === ItemState.Active ? Math.sin(phase * 1.35 + 0.6) * CONFIG.itemActivePulseScale : 0;
    const burstDuration = Math.max(0.0001, CONFIG.itemActivationBurstDurationSec);
    const burstProgress = this.activationBurstSec > 0 ? this.activationBurstSec / burstDuration : 0;
    const burstScale = burstProgress * CONFIG.itemActivationBurstScale;
    const stateScale = this.state === ItemState.Preview ? CONFIG.itemPreviewScaleRatio : 1;
    const scale = Math.max(0.001, this.baseScale * stateScale * (1 + pulse + burstScale));

    this.sprite.setPosition(this.anchorX + swayX, this.anchorY + hoverY);
    this.sprite.setScale(scale);
    this.sprite.setAngle(swayX * 1.5);
  }
}
