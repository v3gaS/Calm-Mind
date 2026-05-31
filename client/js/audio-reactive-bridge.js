/**
 * CalmMind audio-reactive bridge — normalized live audio metrics for custom visuals.
 *
 * Reads the existing master-bus AnalyserNode from client/js/audio.js (no server, no
 * second audio graph). Intended for static AI images, CSS, canvas, or WebGL driven by
 * requestAnimationFrame or subscribe().
 *
 * Load after audio.js:
 *   <script src="client/js/audio.js"></script>
 *   <script src="client/js/audio-reactive-bridge.js"></script>
 *
 * @global CalmMindAudioReactive
 */
'use strict';

const BRIDGE_VERSION = '1.0.0';

/** Rough EEG band ranges (Hz) for labeling — not measured from the analyser. */
const BRAIN_BAND_RANGES = Object.freeze({
    delta: { min: 0.5, max: 4, label: 'Delta' },
    theta: { min: 4, max: 8, label: 'Theta' },
    alpha: { min: 8, max: 13, label: 'Alpha' },
    beta: { min: 13, max: 30, label: 'Beta' },
    gamma: { min: 30, max: 100, label: 'Gamma' },
});

/** Default bin slices (match client/js/visualizer.js particle bands). */
const DEFAULT_BAND_SLICES = Object.freeze({
    bass: [0, 10],
    mid: [10, 100],
    treble: [100, 256],
});

const HEADPHONES_SOUND_TYPES = new Set([
    'binauralRelax', 'binauralFocus', 'binauralSleep', 'emdrBls',
]);

let sessionMetadata = null;
let rafId = null;
let lastFrame = null;
let subscribers = new Set();
let autoRunOnPlay = true;

/** Reused buffers to reduce GC during animation loops. */
const freqBuffer = { data: null, length: 0 };
const waveBuffer = { data: null, length: 0 };

function clamp01(n) {
    return Math.max(0, Math.min(1, Number(n) || 0));
}

function avgRange(arr, start, end) {
    if (!arr || !arr.length) return 0;
    const from = Math.max(0, Math.floor(start));
    const to = Math.min(arr.length, Math.floor(end));
    if (to <= from) return 0;
    let sum = 0;
    for (let i = from; i < to; i++) sum += arr[i];
    return sum / (to - from) / 255;
}

function brainBandFromBeatHz(beatHz) {
    if (beatHz == null || !Number.isFinite(beatHz)) return null;
    for (const [key, band] of Object.entries(BRAIN_BAND_RANGES)) {
        if (beatHz >= band.min && beatHz < band.max) {
            return { id: key, label: band.label, beatHz };
        }
    }
    if (beatHz >= BRAIN_BAND_RANGES.gamma.min) {
        return { id: 'gamma', label: BRAIN_BAND_RANGES.gamma.label, beatHz };
    }
    return { id: 'delta', label: BRAIN_BAND_RANGES.delta.label, beatHz };
}

/**
 * Adjust stress level the same way generatePersonalizedTrack does before generators run.
 * @param {number} stressLevel 1–10
 * @param {string} soundType
 * @returns {number}
 */
function adjustStressForSoundType(stressLevel, soundType) {
    let s = Math.max(1, Math.min(10, Number(stressLevel) || 5));
    if (soundType === 'binauralFocus') s = Math.min(s + 2, 10);
    else if (soundType === 'binauralSleep') s = Math.max(s - 2, 1);
    else if (soundType === 'isochronicEnergy') s = Math.min(s + 3, 10);
    else if (soundType === 'isochronicMeditate') s = Math.max(s - 2, 1);
    else if (soundType === 'isochronicSleep') s = Math.max(s - 3, 1);
    return s;
}

/**
 * Static frequency targets from session settings (not live oscillator readback).
 * Mirrors client/js/audio.js generator formulas + client/js/app.js updateFreqDisplay.
 *
 * @param {number} stressLevel 1–10
 * @param {string} soundType
 * @returns {{
 *   carrierHz: number|null,
 *   beatHz: number|null,
 *   pulseHz: number|null,
 *   brainBand: { id: string, label: string, beatHz: number }|null,
 *   headphonesRequired: boolean,
 *   description: string
 * }}
 */
function estimateTargetFrequencies(stressLevel, soundType) {
    const st = String(soundType || 'binauralRelax');
    const stress = adjustStressForSoundType(stressLevel, st);
    const headphonesRequired = HEADPHONES_SOUND_TYPES.has(st);

    let carrierHz = null;
    let beatHz = null;
    let pulseHz = null;
    let description = '';

    if (st.startsWith('binaural') || st === 'binaural') {
        carrierHz = stress <= 3 ? 200 : stress <= 6 ? 180 : 160;
        beatHz = stress <= 3 ? 8 : stress <= 6 ? 6 : 4;
        description = `Binaural carrier ~${carrierHz} Hz, beat ~${beatHz} Hz`;
    } else if (st.startsWith('isochronic') || st === 'isochronic') {
        if (st === 'isochronicSleep') {
            pulseHz = 2.5;
            carrierHz = 180;
        } else {
            pulseHz = stress <= 3 ? 14 : stress <= 6 ? 10 : 6;
            carrierHz = 180 + stress * 12;
        }
        beatHz = pulseHz;
        description = `Isochronic pulse ~${pulseHz} Hz, carrier ~${carrierHz} Hz`;
    } else if (st === 'monaural') {
        carrierHz = stress <= 3 ? 200 : stress <= 6 ? 160 : 120;
        beatHz = stress <= 3 ? 8 : stress <= 6 ? 6 : 4;
        description = `Monaural carrier ~${carrierHz} Hz, AM ~${beatHz} Hz`;
    } else if (st === 'gamma') {
        beatHz = 40;
        carrierHz = 200;
        description = 'Gamma ~40 Hz with ~200 Hz carrier';
    } else if (st === 'hrv') {
        beatHz = 0.1;
        carrierHz = 256;
        description = 'HRV coherence ~0.1 Hz breathing rhythm';
    } else if (st === 'solfeggio') {
        const s = Math.max(1, Math.min(10, Number(stressLevel) || 5));
        if (s >= 8) carrierHz = 396;
        else if (s >= 6) carrierHz = 417;
        else if (s >= 4) carrierHz = 639;
        else if (s >= 2) carrierHz = 528;
        else carrierHz = 852;
        description = `Solfeggio tone ~${carrierHz} Hz`;
    } else if (st === 'neuroacoustic') {
        carrierHz = 200 + stress * 16;
        beatHz = carrierHz * 0.025;
        description = `Detuned carriers ~${carrierHz} Hz`;
    } else if (st === 'psychoacoustic') {
        carrierHz = stress <= 3 ? 432 : stress <= 6 ? 396 : 528;
        description = `Harmonic stack fundamental ~${carrierHz} Hz`;
    } else if (st === 'emdrBls') {
        beatHz = 1.5;
        carrierHz = 440;
        description = 'Bilateral pan ~1.5 Hz, tone 440 Hz';
    } else if (st === 'pinkNoise' || st === 'whiteNoise' || st === 'brownNoise' || st === 'nature' || st === 'soundBath') {
        description = st === 'pinkNoise' ? 'Pink noise — no entrainment beat'
            : st === 'whiteNoise' ? 'White noise — no entrainment beat'
                : st === 'brownNoise' ? 'Brown noise — no entrainment beat'
                    : st === 'nature' ? 'Nature ambience — no entrainment beat'
                        : 'Sound bath — spatial tones, no fixed beat';
    }

    const brainBand = beatHz != null && beatHz >= 0.5
        ? brainBandFromBeatHz(beatHz)
        : null;

    return {
        carrierHz,
        beatHz,
        pulseHz,
        brainBand,
        headphonesRequired,
        description,
    };
}

/**
 * Resolve active beat/carrier when a protocol defines frequencyPhases.
 * Uses the phase that contains elapsed session time, or first phase before start.
 *
 * @param {number} elapsedSec
 * @param {Array<{durationSec:number, beatHz?:number, carrierHz?:number}>|null} phases
 * @returns {{ beatHz: number|null, carrierHz: number|null, phaseIndex: number }}
 */
function resolvePhasedFrequencies(elapsedSec, phases) {
    if (!phases?.length) {
        return { beatHz: null, carrierHz: null, phaseIndex: -1 };
    }
    let t = 0;
    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const dur = Math.max(0, phase.durationSec || 0);
        if (elapsedSec < t + dur || i === phases.length - 1) {
            return {
                beatHz: phase.beatHz ?? null,
                carrierHz: phase.carrierHz ?? null,
                phaseIndex: i,
            };
        }
        t += dur;
    }
    const last = phases[phases.length - 1];
    return {
        beatHz: last.beatHz ?? null,
        carrierHz: last.carrierHz ?? null,
        phaseIndex: phases.length - 1,
    };
}

function ensureFreqBuffer(length) {
    if (!freqBuffer.data || freqBuffer.length !== length) {
        freqBuffer.data = new Uint8Array(length);
        freqBuffer.length = length;
    }
    return freqBuffer.data;
}

function ensureWaveBuffer(length) {
    if (!waveBuffer.data || waveBuffer.length !== length) {
        waveBuffer.data = new Uint8Array(length);
        waveBuffer.length = length;
    }
    return waveBuffer.data;
}

function getAnalyserSafe() {
    if (typeof window.getAnalyser === 'function') {
        return window.getAnalyser();
    }
    return null;
}

function getContextSafe() {
    if (typeof window.getAudioContext === 'function') {
        return window.getAudioContext();
    }
    return null;
}

function binIndexToHz(analyser, ctx, binIndex) {
    if (!analyser || !ctx) return 0;
    const nyquist = ctx.sampleRate / 2;
    return (binIndex / analyser.frequencyBinCount) * nyquist;
}

function findPeakBinHz(data, analyser, ctx) {
    if (!data?.length) return null;
    let max = 0;
    let maxIdx = 0;
    for (let i = 1; i < data.length; i++) {
        if (data[i] > max) {
            max = data[i];
            maxIdx = i;
        }
    }
    if (max < 8) return null;
    return binIndexToHz(analyser, ctx, maxIdx);
}

/**
 * Sample one frame of live audio metrics.
 *
 * @param {object} [options]
 * @param {boolean} [options.includeSpectrum=false] — attach copy of frequency bins (Uint8Array)
 * @param {boolean} [options.includeWaveform=false] — attach time-domain bytes (Uint8Array)
 * @param {{ bass: [number,number], mid: [number,number], treble: [number,number] }} [options.bandSlices]
 * @returns {AudioReactiveFrame|null} null if analyser unavailable
 *
 * @typedef {object} AudioReactiveFrame
 * @property {number} timestamp — performance.now()
 * @property {number|null} audioTime — AudioContext.currentTime
 * @property {boolean} isPlaying — engine considers playback active
 * @property {string|null} contextState — running | suspended | closed
 * @property {number} level — 0–1 overall spectral energy
 * @property {number} bass — 0–1
 * @property {number} mid — 0–1
 * @property {number} treble — 0–1
 * @property {number|null} peakFrequencyHz — dominant bin (audible mix, not beat frequency)
 * @property {Uint8Array|undefined} spectrum
 * @property {Uint8Array|undefined} waveform
 * @property {SessionSnapshot|undefined} session
 *
 * @typedef {object} SessionSnapshot
 * @property {string} soundType
 * @property {number} stressLevel
 * @property {number} durationMin
 * @property {string} ambientSound
 * @property {string} vizType
 * @property {string|null} protocolId
 * @property {number|null} carrierHz — target / phased
 * @property {number|null} beatHz — entrainment target / phased
 * @property {{ id: string, label: string, beatHz: number }|null} brainBand
 * @property {boolean} headphonesRequired
 * @property {number|null} elapsedSec — seconds since session started
 * @property {number|null} remainingSec
 */
function getAudioFrame(options = {}) {
    const analyser = getAnalyserSafe();
    const ctx = getContextSafe();
    if (!analyser) {
        return null;
    }

    const slices = options.bandSlices || DEFAULT_BAND_SLICES;
    const data = ensureFreqBuffer(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const bass = avgRange(data, slices.bass[0], slices.bass[1]);
    const mid = avgRange(data, slices.mid[0], slices.mid[1]);
    const treble = avgRange(data, slices.treble[0], slices.treble[1]);
    const level = (bass + mid + treble) / 3;

    const frame = {
        timestamp: performance.now(),
        audioTime: ctx ? ctx.currentTime : null,
        isPlaying: internalEnginePlaying,
        contextState: ctx ? ctx.state : null,
        level: clamp01(level),
        bass: clamp01(bass),
        mid: clamp01(mid),
        treble: clamp01(treble),
        peakFrequencyHz: findPeakBinHz(data, analyser, ctx),
    };

    if (options.includeSpectrum) {
        frame.spectrum = new Uint8Array(data);
    }
    if (options.includeWaveform) {
        const wave = ensureWaveBuffer(analyser.fftSize);
        analyser.getByteTimeDomainData(wave);
        frame.waveform = new Uint8Array(wave);
    }

    if (sessionMetadata) {
        frame.session = buildSessionSnapshot(sessionMetadata, ctx);
    }

    lastFrame = frame;
    return frame;
}

function buildSessionSnapshot(meta, ctx) {
    const now = performance.now();
    const startedAt = meta.startedAt ?? now;
    const elapsedSec = Math.max(0, (now - startedAt) / 1000);
    const durationSec = (meta.durationMin ?? 10) * 60;
    const remainingSec = Math.max(0, durationSec - elapsedSec);

    const base = estimateTargetFrequencies(meta.stressLevel, meta.soundType);
    const phased = resolvePhasedFrequencies(elapsedSec, meta.frequencyPhases);

    const beatHz = phased.beatHz ?? base.beatHz;
    const carrierHz = phased.carrierHz ?? base.carrierHz;
    const brainBand = beatHz != null && beatHz >= 0.5
        ? brainBandFromBeatHz(beatHz)
        : base.brainBand;

    return {
        soundType: meta.soundType,
        stressLevel: meta.stressLevel,
        durationMin: meta.durationMin,
        ambientSound: meta.ambientSound,
        vizType: meta.vizType,
        protocolId: meta.protocolId ?? null,
        carrierHz,
        beatHz,
        brainBand,
        headphonesRequired: base.headphonesRequired,
        elapsedSec,
        remainingSec,
        phaseIndex: phased.phaseIndex,
    };
}

/**
 * Map a frame to CSS-friendly values for img/div backgrounds.
 *
 * @param {AudioReactiveFrame} frame
 * @param {'pulse'|'breathe'|'glow'|'calm'} [preset='pulse']
 * @returns {object} style properties (camelCase keys)
 */
function mapFrameToVisualStyle(frame, preset = 'pulse') {
    if (!frame) {
        return {
            transform: 'scale(1)',
            filter: 'brightness(1) saturate(1)',
            opacity: 1,
        };
    }

    const { level, bass, mid, treble } = frame;
    const beat = frame.session?.beatHz;
    const slowMod = beat && beat < 2
        ? 0.5 + 0.5 * Math.sin((frame.timestamp / 1000) * beat * Math.PI * 2)
        : 1;

    switch (preset) {
        case 'breathe': {
            const breath = 0.92 + level * 0.12 * slowMod;
            return {
                transform: `scale(${breath.toFixed(4)})`,
                filter: `brightness(${(1 + bass * 0.15).toFixed(3)})`,
                opacity: clamp01(0.85 + mid * 0.15),
            };
        }
        case 'glow': {
            const blur = 8 + treble * 24;
            const bright = 1 + level * 0.45;
            return {
                transform: `scale(${(1 + bass * 0.05).toFixed(4)})`,
                filter: `brightness(${bright.toFixed(3)}) blur(${blur.toFixed(1)}px) saturate(${(1 + mid * 0.6).toFixed(3)})`,
                opacity: 1,
            };
        }
        case 'calm': {
            return {
                transform: `scale(${(1 + level * 0.04).toFixed(4)})`,
                filter: `brightness(${(1 + bass * 0.2).toFixed(3)}) contrast(${(1 + mid * 0.08).toFixed(3)})`,
                opacity: clamp01(0.9 + treble * 0.1),
            };
        }
        case 'pulse':
        default: {
            return {
                transform: `scale(${(1 + level * 0.08).toFixed(4)})`,
                filter: `brightness(${(1 + bass * 0.3).toFixed(3)}) saturate(${(1 + mid * 0.5).toFixed(3)})`,
                opacity: 1,
            };
        }
    }
}

/**
 * Apply mapFrameToVisualStyle directly to a DOM element.
 * @param {HTMLElement} element
 * @param {AudioReactiveFrame} frame
 * @param {string} [preset]
 */
function applyVisualStyleToElement(element, frame, preset = 'pulse') {
    if (!element || !frame) return;
    const style = mapFrameToVisualStyle(frame, preset);
    element.style.transform = style.transform;
    element.style.filter = style.filter;
    if (style.opacity != null) element.style.opacity = String(style.opacity);
}

function tick() {
    rafId = null;
    if (!subscribers.size) return;

    let needSpectrum = false;
    let needWaveform = false;
    subscribers.forEach((entry) => {
        if (entry.options.includeSpectrum) needSpectrum = true;
        if (entry.options.includeWaveform) needWaveform = true;
    });

    const frame = getAudioFrame({
        includeSpectrum: needSpectrum,
        includeWaveform: needWaveform,
    });
    if (frame) {
        frame.isPlaying = internalEnginePlaying;
        lastFrame = frame;
        subscribers.forEach((entry) => {
            try {
                entry.callback(frame, entry.options);
                if (entry.targetEl) {
                    applyVisualStyleToElement(entry.targetEl, frame, entry.options.preset);
                }
            } catch (err) {
                console.error('[CalmMindAudioReactive] subscriber error:', err);
            }
        });
    }

    rafId = requestAnimationFrame(tick);
}

function startLoop() {
    if (rafId != null) return;
    rafId = requestAnimationFrame(tick);
}

function stopLoop() {
    if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

let internalEnginePlaying = false;

function onEnginePlayingState(isPlaying) {
    internalEnginePlaying = isPlaying;
    if (lastFrame) lastFrame.isPlaying = isPlaying;

    if (!isPlaying && autoRunOnPlay && subscribers.size) {
        const frame = getAudioFrame();
        if (frame) {
            frame.isPlaying = false;
            frame.level = frame.level * 0.35;
            subscribers.forEach((entry) => {
                try {
                    entry.callback(frame, entry.options);
                } catch {
                    /* noop */
                }
            });
        }
    }

    if (isPlaying && subscribers.size) {
        startLoop();
    }
}

function onTrackStopped() {
    internalEnginePlaying = false;
    sessionMetadata = null;
    lastFrame = null;
    stopLoop();
}

function onTrackStarted(stressLevel, duration, ambientSound, soundType, vizType, options) {
    sessionMetadata = {
        stressLevel,
        durationMin: duration,
        ambientSound,
        soundType,
        vizType,
        protocolId: options?.protocolId ?? null,
        frequencyPhases: options?.frequencyPhases ?? null,
        moodBefore: options?.moodBefore ?? null,
        startedAt: performance.now(),
    };
    internalEnginePlaying = true;
    if (subscribers.size) startLoop();
}

/**
 * @param {(frame: AudioReactiveFrame, options: object) => void} callback
 * @param {object} [options]
 * @param {boolean} [options.autoApplyTo] — CSS selector or HTMLElement to apply preset each frame
 * @param {string} [options.preset='pulse'] — mapFrameToVisualStyle preset
 * @param {boolean} [options.includeSpectrum=false]
 * @param {boolean} [options.includeWaveform=false]
 * @returns {() => void} unsubscribe
 */
function subscribe(callback, options = {}) {
    if (typeof callback !== 'function') {
        throw new TypeError('CalmMindAudioReactive.subscribe requires a callback function');
    }

    let targetEl = null;
    if (options.autoApplyTo) {
        targetEl = typeof options.autoApplyTo === 'string'
            ? document.querySelector(options.autoApplyTo)
            : options.autoApplyTo;
    }

    const entry = {
        callback,
        targetEl,
        options: {
            preset: options.preset || 'pulse',
            includeSpectrum: !!options.includeSpectrum,
            includeWaveform: !!options.includeWaveform,
        },
    };

    subscribers.add(entry);

    if (internalEnginePlaying || getAnalyserSafe()) {
        startLoop();
    }

    return function unsubscribe() {
        subscribers.delete(entry);
        if (!subscribers.size) stopLoop();
    };
}

function installEngineHooks() {
    if (window.__calmMindReactiveHooksInstalled) return;
    window.__calmMindReactiveHooksInstalled = true;

    const origSetPlaying = window.setPlayingState;
    window.setPlayingState = function wrappedSetPlayingState(state) {
        if (typeof origSetPlaying === 'function') origSetPlaying(state);
        onEnginePlayingState(!!state);
    };

    const origStop = window.stopCurrentTrack;
    window.stopCurrentTrack = function wrappedStopCurrentTrack() {
        onTrackStopped();
        if (typeof origStop === 'function') return origStop();
    };

    const origPlay = window.playGeneratedTrack;
    window.playGeneratedTrack = function wrappedPlayGeneratedTrack(
        stressLevel, duration, ambientSound, soundType, vizType, options
    ) {
        onTrackStarted(stressLevel, duration, ambientSound, soundType, vizType, options || {});
        if (typeof origPlay === 'function') {
            return origPlay(stressLevel, duration, ambientSound, soundType, vizType, options);
        }
        return false;
    };
}

installEngineHooks();

window.CalmMindAudioReactive = {
    VERSION: BRIDGE_VERSION,
    BRAIN_BAND_RANGES,
    DEFAULT_BAND_SLICES,

    getAudioFrame,
    subscribe,
    start: startLoop,
    stop: stopLoop,

    /**
     * Manually set session metadata if you bypass playGeneratedTrack.
     * @param {object|null} metadata
     */
    setSessionMetadata(metadata) {
        if (!metadata) {
            sessionMetadata = null;
            return;
        }
        sessionMetadata = {
            ...metadata,
            startedAt: metadata.startedAt ?? performance.now(),
        };
    },

    getSessionMetadata() {
        return sessionMetadata ? { ...sessionMetadata } : null;
    },

    getLastFrame() {
        return lastFrame;
    },

    estimateTargetFrequencies,
    brainBandFromBeatHz,
    mapFrameToVisualStyle,
    applyVisualStyleToElement,

    binIndexToHz(analyser, ctx, binIndex) {
        return binIndexToHz(analyser || getAnalyserSafe(), ctx || getContextSafe(), binIndex);
    },

    isRunning() {
        return rafId != null;
    },

    isAudioActive() {
        const ctx = getContextSafe();
        return internalEnginePlaying && ctx && ctx.state === 'running';
    },

    /** When true, subscribe loop starts automatically after playGeneratedTrack. */
    setAutoRunOnPlay(enabled) {
        autoRunOnPlay = !!enabled;
    },
};
