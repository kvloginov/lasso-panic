import type Phaser from 'phaser';

import { CONFIG } from '../config';
import { clamp } from '../utils/clamp';

const TOP_MARGIN = 14;
const LEFT_MARGIN = 14;

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    scene.add.rectangle(LEFT_MARGIN, TOP_MARGIN, 220, 14, 0x22303d, 0.9).setOrigin(0, 0).setDepth(100);
    this.healthFill = scene.add.rectangle(LEFT_MARGIN + 2, TOP_MARGIN + 2, 216, 10, 0x95d67f, 1).setOrigin(0, 0).setDepth(101);
    this.healthText = this.makeText(LEFT_MARGIN, TOP_MARGIN + 18, 'HP 100');
    this.scoreText = this.makeText(LEFT_MARGIN, TOP_MARGIN + 38, 'Score 0');
    this.timeText = this.makeText(LEFT_MARGIN, TOP_MARGIN + 58, 'Time 0.0s');
    this.levelText = this.makeText(LEFT_MARGIN, TOP_MARGIN + 78, 'Level 1');
    this.comboText = this.makeText(LEFT_MARGIN, TOP_MARGIN + 98, 'Combo x0');

    this.muteText = this.makeText(CONFIG.gameWidth - 16, TOP_MARGIN, 'M: sound on').setOrigin(1, 0);
    this.pauseText = this.makeText(CONFIG.gameWidth - 16, TOP_MARGIN + 20, 'P: running').setOrigin(1, 0);

    const overlayBackground = scene.add
      .rectangle(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2, CONFIG.gameWidth, CONFIG.gameHeight, 0x0f141d, 0.82)
      .setDepth(200);

    const startText = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 - 16, 'LASSO PANIC', this.bigTextStyle())
      .setOrigin(0.5)
      .setDepth(201);

    const promptText = scene.add
      .text(CONFIG.gameWidth / 2, CONFIG.gameHeight / 2 + 28, 'Click to Start\nLMB draw, M mute, P pause', this.smallTextStyle())
      .setOrigin(0.5)
      .setDepth(201)
      .setAlign('center');

    this.startContainer = scene.add.container(0, 0, [overlayBackground, startText, promptText]).setDepth(200);

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
  }

  public update(snapshot: HudSnapshot): void {
    const health = clamp(snapshot.health, 0, CONFIG.healthStart);
    const ratio = health / CONFIG.healthStart;

    this.healthFill.width = 216 * ratio;
    this.healthFill.fillColor = health > 50 ? 0x95d67f : health > 25 ? 0xffc95f : 0xff6f6f;

    this.healthText.setText(`HP ${health.toFixed(1)}`);
    this.scoreText.setText(`Score ${snapshot.score}`);
    this.timeText.setText(`Time ${snapshot.timeSec.toFixed(1)}s`);
    this.levelText.setText(`Level ${snapshot.level}`);
    this.comboText.setText(`Combo x${snapshot.combo}`);
    this.muteText.setText(snapshot.muted ? 'M: sound off' : 'M: sound on');
    this.pauseText.setText(snapshot.paused ? 'P: paused' : 'P: running');
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

  private smallTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f6f2e8',
      stroke: '#1c1f2a',
      strokeThickness: 2
    };
  }

  private bigTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...this.smallTextStyle(),
      fontSize: '34px'
    };
  }
}
