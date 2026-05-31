# CalmMind Audio Subsystem

Two audio implementations coexist in this repo. **Integrators and the live app** should start with the shipped stack; the modular Enhanced stack is for Jest and future bundling.

| Stack | Path | Used by `index.html`? |
|-------|------|----------------------|
| **Shipped** | `client/js/audio.js` + helpers | **Yes** |
| **Modular (active `src/`)** | `src/audio/*`, `src/core/AudioCore.js`, visualization configs | **No** (except config bridge) |
| **Modular (archived)** | `archive/src-modular-unwired/*` — Enhanced stack, protocol generators | **No** |

Full API reference: [`integration/frontend-reference.md`](../integration/frontend-reference.md).

---

## Shipped audio (`client/js/`)

### Primary module: `client/js/audio.js`

Owns the browser `AudioContext`, master gain, analyser, and all runtime sound generation.

**Globals on `window`:**

- `initAudio()` — create/resume context (requires user gesture)
- `playGeneratedTrack(stress, durationMin, ambient, soundType, vizType, options?)`
- `stopCurrentTrack()`, `setVolume(value)`, `setPlayingState(playing)`
- `getAnalyser()`, `getAudioContext()`, `getMasterGain()`

**Sound types** (18) include binaural presets, isochronic tones (including sleep), white/pink/brown noise, HRV coherence pacer with breath patterns, bilateral stimulation (BLS), Solfeggio sets, and nature ambience (via samples).

### Supporting modules

| Module | Role |
|--------|------|
| [`ambient-loader.js`](../../client/js/ambient-loader.js) | Load/loop CC0 `.ogg` from `assets/audio/ambient/` |
| [`breath-patterns.js`](../../client/js/breath-patterns.js) | HRV breath pattern definitions (`coherent`, `box`, `fourSevenEight`) |
| [`frequency-scheduler.js`](../../client/js/frequency-scheduler.js) | Multi-phase binaural beat scheduling |
| [`emdr-audio.js`](../../client/js/emdr-audio.js) | Alternating L/R tones (self-regulation, not clinical EMDR) |
| [`protocols.js`](../../client/js/protocols.js) | Preset sessions applied before `playGeneratedTrack` |
| [`audio-reactive-bridge.js`](../../client/js/audio-reactive-bridge.js) | `CalmMindAudioReactive` — spectral metrics for custom visuals |

### Ambient assets

Manifest keys match files under [`assets/audio/ambient/`](../../assets/audio/ambient/). Attribution: [`assets/audio/ATTRIBUTION.md`](../../assets/audio/ATTRIBUTION.md).

### Web Audio graph (simplified)

```text
masterGain → destination
           → AnalyserNode → visualizer.js / CalmMindAudioReactive
Oscillators / noise / scheduled phases → masterGain
AmbientLoader (AudioBufferSourceNode loop) → masterGain
```

---

## Modular Enhanced stack (archived)

Not loaded by the shipped SPA. Jest covers active `src/audio/*` and `AudioCore` only. The Enhanced stack and protocol generators were moved to [`archive/src-modular-unwired/`](../../archive/src-modular-unwired/README.md) on 2026-05-31.

### Lower-level tested modules (active `src/`)

- [`src/audio/generators/`](../../src/audio/generators/) — `BinauralBeats`, pink/white noise (Jest)
- [`src/audio/core/BufferPool.js`](../../src/audio/core/BufferPool.js) — buffer reuse
- [`src/core/AudioCore.js`](../../src/core/AudioCore.js) — simpler core used in tests

For EnhancedAudioManager usage examples, see [`archive/src-modular-unwired/README.md`](../../archive/src-modular-unwired/README.md).

---

## Appendix: modular audio analysis (archived)

The shipped app uses a single master-bus `AnalyserNode` in `client/js/audio.js`. Advanced analysis lives in modular code only:

[`archive/src-modular-unwired/utils/AudioAnalyzer.js`](../../archive/src-modular-unwired/utils/AudioAnalyzer.js) and [`archive/src-modular-unwired/audio/AudioAnalyzer.js`](../../archive/src-modular-unwired/audio/AudioAnalyzer.js) provide FFT-based features for the archived Enhanced stack — **not** wired to `index.html`.

```javascript
import { AudioAnalyzer } from '../../archive/src-modular-unwired/audio/AudioAnalyzer.js';

const analyzer = new AudioAnalyzer(audioContext, {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
});
```

For live reactive visuals in the shipped app, use [`CalmMindAudioReactive`](../integration/audio-reactive.md) instead.

---

## Choosing a stack

| Task | Use |
|------|-----|
| Fix playback bug users see in browser | `client/js/audio.js` |
| Add new sound type to live app | `client/js/audio.js` + `index.html` + integration docs |
| Unit-test generator math in isolation | `src/audio/generators/*` (active) or restore from `archive/src-modular-unwired/` |
| Long-term modular migration | Implement in `src/`, then wire via bundle or bridge |

---

## Browser requirements

- Web Audio API (all stacks)
- HTTP server (not `file://`)
- Headphones recommended for binaural content

See [`architecture/overview.md`](../architecture/overview.md) for full system context.
