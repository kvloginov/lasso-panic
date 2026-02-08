import type Phaser from 'phaser';

import { SfxEngine } from '../../audio/sfx';
import { CONFIG } from '../../config';
import { Item, ItemState } from '../entities/Item';
import type { TextureCatalog } from '../../assets/generateTextures';
import { distance } from '../../utils/geometry';
import { clamp } from '../../utils/clamp';
import { pick, randFloat } from '../../utils/rng';

export interface SpawnerContext {
  readonly scene: Phaser.Scene;
  readonly textures: TextureCatalog;
  readonly sfx: SfxEngine;
}

export class Spawner {
  private readonly scene: Phaser.Scene;

  private readonly textures: TextureCatalog;

  private readonly sfx: SfxEngine;

  private readonly items: Item[] = [];

  private nextId = 1;

  private spawnCooldownSec = CONFIG.spawnIntervalStartSec;

  constructor(context: SpawnerContext) {
    this.scene = context.scene;
    this.textures = context.textures;
    this.sfx = context.sfx;
  }

  public reset(): void {
    this.clear();
    this.spawnCooldownSec = CONFIG.spawnIntervalStartSec * 0.55;
  }

  public update(dtSec: number, elapsedSec: number, itemScale: number): void {
    for (const item of this.items) {
      const activatedNow = item.tick(dtSec);
      if (activatedNow) {
        this.sfx.activate();
      }

      item.setScale(itemScale);
    }

    this.spawnCooldownSec -= dtSec;
    while (this.spawnCooldownSec <= 0) {
      this.spawnOne(elapsedSec, itemScale);
      this.spawnCooldownSec += this.currentSpawnIntervalSec(elapsedSec);
    }
  }

  public getItems(): readonly Item[] {
    return this.items;
  }

  public getActiveItems(): readonly Item[] {
    return this.items.filter((item) => item.state === ItemState.Active);
  }

  public removeItems(itemsToRemove: readonly Item[]): void {
    if (itemsToRemove.length === 0) {
      return;
    }

    const removeSet = new Set(itemsToRemove.map((item) => item.id));

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (removeSet.has(this.items[i].id)) {
        this.items[i].collect();
        this.items.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const item of this.items) {
      item.destroy();
    }

    this.items.length = 0;
  }

  private spawnOne(elapsedSec: number, itemScale: number): void {
    if (this.items.length >= CONFIG.maxItemsSoftCap) {
      return;
    }

    const unlockedTypes = this.unlockedTypeIds(elapsedSec);
    const typeId = pick(unlockedTypes);
    const frames = this.textures.framesByType[typeId];

    if (!frames || frames.length === 0) {
      return;
    }

    const position = this.findSpawnPosition(itemScale);
    if (!position) {
      return;
    }

    const item = new Item(this.scene, {
      id: this.nextId,
      typeId,
      frameKeys: frames,
      x: position.x,
      y: position.y,
      scale: itemScale,
      previewDurationSec: CONFIG.previewDurationSec
    });

    this.nextId += 1;
    this.items.push(item);
    this.sfx.spawnPreview();
  }

  private currentSpawnIntervalSec(elapsedSec: number): number {
    const interval = CONFIG.spawnIntervalStartSec - elapsedSec * CONFIG.spawnAccelerationPerSec;
    return clamp(interval, CONFIG.spawnIntervalMinSec, CONFIG.spawnIntervalStartSec);
  }

  private unlockedTypeIds(elapsedSec: number): readonly string[] {
    const growthSteps = Math.floor(elapsedSec / CONFIG.typesIncreaseEverySec);
    const unlockedCount = clamp(
      CONFIG.startTypes + growthSteps,
      CONFIG.startTypes,
      Math.min(CONFIG.maxTypes, this.textures.typeIds.length)
    );

    return this.textures.typeIds.slice(0, unlockedCount);
  }

  private findSpawnPosition(itemScale: number): { readonly x: number; readonly y: number } | null {
    const halfSize = itemScale * 4;
    const minX = CONFIG.spawnPaddingPx + halfSize;
    const maxX = CONFIG.gameWidth - CONFIG.spawnPaddingPx - halfSize;
    const minY = CONFIG.spawnPaddingPx + halfSize;
    const maxY = CONFIG.gameHeight - CONFIG.spawnPaddingPx - halfSize;

    if (minX >= maxX || minY >= maxY) {
      return null;
    }

    const minDistance = Math.max(CONFIG.spawnMinDistancePx, itemScale * 8 * 0.85);

    for (let attempt = 0; attempt < CONFIG.spawnPlacementAttempts; attempt += 1) {
      const x = randFloat(minX, maxX);
      const y = randFloat(minY, maxY);

      let overlaps = false;
      for (const existing of this.items) {
        const center = existing.getCenter();
        if (distance(center.x, center.y, x, y) < minDistance) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        return { x, y };
      }
    }

    return { x: randFloat(minX, maxX), y: randFloat(minY, maxY) };
  }
}
