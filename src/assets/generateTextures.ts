import type Phaser from 'phaser';

import { PASTEL_PALETTE } from './palettes';
import { ITEM_SPRITES } from './sprites';

export interface TextureCatalog {
  readonly typeIds: readonly string[];
  readonly framesByType: Readonly<Record<string, readonly string[]>>;
}

const SPRITE_SIZE = 8;

const toPaletteIndex = (token: string): number => {
  if (token === '.') {
    return -1;
  }

  const parsed = Number.parseInt(token, 16);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid sprite token: ${token}`);
  }

  return parsed;
};

const draw8x8Texture = (
  scene: Phaser.Scene,
  textureKey: string,
  rows: readonly string[]
): void => {
  if (rows.length !== SPRITE_SIZE) {
    throw new Error(`Texture ${textureKey} has ${rows.length} rows, expected ${SPRITE_SIZE}.`);
  }

  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }

  const canvasTexture = scene.textures.createCanvas(textureKey, SPRITE_SIZE, SPRITE_SIZE);
  if (!canvasTexture) {
    throw new Error(`Failed to allocate canvas texture: ${textureKey}`);
  }

  const canvas = canvasTexture.getSourceImage() as HTMLCanvasElement;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D context for runtime texture generation is unavailable.');
  }

  context.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    if (row.length !== SPRITE_SIZE) {
      throw new Error(`Texture ${textureKey} row ${y} has invalid length ${row.length}.`);
    }

    for (let x = 0; x < row.length; x += 1) {
      const paletteIndex = toPaletteIndex(row[x]);
      if (paletteIndex < 0) {
        continue;
      }

      const color = PASTEL_PALETTE[paletteIndex];
      if (!color) {
        throw new Error(`Palette index ${paletteIndex} is out of range for texture ${textureKey}.`);
      }

      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  }

  canvasTexture.refresh();
};

export const generateTextures = (scene: Phaser.Scene): TextureCatalog => {
  const framesByType: Record<string, string[]> = {};

  for (const definition of ITEM_SPRITES) {
    framesByType[definition.typeId] = [];

    definition.frames.forEach((rows, frameIndex) => {
      const key = `item-${definition.typeId}-${frameIndex}`;
      draw8x8Texture(scene, key, rows);
      framesByType[definition.typeId].push(key);
    });
  }

  return {
    typeIds: Object.freeze(ITEM_SPRITES.map((entry) => entry.typeId)),
    framesByType
  };
};
