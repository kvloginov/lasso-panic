import type Phaser from 'phaser';

import { CONFIG } from '../config';
import { clamp } from '../utils/clamp';

const TOP_MARGIN = 14;
const LEFT_MARGIN = 14;
const RIGHT_MARGIN = 16;
const HEALTH_BAR_SIDE_MARGIN = 20;
const HEALTH_BAR_HEIGHT = 14;
const HEALTH_BAR_BOTTOM_MARGIN = 14;
const HEALTH_BAR_Y = CONFIG.gameHeight - HEALTH_BAR_HEIGHT - HEALTH_BAR_BOTTOM_MARGIN;
const HEALTH_BAR_WIDTH = CONFIG.gameWidth - HEALTH_BAR_SIDE_MARGIN * 2;
const HEALTH_BAR_INNER_PADDING = 2;
const HEALTH_BAR_INNER_WIDTH = HEALTH_BAR_WIDTH - HEALTH_BAR_INNER_PADDING * 2;
const STATUS_PANEL_WIDTH = 268;
const STATUS_PANEL_HEIGHT = 108;
const STATUS_PANEL_X = LEFT_MARGIN - 8;
const STATUS_PANEL_Y = TOP_MARGIN - 8;
const INFO_PANEL_WIDTH = 188;
const INFO_PANEL_HEIGHT = 64;
const INFO_PANEL_X = CONFIG.gameWidth - INFO_PANEL_WIDTH - (RIGHT_MARGIN - 8);
const INFO_PANEL_Y = HEALTH_BAR_Y - INFO_PANEL_HEIGHT - 12;
const SCORE_Y = HEALTH_BAR_Y - 44;
const TIME_Y = HEALTH_BAR_Y - 22;

export interface HudSnapshot {
  readonly health: number;
  readonly score: number;
  readonly timeSec: number;
  readonly level: number;
  readonly combo: number;
  readonly muted: boolean;
  readonly paused: boolean;
}

export interface GameOverSnapshot {
  readonly score: number;
  readonly timeSec: number;
  readonly bestScore: number;
  readonly bestTimeSec: number;
}

export class Hud {
  private readonly scene: Phaser.Scene;

  private readonly healthFill: Phaser.GameObjects.Rectangle;

  private readonly healthText: Phaser.GameObjects.Text;

  private readonly scoreText: Phaser.GameObjects.Text;

  private readonly timeText: Phaser.GameObjects.Text;

  private readonly levelText: Phaser.GameObjects.Text;

  private readonly comboText: Phaser.GameObjects.Text;

  private readonly muteText: Phaser.GameObjects.Text;

  private readonly pauseText: Phaser.GameObjects.Text;

  private readonly startContainer: Phaser.GameObjects.Container;

  private readonly gameOverContainer: Phaser.GameObjects.Container;

  private readonly gameOverText: Phaser.GameObjects.Text;

  private readonly pauseContainer: Phaser.GameObjects.Container;

  private previousLevel: number | null = null;

  private previousCombo: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    scene.add.rectangle(STATUS_PANEL_X, STATUS_PANEL_Y, STATUS_PANEL_WIDTH, STATUS_PANEL_HEIGHT, 0x111925, 0.56).setOrigin(0, 0).setDepth(98);
    scene.add.rectangle(INFO_PANEL_X, INFO_PANEL_Y, INFO_PANEL_WIDTH, INFO_PANEL_HEIGHT, 0x111925, 0.56).setOrigin(0, 0).setDepth(98);
    scene
      .add.rectangle(
        HEALTH_BAR_SIDE_MARGIN - 6,
        HEALTH_BAR_Y - 24,
        HEALTH_BAR_WIDTH + 12,
        HEALTH_BAR_HEIGHT + 32,
        0x0c111a,
        0.62
      )
      .setOrigin(0, 0)
      .setDepth(99);
    scene.add.rectangle(HEALTH_BAR_SIDE_MARGIN, HEALTH_BAR_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 0x22303d, 0.92).setOrigin(0, 0).setDepth(100);
    this.healthFill = scene
      .add.rectangle(
        HEALTH_BAR_SIDE_MARGIN + HEALTH_BAR_INNER_PADDING,
        HEALTH_BAR_Y + HEALTH_BAR_INNER_PADDING,
        HEALTH_BAR_INNER_WIDTH,
        HEALTH_BAR_HEIGHT - HEALTH_BAR_INNER_PADDING * 2,
        0x95d67f,
        1
      )
      .setOrigin(0, 0)
      .setDepth(101);
    this.healthText = this.makeText(HEALTH_BAR_SIDE_MARGIN, HEALTH_BAR_Y - 22, 'HP 100');
    this.scoreText = this.makeText(CONFIG.gameWidth - RIGHT_MARGIN, SCORE_Y, 'SCORE 0').setOrigin(1, 1);
    this.timeText = this.makeText(CONFIG.gameWidth - RIGHT_MARGIN, TIME_Y, 'TIME 0.0s').setOrigin(1, 1);

    this.levelText = scene
      .add.text(LEFT_MARGIN, TOP_MARGIN, 'LEVEL 1', this.levelTextStyle())
      .setDepth(102)
      .setOrigin(0, 0);

    this.comboText = scene
      .add.text(LEFT_MARGIN, TOP_MARGIN + 50, 'COMBO x0', this.comboTextStyle())
      .setDepth(102)
      .setOrigin(0, 0);

    this.muteText = this.makeText(CONFIG.gameWidth - RIGHT_MARGIN, TOP_MARGIN, 'M: sound on').setOrigin(1, 0);
    this.pauseText = this.makeText(CONFIG.gameWidth - RIGHT_MARGIN, TOP_MARGIN + 20, 'P: running').setOrigin(1, 0);

    const overlayBackground = scene.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, 0x0f141d, 0.82)
      .setDepth(200);

    const startText = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 - 170, 'LASSO PANIC', this.bigTextStyle())
      .setOrigin(0.5)
      .setDepth(201);

    const rulesPanel = scene.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 + 4, 700, 282, 0x121a27, 0.88)
      .setDepth(201);

    const rulesText = scene.add
      .text(
        CONFIG.gameWidth / 2,
        CONFIG.gameHeight / 2 - 42,
        [
          'How to play:',
          '- Draw a lasso around ACTIVE items (solid icons only).',
          '- Same type only -> collect items, gain score, heal HP.',
          '- Combo increases only when a successful lasso has 2+ items.',
          '- Higher combo gives stronger HP restore on successful merges.',
          '- Mixed types -> take damage, items stay on screen.',
          '- Preview ghosts do not count until they activate.',
          '- HP drains over time. Reach 0 HP and the run ends.'
        ].join('\n'),
        this.smallTextStyle()
      )
      .setOrigin(0.5)
      .setDepth(202)
      .setAlign('left')
      .setWordWrapWidth(640);

    const promptText = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 + 176, 'Click to Start\nLMB draw, M mute, P pause', this.smallTextStyle())
      .setOrigin(0.5)
      .setDepth(202)
      .setAlign('center');

    this.startContainer = scene
      .add.container(0, 0, [overlayBackground, startText, rulesPanel, rulesText, promptText])
      .setDepth(200);

    const gameOverBackground = scene.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, 0x1b0f16, 0.82)
      .setDepth(220);

    const gameOverTitle = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 - 72, 'GAME OVER', this.bigTextStyle())
      .setOrigin(0.5)
      .setDepth(221);

    this.gameOverText = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 - 8, '', this.smallTextStyle())
      .setOrigin(0.5)
      .setDepth(221)
      .setAlign('center');

    const gameOverHint = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 + 78, 'Press R or click to restart', this.smallTextStyle())
      .setOrigin(0.5)
      .setDepth(221);

    this.gameOverContainer = scene
      .add.container(0, 0, [gameOverBackground, gameOverTitle, this.gameOverText, gameOverHint])
      .setDepth(220)
      .setVisible(false);

    const pauseBackground = scene.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, 0x121820, 0.52)
      .setDepth(210);

    const pauseTitle = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 - 10, 'PAUSED', this.bigTextStyle())
      .setOrigin(0.5)
      .setDepth(211);

    const pauseHint = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 + 34, 'Press P to continue', this.smallTextStyle())
      .setOrigin(0.5)
      .setDepth(211);

    this.pauseContainer = scene.add.container(0, 0, [pauseBackground, pauseTitle, pauseHint]).setDepth(210).setVisible(false);
  }

  public update(snapshot: HudSnapshot): void {
    const health = clamp(snapshot.health, 0, CONFIG.healthStart);
    const ratio = health / CONFIG.healthStart;
    const level = Math.max(1, snapshot.level);
    const combo = Math.max(0, snapshot.combo);
    const comboDisplay = Math.min(combo, CONFIG.maxCombo);
    const comboLabel = combo >= CONFIG.maxCombo ? `COMBO x${CONFIG.maxCombo} MAX` : `COMBO x${comboDisplay}`;
    const previousCombo = this.previousCombo;
    const comboIncreased = previousCombo !== null && combo > previousCombo;
    const comboDecreased = previousCombo !== null && combo < previousCombo;

    this.healthFill.width = HEALTH_BAR_INNER_WIDTH * ratio;
    this.healthFill.fillColor = health > 50 ? 0x95d67f : health > 25 ? 0xffc95f : 0xff6f6f;

    this.healthText.setText(`HP ${Math.round(health)}`);
    this.scoreText.setText(`SCORE ${snapshot.score}`);
    this.timeText.setText(`TIME ${snapshot.timeSec.toFixed(1)}s`);
    this.levelText.setText(`LEVEL ${level}`);
    this.comboText.setText(comboLabel);
    this.comboText.setColor(combo >= CONFIG.maxCombo ? '#ffef95' : '#f6f2e8');

    if (this.previousLevel !== null && level > this.previousLevel) {
      this.animateLevelUp(level);
    }

    if (comboDecreased) {
      this.scene.tweens.killTweensOf(this.comboText);
      this.updateComboScale(comboDisplay, true);
    } else {
      this.updateComboScale(comboDisplay);
    }

    if (comboIncreased) {
      this.animateComboUp(comboDisplay, comboLabel);
    }
    if (comboDecreased && previousCombo !== null) {
      const comboLoss = previousCombo - combo;
      const oldDisplay = Math.min(previousCombo, CONFIG.maxCombo);
      const oldLabel = previousCombo >= CONFIG.maxCombo ? `COMBO x${CONFIG.maxCombo} MAX` : `COMBO x${oldDisplay}`;
      this.animateComboDown(oldDisplay, oldLabel, previousCombo >= CONFIG.maxCombo, comboLoss);
    }

    this.previousLevel = level;
    this.previousCombo = combo;

    this.muteText.setText(snapshot.muted ? 'M: sound off' : 'M: sound on');
    this.pauseText.setText(snapshot.paused ? 'P: paused' : 'P: running');
    this.pauseContainer.setVisible(snapshot.paused);
  }

  public showStart(): void {
    this.startContainer.setVisible(true);
  }

  public hideStart(): void {
    this.startContainer.setVisible(false);
  }

  public showGameOver(snapshot: GameOverSnapshot): void {
    this.gameOverText.setText(
      `Score: ${snapshot.score}\nTime: ${snapshot.timeSec.toFixed(1)}s\nBest score: ${snapshot.bestScore}\nBest time: ${snapshot.bestTimeSec.toFixed(1)}s`
    );
    this.gameOverContainer.setVisible(true);
  }

  public hideGameOver(): void {
    this.gameOverContainer.setVisible(false);
  }

  private makeText(x: number, y: number, content: string): Phaser.GameObjects.Text {
    return this.scene
      .add.text(x, y, content, this.smallTextStyle())
      .setDepth(102)
      .setOrigin(0, 0);
  }

  private comboScale(combo: number): number {
    return 1 + Math.min(combo, CONFIG.maxCombo) * 0.03;
  }

  private updateComboScale(combo: number, force = false): void {
    if (!force && this.scene.tweens.isTweening(this.comboText)) {
      return;
    }

    this.comboText.setScale(this.comboScale(combo));
  }

  private animateLevelUp(level: number): void {
    this.scene.tweens.killTweensOf(this.levelText);
    this.levelText.setScale(1);
    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 2,
      scaleY: 2,
      duration: 110,
      hold: 24,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.levelText.setScale(1)
    });

    const drop = this.scene
      .add.text(this.levelText.x, this.levelText.y - 26, `LEVEL ${level}`, this.levelTextStyle())
      .setOrigin(0, 0)
      .setDepth(103)
      .setAlpha(0.9);

    this.scene.tweens.add({
      targets: drop,
      y: this.levelText.y,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.In',
      onComplete: () => drop.destroy()
    });
  }

  private animateComboUp(comboDisplay: number, comboLabel: string): void {
    const comboBaseScale = this.comboScale(comboDisplay);
    this.scene.tweens.killTweensOf(this.comboText);
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: comboBaseScale + 0.45,
      scaleY: comboBaseScale + 0.45,
      duration: 110,
      hold: 24,
      yoyo: true,
      ease: 'Back.Out',
      onComplete: () => this.comboText.setScale(comboBaseScale)
    });

    const drop = this.scene
      .add.text(this.comboText.x, this.comboText.y - 24, comboLabel, this.comboTextStyle())
      .setOrigin(0, 0)
      .setDepth(103)
      .setAlpha(0.9)
      .setScale(comboBaseScale + 0.2);

    this.scene.tweens.add({
      targets: drop,
      y: this.comboText.y,
      alpha: 0,
      scaleX: comboBaseScale,
      scaleY: comboBaseScale,
      duration: 200,
      ease: 'Cubic.In',
      onComplete: () => drop.destroy()
    });
  }

  private animateComboDown(oldComboDisplay: number, oldComboLabel: string, isMax: boolean, comboLoss: number): void {
    const oldScale = this.comboScale(oldComboDisplay);
    const drop = this.scene
      .add.text(this.comboText.x, this.comboText.y, oldComboLabel, this.comboTextStyle())
      .setOrigin(0, 0)
      .setDepth(103)
      .setAlpha(0.95)
      .setColor(isMax ? '#ffef95' : '#f6f2e8')
      .setScale(oldScale);

    this.scene.tweens.add({
      targets: drop,
      y: this.comboText.y + 38,
      alpha: 0,
      scaleX: Math.max(0.82, oldScale - 0.08),
      scaleY: Math.max(0.82, oldScale - 0.08),
      duration: 520,
      ease: 'Sine.In',
      onComplete: () => drop.destroy()
    });

    if (comboLoss <= 0) {
      return;
    }

    const loss = this.scene
      .add.text(this.comboText.x + this.comboText.displayWidth + 12, this.comboText.y + 2, `-${comboLoss}`, this.comboTextStyle())
      .setOrigin(0, 0)
      .setDepth(104)
      .setColor('#ff6f6f')
      .setScale(0.9);

    this.scene.tweens.add({
      targets: loss,
      y: this.comboText.y + 30,
      alpha: 0,
      duration: 520,
      ease: 'Sine.In',
      onComplete: () => loss.destroy()
    });
  }

  private smallTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f6f2e8',
      stroke: '#1c1f2a',
      strokeThickness: 2
    };
  }

  private levelTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...this.smallTextStyle(),
      fontSize: '34px',
      color: '#f8f0be',
      strokeThickness: 4
    };
  }

  private comboTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...this.smallTextStyle(),
      fontSize: '22px',
      color: '#f6f2e8',
      strokeThickness: 3
    };
  }

  private bigTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...this.smallTextStyle(),
      fontSize: '34px'
    };
  }
}
