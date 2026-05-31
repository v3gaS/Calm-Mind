/**
 * Audio Utilities Module
 * 
 * This module provides utility functions for audio processing and management.
 * 
 * @module AudioUtils
 */

import { getAudioContext } from '../core/audio-core.js';

/**
 * Create a buffer source node from an audio buffer
 * @param {AudioBuffer} buffer - The audio buffer to use
 * @param {boolean} [loop=false] - Whether to loop the buffer
 * @returns {AudioBufferSourceNode} The created buffer source node
 */
function createBufferSource(buffer, loop = false) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    return source;
}

/**
 * Create a pink noise buffer
 * @param {number} [duration=1] - Duration in seconds
 * @returns {AudioBuffer} The created pink noise buffer
 */
function createPinkNoiseBuffer(duration = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // Adjust volume
        b6 = white * 0.115926;
    }
    
    return noiseBuffer;
}

/**
 * Create a brown noise buffer
 * @param {number} [duration=1] - Duration in seconds
 * @returns {AudioBuffer} The created brown noise buffer
 */
function createBrownNoiseBuffer(duration = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Adjust volume
    }
    
    return noiseBuffer;
}

/**
 * Create a white noise buffer
 * @param {number} [duration=1] - Duration in seconds
 * @returns {AudioBuffer} The created white noise buffer
 */
function createWhiteNoiseBuffer(duration = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    return noiseBuffer;
}

/**
 * Create a sine wave buffer
 * @param {number} [frequency=440] - Frequency in Hz
 * @param {number} [duration=1] - Duration in seconds
 * @returns {AudioBuffer} The created sine wave buffer
 */
function createSineWaveBuffer(frequency = 440, duration = 1) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.sin(2 * Math.PI * frequency * i / audioContext.sampleRate);
    }
    
    return buffer;
}

/**
 * Create a buffer pool for efficient buffer reuse
 * @param {Function} bufferCreator - Function to create a buffer
 * @param {number} [poolSize=5] - Size of the buffer pool
 * @returns {Object} Buffer pool with get and release methods
 */
function createBufferPool(bufferCreator, poolSize = 5) {
    const pool = [];
    
    // Initialize the pool
    for (let i = 0; i < poolSize; i++) {
        pool.push({
            buffer: bufferCreator(),
            inUse: false
        });
    }
    
    return {
        /**
         * Get a buffer from the pool
         * @returns {AudioBuffer} An available buffer
         */
        get: function() {
            // Find an available buffer
            const available = pool.find(item => !item.inUse);
            
            if (available) {
                available.inUse = true;
                return available.buffer;
            }
            
            // If no buffer is available, create a new one
            const newBuffer = {
                buffer: bufferCreator(),
                inUse: true
            };
            pool.push(newBuffer);
            return newBuffer.buffer;
        },
        
        /**
         * Release a buffer back to the pool
         * @param {AudioBuffer} buffer - The buffer to release
         */
        release: function(buffer) {
            const item = pool.find(item => item.buffer === buffer);
            if (item) {
                item.inUse = false;
            }
        }
    };
}

/**
 * Convert frequency to MIDI note number
 * @param {number} frequency - Frequency in Hz
 * @returns {number} MIDI note number
 */
function frequencyToMidi(frequency) {
    return 69 + 12 * Math.log2(frequency / 440);
}

/**
 * Convert MIDI note number to frequency
 * @param {number} midi - MIDI note number
 * @returns {number} Frequency in Hz
 */
function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convert frequency to musical note name
 * @param {number} frequency - Frequency in Hz
 * @returns {string} Musical note name (e.g., "A4")
 */
function frequencyToNote(frequency) {
    const midi = frequencyToMidi(frequency);
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
}

// Export the module
export {
    createBufferSource,
    createPinkNoiseBuffer,
    createBrownNoiseBuffer,
    createWhiteNoiseBuffer,
    createSineWaveBuffer,
    createBufferPool,
    frequencyToMidi,
    midiToFrequency,
    frequencyToNote
}; 