# Lasso Panic

Single-screen pixel-art arcade game built with Vite + TypeScript + Phaser 3.

All visual and audio assets are generated at runtime in code:
- 8x8 item textures are generated into Phaser `TextureManager`
- SFX are synthesized with WebAudio (`OscillatorNode` + envelopes)
- No external PNG/WAV/MP3/font assets are used

## Run

```bash
npm i
npm run dev
npm run build
npm run preview
```

## Controls

- `LMB`: draw lasso
- `M`: mute/unmute SFX
- `P`: pause/unpause
- `R`: restart after game over

## Core Mechanics

- Health starts at `100` and drains continuously over time.
- Items spawn as `preview` ghosts first, then become `active`.
- Lasso evaluates only `active` items.
- Success rule: if selected active items are one `typeId` only:
  - selected items are removed
  - score increases
  - health is restored
- Error rule: if selected items contain mixed `typeId`:
  - items are kept
  - damage is applied
  - camera shake + error flash/SFX are triggered
- Empty or too-short lasso: no score/health change (feedback only).
- Game ends when health reaches `0`.
- Best score and best survival time are saved in `localStorage`.

## Difficulty Ramp

Difficulty increases while survival time grows:
- Spawn interval decreases down to a minimum.
- More item types unlock over time.
- Item size slowly shrinks to a configured minimum.
- A soft cap limits total simultaneous items.

## Runtime Asset Generation

- Palette: `src/assets/palettes.ts`
- 8x8 sprite definitions: `src/assets/sprites.ts`
- Texture generation: `src/assets/generateTextures.ts`
- SFX synthesis: `src/audio/sfx.ts`

## Project Structure

- `src/main.ts`
- `src/game/scenes/BootScene.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/entities/Item.ts`
- `src/game/systems/Spawner.ts`
- `src/game/systems/LassoSelection.ts`
- `src/ui/Hud.ts`
- `src/assets/palettes.ts`
- `src/assets/sprites.ts`
- `src/assets/generateTextures.ts`
- `src/audio/sfx.ts`
- `src/config.ts`
- `src/utils/*`

## `config.ts` Parameters

`src/config.ts` contains all gameplay tuning values.

- `healthStart`: initial health points
- `healthDrainPerSec`: passive health drain per second
- `healPerItem`: heal amount for each collected item
- `comboHealBonusPerStep`: extra heal bonus from combo progression
- `damageBase`: fixed damage on mixed-type selection
- `damagePerWrong`: extra damage per wrong item (`selected - majorTypeCount`)
- `previewDurationSec`: preview state duration before activation
- `spawnIntervalStartSec`: initial spawn period
- `spawnIntervalMinSec`: minimum spawn period
- `spawnAccelerationPerSec`: spawn interval reduction over time
- `startTypes`: number of item types available at start
- `maxTypes`: max unlocked item types
- `typesIncreaseEverySec`: type unlock interval
- `itemScaleStart`: initial render scale of 8x8 sprites
- `itemScaleMin`: minimum render scale
- `itemScaleShrinkPerSec`: scale reduction over time
- `maxItemsSoftCap`: max amount of active+preview items
- `spawnPaddingPx`: edge padding for spawn placement
- `spawnPlacementAttempts`: random placement attempts before fallback
- `spawnMinDistancePx`: minimum distance between spawned item centers
- `lassoPointSpacingPx`: minimum pointer movement to append lasso point
- `lassoMinPoints`: minimum number of points for valid lasso
- `lassoMinPathLengthPx`: minimum lasso path length
- `scorePerItem`: score gain per collected item

## Validation Notes

- Build validation is done with `npm run build`.
- In restricted sandboxes where localhost sockets are blocked, `npm run dev` / `npm run preview` may fail with `listen EPERM` even when project code is correct.
