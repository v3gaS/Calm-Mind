import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generator for monaural beats
 */
export class MonauralGenerator extends BaseGenerator {
    constructor(audioCore) {
        super(audioCore);
        this.carrier = null;
        this.modulator = null;
        this.gainNode = null;
        this.carrierFreq = 440;    // Default carrier frequency
        this.beatFreq = 10;        // Default beat frequency
    }

    /**
     * Set the frequencies for monaural beat generation
     * @param {number} carrierFreq - Carrier frequency in Hz
     * @param {number} beatFreq - Beat frequency in Hz
     */
    setFrequencies(carrierFreq, beatFreq) {
        this.carrierFreq = carrierFreq;
        this.beatFreq = beatFreq;

        if (this.isPlaying) {
            // Update frequencies if already playing
            this.carrier.frequency.setValueAtTime(this.carrierFreq, this.context.currentTime);
            this.modulator.frequency.setValueAtTime(this.beatFreq, this.context.currentTime);
        }
    }

    /**
     * Initialize oscillators and gain for monaural beat
     * @protected
     */
    async _onStart() {
        // Create carrier oscillator
        this.carrier = this.context.createOscillator();
        this.carrier.frequency.setValueAtTime(this.carrierFreq, this.context.currentTime);

        // Create modulator oscillator
        this.modulator = this.context.createOscillator();
        this.modulator.frequency.setValueAtTime(this.beatFreq, this.context.currentTime);

        // Create gain node for amplitude modulation
        this.gainNode = this.context.createGain();
        this.gainNode.gain.setValueAtTime(0.5, this.context.currentTime); // Center the modulation

        // Connect modulator to gain node's gain parameter
        this.modulator.connect(this.gainNode.gain);

        // Connect carrier through the modulated gain to output
        this.carrier.connect(this.gainNode);
        this.gainNode.connect(this.output);

        // Start oscillators
        this.carrier.start();
        this.modulator.start();
    }

    /**
     * Stop and clean up oscillators
     * @protected
     */
    async _onStop() {
        if (this.carrier) {
            this.carrier.stop();
            this.carrier.disconnect();
            this.carrier = null;
        }
        if (this.modulator) {
            this.modulator.stop();
            this.modulator.disconnect();
            this.modulator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }

    /**
     * Set the modulation depth
     * @param {number} depth - Modulation depth between 0 and 1
     */
    setModulationDepth(depth) {
        if (this.gainNode) {
            const normalizedDepth = Math.max(0, Math.min(1, depth));
            this.gainNode.gain.setValueAtTime(normalizedDepth, this.context.currentTime);
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