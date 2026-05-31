/**
 * Evidence-informed session protocols — preset sound/ambient/viz/frequency phases.
 * @global CalmMindProtocols
 * @depends none (standalone data + helpers)
 * @usedby client/js/app.js
 */
'use strict';

const EVIDENCE = {
    strong: { label: 'Strong evidence', class: 'evidence--strong' },
    moderate: { label: 'Moderate evidence', class: 'evidence--moderate' },
    emerging: { label: 'Emerging evidence', class: 'evidence--emerging' },
    wellness: { label: 'Wellness tradition', class: 'evidence--wellness' },
};

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
    sleepOnset: {
        id: 'sleepOnset',
        name: 'Sleep Onset',
        durationMin: 35,
        evidence: EVIDENCE.moderate,
        soundType: 'binauralSleep',
        stressLevel: 3,
        ambientSound: 'ocean-calm',
        vizType: 'particles',
        headphones: true,
        description: 'Alpha bridge (10 Hz) then delta (2 Hz) with fade-out.',
        frequencyPhases: [
            { durationSec: 1200, beatHz: 10, carrierHz: 250 },
            { durationSec: 900, beatHz: 2, carrierHz: 250 },
            { durationSec: 300, beatHz: 2, carrierHz: 250, fadeOut: true },
        ],
    },
    focusSprint: {
        id: 'focusSprint',
        name: 'Focus Sprint',
        durationMin: 25,
        evidence: EVIDENCE.moderate,
        soundType: 'isochronicEnergy',
        stressLevel: 7,
        ambientSound: 'none',
        vizType: 'meshWave',
        headphones: false,
        description: 'Beta-range isochronic tones for sustained focus.',
        frequencyPhases: [
            { durationSec: 300, beatHz: 14, carrierHz: 200 },
            { durationSec: 1200, beatHz: 18, carrierHz: 200 },
        ],
    },
    coherenceBreath: {
        id: 'coherenceBreath',
        name: 'Coherence Breath',
        durationMin: 10,
        evidence: EVIDENCE.strong,
        soundType: 'hrv',
        stressLevel: 5,
        ambientSound: 'forest',
        vizType: 'particles',
        headphones: false,
        breathPattern: 'coherent',
        description: 'Resonant breathing ~6/min with visual pacer.',
    },
    blsCalm: {
        id: 'blsCalm',
        name: 'Calm Down (BLS)',
        durationMin: 10,
        evidence: EVIDENCE.moderate,
        soundType: 'emdrBls',
        stressLevel: 5,
        ambientSound: 'ocean-dellec',
        vizType: 'particles',
        headphones: true,
        description: 'Bilateral tones for self-regulation — not clinical EMDR.',
    },
    deepSleep: {
        id: 'deepSleep',
        name: 'Deep Sleep',
        durationMin: 45,
        evidence: EVIDENCE.moderate,
        soundType: 'brownNoise',
        stressLevel: 3,
        ambientSound: 'night-crickets',
        vizType: 'particles',
        headphones: false,
        description: 'Brown noise masking with night crickets for sleep.',
    },
    focusStudy: {
        id: 'focusStudy',
        name: 'Focus / Study',
        durationMin: 30,
        evidence: EVIDENCE.moderate,
        soundType: 'whiteNoise',
        stressLevel: 5,
        ambientSound: 'none',
        vizType: 'meshWave',
        headphones: false,
        description: 'Steady white noise to mask distractions while studying.',
    },
    windDown: {
        id: 'windDown',
        name: 'Wind Down',
        durationMin: 20,
        evidence: EVIDENCE.strong,
        soundType: 'binauralRelax',
        stressLevel: 5,
        ambientSound: 'wind-grass',
        vizType: 'particles',
        headphones: true,
        description: 'Alpha→theta binaural with gentle wind ambience.',
        frequencyPhases: [
            { durationSec: 300, beatHz: 10, carrierHz: 250 },
            { durationSec: 900, beatHz: 6, carrierHz: 250 },
        ],
    },
    boxBreath: {
        id: 'boxBreath',
        name: 'Box Breath',
        durationMin: 10,
        evidence: EVIDENCE.strong,
        soundType: 'hrv',
        stressLevel: 5,
        ambientSound: 'none',
        vizType: 'particles',
        headphones: false,
        breathPattern: 'box',
        description: 'Box breathing 4-4-4-4 with audio and visual pacer.',
    },
};

function getProtocol(id) {
    if (!id || id === 'none') return null;
    return PROTOCOLS[id] || null;
}

function applyProtocolToSettings(protocolId, settings) {
    const protocol = getProtocol(protocolId);
    if (!protocol) return { ...settings, protocol: null };
    return {
        ...settings,
        protocol,
        duration: protocol.durationMin,
        soundType: protocol.soundType,
        stressLevel: protocol.stressLevel,
        ambientSound: protocol.ambientSound,
        vizType: protocol.vizType || settings.vizType,
        breathPattern: protocol.breathPattern || settings.breathPattern || 'coherent',
    };
}

window.CalmMindProtocols = {
    EVIDENCE,
    PROTOCOLS,
    getProtocol,
    applyProtocolToSettings,
};
