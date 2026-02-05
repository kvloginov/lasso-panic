import Phaser from 'phaser';

import { generateTextures, type TextureCatalog } from '../../assets/generateTextures';
import { SfxEngine } from '../../audio/sfx';

export const REGISTRY_TEXTURE_CATALOG = 'textureCatalog';
export const REGISTRY_SFX_ENGINE = 'sfxEngine';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public create(): void {
    const textures = generateTextures(this);
    this.registry.set(REGISTRY_TEXTURE_CATALOG, textures as TextureCatalog);

    const existingSfx = this.registry.get(REGISTRY_SFX_ENGINE) as SfxEngine | undefined;
    if (!existingSfx) {
      this.registry.set(REGISTRY_SFX_ENGINE, new SfxEngine());
    }

    this.scene.start('GameScene');
  }
}
