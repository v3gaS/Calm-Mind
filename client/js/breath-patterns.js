/**
 * Breath pattern definitions for HRV coherence sessions.
 * @global CalmMindBreathPatterns
 */
'use strict';

const BREATH_PATTERNS = {
    coherent: {
        id: 'coherent',
        label: '5.5 breaths / min',
        subLabel: 'Coherent · 4s in / 6s out',
        cycleSec: 10,
        phases: [
            { name: 'inhale', durationSec: 4, carrierStart: 0.3, carrierEnd: 0.6, pulseEnd: 0.3 },
            { name: 'exhale', durationSec: 6, carrierStart: 0.6, carrierEnd: 0.3, pulseEnd: 0 },
        ],
    },
    box: {
        id: 'box',
        label: 'Box · 4-4-4-4',
        subLabel: 'Box · 4-4-4-4',
        cycleSec: 16,
        phases: [
            { name: 'inhale', durationSec: 4, carrierStart: 0.3, carrierEnd: 0.55, pulseEnd: 0.25 },
            { name: 'hold', durationSec: 4, carrierStart: 0.55, carrierEnd: 0.55, pulseEnd: 0 },
            { name: 'exhale', durationSec: 4, carrierStart: 0.55, carrierEnd: 0.3, pulseEnd: 0 },
            { name: 'hold', durationSec: 4, carrierStart: 0.3, carrierEnd: 0.3, pulseEnd: 0 },
        ],
    },
    fourSevenEight: {
        id: 'fourSevenEight',
        label: '4-7-8',
        subLabel: '4-7-8 · sleep breath',
        cycleSec: 19,
        phases: [
            { name: 'inhale', durationSec: 4, carrierStart: 0.3, carrierEnd: 0.55, pulseEnd: 0.25 },
            { name: 'hold', durationSec: 7, carrierStart: 0.55, carrierEnd: 0.55, pulseEnd: 0 },
            { name: 'exhale', durationSec: 8, carrierStart: 0.55, carrierEnd: 0.25, pulseEnd: 0 },
        ],
    },
};

function getBreathPattern(id) {
    if (!id || id === 'coherent') return BREATH_PATTERNS.coherent;
    return BREATH_PATTERNS[id] || BREATH_PATTERNS.coherent;
}

/** Phase at elapsed seconds within a repeating cycle. */
function phaseAtElapsed(pattern, elapsedSec) {
    const p = getBreathPattern(pattern);
    const t = ((elapsedSec % p.cycleSec) + p.cycleSec) % p.cycleSec;
    let acc = 0;
    for (const phase of p.phases) {
        if (t < acc + phase.durationSec) {
            return { ...phase, offsetSec: t - acc, pattern: p };
        }
        acc += phase.durationSec;
    }
    return { ...p.phases[0], offsetSec: 0, pattern: p };
}

/** UI label for breath cue word from phase name. */
function breathWordForPhase(phaseName) {
    if (phaseName === 'inhale') return 'Breathe in';
    if (phaseName === 'exhale') return 'Breathe out';
    if (phaseName === 'hold') return 'Hold';
    return 'Breathe';
}

window.CalmMindBreathPatterns = {
    BREATH_PATTERNS,
    getBreathPattern,
    phaseAtElapsed,
    breathWordForPhase,
};
