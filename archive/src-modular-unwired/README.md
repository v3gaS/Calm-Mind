# Modular code — unwired from runtime

**Archived:** 2026-05-31  
**Status:** Not loaded by `index.html`, `index-legacy.html`, or Jest (except nothing here is tested)

Experimental **Enhanced** audio stack and alternate visualizers that were never wired to the shipped SPA. Kept for reference if bundling `src/` into the browser later.

## Contents

| Path | Description |
|------|-------------|
| [`core/`](core/) | `EnhancedAudioManager`, `EnhancedAudioCore`, legacy `AudioManager` |
| [`generators/`](generators/) | High-level generator classes (Binaural, Isochronic, EMDR, …) |
| [`effects/`](effects/) | Graph-style effects (Reverb, Filter, Spatial) for Enhanced stack |
| [`workers/`](workers/) | `AudioProcessingWorker` (needs bundler for browser URLs) |
| [`visualization/`](visualization/) | `ThreeDVisualizer`, `AudioVisualizer`, particle shaders |
| [`utils/`](utils/) | `MemoryManager` / `WorkerPool`, duplicate `AudioAnalyzer`, `AudioUtils` |
| [`audio/`](audio/) | Standalone `AudioAnalyzer` duplicate |

## Active modular code (still in `src/`)

Jest-tested modules used for future bundle / config bridge:

- `src/audio/` — `BinauralBeats`, noise generators, `AudioEffects`, `BufferPool`
- `src/core/` — `AudioCore`, `AudioContext`, `EventBus`, `StateManager`
- `src/visualization/` — `setup.js`, `VisualizerManager`, configs (`CalmMindSrc` via `src-bridge.js`)
- `src/utils/` — `logger`, `ErrorHandler`

## Restoring

Do not import from here in shipped `client/js/` without repair and tests. To revive:

```bash
git mv archive/src-modular-unwired/generators src/generators  # example
```

Then fix imports and add Jest coverage before wiring to the SPA.
