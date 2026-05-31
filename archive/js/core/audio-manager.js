/**
 * Audio Manager Module
 * Coordinates audio operations and manages sound generation
 */

import {
    initAudioContext,
    setMasterVolume,
    createOscillator,
    createGain,
    createStereoPanner,
    resumeAudioContext,
    suspendAudioContext
} from './audio-core.js';

// Import sound generators
import { generateBinauralBeats } from '../sound-generators/binaural-beats.js';
import { generateIsochronicTones } from '../sound-generators/isochronic-tones.js';
import { generatePinkNoise } from '../sound-generators/pink-noise.js';

// State management
let isPlaying = false;
let activeNodes = new Set();
let currentTrack = null;

/**
 * Generates a personalized audio track based on user parameters
 * @param {Object} params - Track generation parameters
 * @param {number} params.stressLevel - User's stress level (0-1)
 * @param {number} params.duration - Track duration in seconds
 * @param {string} params.ambientSound - Type of ambient sound ('pink', 'white', 'brown')
 * @param {string} params.soundType - Type of sound ('binaural', 'isochronic')
 * @returns {Promise<Object>} Generated track configuration
 */
export async function generatePersonalizedTrack(params) {
    try {
        await initAudioContext();
        
        const track = {
            id: Date.now(),
            params,
            nodes: new Set(),
            startTime: null
        };

        // Generate appropriate frequencies based on stress level
        const baseFreq = calculateBaseFrequency(params.stressLevel);
        
        if (params.soundType === 'binaural') {
            await generateBinauralBeats(track, baseFreq);
        } else if (params.soundType === 'isochronic') {
            await generateIsochronicTones(track, baseFreq);
        }

        if (params.ambientSound) {
            await generateAmbientSound(track, params.ambientSound);
        }

        currentTrack = track;
        return track;
    } catch (error) {
        console.error('Error generating track:', error);
        throw error;
    }
}

/**
 * Calculates base frequency based on stress level
 * @param {number} stressLevel - User's stress level (0-1)
 * @returns {number} Base frequency in Hz
 */
function calculateBaseFrequency(stressLevel) {
    // Map stress levels to frequency ranges
    // Lower stress = lower frequencies (theta/delta)
    // Higher stress = higher frequencies (alpha/beta)
    const minFreq = 4;  // Delta waves
    const maxFreq = 12; // Alpha waves
    return minFreq + (maxFreq - minFreq) * stressLevel;
}

/**
 * Generates binaural beats
 * @param {Object} track - Track configuration
 * @param {number} baseFreq - Base frequency in Hz
 */
async function generateBinauralBeats(track, baseFreq) {
    const beatFreq = 7.83; // Schumann resonance
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq;

    // Create oscillators
    const leftOsc = createOscillator(leftFreq, 'sine');
    const rightOsc = createOscillator(rightFreq, 'sine');

    // Create gain nodes
    const leftGain = createGain(0.5);
    const rightGain = createGain(0.5);

    // Create stereo panners
    const leftPanner = createStereoPanner(-1);
    const rightPanner = createStereoPanner(1);

    // Connect nodes
    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(leftPanner);
    rightGain.connect(rightPanner);
    leftPanner.connect(leftOsc.context.destination);
    rightPanner.connect(rightOsc.context.destination);

    // Add nodes to track
    track.nodes.add(leftOsc);
    track.nodes.add(rightOsc);
    track.nodes.add(leftGain);
    track.nodes.add(rightGain);
    track.nodes.add(leftPanner);
    track.nodes.add(rightPanner);
}

/**
 * Generates isochronic tones
 * @param {Object} track - Track configuration
 * @param {number} baseFreq - Base frequency in Hz
 */
async function generateIsochronicTones(track, baseFreq) {
    const carrierFreq = 150; // Carrier frequency
    const pulseRate = baseFreq;
    
    // Create oscillator
    const osc = createOscillator(carrierFreq, 'sine');
    
    // Create gain node for amplitude modulation
    const gain = createGain(0.5);
    
    // Create modulator oscillator
    const modOsc = createOscillator(pulseRate, 'sine');
    const modGain = createGain(0.5);
    
    // Connect modulation
    modOsc.connect(modGain);
    modGain.connect(gain.gain);
    
    // Connect to destination
    osc.connect(gain);
    gain.connect(osc.context.destination);
    
    // Add nodes to track
    track.nodes.add(osc);
    track.nodes.add(gain);
    track.nodes.add(modOsc);
    track.nodes.add(modGain);
}

/**
 * Generates ambient noise
 * @param {Object} track - Track configuration
 * @param {string} type - Type of noise ('pink', 'white', 'brown')
 */
async function generateAmbientSound(track, type) {
    // Implementation will depend on the specific noise generation method
    // This is a placeholder for future implementation
    console.log(`Generating ${type} noise`);
}

/**
 * Toggles play/pause state
 * @returns {Promise<boolean>} New play state
 */
export async function togglePlayPause() {
    try {
        if (!currentTrack) {
            throw new Error('No active track');
        }

        if (isPlaying) {
            await pause();
        } else {
            await play();
        }

        return isPlaying;
    } catch (error) {
        console.error('Error toggling play/pause:', error);
        throw error;
    }
}

/**
 * Starts playback
 * @returns {Promise<void>}
 */
async function play() {
    if (!currentTrack) return;

    try {
        await resumeAudioContext();
        
        currentTrack.nodes.forEach(node => {
            if (node.start) {
                node.start();
            }
        });

        currentTrack.startTime = Date.now();
        isPlaying = true;
    } catch (error) {
        console.error('Error starting playback:', error);
        throw error;
    }
}

/**
 * Pauses playback
 * @returns {Promise<void>}
 */
async function pause() {
    if (!currentTrack) return;

    try {
        currentTrack.nodes.forEach(node => {
            if (node.stop) {
                node.stop();
            }
        });

        await suspendAudioContext();
        isPlaying = false;
    } catch (error) {
        console.error('Error pausing playback:', error);
        throw error;
    }
}

/**
 * Stops playback and cleans up resources
 * @returns {Promise<void>}
 */
export async function stop() {
    if (!currentTrack) return;

    try {
        await pause();
        
        currentTrack.nodes.forEach(node => {
            if (node.disconnect) {
                node.disconnect();
            }
        });

        currentTrack.nodes.clear();
        currentTrack = null;
        isPlaying = false;
    } catch (error) {
        console.error('Error stopping playback:', error);
        throw error;
    }
}

/**
 * Updates track parameters
 * @param {Object} params - New parameters
 * @returns {Promise<Object>} Updated track
 */
export async function updateTrack(params) {
    try {
        await stop();
        return await generatePersonalizedTrack(params);
    } catch (error) {
        console.error('Error updating track:', error);
        throw error;
    }
}

/**
 * Gets the current playback state
 * @returns {Object} Playback state
 */
export function getPlaybackState() {
    return {
        isPlaying,
        currentTrack: currentTrack ? {
            id: currentTrack.id,
            params: currentTrack.params,
            startTime: currentTrack.startTime
        } : null
    };
}

/**
 * Set the master volume
 * @param {number} value - Volume value between 0 and 1
 */
function setVolume(value) {
    setMasterVolume(value);
}

/**
 * Get the current playing state
 * @returns {boolean} Whether audio is currently playing
 */
function getPlayingState() {
    return isPlaying;
}

/**
 * Get the current audio context state
 * @returns {string} The current audio context state
 */
function getAudioState() {
    const audioContext = getAudioContext();
    return audioContext ? audioContext.state : 'not initialized';
}

// Export the module
export {
    init,
    generatePersonalizedTrack,
    stopCurrentTrack,
    togglePlay,
    setVolume,
    getPlayingState,
    getAudioState
}; 