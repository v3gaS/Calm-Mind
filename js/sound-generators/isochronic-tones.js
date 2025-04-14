/**
 * Isochronic Tones Generator Module
 * 
 * This module provides functions for generating isochronic tones.
 * 
 * @module IsochronicTones
 */

import { 
    getAudioContext, 
    createOscillator, 
    createGainNode, 
    connectToMaster 
} from '../core/audio-core.js';

/**
 * Generate isochronic tones based on stress level
 * @param {number} stressLevel - Stress level (1-10)
 * @param {number} duration - Duration in minutes
 * @returns {Object} Object containing audio nodes and cleanup function
 */
function generateIsochronicTones(stressLevel, duration = 10) {
    const audioContext = getAudioContext();
    if (!audioContext) {
        throw new Error('Audio context not initialized');
    }
    
    console.log('Generating isochronic tones with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
    // Calculate frequencies based on stress level
    const baseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 6; // Beta/Alpha range for focus/meditation
    const pulseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 5;
    
    // Create oscillator
    const osc = createOscillator('sine', baseFreq);
    
    // Create gain node for amplitude modulation
    const gainNode = createGainNode(0.8);
    
    // Connect oscillator to gain node
    osc.connect(gainNode);
    
    // Connect gain node to master
    gainNode.connect(audioContext.destination);
    
    // Start the oscillator
    osc.start();
    
    // Calculate duration in seconds
    const durationInSeconds = duration * 60;
    
    // Schedule stop
    osc.stop(audioContext.currentTime + durationInSeconds);
    
    // Create pulsing effect
    let isOn = true;
    const pulseInterval = 1000 / pulseFreq; // Time in ms for each pulse cycle
    
    // Create interval for pulsing
    const pulseTimer = setInterval(() => {
        if (!audioContext) {
            clearInterval(pulseTimer);
            return;
        }
        
        if (isOn) {
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime); // Higher "on" volume
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); // Faster fade
        } else {
            gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.8, audioContext.currentTime + 0.1); // Faster rise
        }
        isOn = !isOn;
    }, pulseInterval / 2);
    
    // Clear interval after duration
    setTimeout(() => clearInterval(pulseTimer), durationInSeconds * 1000);
    
    console.log('Isochronic tones scheduled to stop after', durationInSeconds, 'seconds');
    
    // Return nodes and cleanup function
    return {
        nodes: [osc, gainNode],
        cleanup: function() {
            try {
                clearInterval(pulseTimer);
                osc.stop();
                osc.disconnect();
                gainNode.disconnect();
            } catch (e) {
                console.error('Error cleaning up isochronic tones:', e);
            }
        }
    };
}

/**
 * Get the recommended isochronic tone frequency for a given stress level
 * @param {number} stressLevel - Stress level (1-10)
 * @returns {Object} Object containing base frequency and pulse frequency
 */
function getRecommendedFrequencies(stressLevel) {
    // Map stress levels to frequencies
    const baseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 6;
    const pulseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 5;
    
    return {
        baseFreq,
        pulseFreq,
        description: getFrequencyDescription(baseFreq, pulseFreq)
    };
}

/**
 * Get a description of the frequency combination
 * @param {number} baseFreq - Base frequency in Hz
 * @param {number} pulseFreq - Pulse frequency in Hz
 * @returns {string} Description of the frequency combination
 */
function getFrequencyDescription(baseFreq, pulseFreq) {
    if (baseFreq === 10 && pulseFreq === 10) {
        return 'Beta waves (12-30 Hz) - Alertness, focus, active thinking';
    } else if (baseFreq === 8 && pulseFreq === 8) {
        return 'Alpha waves (8-12 Hz) - Relaxation, calmness, creativity';
    } else if (baseFreq === 6 && pulseFreq === 5) {
        return 'Theta waves (4-8 Hz) - Deep relaxation, meditation, creativity';
    } else {
        return `Custom frequency (${baseFreq} Hz with ${pulseFreq} Hz pulse)`;
    }
}

// Export the module
export {
    generateIsochronicTones,
    getRecommendedFrequencies,
    getFrequencyDescription
}; 