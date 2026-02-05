import Phaser from 'phaser';

import { CONFIG } from './config';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#101923',
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.gameWidth,
    height: CONFIG.gameHeight
  },
  scene: [BootScene, GameScene]
};

new Phaser.Game(gameConfig);
