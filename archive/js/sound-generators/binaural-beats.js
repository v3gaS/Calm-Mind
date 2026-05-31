/**
 * Binaural Beats Generator Module
 * 
 * This module provides functions for generating binaural beats.
 * 
 * @module BinauralBeats
 */

import { 
    getAudioContext, 
    createOscillator, 
    createStereoPanner, 
    connectToMaster 
} from '../core/audio-core.js';

/**
 * Generate binaural beats based on stress level
 * @param {number} stressLevel - Stress level (1-10)
 * @param {number} duration - Duration in minutes
 * @returns {Object} Object containing audio nodes and cleanup function
 */
function generateBinauralBeats(stressLevel, duration = 10) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    console.log('Generating binaural beats with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
    // Calculate frequencies based on stress level
    const baseFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 4 : 2;
    const beatFreq = stressLevel <= 3 ? 0.5 : stressLevel <= 6 ? 0.3 : 0.1;
    
    // Create oscillators
    const osc1 = createOscillator('sine', baseFreq);
    const osc2 = createOscillator('sine', baseFreq + beatFreq);
    
    // Create stereo panners
    const leftPanner = createStereoPanner(-1); // Full left
    const rightPanner = createStereoPanner(1);  // Full right
    
    // Connect oscillators to panners
    osc1.connect(leftPanner);
    osc2.connect(rightPanner);
    
    // Connect panners to master
    leftPanner.connect(audioContext.destination);
    rightPanner.connect(audioContext.destination);
    
    // Start oscillators
    osc1.start();
    osc2.start();
    
    // Calculate duration in seconds
    const durationInSeconds = duration * 60;
    
    // Schedule stop
    osc1.stop(audioContext.currentTime + durationInSeconds);
    osc2.stop(audioContext.currentTime + durationInSeconds);
    
    console.log('Binaural beats scheduled to stop after', durationInSeconds, 'seconds');
    
    // Return nodes and cleanup function
    return {
        nodes: [osc1, osc2, leftPanner, rightPanner],
        cleanup: function() {
            try {
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
                leftPanner.disconnect();
                rightPanner.disconnect();
            } catch (e) {
                console.error('Error cleaning up binaural beats:', e);
            }
        }
    };
}

/**
 * Get the recommended binaural beat frequency for a given stress level
 * @param {number} stressLevel - Stress level (1-10)
 * @returns {Object} Object containing base frequency and beat frequency
 */
function getRecommendedFrequencies(stressLevel) {
    // Map stress levels to frequencies
    const baseFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 4 : 2;
    const beatFreq = stressLevel <= 3 ? 0.5 : stressLevel <= 6 ? 0.3 : 0.1;
    
    return {
        baseFreq,
        beatFreq,
        description: getFrequencyDescription(baseFreq, beatFreq)
    };
}

/**
 * Get a description of the frequency combination
 * @param {number} baseFreq - Base frequency in Hz
 * @param {number} beatFreq - Beat frequency in Hz
 * @returns {string} Description of the frequency combination
 */
function getFrequencyDescription(baseFreq, beatFreq) {
    if (baseFreq === 8 && beatFreq === 0.5) {
        return 'Theta waves (4-8 Hz) - Deep relaxation, meditation, creativity';
    } else if (baseFreq === 4 && beatFreq === 0.3) {
        return 'Delta waves (0.5-4 Hz) - Deep sleep, physical healing, immune system';
    } else if (baseFreq === 2 && beatFreq === 0.1) {
        return 'Sub-delta waves (< 0.5 Hz) - Profound relaxation, near-sleep state';
    } else {
        return `Custom frequency (${baseFreq} Hz with ${beatFreq} Hz beat)`;
    }
}

// Export the module
export {
    generateBinauralBeats,
    getRecommendedFrequencies,
    getFrequencyDescription
}; 