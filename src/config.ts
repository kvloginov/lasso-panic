export interface GameTuning {
  readonly gameWidth: number;
  readonly gameHeight: number;
  readonly healthStart: number;
  readonly healthDrainPerSec: number;
  readonly healPerItem: number;
  readonly comboHealBonusPerStep: number;
  readonly damageBase: number;
  readonly damagePerWrong: number;
  readonly previewDurationSec: number;
  readonly spawnIntervalStartSec: number;
  readonly spawnIntervalMinSec: number;
  readonly spawnAccelerationPerSec: number;
  readonly startTypes: number;
  readonly maxTypes: number;
  readonly typesIncreaseEverySec: number;
  readonly itemScaleStart: number;
  readonly itemScaleMin: number;
  readonly itemScaleShrinkPerSec: number;
  readonly maxItemsSoftCap: number;
  readonly spawnPaddingPx: number;
  readonly spawnPlacementAttempts: number;
  readonly spawnMinDistancePx: number;
  readonly lassoPointSpacingPx: number;
  readonly lassoMinPoints: number;
  readonly lassoMinPathLengthPx: number;
  readonly lassoFlashDurationMs: number;
  readonly flashFadeOutMs: number;
  readonly successFlashColor: number;
  readonly errorFlashColor: number;
  readonly scorePerItem: number;
  readonly storageBestScoreKey: string;
  readonly storageBestTimeKey: string;
}

export const CONFIG: GameTuning = {
  gameWidth: 960,
  gameHeight: 540,
  healthStart: 100,
  healthDrainPerSec: 6.2,
  healPerItem: 3.8,
  comboHealBonusPerStep: 0.35,
  damageBase: 9,
  damagePerWrong: 4.5,
  previewDurationSec: 0.75,
  spawnIntervalStartSec: 1.45,
  spawnIntervalMinSec: 0.42,
  spawnAccelerationPerSec: 0.024,
  startTypes: 2,
  maxTypes: 6,
  typesIncreaseEverySec: 18,
  itemScaleStart: 9,
  itemScaleMin: 6,
  itemScaleShrinkPerSec: 0.03,
  maxItemsSoftCap: 38,
  spawnPaddingPx: 52,
  spawnPlacementAttempts: 24,
  spawnMinDistancePx: 72,
  lassoPointSpacingPx: 5,
  lassoMinPoints: 3,
  lassoMinPathLengthPx: 34,
  lassoFlashDurationMs: 100,
  flashFadeOutMs: 160,
  successFlashColor: 0x95d67f,
  errorFlashColor: 0xff667a,
  scorePerItem: 1,
  storageBestScoreKey: 'lassoPanic.bestScore',
  storageBestTimeKey: 'lassoPanic.bestTimeSec'
};
