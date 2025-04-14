import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generator for Solfeggio frequencies
 */
export class SolfeggioGenerator extends BaseGenerator {
    constructor(audioCore) {
        super(audioCore);
        this.oscillator = null;
        this.frequency = 528; // Default to 528 Hz (transformation frequency)
        
        // Solfeggio frequencies and their purposes
        this.frequencies = {
            UT: 396,  // Liberating guilt and fear
            RE: 417,  // Undoing situations and facilitating change
            MI: 528,  // Transformation and miracles
            FA: 639,  // Connecting and relationships
            SOL: 741, // Awakening intuition
            LA: 852   // Returning to spiritual order
        };
    }

    /**
     * Set the Solfeggio frequency
     * @param {number|string} freq - Frequency in Hz or frequency name (UT, RE, etc.)
     */
    setFrequency(freq) {
        if (typeof freq === 'string') {
            if (this.frequencies[freq.toUpperCase()]) {
                this.frequency = this.frequencies[freq.toUpperCase()];
            } else {
                throw new Error('Invalid Solfeggio frequency name');
            }
        } else if (typeof freq === 'number') {
            this.frequency = freq;
        } else {
            throw new Error('Invalid frequency type');
        }

        if (this.isPlaying && this.oscillator) {
            this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime);
        }
    }

    /**
     * Get available Solfeggio frequencies
     * @returns {Object} Map of frequency names to values
     */
    getAvailableFrequencies() {
        return { ...this.frequencies };
    }

    /**
     * Initialize oscillator with smooth fade-in
     * @protected
     */
    async _onStart() {
        this.oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        // Set initial gain to 0 for fade-in
        gain.gain.setValueAtTime(0, this.context.currentTime);
        
        // Set frequency
        this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime);
        
        // Connect nodes
        this.oscillator.connect(gain);
        gain.connect(this.output);
        
        // Start oscillator
        this.oscillator.start();
        
        // Fade in over 0.5 seconds
        gain.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.5);
    }

    /**
     * Stop oscillator with smooth fade-out
     * @protected
     */
    async _onStop() {
        if (this.oscillator) {
            // Get the oscillator's gain node
            const gain = this.oscillator.connect(this.context.createGain());
            
            // Fade out over 0.5 seconds
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.5);
            
            // Schedule oscillator stop after fade-out
            setTimeout(() => {
                this.oscillator.stop();
                this.oscillator.disconnect();
                this.oscillator = null;
            }, 500);
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        super.dispose();
    }
} 