# CalmMind Technical Documentation

> **Shipped SPA API:** [`integration/frontend-reference.md`](../integration/frontend-reference.md) documents `window.*` globals from `client/js/`.  
> **Architecture overview:** [`architecture/overview.md`](overview.md).

This file focuses on the **modular ES module stack** under `src/` (Jest-tested, not the primary runtime path for `index.html`).

---

## Modular architecture

```text
src/
├── core/           AudioContext, EventBus, StateManager, AudioCore, Enhanced*
├── audio/          BufferPool, generators, AudioEffects
├── generators/     Protocol-oriented therapeutic generators
├── visualization/  VisualizerManager, setup, configs
├── effects/        Filter, Reverb, Spatial
└── utils/          logger, ErrorHandler, AudioAnalyzer
```

---

## Audio context (modular)

[`src/core/AudioContext.js`](../src/core/AudioContext.js) — singleton manager for Web Audio in module tests and future bundles.

```javascript
import { audioContextManager } from '../core/AudioContext.js';

audioContextManager.initialize();
const context = audioContextManager.getContext();
const analyser = audioContextManager.getAnalyser();
```

The **shipped** app uses its own context in [`client/js/audio.js`](../client/js/audio.js) instead.

---

## State management (modular)

[`src/core/StateManager.js`](../src/core/StateManager.js) — in-memory singleton with subscribe/set API for modular visualization setup.

```javascript
import { stateManager } from '../core/StateManager.js';

const unsubscribe = stateManager.subscribe((state) => {
  console.log('State updated:', state);
});

stateManager.set('visualizerManager', manager);
unsubscribe();
```

**Shipped** persistence uses [`client/js/state-manager.js`](../client/js/state-manager.js) (`CalmMindState` / localStorage).

---

## Event bus

[`src/core/EventBus.js`](../src/core/EventBus.js):

```javascript
import { eventBus } from '../core/EventBus.js';

eventBus.on('visualizer:initialized', (data) => {
  console.log('Visualizer ready:', data);
});

eventBus.emit('visualizer:initialized', { success: true });
```

---

## Sound generators (modular)

### `src/audio/` (Jest-covered)

[`BaseSoundGenerator`](../src/audio/generators/BaseSoundGenerator.js) — base class for binaural and noise generators under `src/audio/generators/`.

### Protocol generators (archived)

Higher-level generators (`Binaural`, `Isochronic`, `Ambient`, `Solfeggio`, `Monaural`, `EMDR`, `HRV`) and `EnhancedAudioManager` live under [`archive/src-modular-unwired/`](../../archive/src-modular-unwired/README.md). They are **not** in active `src/` and are not Jest-covered.

To unit-test generator math today, use [`src/audio/generators/`](../src/audio/generators/) (Jest-covered).

---

## Visualization (modular)

[`src/visualization/setup.js`](../src/visualization/setup.js):

```javascript
import { initializeVisualizer, changeVisualizerType } from '../visualization/setup.js';

const manager = initializeVisualizer(canvasElement, { type: 'particles' });
changeVisualizerType('meshWave');
```

**Shipped primary visualizer:** [`client/js/calm-viz.js`](../client/js/calm-viz.js) — procedural canvas `CalmViz` on `#viz`; audio-reactive when `CalmMind.frame.playing` (see [`subsystems/visualization.md`](../subsystems/visualization.md)).

**Legacy Three.js visualizer:** [`client/js/visualizer.js`](../client/js/visualizer.js) (`index-legacy.html`, types include `spectrum`).

Config objects: [`src/visualization/configs/visualizerConfigs.js`](../src/visualization/configs/visualizerConfigs.js) — exposed optionally as `window.CalmMindSrc` via [`client/js/src-bridge.js`](../client/js/src-bridge.js).

---

## Testing modular code

```bash
npm test
```

Mocks in [`tests/setup.js`](../tests/setup.js) provide `AudioContext`, canvas, and animation frame stubs.

---

## Archive

Superseded code (legacy `js/`, experimental core modules) lives in [`archive/`](../archive/README.md). Do not import from archived paths in active modules.

---

## Related docs

| Doc | Content |
|-----|---------|
| [`subsystems/audio.md`](../subsystems/audio.md) | Shipped vs Enhanced audio |
| [`guides/development.md`](../guides/development.md) | Conventions |
| [`integration/frontend-reference.md`](../integration/frontend-reference.md) | Live `window.*` contract |
