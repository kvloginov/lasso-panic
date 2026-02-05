import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Lasso Panic\nVite + TypeScript + Phaser 3', {
        color: '#f4f4f4',
        fontSize: '24px',
        align: 'center'
      })
      .setOrigin(0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#1d2430',
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scene: [MainScene]
};

new Phaser.Game(config);
