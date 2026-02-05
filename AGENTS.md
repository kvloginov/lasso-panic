# AGENTS.md

## Project Mission
Build a fully playable single-screen game, **Lasso Panic**, using **Vite + TypeScript + Phaser 3** with strict pixel-art rendering and code-generated assets only.

## Non-Negotiable Requirements
- No external image, audio, or font files.
- All sprite textures must be generated in code at runtime (8x8 source pixels).
- All SFX must be generated in code at runtime (WebAudio), no WAV/MP3 assets.
- The game must run with:
  - `npm i`
  - `npm run dev`
  - `npm run build`
  - `npm run preview`

## Tech and Rendering Baseline
- Phaser config must include:
  - `render: { pixelArt: true, antialias: false, roundPixels: true }`
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 540 }`
- Sprites are 8x8 textures generated into `TextureManager`.
- Item sprites are upscaled (for example scale 6..10) while preserving pixel sharpness.

## Core Gameplay Contract
- Single-screen loop.
- Health (`0..100`) drains continuously over time.
- Spawn flow: item appears as `preview` first, then becomes `active`.
- Lasso selection evaluates only `active` items:
  - If selected active items are one `typeId` only: success, remove selected items, increase score, heal.
  - If selected items include mixed `typeId`: apply damage, play error feedback, do not remove items.
- Difficulty must ramp over time:
  - More frequent spawns.
  - More active item types.
  - Optional mild size reduction and/or soft cap tuning.
- Game ends at `health <= 0`.
- Must include start overlay, game-over overlay, restart, and HUD.
- Save best score and best survival time in `localStorage`.

## Required Project Structure
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

## Architecture and Coding Standards
- Keep tunables in `src/config.ts` (health, drain, heal, damage, spawn timing, type progression, scale, caps).
- Keep entity/system boundaries clear:
  - `Item`: state + sprite lifecycle.
  - `Spawner`: spawn timing, preview->active transition, placement attempts.
  - `LassoSelection`: pointer capture, polygon build, hit evaluation, rule resolution.
  - `Hud`: score/health/time/level/combo + mute state.
- Use typed interfaces and explicit state enums.
- Prefer deterministic helper utilities in `src/utils/` (`clamp`, RNG helpers, geometry helpers).
- Write only in English

## Definition of Done
- `npm run dev` launches playable game loop.
- 8x8 generated textures are visible and readable as cute pixel-art.
- Runtime-generated SFX exists for spawn preview, activation, success, error, and game over.
- Preview-to-active transition works reliably.
- Lasso rules are correct for success and mixed-type error.
- Health drains continuously and game over triggers at zero.
- Start/game-over/restart flow works.
- HUD shows health, score, survival time, difficulty level, and mute state.
- Best score/time persists via `localStorage`.
- `README.md` explains mechanics and key `config.ts` parameters.

## Per-Change Validation Checklist
- Install and run:
  - `npm i`
  - `npm run dev`
  - `npm run build`
  - `npm run preview`
- Manual behavior checks:
  - Preview items do not count in lasso results.
  - Active items are detected by polygon hit test.
  - Success path removes items, adds score, heals, and plays success feedback.
  - Error path keeps items, applies damage, and plays error feedback.
  - Health drain, game over, restart (`R`), and mute toggle (`M`) all work.

## Failure and Fix Log (Append-Only)
If something fails or a first attempt is wrong, append a new row immediately and add a prevention rule.

| Date (YYYY-MM-DD) | Context | What failed | Root cause | Fix applied | Prevention rule added |
|---|---|---|---|---|---|
| 2026-02-05 | Project bootstrap (`npm install`) | Dependency installation failed (`ENOTFOUND`) | DNS/network access to `registry.npmjs.org` unavailable in current environment | Completed local scaffold files first; deferred dependency install until network is available | Before running `npm install`, verify npm registry reachability in the environment (`npm ping` or DNS check) |
| 2026-02-05 | Core game implementation (`npm run build`) | TypeScript build failed on first integration pass | Strict nullability and `noUnusedLocals` issues were missed while composing multiple systems in parallel | Added explicit null-guard for `createCanvas` and cleaned HUD unused/implicit-any issues | Run `npm run build` after each subsystem merge (assets, UI, systems) before wiring scene integration |
| 2026-02-05 | Runtime validation (`npm run dev`, `npm run preview`) | Local servers could not start (`listen EPERM`) | Current sandbox environment blocks binding to localhost ports | Completed build-level validation and documented runtime verification as environment-dependent | Before runtime checks, confirm the environment allows opening local listening sockets |

### Logging Rules
- Never rewrite old rows; only append.
- Keep entries concrete and testable.
- Convert repeated mistakes into explicit checklist items or coding rules in this file.

## Working Notes
- Use this section for active TODOs, open risks, and short implementation reminders.
