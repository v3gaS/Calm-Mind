/**
 * Audio Core Module
 * Handles low-level audio operations and Web Audio API interactions
 */

// Audio context and master gain
let audioContext = null;
let masterGain = null;

/**
 * Initializes the audio context
 * @returns {Promise<AudioContext>} The initialized audio context
 */
export async function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.value = 0.5; // Default volume
        } catch (error) {
            console.error('Error initializing audio context:', error);
            throw error;
        }
    }
    return audioContext;
}

/**
 * Gets the current audio context
 * @returns {AudioContext|null} The current audio context
 */
export function getAudioContext() {
    return audioContext;
}

/**
 * Gets the master gain node
 * @returns {GainNode|null} The master gain node
 */
export function getMasterGain() {
    return masterGain;
}

/**
 * Sets the master volume
 * @param {number} volume - Volume level (0-1)
 */
export function setMasterVolume(volume) {
    if (masterGain) {
        masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Creates an oscillator node
 * @param {number} frequency - Frequency in Hz
 * @param {string} type - Waveform type ('sine', 'square', 'sawtooth', 'triangle')
 * @returns {OscillatorNode} The created oscillator node
 */
export function createOscillator(frequency, type = 'sine') {
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }

    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    return oscillator;
}

/**
 * Creates a gain node
 * @param {number} gain - Initial gain value (0-1)
 * @returns {GainNode} The created gain node
 */
export function createGain(gain = 1) {
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }

    const gainNode = audioContext.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, gain));
    return gainNode;
}

/**
 * Creates a stereo panner node
 * @param {number} pan - Pan value (-1 to 1)
 * @returns {StereoPannerNode} The created stereo panner node
 */
export function createStereoPanner(pan = 0) {
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }

    const panner = audioContext.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    return panner;
}

/**
 * Creates a biquad filter node
 * @param {string} type - Filter type ('lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass')
 * @param {number} frequency - Cutoff frequency in Hz
 * @param {number} Q - Quality factor
 * @param {number} gain - Gain value (for shelf and peaking filters)
 * @returns {BiquadFilterNode} The created filter node
 */
export function createFilter(type, frequency, Q = 1, gain = 0) {
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }

    const filter = audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    filter.gain.value = gain;
    return filter;
}

/**
 * Resumes the audio context
 * @returns {Promise<void>}
 */
export async function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (error) {
            console.error('Error resuming audio context:', error);
            throw error;
        }
    }
}

/**
 * Suspends the audio context
 * @returns {Promise<void>}
 */
export async function suspendAudioContext() {
    if (audioContext && audioContext.state === 'running') {
        try {
            await audioContext.suspend();
        } catch (error) {
            console.error('Error suspending audio context:', error);
            throw error;
        }
    }
}

/**
 * Cleans up audio resources
 * @returns {Promise<void>}
 */
export async function cleanup() {
    if (audioContext) {
        try {
            await audioContext.close();
            audioContext = null;
            masterGain = null;
        } catch (error) {
            console.error('Error cleaning up audio resources:', error);
            throw error;
        }
    }
}

/**
 * Create a new analyser node
 * @param {number} [fftSize=2048] - FFT size for frequency analysis
 * @returns {AnalyserNode} The created analyser node
 */
function createAnalyser(fftSize = 2048) {
    if (!audioContext) {
        initAudioContext();
    }
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    return analyser;
}

/**
 * Connect an audio node to the master gain
 * @param {AudioNode} node - The audio node to connect
 */
function connectToMaster(node) {
    if (masterGain) {
        node.connect(masterGain);
    }
}

/**
 * Disconnect an audio node from the master gain
 * @param {AudioNode} node - The audio node to disconnect
 */
function disconnectFromMaster(node) {
    if (masterGain) {
        node.disconnect(masterGain);
    }
}

// Export the module
export {
    initAudioContext,
    getAudioContext,
    getMasterGain,
    setMasterVolume,
    resumeAudioContext,
    suspendAudioContext,
    createOscillator,
    createGain,
    createStereoPanner,
    createAnalyser,
    connectToMaster,
    disconnectFromMaster,
    cleanup
}; 