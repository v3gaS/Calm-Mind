# Changelog

All notable changes to CalmMind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Vercel static deployment config ([`vercel.json`](../../vercel.json), [`.vercelignore`](../../.vercelignore)), guide [`docs/guides/vercel-deployment.md`](../guides/vercel-deployment.md) for [useCalmMind.com](https://useCalmMind.com); `www` → apex redirect
- Vercel Web Analytics via `@vercel/analytics` (`inject()` in [`client/js/vercel-analytics-init.js`](../../client/js/vercel-analytics-init.js))
- GitHub publication guide ([`docs/guides/github-publication.md`](../guides/github-publication.md)), `.gitattributes`, `.nvmrc`, `.editorconfig`
- `.gitignore` rules for local Claude Design export folders and promo capture frames

### Changed

- Legacy logo moved to [`assets/branding/Logo.png`](../../assets/branding/Logo.png) (was repo root)
- `index.html` meta description and author; `package.json` `engines` (Node ≥18)

### Changed (prior)

- **Living Tissue visualizer** — updated to Claude Design metaball multi-cell organism (`client/js/calm-viz.js`): orbiting cells, plankton drift, flowing veins, luminous membrane rim; breath pacing remains in the `#breathCue` overlay (canvas guide ring removed to match design)

### Added

- **Audio expansion:** `whiteNoise`, `brownNoise`, `isochronicSleep` sound types; CC0 ambients `fireplace`, `night-crickets`, `wind-grass`; HRV breath patterns (`box`, `fourSevenEight`) via [`client/js/breath-patterns.js`](../../client/js/breath-patterns.js)
- Protocol presets: `deepSleep`, `focusStudy`, `windDown`, `boxBreath` ([`client/js/protocols.js`](../../client/js/protocols.js))

### Added (prior)
- [`assets/branding/CalmMind_Logo.jpg`](../../assets/branding/CalmMind_Logo.jpg) — top-left brand on primary UI
- Claude Design UI as primary entry ([`index.html`](../../index.html)): glass compose/playing shell, canvas visualizers (`calm-viz.js`), design bridge/shell
- [`index-legacy.html`](../../index-legacy.html) — previous Three.js UI preserved for reference
- [`docs/integration/claude-design-alignment.md`](../integration/claude-design-alignment.md) — design ↔ engine handoff spec
- [`client/css/design.css`](../../client/css/design.css) — Claude Design tokens and layout

### Changed

- Documented canvas visualizer behavior: procedural draw loops, playing vs idle reactivity, `CalmMind.frame` contract ([`subsystems/visualization.md`](../subsystems/visualization.md))
- GitHub upload docs: proprietary [LICENSE](../../LICENSE), [DISCLAIMER](../../DISCLAIMER.md), [SECURITY](../../SECURITY.md), [PRIVACY](../../PRIVACY.md), [NOTICE](../../NOTICE.md), issue templates, README promo GIF (real app capture via `scripts/capture-app-promo.mjs`)
- Brand logo on primary `index.html` ([`assets/branding/CalmMind_Logo.jpg`](../../assets/branding/CalmMind_Logo.jpg))
- Removed promotional background video from primary UI
- Primary script stack: `calm-viz.js`, `design-bridge.js`, `design-shell.js` (no Three.js on main entry)
- `audio.js` skips Three.js setup when `#visualizerCanvas` is absent
- Shared HTTP server logic in [`lib/static-server.cjs`](../../lib/static-server.cjs)
- Design prototype moved to [`archive/design-prototype/`](../../archive/design-prototype/)
- Unwired modular stack (`EnhancedAudioManager`, generators, effects, workers, alt visualizers) moved to [`archive/src-modular-unwired/`](../../archive/src-modular-unwired/)
- Unused `images_waves.png` moved to [`archive/assets/`](../../archive/assets/)
- Documentation aligned to dual-entry architecture (AGENTS, README, frontend-reference, development guide)
- Moved canonical docs into topical subfolders (see `docs/README.md`)
- Historical snapshots relocated to `docs/history/` (not maintained)
- Cross-links updated across README, CONTRIBUTING, integration docs

### Added (prior cleanup pass)

- Shipped client bundle under `client/js/` (audio, visualizer, app, protocols, state, ambient loader, bridges)
- CC0 ambient assets in `assets/audio/ambient/` with attribution file
- `CalmMindAudioReactive` bridge for custom audio-driven visuals
- `CalmMindProtocols` evidence-tagged session presets
- `CalmMindState` localStorage persistence (favorites, history, settings)
- `archive/` tree for superseded and unwired code with README
- Rewritten architecture docs: `technical_architecture.md`, `development_guidelines.md`, `PROJECT_STATUS.md`, `IMPROVEMENTS.md`

### Changed

- Entry scripts moved from repo root to `client/js/` (`index.html` script tags updated)
- `docs/audio-system.md` and `docs/TECHNICAL.md` now distinguish shipped vs modular stacks
- `docs/frontend-integration-reference.md` — script order includes `audio-reactive-bridge.js`; `spectrum` viz type documented
- README, AGENTS.md, CONTRIBUTING.md aligned to current paths
- Debug logging in `VisualizerManager`, `setup.js`, `AudioContext` uses logger or removed

### Removed

- Root-level `app.js`, `audio.js`, `visualizer.js` (replaced by `client/js/`)
- Unwired `src/interfaces/` and legacy `js/` layer (moved to `archive/`)
- Unused experimental `src/core/Analytics.js`, `PerformanceMonitor.js`, duplicate `ErrorHandler.js` (archived)

## [0.1.0] - 2025-04-14

- Initial browser SPA with Web Audio generation and Three.js visualizer
- Modular ES modules under `src/` with Jest tests
- Static HTTP server (`server.js`, `launch.cjs`)
