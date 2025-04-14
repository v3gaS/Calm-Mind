/**
 * Audio Effects Module
 * 
 * This module provides audio effects processing functions.
 * 
 * @module AudioEffects
 */

import { getAudioContext, createGainNode } from '../core/audio-core.js';

/**
 * Create a low-pass filter
 * @param {number} [frequency=1000] - Cutoff frequency in Hz
 * @param {number} [Q=1] - Q factor (resonance)
 * @returns {BiquadFilterNode} The created low-pass filter
 */
function createLowPassFilter(frequency = 1000, Q = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
    filter.Q.setValueAtTime(Q, audioContext.currentTime);
    
    return filter;
}

/**
 * Create a high-pass filter
 * @param {number} [frequency=1000] - Cutoff frequency in Hz
 * @param {number} [Q=1] - Q factor (resonance)
 * @returns {BiquadFilterNode} The created high-pass filter
 */
function createHighPassFilter(frequency = 1000, Q = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
    filter.Q.setValueAtTime(Q, audioContext.currentTime);
    
    return filter;
}

/**
 * Create a band-pass filter
 * @param {number} [frequency=1000] - Center frequency in Hz
 * @param {number} [Q=1] - Q factor (bandwidth)
 * @returns {BiquadFilterNode} The created band-pass filter
 */
function createBandPassFilter(frequency = 1000, Q = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, audioContext.currentTime);
    filter.Q.setValueAtTime(Q, audioContext.currentTime);
    
    return filter;
}

/**
 * Create a compressor
 * @param {number} [threshold=-24] - Threshold in dB
 * @param {number} [knee=30] - Knee in dB
 * @param {number} [ratio=12] - Compression ratio
 * @param {number} [attack=0.003] - Attack time in seconds
 * @param {number} [release=0.25] - Release time in seconds
 * @returns {DynamicsCompressorNode} The created compressor
 */
function createCompressor(threshold = -24, knee = 30, ratio = 12, attack = 0.003, release = 0.25) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(threshold, audioContext.currentTime);
    compressor.knee.setValueAtTime(knee, audioContext.currentTime);
    compressor.ratio.setValueAtTime(ratio, audioContext.currentTime);
    compressor.attack.setValueAtTime(attack, audioContext.currentTime);
    compressor.release.setValueAtTime(release, audioContext.currentTime);
    
    return compressor;
}

/**
 * Create a delay effect
 * @param {number} [delayTime=0.3] - Delay time in seconds
 * @param {number} [feedback=0.5] - Feedback amount (0-1)
 * @returns {Object} Object containing delay nodes and connect method
 */
function createDelay(delayTime = 0.3, feedback = 0.5) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const delay = audioContext.createDelay();
    delay.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
    
    const feedbackGain = createGainNode(feedback);
    
    // Connect delay to feedback gain and back to delay
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    
    return {
        input: delay,
        output: delay,
        connect: function(source) {
            source.connect(delay);
            return delay;
        }
    };
}

/**
 * Create a reverb effect
 * @param {number} [decay=2] - Reverb decay time in seconds
 * @param {number} [reverse=false] - Whether to reverse the reverb
 * @param {number} [wet=0.5] - Wet/dry mix (0-1)
 * @returns {Object} Object containing reverb nodes and connect method
 */
function createReverb(decay = 2, reverse = false, wet = 0.5) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    // Create convolver
    const convolver = audioContext.createConvolver();
    
    // Create impulse response
    const length = audioContext.sampleRate * decay;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    
    convolver.buffer = impulse;
    
    // Create wet/dry mix
    const wetGain = createGainNode(wet);
    const dryGain = createGainNode(1 - wet);
    
    return {
        input: convolver,
        output: convolver,
        wetGain: wetGain,
        dryGain: dryGain,
        connect: function(source) {
            source.connect(convolver);
            convolver.connect(wetGain);
            source.connect(dryGain);
            wetGain.connect(audioContext.destination);
            dryGain.connect(audioContext.destination);
            return {
                wetGain: wetGain,
                dryGain: dryGain
            };
        }
    };
}

/**
 * Create a tremolo effect
 * @param {number} [frequency=5] - Tremolo frequency in Hz
 * @param {number} [depth=0.5] - Tremolo depth (0-1)
 * @returns {Object} Object containing tremolo nodes and connect method
 */
function createTremolo(frequency = 5, depth = 0.5) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    const gainNode = createGainNode(1);
    
    // Connect oscillator to gain node
    oscillator.connect(gainNode.gain);
    
    // Start the oscillator
    oscillator.start();
    
    return {
        input: gainNode,
        output: gainNode,
        connect: function(source) {
            source.connect(gainNode);
            return gainNode;
        },
        stop: function() {
            oscillator.stop();
        }
    };
}

/**
 * Create a phaser effect
 * @param {number} [frequency=0.5] - LFO frequency in Hz
 * @param {number} [depth=0.5] - Phaser depth (0-1)
 * @param {number} [feedback=0.5] - Feedback amount (0-1)
 * @returns {Object} Object containing phaser nodes and connect method
 */
function createPhaser(frequency = 0.5, depth = 0.5, feedback = 0.5) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    // Create LFO
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create gain for LFO
    const lfoGain = createGainNode(depth * 1000);
    
    // Connect LFO to gain
    lfo.connect(lfoGain);
    
    // Create all-pass filters
    const filters = [];
    const filterCount = 4;
    
    for (let i = 0; i < filterCount; i++) {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'allpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filters.push(filter);
    }
    
    // Connect LFO gain to filter frequencies
    lfoGain.connect(filters[0].frequency);
    
    // Connect filters in series
    for (let i = 0; i < filterCount - 1; i++) {
        filters[i].connect(filters[i + 1]);
    }
    
    // Create feedback gain
    const feedbackGain = createGainNode(feedback);
    
    // Connect last filter to feedback gain and back to first filter
    filters[filterCount - 1].connect(feedbackGain);
    feedbackGain.connect(filters[0]);
    
    // Start the LFO
    lfo.start();
    
    return {
        input: filters[0],
        output: filters[filterCount - 1],
        connect: function(source) {
            source.connect(filters[0]);
            return filters[filterCount - 1];
        },
        stop: function() {
            lfo.stop();
        }
    };
}

// Export the module
export {
    createLowPassFilter,
    createHighPassFilter,
    createBandPassFilter,
    createCompressor,
    createDelay,
    createReverb,
    createTremolo,
    createPhaser
}; 