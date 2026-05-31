# CalmMind — Status & Roadmap

**Last updated:** 2026-05-31  
**Version:** 0.1.0 (browser SPA)

## Overview

CalmMind is a browser-based relaxation application: therapeutic audio (binaural beats, isochronic tones, ambient nature layers) paired with Claude Design canvas visualizers (primary) and optional legacy Three.js UI (`index-legacy.html`).

## Current architecture

```text
.
├── index.html, index-legacy.html
├── client/js/              # Shipped app (globals)
├── client/css/design.css   # Primary UI styles
├── assets/audio/ambient/   # CC0 field recordings
├── src/                    # Modular ES modules (Jest)
├── tests/                  # 112 unit tests
├── archive/                # Superseded / unwired code
├── server.js, launch.cjs
└── docs/
```

See [`architecture/overview.md`](../architecture/overview.md) for the dual-stack diagram and script load order.

## Completed (shipped)

| Area | Status |
|------|--------|
| Client migration | Root `app.js` / `audio.js` / `visualizer.js` → `client/js/` |
| Web Audio engine | Binaural, isochronic, pink noise, HRV pacer, BLS, Solfeggio presets |
| Ambient layers | 13 CC0 `.ogg` loops under `assets/audio/ambient/` |
| Protocols | Evidence-tagged presets including sleep, focus, wind-down, box breath |
| Session state | Favorites, history, mood, settings via `CalmMindState` / localStorage |
| Visualizer | Canvas: `neural`, `tissue`, `mandala` (`calm-viz.js`); legacy Three.js on `index-legacy.html` |
| Audio-reactive API | `CalmMindAudioReactive` bridge for custom visuals |
| Static server | HTTP on port 3000–3099, `.ogg` MIME support |
| Unit tests | Jest coverage for `src/audio/*`, `AudioCore`, visualization setup |
| Docs organization | Topical `docs/` layout + agent maintenance rules |

## Modular `src/` (partial integration)

| Component | Status |
|-----------|--------|
| `src/audio/*`, `AudioCore`, visualization configs | Tested; not primary runtime path |
| `src-bridge.js` | Exports `CalmMindSrc` configs only (legacy entry) |
| Enhanced stack / protocol generators | Archived under `archive/src-modular-unwired/` |

## Archive (2026-05-31)

Moved to [`archive/`](../../archive/README.md): legacy `js/`, unwired `src-interfaces/`, experimental core modules, design prototype, unwired modular stack (`src-modular-unwired/`), unused static assets.

---

## Roadmap

**Shipped** behavior lives in `client/js/`; modular experiments in `src/`.

### Done

#### Shipped SPA

- [x] Monolithic audio split into focused client modules
- [x] UI controller with protocols, favorites, session history
- [x] Browser persistence (`CalmMindState` / localStorage)
- [x] CC0 ambient asset pipeline
- [x] Canvas visualizer (primary): `neural`, `tissue`, `mandala` via `calm-viz.js`
- [x] Claude Design UI as primary entry (`index.html`, `design-shell.js`)
- [x] Legacy Three.js UI preserved at `index-legacy.html`
- [x] `CalmMindAudioReactive` bridge
- [x] Static HTTP server with ambient MIME types
- [x] Client migration to `client/js/`

#### Modular `src/` (Jest)

- [x] `src/audio/` generators + `BufferPool`
- [x] `src/core/AudioCore.js` with tests
- [x] Visualization setup, `VisualizerManager`, `configManager` tests
- [x] Protocol-oriented generator classes + Enhanced stack (archived under `archive/src-modular-unwired/`, not SPA-wired)

#### Documentation

- [x] Dual-stack architecture docs
- [x] Front-end integration reference
- [x] Orphan code archived under `archive/`
- [x] Topical `docs/` organization with agent router

### In progress

- [ ] Gradual wiring of `src/` configs via `CalmMindSrc`
- [ ] Expanded Jest coverage for `PinkNoiseGenerator`, `AudioEffects` edge paths

### Future

**Performance:** AudioWorklet, lazy-load ambient assets, bundle `src/` to reduce duplication vs `client/js/audio.js`

**Features:** Cloud sync profiles, session export, custom uploaded ambient, accessibility pass

**Tooling:** ESLint/Prettier (optional), browser smoke tests, CI coverage reporting

**Out of scope:** WebAssembly FFT, WebXR, server API, clinical EMDR tooling

---

## How to run

```bash
npm install
npm run launch
npm test
```

## Key documentation

| Doc | Purpose |
|-----|---------|
| [`../README.md`](../README.md) | Agent documentation index |
| [`../integration/frontend-reference.md`](../integration/frontend-reference.md) | Full engine contract |
| [`../integration/audio-reactive.md`](../integration/audio-reactive.md) | Reactive visuals API |
| [`../guides/development.md`](../guides/development.md) | Repo conventions |
