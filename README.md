# Lasso Panic

Single-screen pixel-art arcade survival game about fast pattern recognition and risky lasso decisions.

![Gameplay preview](docs/game-preview.webp)

## What the game is about

You survive by drawing a lasso around matching active items.

- Your health is always draining.
- Items appear as preview ghosts first, then become active.
- Only active items count for a lasso result.
- Lasso one item type only: gain score and heal.
- Lasso mixed item types: take damage and keep all selected items.
- Last as long as possible and beat your best score/time.

## Controls

- `LMB`: draw lasso
- `M`: mute/unmute SFX
- `P`: pause/unpause
- `R`: restart after game over

## Run locally

```bash
npm i
npm run dev
npm run build
npm run preview
```

## About this project

This game was generated with AI and is intentionally a vibe-code experiment.
Most of the project was produced in two prompts.

## For developers

Technical and agent-facing implementation details live in `AGENTS.md`.
