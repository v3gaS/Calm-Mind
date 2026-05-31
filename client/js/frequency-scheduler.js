/**
 * Progressive beat/carrier scheduling for multi-phase binaural sessions.
 * @global FrequencyScheduler
 * @depends Web Audio API (OscillatorNode frequency automation)
 * @usedby client/js/audio.js
 */
'use strict';

/**
 * Schedule binaural beat frequency changes on two oscillators.
 * @param {AudioContext} ctx
 * @param {OscillatorNode} oscLeft — base carrier
 * @param {OscillatorNode} oscRight — carrier + beat offset
 * @param {Array<{durationSec:number, beatHz:number, carrierHz:number, fadeOut?:boolean}>} phases
 * @param {GainNode} [masterFadeGain] — optional gain for fade-out on last phase
 */
function scheduleBinauralPhases(ctx, oscLeft, oscRight, phases, masterFadeGain) {
    if (!ctx || !oscLeft || !oscRight || !phases?.length) return;

    let t = ctx.currentTime + 0.05;
    phases.forEach((phase, idx) => {
        const carrier = phase.carrierHz ?? 250;
        const beat = phase.beatHz ?? 6;
        oscLeft.frequency.setValueAtTime(carrier, t);
        oscRight.frequency.setValueAtTime(carrier + beat, t);
        t += Math.max(0, phase.durationSec);

        if (phase.fadeOut && masterFadeGain && idx === phases.length - 1) {
            const fadeStart = t - Math.min(60, phase.durationSec);
            masterFadeGain.gain.setValueAtTime(masterFadeGain.gain.value, fadeStart);
            masterFadeGain.gain.linearRampToValueAtTime(0.001, t);
        }
    });
}

/**
 * Schedule isochronic pulse rate via callback (pulse interval ms).
 */
function scheduleIsochronicPhases(ctx, phases, onPhase) {
    if (!phases?.length) return () => {};
    let elapsed = 0;
    const timers = [];

    phases.forEach((phase) => {
        const delay = elapsed * 1000;
        timers.push(
            setTimeout(() => {
                onPhase(phase.beatHz ?? 10, phase.carrierHz ?? 200);
            }, delay)
        );
        elapsed += phase.durationSec;
    });

    return () => timers.forEach(clearTimeout);
}

window.FrequencyScheduler = {
    scheduleBinauralPhases,
    scheduleIsochronicPhases,
};
