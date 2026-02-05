export interface PointLike {
  readonly x: number;
  readonly y: number;
}

export interface BBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export const distance = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
};

export const polylineLength = (points: readonly PointLike[]): number => {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }

  return total;
};

export const bboxFromPoints = (points: readonly PointLike[]): BBox => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return { minX, minY, maxX, maxY };
};

export const pointInBBox = (bbox: BBox, x: number, y: number): boolean =>
  x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;
