/**
 * Pink Noise Generator Module
 * 
 * This module provides functions for generating pink noise.
 * 
 * @module PinkNoise
 */

import { 
    getAudioContext, 
    connectToMaster 
} from '../core/audio-core.js';
import { createPinkNoiseBuffer, createBufferSource } from '../utils/audio-utils.js';

/**
 * Generate pink noise
 * @param {number} duration - Duration in minutes
 * @returns {Object} Object containing audio nodes and cleanup function
 */
function generatePinkNoise(duration = 10) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    console.log('Generating pink noise with duration:', duration, 'minutes');
    
    // Create pink noise buffer
    const noiseBuffer = createPinkNoiseBuffer();
    
    // Create buffer source
    const noiseSource = createBufferSource(noiseBuffer, true);
    
    // Connect to master
    noiseSource.connect(audioContext.destination);
    
    // Start the source
    noiseSource.start();
    
    // Calculate duration in seconds
    const durationInSeconds = duration * 60;
    
    // Schedule stop
    noiseSource.stop(audioContext.currentTime + durationInSeconds);
    
    console.log('Pink noise scheduled to stop after', durationInSeconds, 'seconds');
    
    // Return nodes and cleanup function
    return {
        nodes: [noiseSource],
        cleanup: function() {
            try {
                noiseSource.stop();
                noiseSource.disconnect();
            } catch (e) {
                console.error('Error cleaning up pink noise:', e);
            }
        }
    };
}

/**
 * Get a description of pink noise
 * @returns {string} Description of pink noise
 */
function getDescription() {
    return 'Pink Noise - Even distribution of frequencies, natural sound, good for sleep and masking background noise';
}

// Export the module
export {
    generatePinkNoise,
    getDescription
}; 