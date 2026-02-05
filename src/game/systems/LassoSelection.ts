import Phaser from 'phaser';

import { CONFIG } from '../../config';
import { bboxFromPoints, distance, pointInBBox, polylineLength, type PointLike } from '../../utils/geometry';
import { Item } from '../entities/Item';

export type LassoResultReason = 'invalid' | 'empty' | 'evaluated';

export interface LassoResult {
  readonly isValid: boolean;
  readonly reason: LassoResultReason;
  readonly selected: readonly Item[];
  readonly uniqueTypeIds: readonly string[];
  readonly majorTypeCount: number;
}

export class LassoSelection {
  private readonly scene: Phaser.Scene;

  private readonly graphics: Phaser.GameObjects.Graphics;

  private readonly flashGraphics: Phaser.GameObjects.Graphics;

  private readonly points: PointLike[] = [];

  private drawing = false;

  private enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(50);
    this.flashGraphics = scene.add.graphics().setDepth(51);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  public isDrawing(): boolean {
    return this.drawing;
  }

  public begin(x: number, y: number): void {
    if (!this.enabled) {
      return;
    }

    this.drawing = true;
    this.points.length = 0;
    this.points.push({ x, y });
    this.redraw();
  }

  public appendPoint(x: number, y: number): void {
    if (!this.enabled || !this.drawing) {
      return;
    }

    const last = this.points[this.points.length - 1];
    if (distance(last.x, last.y, x, y) < CONFIG.lassoPointSpacingPx) {
      return;
    }

    this.points.push({ x, y });
    this.redraw();
  }

  public endAndEvaluate(activeItems: readonly Item[]): LassoResult {
    if (!this.enabled || !this.drawing) {
      this.cancel();
      return {
        isValid: false,
        reason: 'invalid',
        selected: [],
        uniqueTypeIds: [],
        majorTypeCount: 0
      };
    }

    this.drawing = false;

    const pointsSnapshot = this.points.map((point) => ({ x: point.x, y: point.y }));
    const pathLength = polylineLength(pointsSnapshot);

    if (pointsSnapshot.length < CONFIG.lassoMinPoints || pathLength < CONFIG.lassoMinPathLengthPx) {
      this.clearGraphics();
      return {
        isValid: false,
        reason: 'invalid',
        selected: [],
        uniqueTypeIds: [],
        majorTypeCount: 0
      };
    }

    this.flash(pointsSnapshot);

    const polygon = new Phaser.Geom.Polygon(pointsSnapshot);
    const bbox = bboxFromPoints(pointsSnapshot);
    const selected: Item[] = [];

    for (const item of activeItems) {
      const center = item.getCenter();
      if (!pointInBBox(bbox, center.x, center.y)) {
        continue;
      }

      if (Phaser.Geom.Polygon.Contains(polygon, center.x, center.y)) {
        selected.push(item);
      }
    }

    if (selected.length === 0) {
      this.clearGraphics();
      return {
        isValid: true,
        reason: 'empty',
        selected,
        uniqueTypeIds: [],
        majorTypeCount: 0
      };
    }

    const counts = new Map<string, number>();
    for (const item of selected) {
      counts.set(item.typeId, (counts.get(item.typeId) ?? 0) + 1);
    }

    const uniqueTypeIds = Array.from(counts.keys());
    const majorTypeCount = Math.max(...Array.from(counts.values()));
    this.clearGraphics();

    return {
      isValid: true,
      reason: 'evaluated',
      selected,
      uniqueTypeIds,
      majorTypeCount
    };
  }

  public cancel(): void {
    this.drawing = false;
    this.points.length = 0;
    this.clearGraphics();
  }

  private redraw(): void {
    this.graphics.clear();
    if (this.points.length < 2) {
      return;
    }

    this.graphics.lineStyle(2, 0xfff1c1, 0.95);
    this.graphics.fillStyle(0xfff1c1, this.points.length >= 3 ? 0.12 : 0.04);
    this.graphics.beginPath();
    this.graphics.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i += 1) {
      this.graphics.lineTo(this.points[i].x, this.points[i].y);
    }

    if (this.points.length >= 3) {
      this.graphics.closePath();
      this.graphics.fillPath();
    }

    this.graphics.strokePath();
  }

  private flash(points: readonly PointLike[]): void {
    this.flashGraphics.clear();
    this.flashGraphics.lineStyle(2, 0xffffff, 0.85);
    this.flashGraphics.beginPath();
    this.flashGraphics.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i += 1) {
      this.flashGraphics.lineTo(points[i].x, points[i].y);
    }

    this.flashGraphics.closePath();
    this.flashGraphics.strokePath();
    this.flashGraphics.setAlpha(0.95);

    this.scene.tweens.add({
      targets: this.flashGraphics,
      alpha: 0,
      duration: CONFIG.lassoFlashDurationMs,
      onComplete: () => {
        this.flashGraphics.clear();
        this.flashGraphics.setAlpha(1);
      }
    });
  }

  private clearGraphics(): void {
    this.graphics.clear();
    this.points.length = 0;
  }
}
