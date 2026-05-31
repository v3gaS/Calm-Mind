# CalmMind — Front-End Integration Reference

Wiring reference from the **live client path** (`client/js/*` + entry HTML). Playback runs through globals on `window`, not React/Vue. Active modular code under `src/` is Jest-tested but **not** what the primary `index.html` calls today. The Enhanced stack lives in [`archive/src-modular-unwired/`](../../archive/src-modular-unwired/README.md).

**Two entry pages:**

| Entry | UI | Extra scripts |
|-------|-----|----------------|
| [`index.html`](../../index.html) | Claude Design + canvas viz | `calm-viz.js`, `design-bridge.js`, `design-shell.js` |
| [`index-legacy.html`](../../index-legacy.html) | Three.js UI | `src-bridge.js`, `visualizer.js`, `app.js` |

See [`claude-design-alignment.md`](claude-design-alignment.md) for primary script order and DOM IDs.

---

## 1. AUDIO ENGINE

**Primary module:** `client/js/audio.js`  
**Supporting:** `client/js/ambient-loader.js`, `client/js/breath-patterns.js`, `client/js/emdr-audio.js`, `client/js/frequency-scheduler.js`, `client/js/protocols.js`, `client/js/state-manager.js`, `client/js/audio-reactive-bridge.js`

**Legacy-only:** `client/js/src-bridge.js`, `client/js/visualizer.js`, `client/js/app.js`

**Runtime vs files:** Therapeutic tones are **Web Audio API nodes built at runtime** (`OscillatorNode`, `GainNode`, `StereoPannerNode`, `BufferSourceNode`, etc.). Ambient/nature layers use **pre-rendered `.ogg` files** via `AudioBufferSourceNode` (with triangle-oscillator fallback).

### Public interface (exact signatures on `window`)

```javascript
// client/js/audio.js

/**
 * CalmMind browser audio engine (Web Audio API).
 * Exposes window.initAudio, playGeneratedTrack, getAnalyser, setVolume, stopCurrentTrack, setPlayingState.
 */

function initAudio() { /* ... */ }

window.getAnalyser = function getAnalyser() { /* ... */ };

window.getAudioContext = function() { /* ... */ };

window.getMasterGain = function() { /* ... */ };

window.setVolume = function (value) {
    if (!audioContext) initAudio();
    if (masterGain) {
        masterGain.gain.value = Math.max(0, Math.min(1, Number(value)));
    }
};

window.initAudio = initAudio;

/**
 * Main entry from UI: generate audio and wire visualizer.
 * @param {string} [vizType] — from #visualizerType (particles | meshWave | spectrum)
 * @returns {boolean|Promise<boolean>}
 */
function playGeneratedTrack(stressLevel, duration, ambientSound, soundType, vizType, options = {}) {
    // ...
}

window.playGeneratedTrack = playGeneratedTrack;

function stopCurrentTrack() { /* ... */ }

window.stopCurrentTrack = stopCurrentTrack;

function setPlayingState(state) { /* ... */ }

window.setPlayingState = setPlayingState;
```

**EMDR (separate module):**

```javascript
// client/js/emdr-audio.js

function generateEMDRBilateral(ctx, destination, durationSec, nodeRegistry) {
    const panRateHz = 1.5;
    const toneHz = 440;
    // ...
}

window.generateEMDRBilateral = generateEMDRBilateral;
```

**Ambient loader:**

```javascript
// client/js/ambient-loader.js

async function playLoop(type, durationSec, volume, audioContext, destination, nodeRegistry) { /* ... */ }

async function playAmbient(type, durationSec, volume, audioContext, destination, nodeRegistry) { /* ... */ }

window.AmbientLoader = {
    AMBIENT_MANIFEST,
    loadAmbientBuffer,
    playAmbient,
    stopAllAmbient,
};
```

### Output chain (how a track is wired)

```javascript
// client/js/audio.js

/** masterGain → analyser → destination */
function connectOutputChain() {
    if (!audioContext || !masterGain) return;
    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
    }
    safeDisconnect(masterGain);
    safeDisconnect(analyser);
    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);
}
```

### Track construction (dispatcher + example binaural node graph)

```javascript
// client/js/audio.js — generatePersonalizedTrack (excerpt)

function generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType) {
    stopCurrentTrack();
    // ...
    if (soundType === 'binauralRelax' || soundType === 'binauralFocus' ||
        soundType === 'binauralSleep' || soundType === 'binaural') {
        let adjustedStressLevel = stressLevel;
        if (soundType === 'binauralFocus') {
            adjustedStressLevel = Math.min(stressLevel + 2, 10);
        } else if (soundType === 'binauralSleep') {
            adjustedStressLevel = Math.max(stressLevel - 2, 1);
        }
        generateBinauralBeats(adjustedStressLevel, durationSeconds);
    } else if (soundType === 'isochronicEnergy' || soundType === 'isochronicMeditate' ||
               soundType === 'isochronic') {
        generateIsochronicTones(adjustedStressLevel, durationSeconds);
    } else if (soundType === 'pinkNoise') {
        generatePinkNoise(durationSeconds);
    } else if (soundType === 'nature') {
        generateNatureEnhancedSound(ambientSound, durationSeconds);
    } else if (soundType === 'solfeggio') {
        generateSolfeggioFrequencies(stressLevel, durationSeconds);
    } else if (soundType === 'monaural') {
        generateMonauralBeats(stressLevel, durationSeconds);
    } else if (soundType === 'gamma') {
        generateGammaWaves(durationSeconds);
    } else if (soundType === 'hrv') {
        generateHRVCoherence(durationSeconds);
    } else if (soundType === 'soundBath') {
        generateSoundBath(durationSeconds);
    } else if (soundType === 'psychoacoustic') {
        generatePsychoacousticMood(stressLevel, durationSeconds);
    } else if (soundType === 'neuroacoustic') {
        generateNeuroacoustic(stressLevel, durationSeconds);
    } else if (soundType === 'emdrBls') {
        window.generateEMDRBilateral(audioContext, masterGain, durationSeconds, soundTypeNodes);
    } else {
        generateBinauralBeats(stressLevel, durationSeconds);
    }

    if (ambientSound !== 'none' && soundType !== 'nature' && soundType !== 'soundBath') {
        playAmbientLayer(ambientSound, durationSeconds);
    }

    if (durationSeconds > 0) {
        trackStopTimerId = setTimeout(() => stopCurrentTrack(), durationSeconds * 1000);
    }
}
```

```javascript
// client/js/audio.js — generateBinauralBeats (excerpt)

function generateBinauralBeats(stressLevel, trackDurationSec = 600) {
    const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 180 : 160;
    const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4;

    binauralOsc1 = audioContext.createOscillator();
    binauralOsc2 = audioContext.createOscillator();
    binauralOsc1.type = 'sine';
    binauralOsc2.type = 'sine';
    binauralOsc1.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    binauralOsc2.frequency.setValueAtTime(baseFreq + beatFreq, audioContext.currentTime);

    // StereoPanner L/R or ChannelMerger fallback → volumeBoost → masterGain

    if (activeFrequencyPhases?.length && window.FrequencyScheduler) {
        window.FrequencyScheduler.scheduleBinauralPhases(
            audioContext, binauralOsc1, binauralOsc2, activeFrequencyPhases, volumeBoost
        );
    }
    binauralOsc1.start();
    binauralOsc2.start();
    binauralOsc1.stop(audioContext.currentTime + durationInSeconds);
    binauralOsc2.stop(audioContext.currentTime + durationInSeconds);
}
```

**Pink noise** uses a runtime `AudioBuffer` (Paul Kellet filter), not a file:

```javascript
// client/js/audio.js — generatePinkNoise (excerpt)

function generatePinkNoise(trackDurationSec = 600) {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    // ... pink filter loop ...
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(masterGain);
    noiseSource.start();
    noiseSource.stop(audioContext.currentTime + durationInSeconds);
}
```

---

## 2. SOUND-TYPE CATALOG

There is **no single config object** with carrier/beat/band/headphones for all types. Data is split across `client/js/app.js` (hints + headphones), `client/js/audio.js` (generation math), and `index.html` (option values).

### UI hints + headphones flag

```javascript
// client/js/app.js

const SOUND_TYPE_HINTS = {
    binauralRelax:
        'Binaural beats around Earth’s resonance (~7.83 Hz) for deep relaxation. Best with headphones.',
    binauralFocus:
        'Beta-range binaural beats (~12–15 Hz) to support concentration and alertness. Best with headphones.',
    binauralSleep:
        'Delta-range binaural beats (~2–4 Hz) for sleep and regeneration. Best with headphones.',
    isochronicEnergy:
        'Isochronic pulses in a higher beta range for energy and motivation.',
    isochronicMeditate:
        'Isochronic pulses in the alpha range for meditation and a calm, creative state.',
    isochronicSleep:
        'Slow delta/theta isochronic pulses (~2.5 Hz) for sleep onset.',
    pinkNoise: 'Broad-spectrum pink noise to mask distractions and support sleep.',
    whiteNoise: 'Flat white noise for focus and masking.',
    brownNoise: 'Deep brown noise (1/f²) for sleep and relaxation.',
    nature: 'Layered nature-inspired tones with gentle modulation for stress relief.',
    solfeggio: 'Single-tone Solfeggio-related frequencies chosen by stress level.',
    monaural: 'Monaural beating—works without headphones; theta-oriented modulation.',
    gamma: 'Higher-frequency content associated with alertness and cognitive engagement.',
    hrv: 'Slow rhythmic modulation (~0.1 Hz) to suggest relaxed breathing and coherence.',
    soundBath: 'Singing-bowl–like tones with spatial variation. Best on headphones.',
    psychoacoustic: 'Harmonic stacks and gentle motion for an immersive, mood-oriented wash.',
    neuroacoustic: 'Clear, detuned carriers for a steady “focus wash” without harsh peaks.',
    emdrBls: 'Alternating L/R tones (~1.5 Hz) for self-regulation — not clinical EMDR. Use headphones.',
};

const HEADPHONES_SOUND_TYPES = new Set([
    'binauralRelax', 'binauralFocus', 'binauralSleep', 'emdrBls',
]);
```

### HTML option keys (canonical `soundType` values)

From `index.html` `#soundType`:

| Value | Label |
|-------|-------|
| `binauralRelax` | Binaural · Relaxation |
| `binauralFocus` | Binaural · Focus |
| `binauralSleep` | Binaural · Sleep |
| `isochronicEnergy` | Isochronic · Energy |
| `isochronicMeditate` | Isochronic · Meditation |
| `isochronicSleep` | Isochronic · Sleep |
| `pinkNoise` | Pink noise · Deep sleep |
| `whiteNoise` | White noise · Focus |
| `brownNoise` | Brown noise · Sleep |
| `nature` | Nature · Enhanced |
| `solfeggio` | Solfeggio frequencies |
| `monaural` | Monaural beats |
| `gamma` | Gamma waves |
| `hrv` | HRV coherence |
| `emdrBls` | Bilateral stimulation (BLS) |
| `soundBath` | Sound bath |
| `psychoacoustic` | Psychoacoustic mood |
| `neuroacoustic` | Neuroacoustic |

### Per-type generation parameters (from `audio.js`)

**Binaural** — stress 1–10 maps carrier + beat; intent adjusts stress before call:

```javascript
const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 180 : 160;
const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4;
```

| Key | Stress adjust | Carrier (Hz) | Beat (Hz) | Band (implied) | Headphones |
|-----|---------------|--------------|-----------|----------------|------------|
| `binauralRelax` | none | 160–200 | 4–8 | alpha/theta | yes |
| `binauralFocus` | `stress+2` (max 10) | 160–200 | 4–8 | beta-ish | yes |
| `binauralSleep` | `stress-2` (min 1) | 160–200 | 4–8 | delta/theta | yes |

**Isochronic:**

```javascript
let pulseFreq = stressLevel <= 3 ? 14 : stressLevel <= 6 ? 10 : 6;
let carrierHz = 180 + stressLevel * 12;
```

| Key | Stress adjust | Pulse (Hz) | Carrier (Hz) | Band | Headphones |
|-----|---------------|------------|--------------|------|------------|
| `isochronicEnergy` | `stress+3` | 6–14 | `180+stress*12` | beta | no |
| `isochronicMeditate` | `stress-2` | 6–14 | `180+stress*12` | alpha | no |
| `isochronicSleep` | `stress-3` | **2.5** (fixed) | 180 | delta/theta | no |

**Colored noise** (`pinkNoise`, `whiteNoise`, `brownNoise`) — procedural `BufferSource` loops via `createNoiseBuffer()`; no carrier/beat.

**Pink noise** — Paul Kellet 1/f filter (legacy path preserved).

**Nature** — plays ambient `.ogg` (see §6); no oscillators unless fallback.

**Solfeggio** — stress → single tone:

```javascript
const solfeggioFreqs = {
    396: 'Liberating guilt and fear',
    417: 'Facilitating change',
    432: 'Universal harmony',
    528: 'Transformation and miracles',
    639: 'Connecting relationships',
    741: 'Awakening intuition',
    852: 'Returning to spiritual order'
};
// stress >= 8 → 396; >= 6 → 417; >= 4 → 639; >= 2 → 528; else → 852
```

**Monaural:**

```javascript
const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 160 : 120;
const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4; // Alpha/Theta range
```

**Gamma:**

```javascript
const gammaFreq = 40; // 40 Hz — + carrierOsc at 200 Hz
```

**HRV:**

```javascript
// breathPattern: 'coherent' | 'box' | 'fourSevenEight' (options.breathPattern)
// coherent: 4s inhale / 6s exhale; box: 4-4-4-4; fourSevenEight: 4-7-8
// carrier 256 Hz, pulse 432 Hz on inhale
```

**Sound bath** — bowl fundamentals `[264,297,330,352,396,440,495]` + gong 56 Hz; `PannerNode` spatial.

**Psychoacoustic:**

```javascript
const fundamentalFreq = stressLevel <= 3 ? 432 : stressLevel <= 6 ? 396 : 528;
const harmonics = [1, 1.5, 2, 2.5, 3, 4];
```

**Neuroacoustic:**

```javascript
const base = 200 + stressLevel * 16;
osc1.frequency.setValueAtTime(base, t0);
osc2.frequency.setValueAtTime(base * 1.025, t0);
```

**EMDR BLS** (`emdr-audio.js`): tone 440 Hz, pan 1.5 Hz, pad 110 Hz; headphones recommended in hint.

**UI freq preview** (same stress formulas, not engine readback):

```javascript
// client/js/app.js — updateFreqDisplay

function updateFreqDisplay() {
    const base = stress <= 3 ? 200 : stress <= 6 ? 180 : 160;
    const beat = stress <= 3 ? 8 : stress <= 6 ? 6 : 4;
    if (soundType?.startsWith('binaural')) {
        el.textContent = `Carrier ~${base} Hz · beat ~${beat} Hz (protocols may ramp frequencies)`;
    } else if (soundType?.startsWith('isochronic')) {
        const pulse = stress <= 3 ? 14 : stress <= 6 ? 10 : 6;
        el.textContent = `Pulse ~${pulse} Hz · carrier ~${180 + stress * 12} Hz`;
    }
}
```

**Unused modular brainwave helper** (in `src/`, not wired to client playback):

```javascript
// src/utils/AudioUtils.js

export function getBrainwaveFrequency(state, range = 'mid') {
  const ranges = {
    delta: { low: 0.5, mid: 2, high: 4 },
    theta: { low: 4, mid: 6, high: 8 },
    alpha: { low: 8, mid: 10, high: 12 },
    beta: { low: 13, mid: 20, high: 30 },
    gamma: { low: 30, mid: 50, high: 80 }
  };
  return ranges[state]?.[range] || null;
}
```

---

## 3. SESSION / STATE MODEL

### Browser persistence (`CalmMindState`)

```javascript
// client/js/state-manager.js

const defaultState = () => ({
    favorites: [],
    sessionHistory: [],
    lastMoodBefore: null,
    settings: {
        stressLevel: 5,
        duration: 10,
        ambientSound: 'none',
        soundType: 'binauralRelax',
        protocolId: 'none',
        vizType: 'particles',
        volume: 0.5,
    },
});

window.CalmMindState = {
    load,
    save,
    addSession,
    saveFavorite,
    persistSettings,
    restoreSettingsToForm,
};
```

### In-memory UI state (`client/js/app.js`)

```javascript
let isPlaying = false;
let currentVisualizerType = 'particles';
```

Theme/animations live in `localStorage` (`calmMindTheme`, `calmMindAnimations`), not in `CalmMindState`.

### Stress → frequency mapping (generation path)

```javascript
// client/js/app.js — generateTrackFromSettings (excerpt)

async function generateTrackFromSettings() {
    let stressLevel = Math.min(10, Math.max(1, stressRaw));
    let duration = Math.min(60, Math.max(1, durationRaw));
    let ambientSound = document.getElementById('ambientSound').value;
    let soundType = document.getElementById('soundType').value;
    let vizType = visualizerTypeElement ? visualizerTypeElement.value : 'particles';
    const protocolId = document.getElementById('sessionProtocol')?.value || 'none';

    let frequencyPhases = null;
    if (window.CalmMindProtocols && protocolId !== 'none') {
        const applied = window.CalmMindProtocols.applyProtocolToSettings(protocolId, {
            stressLevel, duration, ambientSound, soundType, vizType,
        });
        if (applied.protocol) {
            duration = applied.duration;
            soundType = applied.soundType;
            ambientSound = applied.ambientSound;
            vizType = applied.vizType;
            stressLevel = applied.stressLevel;
            frequencyPhases = applied.protocol.frequencyPhases || null;
        }
    }
    // → playGeneratedTrack(stressLevel, duration, ambientSound, soundType, vizType, { frequencyPhases, ... })
}
```

### Legacy singleton (`src/core/StateManager.js` — not used by current HTML shell)

```javascript
this.state = {
    audio: {
        isPlaying: false,
        currentTrack: null,
        volume: 0.7,
        soundType: 'binauralRelax'
    },
    visualization: {
        type: 'particles',
        theme: 'dark',
        isActive: false
    },
    settings: {
        stressLevel: 5,
        duration: 10,
        ambientSound: 'none'
    }
};
```

---

## 4. REAL-TIME DATA FOR VISUALS

**Yes — live `AnalyserNode`** on the master bus. No separate L/R analysers; L/R is spatial audio only.

### Analyser setup

```javascript
// client/js/audio.js
const ANALYSER_FFT_SIZE = 512;
const ANALYSER_SMOOTHING = 0.8;
```

### Per-frame read (`visualizer.js`)

```javascript
function drawVisualizer(timestamp) {
    animationFrameId = requestAnimationFrame(drawVisualizer);
    // ... 30 FPS cap ...

    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteFrequencyData(dataArray);

    if (currentVizType === 'spectrum') {
        drawSpectrum2D(dataArray);
        return;
    }

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const averageAmplitude = sum / bufferLength / 255.0;

    if (currentVizType === 'particles') {
        updateParticleVisualizer(dataArray, averageAmplitude, timestamp);
    } else if (currentVizType === 'meshWave') {
        updateMeshWaveVisualizer(dataArray);
    }

    renderer.render(scene, camera);
}
```

**Band split for particles:**

```javascript
function updateParticleVisualizer(dataArray, averageAmplitude, timestamp) {
    const bassFactor = getFrequencyRangeValue(dataArray, 0, 10) / 255.0;
    const midFactor = getFrequencyRangeValue(dataArray, 10, 100) / 255.0;
    const trebleFactor = getFrequencyRangeValue(dataArray, 100, 255) / 255.0;
    // drives scale, position, rotation per particle
}
```

### “Brain state” / Hz readout

**Not derived from the engine at runtime.** `#freqDisplay` is filled by `updateFreqDisplay()` from **stress slider + sound type** (see §2). There is no live beat-frequency or brain-band export from oscillators to the UI.

Play/pause gates the animation loop via:

```javascript
window.__vizSetPlayingState = function(isPlaying) {
    isVisualizerActive = isPlaying;
    if (isPlaying) {
        // setupVisualizer / startDrawing
    } else {
        stopDrawing();
    }
};
```

---

## 5. PLAYBACK LIFECYCLE

### Generate

```javascript
document.getElementById('generateButton')?.addEventListener('click', () => {
    generateTrackFromSettings().catch((err) => console.error(err));
});
```

Flow: `generateTrackFromSettings` → `window.stopCurrentTrack()` → `window.initAudio()` → `window.playGeneratedTrack(...)` → `generatePersonalizedTrack` → `setPlayingState(true)` + visualizer setup.

### Play / Pause

```javascript
function togglePlay() {
    if (isPlaying) {
        audioCtx.suspend().then(() => {
            isPlaying = false;
            playBtn.textContent = 'Play';
            window.setPlayingState(false);
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            playBtn.textContent = 'Pause';
            window.setPlayingState(true);
        });
    }
}
```

Pause **suspends the whole `AudioContext`**, not individual nodes.

### Stop

```javascript
function stopTrack() {
    window.stopCurrentTrack?.();
    stopBreathPacer();
    stopAvePulse();
    isPlaying = false;
    playBtn.textContent = 'Play';
    trackInfoEl.textContent = 'No track playing';
}
```

Stop button also logs session via `CalmMindState.addSession(...)`.

### Progress / completion

- **Auto-stop:** `setTimeout` in `generatePersonalizedTrack` calls `stopCurrentTrack()` after `durationMinutes * 60` seconds.
- **No elapsed-time ticker or progress callbacks** — only `#trackInfo` static string from `updateTrackInfo`.
- **No `EventBus` hooks** on the client path (EventBus exists under `src/core/` but is unused here).

```javascript
function updateTrackInfo(stressLevel, duration, ambientSound, soundType, protocolId) {
    let infoText = `${formattedSoundType} · Level ${stressLevel} · ${duration} min`;
    // + protocol name, ambient label
    trackInfoEl.textContent = infoText;
}
```

---

## 6. PRESETS / AMBIENT ASSETS

### Guided protocols (presets)

```javascript
// client/js/protocols.js

const PROTOCOLS = {
    none: null,
    anxietyReset: {
        id: 'anxietyReset',
        name: 'Anxiety Reset',
        durationMin: 15,
        evidence: EVIDENCE.strong,
        soundType: 'binauralRelax',
        stressLevel: 6,
        ambientSound: 'rain',
        vizType: 'particles',
        headphones: true,
        description: 'Alpha wind-down → theta hold (10→6 Hz over 5 min).',
        frequencyPhases: [
            { durationSec: 300, beatHz: 10, carrierHz: 250 },
            { durationSec: 600, beatHz: 6, carrierHz: 250 },
        ],
    },
    sleepOnset: { /* frequencyPhases with fadeOut */ },
    focusSprint: { /* isochronicEnergy, meshWave */ },
    coherenceBreath: { soundType: 'hrv', breathPattern: 'coherent' },
    blsCalm: { soundType: 'emdrBls' },
    deepSleep: { soundType: 'isochronicSleep', ambientSound: 'fireplace' },
    focusStudy: { soundType: 'isochronicEnergy' },
    windDown: { soundType: 'binauralRelax', ambientSound: 'wind-grass' },
    boxBreath: { soundType: 'hrv', breathPattern: 'box' },
};
```

Phase scheduler:

```javascript
// client/js/frequency-scheduler.js

function scheduleBinauralPhases(ctx, oscLeft, oscRight, phases, masterFadeGain) {
    let t = ctx.currentTime + 0.05;
    phases.forEach((phase, idx) => {
        const carrier = phase.carrierHz ?? 250;
        const beat = phase.beatHz ?? 6;
        oscLeft.frequency.setValueAtTime(carrier, t);
        oscRight.frequency.setValueAtTime(carrier + beat, t);
        t += Math.max(0, phase.durationSec);
        // fadeOut on last phase ...
    });
}
```

### User favorites

Saved via `CalmMindState.saveFavorite(name, settings)` with form snapshot (stress, duration, ambient, soundType, protocolId, vizType).

### Ambient manifest + URLs

```javascript
// client/js/ambient-loader.js

const AMBIENT_MANIFEST = {
    rain: 'rain.ogg',
    'rain-heavy': 'rain-heavy.ogg',
    'rain-tent': 'rain-tent.ogg',
    'rain-concrete': 'rain-concrete.ogg',
    ocean: 'ocean.ogg',
    'ocean-calm': 'ocean-calm.ogg',
    'ocean-dellec': 'ocean-dellec.ogg',
    'ocean-terns': 'ocean-terns.ogg',
    forest: 'forest.ogg',
    'forest-stream': 'forest-stream.ogg',
    fireplace: 'fireplace.ogg',
    'night-crickets': 'night-crickets.ogg',
    'wind-grass': 'wind-grass.ogg',
};

const AMBIENT_BASE = '/assets/audio/ambient/';

function resolveFile(type) {
    return `${AMBIENT_BASE}${AMBIENT_MANIFEST[type]}`;
}
```

Files on disk: `assets/audio/ambient/*.ogg`. Default ambient gain in engine: `AMBIENT_VOLUME = 0.2` in `audio.js`.

---

## 7. APP SHELL

### Framework & mount

**Vanilla HTML + IIFE/global scripts.** No React/Vue root. Mount point: `<div id="app">`.

### Primary entry — `index.html` (Claude Design)

Script load order:

```html
<script src="client/js/ambient-loader.js"></script>
<script src="client/js/breath-patterns.js"></script>
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

- **Styles:** `client/css/design.css`
- **Canvas:** `#viz` — modes `neural`, `tissue`, `mandala` via `window.CalmViz` / `window.CalmMind.frame`
- **Brand:** `.brand-logo` — `assets/branding/CalmMind_Logo.jpg` (top-left)
- **Viz behavior:** Procedural canvas (not image files). **Audio-reactive only while playing**; compose screen uses synthetic breath motion. See [`subsystems/visualization.md`](../subsystems/visualization.md).
- **DOM contract:** [`claude-design-alignment.md`](claude-design-alignment.md)

### Legacy entry — `index-legacy.html` (Three.js)

Script load order:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script type="module" src="client/js/src-bridge.js"></script>
<script src="client/js/ambient-loader.js"></script>
<script src="client/js/protocols.js"></script>
<script src="client/js/frequency-scheduler.js"></script>
<script src="client/js/emdr-audio.js"></script>
<script src="client/js/state-manager.js"></script>
<script src="client/js/audio.js"></script>
<script src="client/js/audio-reactive-bridge.js"></script>
<script src="client/js/visualizer.js"></script>
<script src="client/js/app.js"></script>
```

- **Styles:** `styles.css` with CSS variables (see below)
- **Canvas:** `#visualizerCanvas` — types `particles`, `meshWave`, `spectrum`
- **Wiring:** `DOMContentLoaded` in `client/js/app.js`

Load `audio-reactive-bridge.js` immediately after `audio.js` on both entries.

### Server

```javascript
// lib/static-server.cjs + server.js / launch.cjs
// Static files from repo root; .ogg served as audio/ogg
// GET / → index.html
```

Run via `npm run dev` / `npm run launch` (HTTP required; not `file://`).

### Theme tokens / CSS variables (legacy UI only)

```css
/* styles.css — index-legacy.html */
:root {
  color-scheme: dark;
  --bg-color: #0f111a;
  --card-bg-color: #1a1d2e;
  --primary-gradient: linear-gradient(135deg, #7c3aed, #4c1d95);
  --secondary-gradient: linear-gradient(135deg, #f472b6, #c084fc);
  --accent-color-1: #8b5cf6;
  --accent-color-2: #22d3ee;
  --color-accent-primary: #8b5cf6;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --muted-foreground: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.08);
  --shadow-color: rgba(0, 0, 0, 0.35);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.25);
  --font-family: "Inter", system-ui, -apple-system, sans-serif;
  --border-radius-lg: 16px;
  --border-radius-md: 10px;
  --border-radius-sm: 8px;
  --radius-input: 10px;
  --transition-speed: 0.2s ease;
  --focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.35);
  --space-section: 1.25rem;
}
```

Theme switching: body classes `light-theme`, `space-gray-theme`, `silver-theme`, `gold-theme`, `midnight-green-theme`; default dark has no extra class. Stored in `localStorage` key `calmMindTheme`.

---

## Integration contract (minimal)

If your new front-end should drive the existing engine without rewriting it, implement against:

| Global | Role |
|--------|------|
| `window.CalmMindAudioReactive` | **Live audio metrics + subscribe loop for reactive visuals** |
| `window.initAudio()` | Create/resume `AudioContext` |
| `window.playGeneratedTrack(stress, durationMin, ambient, soundType, vizType, options?)` | Generate + start |
| `window.stopCurrentTrack()` | Tear down nodes |
| `window.setVolume(0–1)` | Master gain |
| `window.getAnalyser()` | For custom visuals |
| `window.setPlayingState(bool)` | Visualizer on/off |
| `window.setupVisualizer(canvas, analyser, vizType)` | Three.js viz (**legacy entry only**) |
| `window.CalmMindState` | Persist settings/history |
| `window.CalmMindProtocols` | Preset recipes |
| `window.AmbientLoader` | Ambient files |

There is no unified TypeScript types file — signatures above are the real API.

---

## 8. Real-time audio → visuals (`CalmMindAudioReactive`)

> **Audio-reactive guide:** [`audio-reactive.md`](audio-reactive.md)  
> **Implementation plan:** [`custom-front-end-plan.md`](custom-front-end-plan.md)

**Module:** `client/js/audio-reactive-bridge.js`  
**Load order:** immediately after `audio.js` (already wired in `index.html`).

This bridge answers: *“How does a custom front-end (e.g. a Claude Design image) react to sound in real time?”*

### Architecture (no server)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser only                          │
├─────────────────────────────────────────────────────────────┤
│  playGeneratedTrack() → oscillators / buffers / ambient      │
│           ↓                                                  │
│      masterGain                                              │
│           ↓                                                  │
│      AnalyserNode  ←── getAnalyser() / getAudioFrame()       │
│           ↓                                                  │
│      speakers                                                │
│                                                              │
│  requestAnimationFrame loop (subscribe)                      │
│           ↓                                                  │
│  { level, bass, mid, treble } → CSS / canvas / WebGL / img   │
└─────────────────────────────────────────────────────────────┘
```

You do **not** need WebSockets, a backend stream, or exported audio files. The browser’s Web Audio API already exposes live spectral data from whatever is playing.

### What is live vs static

| Signal | Source | Use for visuals |
|--------|--------|-----------------|
| `level`, `bass`, `mid`, `treble` | **Live** analyser (`getByteFrequencyData`) | Pulse, scale, brightness, motion |
| `peakFrequencyHz` | **Live** dominant FFT bin | Color shifts, sparkle (audible mix, not beat Hz) |
| `waveform` | **Live** optional time-domain | Ripple, distortion |
| `session.beatHz`, `session.carrierHz` | **Static** from settings + protocol phases | Labels (“Alpha ~10 Hz”), slow breathe sync |
| `session.brainBand` | **Derived** from target beat Hz | UI copy, not EEG measurement |
| L vs R energy | **Not available** | Single analyser on stereo mix |

The bridge **does not** read individual oscillator frequencies from the engine. Entrainment labels come from the same formulas as `audio.js` generators.

### Global API

```javascript
window.CalmMindAudioReactive = {
  VERSION: '1.0.0',
  BRAIN_BAND_RANGES,
  DEFAULT_BAND_SLICES,

  getAudioFrame(options?),       // one-shot sample
  subscribe(callback, options?), // rAF loop; returns unsubscribe()
  start(),                       // manual rAF loop (if not using subscribe)
  stop(),

  setSessionMetadata(metadata),  // if you bypass playGeneratedTrack
  getSessionMetadata(),
  getLastFrame(),

  estimateTargetFrequencies(stressLevel, soundType),
  brainBandFromBeatHz(beatHz),
  mapFrameToVisualStyle(frame, preset?),
  applyVisualStyleToElement(element, frame, preset?),
  binIndexToHz(analyser, ctx, binIndex),

  isRunning(),      // rAF loop active
  isAudioActive(),  // playing + context running
  setAutoRunOnPlay(boolean),
};
```

### Automatic hooks

On load, the bridge wraps (does not replace) these globals:

- `playGeneratedTrack(...)` → stores session metadata, marks playing
- `setPlayingState(bool)` → syncs play/pause to subscribers
- `stopCurrentTrack()` → clears session, stops rAF loop

No changes required in `app.js` for basic use.

### `getAudioFrame(options)` return shape

```javascript
{
  timestamp: 1234567.89,           // performance.now()
  audioTime: 42.5,                 // AudioContext.currentTime | null
  isPlaying: true,
  contextState: 'running',         // running | suspended | closed

  level: 0.42,                     // 0–1 overall (avg of bass/mid/treble)
  bass: 0.55,                      // bins 0–10
  mid: 0.38,                       // bins 10–100
  treble: 0.22,                    // bins 100+

  peakFrequencyHz: 180.4,          // loudest FFT bin in mix | null

  // optional:
  spectrum: Uint8Array,            // if includeSpectrum: true
  waveform: Uint8Array,            // if includeWaveform: true

  // present after playGeneratedTrack:
  session: {
    soundType: 'binauralRelax',
    stressLevel: 6,
    durationMin: 15,
    ambientSound: 'rain',
    vizType: 'particles',
    protocolId: 'anxietyReset',
    carrierHz: 250,
    beatHz: 10,                    // updates with frequencyPhases over time
    brainBand: { id: 'alpha', label: 'Alpha', beatHz: 10 },
    headphonesRequired: true,
    elapsedSec: 83.2,
    remainingSec: 816.8,
    phaseIndex: 0,
  }
}
```

### `subscribe(callback, options)`

```javascript
const unsubscribe = CalmMindAudioReactive.subscribe(
  (frame) => {
    // frame has same shape as getAudioFrame()
    myImage.style.transform = `scale(${1 + frame.level * 0.1})`;
  },
  {
    preset: 'pulse',              // pulse | breathe | glow | calm
    autoApplyTo: '#heroImage',    // optional: auto CSS on this element
    includeSpectrum: false,
    includeWaveform: false,
  }
);

// later:
unsubscribe();
```

While subscribed and audio is playing, an internal `requestAnimationFrame` loop samples the analyser every frame (~60 Hz). On pause (`AudioContext.suspend`), callbacks still fire once with reduced `level`.

### Visual style presets (`mapFrameToVisualStyle`)

| Preset | Behavior |
|--------|----------|
| `pulse` | Scale + brightness + saturation from level/bass/mid (default) |
| `breathe` | Gentler scale; uses slow mod when `beatHz < 2` (HRV/delta) |
| `glow` | Blur + brightness from treble/level |
| `calm` | Subtle scale/contrast for minimal UI |

```javascript
const style = CalmMindAudioReactive.mapFrameToVisualStyle(frame, 'glow');
// { transform, filter, opacity }
CalmMindAudioReactive.applyVisualStyleToElement(imgEl, frame, 'glow');
```

### Full integration example (Claude Design image)

```html
<!-- After audio.js + audio-reactive-bridge.js -->
<img id="sessionArt" src="/path/to/generated-art.png" alt="" />

<script>
  let stopReactive = null;

  async function startSession() {
    window.initAudio();
    const ctx = window.getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    await window.playGeneratedTrack(5, 10, 'ocean-calm', 'binauralRelax', 'particles', {
      protocolId: 'none',
    });

    stopReactive?.();
    stopReactive = CalmMindAudioReactive.subscribe(
      (frame) => {
        const meta = frame.session;
        document.getElementById('bandLabel').textContent =
          meta?.brainBand?.label ?? '';
        document.getElementById('beatLabel').textContent =
          meta?.beatHz != null ? `${meta.beatHz.toFixed(1)} Hz` : '';
      },
      { preset: 'breathe', autoApplyTo: '#sessionArt' }
    );
  }

  function endSession() {
    stopReactive?.();
    stopReactive = null;
    window.stopCurrentTrack();
    const img = document.getElementById('sessionArt');
    img.style.transform = '';
    img.style.filter = '';
  }
</script>
```

### Custom canvas / WebGL (beyond CSS)

```javascript
CalmMindAudioReactive.subscribe((frame) => {
  const { bass, mid, treble, level } = frame;
  const ctx2d = canvas.getContext('2d');
  const radius = 80 + bass * 120;
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.beginPath();
  ctx2d.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
  ctx2d.fillStyle = `hsla(${200 + mid * 80}, 70%, ${50 + level * 30}%, 0.85)`;
  ctx2d.fill();
});
```

Optional spectrum drawing:

```javascript
CalmMindAudioReactive.subscribe((frame) => {
  if (!frame.spectrum) return;
  const bars = 64;
  const step = Math.floor(frame.spectrum.length / bars);
  for (let i = 0; i < bars; i++) {
    const v = frame.spectrum[i * step] / 255;
    // draw bar i with height v
  }
}, { includeSpectrum: true });
```

### Protocol frequency phases

When `playGeneratedTrack` is called with `options.frequencyPhases` (from `CalmMindProtocols`), `session.beatHz` / `session.carrierHz` update by **elapsed session time**:

```javascript
// anxietyReset phases (from protocols.js)
[
  { durationSec: 300, beatHz: 10, carrierHz: 250 },
  { durationSec: 600, beatHz: 6, carrierHz: 250 },
]
// elapsed 400s → beatHz 6, phaseIndex 1
```

Use `session.elapsedSec` / `session.remainingSec` for progress UI (no separate progress event exists yet).

### `estimateTargetFrequencies(stressLevel, soundType)`

Call before playback to preview targets for UI copy:

```javascript
CalmMindAudioReactive.estimateTargetFrequencies(5, 'binauralFocus');
// {
//   carrierHz: 180,
//   beatHz: 8,
//   pulseHz: null,
//   brainBand: { id: 'alpha', label: 'Alpha', beatHz: 8 },
//   headphonesRequired: true,
//   description: 'Binaural carrier ~180 Hz, beat ~8 Hz'
// }
```

Stress adjustments match `generatePersonalizedTrack` (e.g. `binauralFocus` → stress + 2).

### Brain band reference (`BRAIN_BAND_RANGES`)

```javascript
{
  delta: { min: 0.5, max: 4, label: 'Delta' },
  theta: { min: 4, max: 8, label: 'Theta' },
  alpha: { min: 8, max: 13, label: 'Alpha' },
  beta: { min: 13, max: 30, label: 'Beta' },
  gamma: { min: 30, max: 100, label: 'Gamma' },
}
```

### Band bin slices (default)

Same as the particle visualizer:

```javascript
DEFAULT_BAND_SLICES = {
  bass: [0, 10],
  mid: [10, 100],
  treble: [100, 256],
};
```

Override per call:

```javascript
getAudioFrame({
  bandSlices: { bass: [0, 8], mid: [8, 64], treble: [64, 200] },
});
```

### Pause, stop, and edge cases

| Action | Bridge behavior |
|--------|-----------------|
| **Pause** (UI suspends `AudioContext`) | `isPlaying: false`; subscribers get damped frame; loop keeps running if subscribed |
| **Stop** | `stopCurrentTrack()` → session cleared, loop stopped |
| **Generate before user gesture** | `AudioContext` may stay `suspended` until click; call `ctx.resume()` in click handler |
| **No audio yet** | `getAudioFrame()` returns null if analyser missing; call after `initAudio()` |
| **Static AI PNG** | Recommended: one asset + CSS/canvas motion (not per-frame AI regen) |

### Bypassing `playGeneratedTrack`

If the new UI drives audio differently but still uses `masterGain` → `analyser`:

```javascript
CalmMindAudioReactive.setSessionMetadata({
  stressLevel: 7,
  durationMin: 20,
  ambientSound: 'forest',
  soundType: 'isochronicEnergy',
  vizType: 'particles',
  protocolId: null,
  frequencyPhases: null,
  startedAt: performance.now(),
});
CalmMindAudioReactive.subscribe(onFrame, { autoApplyTo: '#art' });
CalmMindAudioReactive.start();
```

### Updated integration contract

| Global | Role |
|--------|------|
| `window.CalmMindAudioReactive.getAudioFrame()` | One-shot live metrics |
| `window.CalmMindAudioReactive.subscribe(fn, opts?)` | rAF stream for reactive visuals |
| `window.CalmMindAudioReactive.mapFrameToVisualStyle()` | CSS mapping helpers |
| `window.getAnalyser()` | Low-level escape hatch (same analyser) |
