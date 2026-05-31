/**
 * CC0 ambient sample loader — fetch, cache, loop via AudioBufferSourceNode.
 * @global AmbientLoader
 * @depends Web Audio API; assets at /assets/audio/ambient/*.ogg
 * @usedby client/js/audio.js
 */
'use strict';

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
const bufferCache = new Map();
const activeSources = [];

function resolveFile(type) {
    const file = AMBIENT_MANIFEST[type];
    if (!file) return null;
    return `${AMBIENT_BASE}${file}`;
}

async function loadAmbientBuffer(type, audioContext) {
    if (bufferCache.has(type)) return bufferCache.get(type);
    const url = resolveFile(type);
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(ab);
        bufferCache.set(type, buffer);
        return buffer;
    } catch (err) {
        console.warn('[AmbientLoader] Failed to load', type, err);
        return null;
    }
}

function stopAllAmbient() {
    activeSources.forEach((entry) => {
        try {
            if (entry.source?.stop) entry.source.stop();
        } catch {
            /* already stopped */
        }
        try {
            entry.source?.disconnect();
            entry.gain?.disconnect();
        } catch {
            /* noop */
        }
    });
    activeSources.length = 0;
}

/**
 * @param {string} type — key from AMBIENT_MANIFEST
 * @param {number} durationSec
 * @param {number} volume — linear gain (0–1)
 * @param {AudioContext} audioContext
 * @param {GainNode} destination — usually masterGain
 * @param {Array} nodeRegistry — soundTypeNodes in audio.js
 * @returns {Promise<boolean>}
 */
async function playLoop(type, durationSec, volume, audioContext, destination, nodeRegistry) {
    if (!type || type === 'none' || !audioContext || !destination) return false;

    const buffer = await loadAmbientBuffer(type, audioContext);
    if (!buffer) return false;

    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = Math.max(0, Math.min(1, volume));
    source.connect(gain);
    gain.connect(destination);
    source.start();

    const duration = Math.max(0, durationSec);
    const fadeSec = Math.min(60, duration * 0.1);
    const fadeStart = Math.max(0, duration - fadeSec);

    if (duration > 0) {
        source.stop(audioContext.currentTime + duration);
        if (fadeSec > 0 && fadeStart > 0) {
            gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime + fadeStart);
            gain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + duration);
        }
    }

    const entry = { source, gain };
    activeSources.push(entry);
    nodeRegistry.push(source, gain, { disconnect: () => stopAllAmbient() });
    return true;
}

/** Fallback triangle oscillator when samples unavailable */
function playSyntheticFallback(type, durationSec, volume, audioContext, destination, nodeRegistry) {
    const freqMap = {
        rain: 200,
        ocean: 120,
        forest: 300,
        fireplace: 180,
        'night-crickets': 220,
        'wind-grass': 160,
    };
    const base = freqMap[type] || freqMap[type?.split('-')[0]] || 180;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.value = base;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    if (durationSec > 0) osc.stop(audioContext.currentTime + durationSec);
    nodeRegistry.push(osc, gain);
    return true;
}

async function playAmbient(type, durationSec, volume, audioContext, destination, nodeRegistry) {
    stopAllAmbient();
    const ok = await playLoop(type, durationSec, volume, audioContext, destination, nodeRegistry);
    if (!ok) {
        const simple = type.split('-')[0];
        playSyntheticFallback(simple, durationSec, volume, audioContext, destination, nodeRegistry);
    }
}

window.AmbientLoader = {
    AMBIENT_MANIFEST,
    loadAmbientBuffer,
    playAmbient,
    stopAllAmbient,
};
