/**
 * Bilateral stimulation (EMDR-style) for self-regulation — not clinical EMDR.
 * @global generateEMDRBilateral
 * @depends Web Audio API (oscillator + stereo panner)
 * @usedby client/js/audio.js
 */
'use strict';

/**
 * Alternating L/R tones at ~1.5 Hz with optional soft pad.
 * @param {AudioContext} ctx
 * @param {GainNode} destination
 * @param {number} durationSec
 * @param {Array} nodeRegistry
 */
function generateEMDRBilateral(ctx, destination, durationSec, nodeRegistry) {
    const panRateHz = 1.5;
    const toneHz = 440;
    const periodMs = 1000 / panRateHz;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = 'sine';
    osc.frequency.value = toneHz;
    gain.gain.value = 0.22;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(destination);
    osc.start();

    let panSide = -1;
    panner.pan.value = panSide;
    const panTimer = setInterval(() => {
        if (!ctx) {
            clearInterval(panTimer);
            return;
        }
        panSide = panSide > 0 ? -1 : 1;
        panner.pan.setTargetAtTime(panSide, ctx.currentTime, 0.02);
    }, periodMs / 2);

    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = 'sine';
    pad.frequency.value = 110;
    padGain.gain.value = 0.06;
    pad.connect(padGain);
    padGain.connect(destination);
    pad.start();

    const dur = Math.max(0, durationSec);
    osc.stop(ctx.currentTime + dur);
    pad.stop(ctx.currentTime + dur);
    setTimeout(() => clearInterval(panTimer), dur * 1000);

    nodeRegistry.push(osc, gain, panner, pad, padGain, {
        disconnect: () => clearInterval(panTimer),
    });
}

window.generateEMDRBilateral = generateEMDRBilateral;
