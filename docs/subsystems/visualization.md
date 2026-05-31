# CalmMind Visualization Subsystem

The **shipped** app uses Claude Design **canvas** visualizers in [`client/js/calm-viz.js`](../../client/js/calm-viz.js) on `#viz`. The legacy Three.js visualizer in [`client/js/visualizer.js`](../../client/js/visualizer.js) remains for [`index-legacy.html`](../../index-legacy.html). Modular visualization under `src/visualization/` is Jest-tested but not loaded by the primary entry.

Full wiring: [`architecture/overview.md`](../architecture/overview.md). Alignment spec: [`integration/claude-design-alignment.md`](../integration/claude-design-alignment.md).

---

## Shipped canvas visualizer (`client/js/calm-viz.js`)

### What they are (not static images)

Neural Bloom, Living Tissue, and Synaptic Mandala are **procedurally drawn** on a `<canvas id="viz">` every animation frame (~60 fps via `requestAnimationFrame`). They are **not** pre-rendered PNGs, AI image sequences, or video loops. Each mode is a factory that paints 2D graphics (nodes, blobs, radial bars) and reads the same shared frame object on every tick.

### Globals

- `CalmViz.neural(canvas, getFrame)` — Neural Bloom (3D node graph, pulses)
- `CalmViz.tissue(canvas, getFrame)` — Living Tissue (multi-cell metaball organism, plankton, membrane rim)
- `CalmViz.mandala(canvas, getFrame)` — Synaptic Mandala (radial spectrum bars)

Each factory returns `{ resize(), destroy() }`. `getFrame()` reads `window.CalmMind.frame` (updated by [`design-bridge.js`](../../client/js/design-bridge.js)).

### Visualizer modes

| Mode | UI label | Typical protocol |
|------|----------|------------------|
| `neural` | Neural Bloom | BLS Calm |
| `tissue` | Living Tissue | Anxiety Reset, Sleep Onset, Coherence, Deep Sleep, Wind Down, Box Breath |
| `mandala` | Synaptic Mandala | Focus Sprint, Focus / Study |

Set via segmented controls `#vizSeg` / `#vizSeg2` in [`index.html`](../../index.html).

Set via segmented controls `#vizSeg` / `#vizSeg2` in [`index.html`](../../index.html). The canvas mounts on load (default `neural`) and keeps running on compose and playing screens.

### Audio reactivity: playing vs idle

[`design-bridge.js`](../../client/js/design-bridge.js) runs `updateFrame()` on every animation frame and exposes `window.CalmMind.frame`. [`design-shell.js`](../../client/js/design-shell.js) passes `() => CalmMind.frame` into each `CalmViz.*` factory.

| State | `frame.playing` | Audio source | What you see |
|-------|-----------------|--------------|--------------|
| **Compose / stopped** | `false` | None (synthetic envelope) | Slow breath-paced motion; `frame.data` is `null`; Mandala uses sine fallbacks instead of spectrum |
| **Playing** | `true` | Live master-bus analyser | Motion driven by real output (tones + ambient mixed at `masterGain`) |

**While playing**, the bridge tries in order:

1. `CalmMindAudioReactive.getAudioFrame({ includeSpectrum: true })` — preferred; sets `level`, `bass`, `mid`, `treble`, and optional `spectrum` (`Uint8Array`).
2. Fallback: `getAnalyser().getByteFrequencyData()` and manual band averages.
3. If both fail: synthetic `demoData` shaped by `frame.breath` (still marked playing, but not true FFT).

**Breath pacing:** When the reactive frame includes session beat Hz (e.g. HRV / slow modulation), `frame.breath` can follow that period; otherwise a default period (~10.9 s) applies.

**Reduced motion:** `prefers-reduced-motion: reduce` sets `frame.motionScale` to `0.35`, scaling `amp` / band values before they reach the canvas.

### `CalmMind.frame` fields (viz contract)

| Field | Type | Role |
|-------|------|------|
| `amp` | number 0–1 | Overall energy (RMS / level) |
| `bass`, `mid`, `treble` | number 0–1 | Band averages from spectrum |
| `data` | `Uint8Array` \| `null` | Byte frequency data for Mandala bars; `null` when not playing |
| `breath` | number 0–1 | Smooth 0–1 breath phase (UI pacer + idle motion) |
| `breathLabel` | string \| null | Phase word for breath cue (`Breathe in`, `Hold`, …) when pattern active |
| `playing` | boolean | Whether a session is active |
| `motionScale` | number | Accessibility scale (1 or ~0.35) |
| `a`, `b`, `c` | RGB tuples | Palette from `CalmMind.PALETTES[vizMode]` |

### Per-mode mapping (when playing)

| Mode | Primary audio inputs |
|------|----------------------|
| **Neural** | `mid` → edge brightness; `amp` / `bass` → core glow; `treble` → pulse spawn rate along edges |
| **Tissue** | `amp` → colony scale, cell orbit, plankton drift; `mid` → cell/nucleus size; `breath` → organism pulse; palette `a`/`b` → body gradient and membrane |
| **Mandala** | `frame.data` → radial bar heights; without data, time-based sine bars (idle / fallback) |

### Audio integration

[`design-bridge.js`](../../client/js/design-bridge.js) polls `CalmMindAudioReactive.getAudioFrame({ includeSpectrum: true })` each animation frame when `frame.playing` is true. Spectrum bytes feed Mandala bars; `level` / `bass` / `mid` / `treble` drive motion in all three modes.

```text
audio.js: masterGain → AnalyserNode → destination
                    ↘
         audio-reactive-bridge.js (getAudioFrame)
                    ↘
         design-bridge.js (updateFrame → CalmMind.frame)
                    ↘
         calm-viz.js (requestAnimationFrame draw loops)
```

**Important:** Reactivity reflects the **mixed master output**, not separate per-layer analysers. There is no second audio graph for visuals.

### Script dependency

Load after `audio-reactive-bridge.js`:

```html
<script src="client/js/calm-viz.js"></script>
<script src="client/js/design-bridge.js"></script>
<script src="client/js/design-shell.js"></script>
```

---

## Legacy Three.js visualizer (`client/js/visualizer.js`)

Used only by [`index-legacy.html`](../../index-legacy.html).

### Globals

- `setupVisualizer(canvas, analyser, vizType)` — initialize Three.js scene on `#visualizerCanvas`
- `changeVisualizerType(type)` — switch mode during playback
- `__vizSetPlayingState(playing)` — internal sync with audio engine

### Visualizer types

| `vizType` | Description |
|-----------|-------------|
| `particles` | Audio-reactive particle field (default) |
| `meshWave` | Deforming mesh driven by frequency bands |
| `spectrum` | Bar/spectrum-style display |

### Custom reactive UI (static image / CSS)

For static images or CSS-driven motion, use [`CalmMindAudioReactive`](../integration/audio-reactive.md) instead of extending `visualizer.js`.

---

## Modular visualization (`src/visualization/`) — not shipped

These modules support Jest and future bundling; **do not** document them as the live app path.

| Module | Role |
|--------|------|
| [`setup.js`](../../src/visualization/setup.js) | `initializeVisualizer`, type switching (tested) |
| [`VisualizerManager.js`](../../src/visualization/VisualizerManager.js) | Canvas/WebGL particle manager (tested) |
| [`configs/configManager.js`](../../src/visualization/configs/configManager.js) | Config merge/validation (tested) |
| [`ThreeDVisualizer.js`](../../archive/src-modular-unwired/visualization/ThreeDVisualizer.js) | Alternate Three.js visualizer — **archived** |
| [`visualizerConfigs.js`](../../src/visualization/configs/visualizerConfigs.js) | Config objects exposed via `CalmMindSrc` bridge |

### Example (modular / test harness only)

```javascript
import { initializeVisualizer } from '../../src/visualization/setup.js';

const manager = initializeVisualizer(canvasElement, { type: 'particles' });
```

### Config bridge

[`client/js/src-bridge.js`](../../client/js/src-bridge.js) imports `SOUND_TYPE_CONFIGS` and `VISUALIZER_CONFIGS` from `visualizerConfigs.js` as optional `window.CalmMindSrc` — not consumed by other client scripts today.

---

## Performance notes (shipped)

- Analyser FFT size and smoothing are set in `audio.js` (responsiveness vs CPU).
- **Primary UI:** `design-shell.js` debounces canvas resize (`vizInst.resize()`); destroy/recreate on viz mode change.
- **Legacy UI:** `visualizer.js` re-inits on dimension changes; gate debug logs with `DEBUG_VIZ`.

---

## Related docs

| Doc | Content |
|-----|---------|
| [`integration/frontend-reference.md`](../integration/frontend-reference.md) | `vizType` in `playGeneratedTrack`, script order |
| [`integration/audio-reactive.md`](../integration/audio-reactive.md) | Custom visuals API |
| [`architecture/modular-api.md`](../architecture/modular-api.md) | `src/visualization` module imports |
