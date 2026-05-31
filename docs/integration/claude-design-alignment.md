# Claude Design — Alignment Spec

**Purpose:** Handoff document for Claude Design UI integration with the shipped CalmMind engine.  
**Status:** Implemented in repo (canvas viz primary)  
**Last updated:** 2026-05-31  

Canonical engine API: [`frontend-reference.md`](frontend-reference.md) · Live metrics: [`audio-reactive.md`](audio-reactive.md)

---

## Shipped entry point

| File | Role |
|------|------|
| [`index.html`](../../index.html) | Claude Design UI (production entry) |
| [`index-legacy.html`](../../index-legacy.html) | Previous Three.js UI (reference) |
| [`client/css/design.css`](../../client/css/design.css) | Design tokens + layout |
| [`client/js/calm-viz.js`](../../client/js/calm-viz.js) | Canvas visualizers (`CalmViz`) |
| [`client/js/design-bridge.js`](../../client/js/design-bridge.js) | `window.CalmMind` bridge |
| [`client/js/design-shell.js`](../../client/js/design-shell.js) | DOM + transport wiring |

## Script load order

```html
<script src="client/js/ambient-loader.js"></script>
<script src="client/js/protocols.js"></script>
<script src="client/js/frequency-scheduler.js"></script>
<script src="client/js/emdr-audio.js"></script>
<script src="client/js/state-manager.js"></script>
<script src="client/js/audio.js"></script>
<script src="client/js/audio-reactive-bridge.js"></script>
<script src="client/js/calm-viz.js"></script>
<script src="client/js/design-bridge.js"></script>
<script src="client/js/design-shell.js"></script>
```

**Not loaded:** Three.js, `visualizer.js`, legacy `app.js`.

## Single source of truth

| Data | Source | Do not duplicate |
|------|--------|------------------|
| Guided protocols | `CalmMindProtocols.PROTOCOLS` | Inline preset arrays |
| Ambient keys | `AmbientLoader.AMBIENT_MANIFEST` | Hardcoded ambient lists |
| Frequency preview | `CalmMindAudioReactive.estimateTargetFrequencies` | Ad-hoc Hz math |
| Live session | `CalmMindAudioReactive.getAudioFrame` | Fake timers for band/phase |

## Session lifecycle

1. User gesture → `stopCurrentTrack()` → `initAudio()` → `AudioContext.resume()`
2. `playGeneratedTrack(stress, durationMin, ambient, soundType, 'particles', { protocolId, frequencyPhases, moodBefore })`
3. `setPlayingState(true)` · canvas driven by `CalmMind.frame` from bridge
4. Stop → `stopCurrentTrack()` · `CalmMindState.addSession()` · reset UI

## Canvas visualizer modes

| UI mode | `CalmViz` factory | Default for protocol |
|---------|-------------------|----------------------|
| `neural` | Neural Bloom | `blsCalm` |
| `tissue` | Living Tissue | `anxietyReset`, `sleepOnset`, `coherenceBreath`, `deepSleep`, `windDown`, `boxBreath` |
| `mandala` | Synaptic Mandala | `focusSprint`, `focusStudy` |

### Visual reactivity (playing vs idle)

The three modes are **live canvas animations**, not static images. [`design-bridge.js`](../../client/js/design-bridge.js) updates `CalmMind.frame` every animation frame:

- **Playing:** `CalmMindAudioReactive.getAudioFrame({ includeSpectrum: true })` (or direct `getAnalyser()` fallback) → `amp`, `bass`, `mid`, `treble`, optional `spectrum` for Mandala bars. Input is the **mixed master bus** (tones + ambient).
- **Compose / stopped:** `frame.playing === false` → synthetic breath motion; `frame.data` is `null`; Mandala falls back to sine-driven bars.

Full behavior table and per-mode mapping: [`subsystems/visualization.md`](../subsystems/visualization.md#audio-reactivity-playing-vs-idle).

## DOM IDs (design UI)

`#app`, `#viz`, `.setup-scroll`, `.setup-inner`, `.brand-logo`, `.brand-title` (h1), `.brand-tagline`, `#stress`, `#duration`, `#ambient`, `#soundType`, `#generate`, `.wellness-note`, `.compose-legal` (uppercase lab-style footer links; `·` separators hidden via CSS), `#volume`, `#headphonesHint` (icon + text inside scroll column; auto-dismiss ~4.5s; hidden while playing), `#moodBefore`, `#moodAfter`, playing chrome (`#bandName`, `#beatHz`, dock controls).

**Layout:** `.setup-scroll` fills the viewport below the top bar — centers the compose card when tall enough, scrolls on short viewports. Top bar has a fade gradient (`::before`) so content does not clash under the logo.

**Branding:** [`assets/branding/CalmMind_Logo.jpg`](../../assets/branding/CalmMind_Logo.jpg) (top bar); [`assets/branding/calm-mind-mark.svg`](../../assets/branding/calm-mind-mark.svg) (gradient mark, favicon source). Favicon is inline SVG in `index.html` `<head>`.

Legacy IDs (`#stressLevel`, `#visualizerCanvas`) remain on `index-legacy.html` only.

## Acceptance checklist

- [x] Engine scripts loaded; status **SYNTHESIZING** with real audio
- [x] Protocols from `protocols.js` (not inline duplicates)
- [x] All 13 ambient keys in UI
- [x] `protocolId` passed to `playGeneratedTrack`
- [x] `CalmMindState` persist + session log on stop
- [x] `prefers-reduced-motion` caps viz motion
- [x] No Three.js on `index.html`

---

See [`custom-front-end-plan.md`](custom-front-end-plan.md) for phase history.
