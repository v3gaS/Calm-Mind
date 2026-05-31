# Claude Design — Audio-Reactive Visuals Reference

**Purpose:** Make a **static generated image** (PNG, SVG, or background) react to CalmMind session audio in real time.

**Audience:** Front-end / design implementation (Claude Design or any custom UI).

**Related code:** `client/js/audio-reactive-bridge.js`  
**Broader app wiring:** [`frontend-reference.md`](frontend-reference.md)  
**Shipped canvas visualizers (Neural / Tissue / Mandala):** [`subsystems/visualization.md`](../subsystems/visualization.md) — same analyser path via `CalmMind.frame` when `frame.playing` is true.

---

## TL;DR

1. Load CalmMind audio scripts (see [Required scripts](#required-scripts)).
2. On user click → `playGeneratedTrack(...)` starts sound.
3. Call `CalmMindAudioReactive.subscribe(callback, { autoApplyTo: '#yourImage' })`.
4. The image pulses/glows from **live audio energy** — no server, no WebSocket.
5. On stop → `unsubscribe()` + `stopCurrentTrack()`.

**Do:** One AI-generated asset + CSS/canvas motion driven by audio.  
**Don’t:** Regenerate AI art every frame (too slow).

---

## Architecture

Everything runs in the browser.

```
User clicks Play
       ↓
playGeneratedTrack()  →  Web Audio oscillators / noise / ambient .ogg
       ↓
   masterGain
       ↓
 AnalyserNode  ←── CalmMindAudioReactive reads here (~60 fps)
       ↓
   speakers

subscribe() loop  →  { level, bass, mid, treble }  →  your <img> / canvas / CSS
```

No backend audio stream. No exported WAV. No second audio graph.

---

## Required scripts

Load in this order (same as `index.html`):

```html
<script src="client/js/ambient-loader.js"></script>
<script src="client/js/protocols.js"></script>
<script src="client/js/frequency-scheduler.js"></script>
<script src="client/js/emdr-audio.js"></script>
<script src="client/js/state-manager.js"></script>
<script src="client/js/audio.js"></script>
<script src="client/js/audio-reactive-bridge.js"></script>
```

Serve over HTTP (`npm run dev` or `npm run launch`). **Do not** open as `file://`.

Minimum for reactive visuals only (if audio is already started elsewhere):

```html
<script src="client/js/audio.js"></script>
<script src="client/js/audio-reactive-bridge.js"></script>
```

---

## Global API: `window.CalmMindAudioReactive`

| Method / property | Description |
|-------------------|-------------|
| `VERSION` | `'1.0.0'` |
| `getAudioFrame(options?)` | One-shot sample; returns frame object or `null` |
| `subscribe(callback, options?)` | `requestAnimationFrame` loop; returns `unsubscribe()` |
| `start()` / `stop()` | Manual loop control (rare; prefer `subscribe`) |
| `setSessionMetadata(obj)` | If you bypass `playGeneratedTrack` |
| `getSessionMetadata()` | Current session settings or `null` |
| `getLastFrame()` | Most recent frame |
| `estimateTargetFrequencies(stress, soundType)` | Preview Hz / brain band for UI copy |
| `mapFrameToVisualStyle(frame, preset?)` | `{ transform, filter, opacity }` |
| `applyVisualStyleToElement(el, frame, preset?)` | Apply CSS to a DOM node |
| `isRunning()` | Is the rAF loop active? |
| `isAudioActive()` | Playing + `AudioContext` running |
| `BRAIN_BAND_RANGES` | Delta/theta/alpha/beta/gamma Hz ranges for labels |
| `DEFAULT_BAND_SLICES` | FFT bin ranges for bass/mid/treble |

The bridge **automatically hooks** `playGeneratedTrack`, `setPlayingState`, and `stopCurrentTrack` — no extra wiring in the legacy app.

---

## Frame object (what you get each tick)

```javascript
{
  timestamp: 1234567.89,        // performance.now()
  audioTime: 42.5,              // AudioContext.currentTime
  isPlaying: true,
  contextState: 'running',      // running | suspended | closed

  // LIVE — use these to drive motion (all 0–1)
  level: 0.42,                  // overall energy
  bass: 0.55,                   // low frequencies
  mid: 0.38,
  treble: 0.22,
  peakFrequencyHz: 180.4,       // loudest bin in the mix (not beat Hz)

  // optional (request via subscribe options)
  spectrum: Uint8Array,         // includeSpectrum: true
  waveform: Uint8Array,         // includeWaveform: true

  // SESSION — use for labels & slow rhythm (not live EEG)
  session: {
    soundType: 'binauralRelax',
    stressLevel: 6,
    durationMin: 15,
    ambientSound: 'rain',
    vizType: 'particles',
    protocolId: 'anxietyReset',
    carrierHz: 250,
    beatHz: 10,
    brainBand: { id: 'alpha', label: 'Alpha', beatHz: 10 },
    headphonesRequired: true,
    elapsedSec: 83.2,
    remainingSec: 816.8,
    phaseIndex: 0,
  }
}
```

### Live vs static — important for design

| Data | Live? | Use for |
|------|-------|---------|
| `level`, `bass`, `mid`, `treble` | **Yes** | Scale, brightness, blur, particle speed |
| `peakFrequencyHz` | **Yes** | Color accents, sparkle |
| `session.beatHz`, `session.brainBand` | **No** (configured) | Text: “Alpha · 10 Hz” |
| `session.elapsedSec`, `remainingSec` | **Clock** | Progress ring, countdown |
| Left vs right channel | **Not available** | Single analyser on stereo mix |

---

## Quick start — reactive `<img>`

### HTML

```html
<div class="session-stage">
  <img id="sessionArt" src="/assets/your-generated-art.png" alt="" />
  <p id="bandLabel"></p>
  <p id="beatLabel"></p>
  <button type="button" id="btnStart">Start session</button>
  <button type="button" id="btnStop">Stop</button>
</div>
```

### CSS (recommended)

```css
#sessionArt {
  display: block;
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  transform-origin: center center;
  will-change: transform, filter;
  transition: none; /* bridge sets transform/filter every frame */
}
```

### JavaScript

```javascript
let unsubscribeReactive = null;

async function startSession() {
  window.initAudio();
  const ctx = window.getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const ok = await Promise.resolve(
    window.playGeneratedTrack(
      5,              // stressLevel 1–10
      10,             // duration minutes
      'ocean-calm',   // ambientSound | 'none'
      'binauralRelax',// soundType (see frontend-integration-reference.md)
      'particles',    // vizType (ignored if you skip Three.js viz)
      { protocolId: 'none' }
    )
  );
  if (ok === false) return;

  unsubscribeReactive?.();
  unsubscribeReactive = CalmMindAudioReactive.subscribe(
    (frame) => {
      const s = frame.session;
      document.getElementById('bandLabel').textContent = s?.brainBand?.label ?? '';
      document.getElementById('beatLabel').textContent =
        s?.beatHz != null ? `${s.beatHz.toFixed(1)} Hz` : '';
    },
    {
      preset: 'breathe',
      autoApplyTo: '#sessionArt',
    }
  );
}

function stopSession() {
  unsubscribeReactive?.();
  unsubscribeReactive = null;
  window.stopCurrentTrack();
  const img = document.getElementById('sessionArt');
  img.style.transform = '';
  img.style.filter = '';
  img.style.opacity = '';
}

document.getElementById('btnStart').addEventListener('click', () => {
  startSession().catch(console.error);
});
document.getElementById('btnStop').addEventListener('click', stopSession);
```

---

## `subscribe(callback, options)`

```javascript
const unsubscribe = CalmMindAudioReactive.subscribe(
  (frame, options) => {
    // your custom logic
  },
  {
    preset: 'pulse',           // pulse | breathe | glow | calm
    autoApplyTo: '#sessionArt', // HTMLElement or CSS selector
    includeSpectrum: false,    // attach frame.spectrum (Uint8Array)
    includeWaveform: false,    // attach frame.waveform
  }
);

// when done:
unsubscribe();
```

### Visual presets (`preset`)

| Preset | Effect |
|--------|--------|
| `pulse` | Scale + brightness + saturation (default, energetic) |
| `breathe` | Gentle scale; slow oscillation when beat &lt; 2 Hz (HRV/sleep) |
| `glow` | Blur + brightness bloom |
| `calm` | Subtle scale/contrast (minimal UI) |

Manual mapping:

```javascript
const style = CalmMindAudioReactive.mapFrameToVisualStyle(frame, 'glow');
// { transform: 'scale(1.04)', filter: 'brightness(1.2) blur(12px)...', opacity: 1 }
```

---

## Custom motion (canvas / WebGL)

Use live bands directly:

```javascript
CalmMindAudioReactive.subscribe((frame) => {
  const { bass, mid, level } = frame;
  const ctx = canvas.getContext('2d');
  const r = 60 + bass * 100;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${200 + mid * 80}, 70%, ${50 + level * 30}%, 0.9)`;
  ctx.fill();
});
```

Spectrum bars:

```javascript
CalmMindAudioReactive.subscribe((frame) => {
  if (!frame.spectrum) return;
  const n = 48;
  const step = Math.floor(frame.spectrum.length / n);
  for (let i = 0; i < n; i++) {
    const h = (frame.spectrum[i * step] / 255) * canvas.height;
    // draw bar at x = i * barWidth, height = h
  }
}, { includeSpectrum: true });
```

---

## Session labels before playback

Show copy before audio starts:

```javascript
const preview = CalmMindAudioReactive.estimateTargetFrequencies(5, 'binauralFocus');
// {
//   carrierHz: 180,
//   beatHz: 8,
//   brainBand: { id: 'alpha', label: 'Alpha', beatHz: 8 },
//   headphonesRequired: true,
//   description: 'Binaural carrier ~180 Hz, beat ~8 Hz'
// }
```

---

## Sound types (`soundType` values)

Use these strings in `playGeneratedTrack(..., soundType, ...)`:

| Value | Headphones? | Notes |
|-------|-------------|-------|
| `binauralRelax` | Yes | Alpha/theta beat |
| `binauralFocus` | Yes | Stress +2 before freq map |
| `binauralSleep` | Yes | Stress −2 |
| `isochronicEnergy` | No | Stress +3 |
| `isochronicMeditate` | No | Stress −2 |
| `isochronicSleep` | No | Fixed ~2.5 Hz pulse |
| `pinkNoise` | No | No beat — use `level` only |
| `whiteNoise` | No | No beat — use `level` only |
| `brownNoise` | No | No beat — use `level` only |
| `nature` | No | Ambient file |
| `solfeggio` | No | Single tone by stress |
| `monaural` | No | AM beat, mono |
| `gamma` | No | ~40 Hz |
| `hrv` | No | ~0.1 Hz — use `breathe` preset |
| `emdrBls` | Yes | L/R pan ~1.5 Hz |
| `soundBath` | Recommended | Spatial bowls |
| `psychoacoustic` | No | Harmonic stack |
| `neuroacoustic` | No | Detuned carriers |

Ambient keys: `none`, `rain`, `rain-heavy`, `rain-tent`, `rain-concrete`, `ocean`, `ocean-calm`, `ocean-dellec`, `ocean-terns`, `forest`, `forest-stream`, `fireplace`, `night-crickets`, `wind-grass`.

---

## Protocol presets (optional)

```javascript
// Uses CalmMindProtocols — load protocols.js
window.playGeneratedTrack(6, 15, 'rain', 'binauralRelax', 'particles', {
  protocolId: 'anxietyReset',
  frequencyPhases: [
    { durationSec: 300, beatHz: 10, carrierHz: 250 },
    { durationSec: 600, beatHz: 6, carrierHz: 250 },
  ],
});
```

During playback, `frame.session.beatHz` updates by elapsed time across phases. Use `frame.session.elapsedSec` / `remainingSec` for progress UI.

Protocol IDs: `anxietyReset`, `sleepOnset`, `focusSprint`, `coherenceBreath`, `blsCalm`, `deepSleep`, `focusStudy`, `windDown`, `boxBreath`.

Optional `options.breathPattern`: `coherent`, `box`, `fourSevenEight` (HRV and breath protocols).

---

## Lifecycle checklist

| User action | Your code |
|-------------|-----------|
| **Start** | `initAudio()` → `ctx.resume()` → `playGeneratedTrack(...)` → `subscribe(...)` |
| **Pause** | App calls `audioCtx.suspend()` — bridge sets `isPlaying: false`, motion dampens |
| **Resume** | `audioCtx.resume()` + `setPlayingState(true)` |
| **Stop** | `unsubscribe()` → `stopCurrentTrack()` → reset image CSS |

---

## Design guidelines

1. **Asset:** Export one high-res PNG/SVG; avoid text baked into the image (labels come from HTML).
2. **Motion:** Prefer `transform` + `filter` (GPU-friendly); avoid layout properties (`width`, `top`).
3. **Intensity:** Typical scale range `1.0 – 1.08` from `level`; stronger looks gimmicky.
4. **Pink noise / nature:** Motion comes from `level`/`bass` only — no meaningful `beatHz`.
5. **HRV / sleep:** Use `preset: 'breathe'`; optionally sync UI to `session.beatHz` when &lt; 2.
6. **Accessibility:** Respect `prefers-reduced-motion` — skip subscribe or cap `level` multiplier.
7. **User gesture:** First interaction must call `getAudioContext().resume()` or audio stays silent.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `getAudioFrame()` returns `null` | Call `initAudio()` first; ensure track was generated |
| Image never moves | Subscribe **after** `playGeneratedTrack`; check `#sessionArt` selector |
| No sound | `AudioContext` suspended — await `ctx.resume()` in click handler |
| Motion continues after stop | Call `unsubscribe()` before/alongside `stopCurrentTrack()` |
| Wrong Hz label | Labels are **targets**, not analyser readings — expected |

---

## Escape hatch

Low-level access (same analyser the bridge uses):

```javascript
const analyser = window.getAnalyser();
analyser.getByteFrequencyData(myUint8Array);
```

Prefer `CalmMindAudioReactive` for normalized 0–1 values and session metadata.

---

## File index

| File | Role |
|------|------|
| `client/js/audio-reactive-bridge.js` | This feature |
| `client/js/audio.js` | Audio engine + analyser |
| `client/js/app.js` | Legacy UI (reference for lifecycle) |
| `client/js/protocols.js` | Guided session presets |
| `client/js/ambient-loader.js` | Nature `.ogg` paths |
| [`frontend-reference.md`](frontend-reference.md) | Full app integration |
| [`custom-front-end-plan.md`](custom-front-end-plan.md) | Phases, checklist, acceptance criteria |

---

*See also: [`custom-front-end-plan.md`](custom-front-end-plan.md) for implementation phases.*
