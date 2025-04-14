import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generator for binaural beats
 */
export class BinauralGenerator extends BaseGenerator {
    constructor(audioCore) {
        super(audioCore);
        this.leftOsc = null;
        this.rightOsc = null;
        this.leftGain = null;
        this.rightGain = null;
        this.baseFrequency = 440; // Default base frequency
        this.beatFrequency = 10;  // Default beat frequency
    }

    /**
     * Set the frequencies for binaural beat generation
     * @param {number} baseFreq - Base carrier frequency
     * @param {number} beatFreq - Desired beat frequency
     */
    setFrequencies(baseFreq, beatFreq) {
        this.baseFrequency = baseFreq;
        this.beatFrequency = beatFreq;
        
        if (this.isPlaying) {
            // Update frequencies if already playing
            this.leftOsc.frequency.setValueAtTime(this.baseFrequency, this.context.currentTime);
            this.rightOsc.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, this.context.currentTime);
        }
    }

    /**
     * Create stereo panner for spatial separation
     * @private
     */
    _createStereoPanner() {
        const merger = this.context.createChannelMerger(2);
        
        this.leftGain = this.context.createGain();
        this.rightGain = this.context.createGain();
        
        this.leftGain.connect(merger, 0, 0);  // Connect to left channel
        this.rightGain.connect(merger, 0, 1);  // Connect to right channel
        
        merger.connect(this.output);
    }

    /**
     * Initialize oscillators and gains
     * @protected
     */
    async _onStart() {
        // Create oscillators
        this.leftOsc = this.context.createOscillator();
        this.rightOsc = this.context.createOscillator();
        
        // Set frequencies
        this.leftOsc.frequency.setValueAtTime(this.baseFrequency, this.context.currentTime);
        this.rightOsc.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, this.context.currentTime);
        
        // Create and set up stereo separation
        this._createStereoPanner();
        
        // Connect oscillators to their respective gains
        this.leftOsc.connect(this.leftGain);
        this.rightOsc.connect(this.rightGain);
        
        // Start oscillators
        this.leftOsc.start();
        this.rightOsc.start();
    }

    /**
     * Clean up oscillators and gains
     * @protected
     */
    async _onStop() {
        // Stop oscillators
        if (this.leftOsc) {
            this.leftOsc.stop();
            this.leftOsc.disconnect();
        }
        if (this.rightOsc) {
            this.rightOsc.stop();
            this.rightOsc.disconnect();
        }
        
        // Disconnect gains
        if (this.leftGain) {
            this.leftGain.disconnect();
        }
        if (this.rightGain) {
            this.rightGain.disconnect();
        }
        
        // Clear references
        this.leftOsc = null;
        this.rightOsc = null;
        this.leftGain = null;
        this.rightGain = null;
    }

    /**
     * Clean up all resources
     */
    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        super.dispose();
    }
} 