# CalmMind Technical Architecture

This document describes the **running CalmMind application** and how it relates to modular code under `src/`. For integrator APIs see [`integration/frontend-reference.md`](../integration/frontend-reference.md).

## Dual-stack overview

CalmMind maintains two JavaScript layers:

| Stack | Location | Runtime | Tests |
|-------|----------|---------|-------|
| **Shipped SPA** | `index.html`, `client/js/*` | Browser globals (`window.*`) | None (manual / browser) |
| **Modular ES modules** | `src/*` | Jest + optional `src-bridge.js` import | `tests/*.test.js` (112 tests) |

The shipped app does **not** call `EnhancedAudioManager` or protocol-layer generators (those live in [`archive/src-modular-unwired/`](../archive/src-modular-unwired/)). Only [`client/js/src-bridge.js`](../client/js/src-bridge.js) imports from active `src/` (visualizer config objects).

```text
index.html (Claude Design UI)
  ├── client/css/design.css
  ├── client/js/ambient-loader.js
  ├── client/js/breath-patterns.js
  ├── client/js/protocols.js
  ├── client/js/frequency-scheduler.js
  ├── client/js/emdr-audio.js
  ├── client/js/state-manager.js
  ├── client/js/audio.js
  ├── client/js/audio-reactive-bridge.js
  ├── client/js/calm-viz.js
  ├── client/js/design-bridge.js
  └── client/js/design-shell.js

index-legacy.html (previous Three.js UI)
  ├── Three.js r128 (CDN)
  ├── client/js/src-bridge.js  →  src/visualization/configs/visualizerConfigs.js
  ├── … (same audio stack as above)
  ├── client/js/visualizer.js
  └── client/js/app.js
```

Serve over **HTTP** (`npm run launch` or `npm run dev`). Web Audio and ES module loading fail or degrade under `file://`.

## Shipped SPA

### UI shell

- **Entry:** [`index.html`](../index.html) — Claude Design UI; styles in [`client/css/design.css`](../client/css/design.css)
- **Controller:** [`client/js/design-shell.js`](../client/js/design-shell.js) + [`client/js/design-bridge.js`](../client/js/design-bridge.js) (`window.CalmMind`)
- **Legacy UI:** [`index-legacy.html`](../index-legacy.html) + [`client/js/app.js`](../client/js/app.js) + [`styles.css`](../styles.css)
- **Persistence:** [`client/js/state-manager.js`](../client/js/state-manager.js) → `localStorage` key `calmMindState`
- **Protocols:** [`client/js/protocols.js`](../client/js/protocols.js) — evidence-tagged presets applied before playback

### Audio engine (shipped)

[`client/js/audio.js`](../client/js/audio.js) owns the live Web Audio graph:

```text
User gesture → initAudio()
  → AudioContext + masterGain → destination
  → AnalyserNode (visualizer + CalmMindAudioReactive)
  → Per-track generators (oscillators, noise, scheduled phases)
  → AmbientLoader (looping .ogg buffers from assets/audio/ambient/)
```

Supporting modules:

| Module | Role |
|--------|------|
| `ambient-loader.js` | Fetch/cache CC0 `.ogg`, loop via `AudioBufferSourceNode` |
| `breath-patterns.js` | HRV breath pattern definitions (`coherent`, `box`, `fourSevenEight`) |
| `frequency-scheduler.js` | Multi-phase binaural beat/carrier automation |
| `emdr-audio.js` | Alternating L/R bilateral tones |

**Public globals:** `initAudio`, `playGeneratedTrack`, `stopCurrentTrack`, `setVolume`, `getAnalyser`, `getAudioContext`, `getMasterGain`, `setPlayingState`.

### Visualization (shipped)

**Primary:** [`client/js/calm-viz.js`](../client/js/calm-viz.js) — procedural 2D canvas on `#viz` (`neural`, `tissue`, `mandala`). While audio is playing, motion is driven in real time from the master-bus `AnalyserNode` via `CalmMind.frame`; on the compose screen, motion is synthetic (breath-paced), not FFT-linked. Details: [`subsystems/visualization.md`](../subsystems/visualization.md).

**Legacy:** [`client/js/visualizer.js`](../client/js/visualizer.js) — Three.js on `#visualizerCanvas` (`index-legacy.html` only).

See [`subsystems/visualization.md`](../subsystems/visualization.md) and [`integration/claude-design-alignment.md`](../integration/claude-design-alignment.md).

### Audio-reactive bridge

[`client/js/audio-reactive-bridge.js`](../client/js/audio-reactive-bridge.js) exposes `window.CalmMindAudioReactive` — normalized spectral metrics for custom CSS/canvas/WebGL without a second audio graph. See [`integration/audio-reactive.md`](../integration/audio-reactive.md).

### Optional config bridge

[`client/js/src-bridge.js`](../client/js/src-bridge.js) sets `window.CalmMindSrc` with `SOUND_TYPE_CONFIGS` and `VISUALIZER_CONFIGS` from modular `src/`. No other client script consumes this today; intended for external integrators.

### Static assets

- Ambient audio: [`assets/audio/ambient/`](../assets/audio/ambient/) (CC0, see [`assets/audio/ATTRIBUTION.md`](../assets/audio/ATTRIBUTION.md))
- Branding: [`assets/branding/CalmMind_Logo.jpg`](../assets/branding/CalmMind_Logo.jpg)
- Served as static files by [`server.js`](../server.js) / [`launch.cjs`](../launch.cjs)

## Modular `src/` (Jest-tested)

Used for unit tests and future bundling. Layout:

```text
src/
├── core/           AudioCore, AudioContext, EventBus, StateManager
├── audio/          BufferPool, BaseSoundGenerator, BinauralBeats, noise generators, AudioEffects
├── visualization/  VisualizerManager, setup.js, configManager, visualizerConfigs
└── utils/          logger, ErrorHandler
```

**Test coverage (representative):** `src/audio/*`, `src/core/AudioCore.js`, `src/visualization/setup.js`, `VisualizerManager.js`, `configManager.js`.

**Archived (not in active tree):** Enhanced stack, `src/generators/`, effects, workers, `ThreeDVisualizer` — see [`archive/src-modular-unwired/`](../archive/src-modular-unwired/README.md).

## Archive policy

Orphan or superseded code lives under [`archive/`](../archive/README.md):

- `archive/js/` — legacy intermediate layer (superseded by `client/js/`)
- `archive/src-interfaces/` — unwired alternate UI shell
- `archive/src-core-experimental/` — broken/unused Analytics, PerformanceMonitor, duplicate ErrorHandler
- `archive/src-modular-unwired/` — EnhancedAudioManager, generators, effects, workers, alt visualizers
- `archive/design-prototype/` — pre-integration Claude Design export
- `archive/assets/` — unused static images

Archived trees are not loaded by `index.html` or Jest.

## Server

[`server.js`](../server.js) and [`launch.cjs`](../launch.cjs) are static file servers from the repo root. Port 3000 by default, auto-increment to 3099 if busy. MIME types include `.ogg` for ambient playback.

## Data flow (playback session)

```text
app.js: user clicks Generate
  → CalmMindProtocols.apply? (optional preset)
  → playGeneratedTrack(stress, duration, ambient, soundType, vizType, options)
  → audio.js: build graph, start ambient, schedule stop
  → setupVisualizer(canvas, analyser, vizType)
  → CalmMindAudioReactive (optional subscribe loop)
  → CalmMindState.recordSession on stop
```

## Related documentation

| Doc | Audience |
|-----|----------|
| [`integration/frontend-reference.md`](../integration/frontend-reference.md) | Full `window.*` contract |
| [`guides/development.md`](../guides/development.md) | Conventions for this repo |
| [`subsystems/audio.md`](../subsystems/audio.md) | Shipped audio + modular Enhanced stack |
| [`architecture/modular-api.md`](modular-api.md) | Modular `src/` API examples |
