export const randFloat = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const randInt = (minInclusive: number, maxInclusive: number): number =>
  Math.floor(randFloat(minInclusive, maxInclusive + 1));

export const pick = <T>(items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array.');
  }

  return items[randInt(0, items.length - 1)];
};
