import Phaser from 'phaser';

import type { TextureCatalog } from '../../assets/generateTextures';
import { SfxEngine } from '../../audio/sfx';
import { CONFIG } from '../../config';
import { Item } from '../entities/Item';
import { LassoSelection } from '../systems/LassoSelection';
import { Spawner } from '../systems/Spawner';
import { Hud } from '../../ui/Hud';
import { clamp } from '../../utils/clamp';
import { getStoredNumber, setStoredNumber } from '../../utils/storage';
import { REGISTRY_SFX_ENGINE, REGISTRY_TEXTURE_CATALOG } from './BootScene';

enum SessionState {
  StartOverlay = 'startOverlay',
  Running = 'running',
  Paused = 'paused',
  GameOver = 'gameOver'
}

export class GameScene extends Phaser.Scene {
  private texturesCatalog!: TextureCatalog;

  private sfx!: SfxEngine;

  private hud!: Hud;

  private spawner!: Spawner;

  private lasso!: LassoSelection;

  private state: SessionState = SessionState.StartOverlay;

  private health = CONFIG.healthStart;

  private score = 0;

  private timeSec = 0;

  private level = 1;

  private combo = 0;

  private bestScore = 0;

  private bestTimeSec = 0;

  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  public create(): void {
    const texturesCatalog = this.registry.get(REGISTRY_TEXTURE_CATALOG) as TextureCatalog | undefined;
    const sfx = this.registry.get(REGISTRY_SFX_ENGINE) as SfxEngine | undefined;

    if (!texturesCatalog || !sfx) {
      throw new Error('Boot data is missing. BootScene must run before GameScene.');
    }

    this.texturesCatalog = texturesCatalog;
    this.sfx = sfx;
    this.state = SessionState.StartOverlay;

    this.health = CONFIG.healthStart;
    this.score = 0;
    this.timeSec = 0;
    this.combo = 0;
    this.level = 1;

    this.bestScore = getStoredNumber(CONFIG.storageBestScoreKey, 0);
    this.bestTimeSec = getStoredNumber(CONFIG.storageBestTimeKey, 0);

    this.createBackdrop();

    this.spawner = new Spawner({
      scene: this,
      textures: this.texturesCatalog,
      sfx: this.sfx
    });
    this.spawner.reset();

    this.lasso = new LassoSelection(this);
    this.lasso.setEnabled(false);

    this.hud = new Hud(this);
    this.hud.showStart();

    this.feedbackText = this.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.26, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fefae0',
        stroke: '#121723',
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(140)
      .setAlpha(0);

    this.flashOverlay = this.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, CONFIG.successFlashColor, 0)
      .setDepth(130);

    this.registerInput();
    this.registerKeys();
    this.refreshHud();
  }

  public update(_time: number, deltaMs: number): void {
    const dtSec = deltaMs / 1000;

    if (this.state === SessionState.Running) {
      this.timeSec += dtSec;
      this.level = 1 + Math.floor(this.timeSec / CONFIG.typesIncreaseEverySec);

      this.health -= CONFIG.healthDrainPerSec * dtSec;
      this.health = clamp(this.health, 0, CONFIG.healthStart);

      const itemScale = clamp(
        CONFIG.itemScaleStart - this.timeSec * CONFIG.itemScaleShrinkPerSec,
        CONFIG.itemScaleMin,
        CONFIG.itemScaleStart
      );

      this.spawner.update(dtSec, this.timeSec, itemScale);

      if (this.health <= 0) {
        this.onGameOver();
      }

      this.refreshHud();
    }
  }

  private registerInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.sfx.resume().catch(() => undefined);

      if (this.state === SessionState.StartOverlay) {
        this.startRun();
        return;
      }

      if (this.state === SessionState.GameOver) {
        this.scene.restart();
        return;
      }

      if (this.state !== SessionState.Running || !pointer.leftButtonDown()) {
        return;
      }

      this.lasso.begin(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.state !== SessionState.Running || !pointer.isDown) {
        return;
      }

      this.lasso.appendPoint(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointerup', () => {
      if (this.state !== SessionState.Running) {
        this.lasso.cancel();
        return;
      }

      if (!this.lasso.isDrawing()) {
        return;
      }

      const result = this.lasso.endAndEvaluate(this.spawner.getActiveItems());

      if (!result.isValid || result.reason === 'invalid') {
        this.showFeedback('Too short', CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.26, '#f4e8af');
        this.refreshHud();
        return;
      }

      if (result.reason === 'empty' || result.selected.length === 0) {
        this.showFeedback('No active items', CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.26, '#d1dcff');
        this.refreshHud();
        return;
      }

      if (result.uniqueTypeIds.length === 1) {
        this.handleSuccess(result.selected.length, result.selected);
      } else {
        this.handleError(result.selected.length, result.majorTypeCount);
      }

      this.refreshHud();
    });
  }

  private registerKeys(): void {
    this.input.keyboard?.on('keydown-M', () => {
      const muted = this.sfx.toggleMute();
      this.refreshHud(muted);
    });

    this.input.keyboard?.on('keydown-P', () => {
      if (this.state === SessionState.Running) {
        this.state = SessionState.Paused;
        this.lasso.setEnabled(false);
        this.refreshHud();
        return;
      }

      if (this.state === SessionState.Paused) {
        this.state = SessionState.Running;
        this.lasso.setEnabled(true);
        this.refreshHud();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      if (this.state === SessionState.GameOver) {
        this.scene.restart();
      }
    });
  }

  private startRun(): void {
    this.state = SessionState.Running;
    this.lasso.setEnabled(true);
    this.hud.hideStart();
    this.hud.hideGameOver();
    this.refreshHud();
  }

  private onGameOver(): void {
    this.state = SessionState.GameOver;
    this.lasso.setEnabled(false);
    this.sfx.gameOver();
    this.updateBestScores();
    this.hud.showGameOver({
      score: this.score,
      timeSec: this.timeSec,
      bestScore: this.bestScore,
      bestTimeSec: this.bestTimeSec
    });
    this.refreshHud();
  }

  private updateBestScores(): void {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      setStoredNumber(CONFIG.storageBestScoreKey, this.bestScore);
    }

    if (this.timeSec > this.bestTimeSec) {
      this.bestTimeSec = this.timeSec;
      setStoredNumber(CONFIG.storageBestTimeKey, this.bestTimeSec);
    }
  }

  private handleSuccess(count: number, selected: readonly Item[]): void {
    const first = selected[0]?.sprite;
    const x = first ? first.x : CONFIG.gameWidth / 2;
    const y = first ? first.y : CONFIG.gameHeight / 2;

    this.spawner.removeItems(selected);
    this.score += count * CONFIG.scorePerItem;
    this.combo += 1;

    const heal = count * CONFIG.healPerItem + this.combo * CONFIG.comboHealBonusPerStep;
    this.health = clamp(this.health + heal, 0, CONFIG.healthStart);

    this.sfx.success(count, this.combo);
    this.flash(CONFIG.successFlashColor);
    this.emitSuccessSparkles(x, y);
    this.showFeedback(`+${count}`, x, y, '#c5ffbd');
  }

  private handleError(selectedCount: number, majorTypeCount: number): void {
    const wrongCount = Math.max(1, selectedCount - majorTypeCount);
    const damage = CONFIG.damageBase + CONFIG.damagePerWrong * wrongCount;
    this.health = clamp(this.health - damage, 0, CONFIG.healthStart);
    this.combo = 0;

    this.sfx.error();
    this.flash(CONFIG.errorFlashColor);
    this.cameras.main.shake(120, 0.005);
    this.showFeedback(`-${damage.toFixed(0)}`, CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.3, '#ffb0be');
  }

  private flash(color: number): void {
    this.flashOverlay.fillColor = color;
    this.flashOverlay.alpha = 0.3;

    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: CONFIG.flashFadeOutMs,
      ease: 'Sine.Out'
    });
  }

  private showFeedback(text: string, x: number, y: number, color: string): void {
    this.feedbackText.setText(text);
    this.feedbackText.setColor(color);
    this.feedbackText.setPosition(x, y);
    this.feedbackText.setAlpha(1);

    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      y: y - 24,
      alpha: 0,
      duration: 350,
      ease: 'Quad.Out'
    });
  }

  private emitSuccessSparkles(x: number, y: number): void {
    for (let i = 0; i < 8; i += 1) {
      const sparkle = this.add.circle(x, y, 2, 0xfff1c1, 0.95).setDepth(135);
      const angle = (Math.PI * 2 * i) / 8 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const distance = Phaser.Math.FloatBetween(18, 42);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: sparkle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 260,
        ease: 'Sine.Out',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private refreshHud(forceMuted?: boolean): void {
    this.hud.update({
      health: this.health,
      score: this.score,
      timeSec: this.timeSec,
      level: this.level,
      combo: this.combo,
      muted: forceMuted ?? this.sfx.isMuted(),
      paused: this.state === SessionState.Paused
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, 0x18212d, 1);
    this.add.rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.2, CONFIG.gameWidth, 130, 0x24344a, 0.35);
    this.add.rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight * 0.84, CONFIG.gameWidth, 160, 0x111826, 0.5);

    for (let i = 0; i < 10; i += 1) {
      const x = Phaser.Math.Between(30, CONFIG.gameWidth - 30);
      const y = Phaser.Math.Between(24, CONFIG.gameHeight - 24);
      const twinkle = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xf6f2e8, 0.35).setDepth(5);
      this.tweens.add({
        targets: twinkle,
        alpha: Phaser.Math.FloatBetween(0.08, 0.4),
        duration: Phaser.Math.Between(900, 1900),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }
}
