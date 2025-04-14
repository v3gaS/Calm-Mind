import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generator for isochronic tones
 */
export class IsochronicGenerator extends BaseGenerator {
    constructor(audioCore) {
        super(audioCore);
        this.oscillator = null;
        this.gainNode = null;
        this.lfoNode = null;
        this.carrierFreq = 440;    // Default carrier frequency
        this.pulseFreq = 10;       // Default pulse frequency
        this.pulseWidth = 0.5;     // Default pulse width (duty cycle)
    }

    /**
     * Set the frequencies for isochronic tone generation
     * @param {number} carrierFreq - Carrier frequency in Hz
     * @param {number} pulseFreq - Pulse frequency in Hz
     */
    setFrequencies(carrierFreq, pulseFreq) {
        this.carrierFreq = carrierFreq;
        this.pulseFreq = pulseFreq;

        if (this.isPlaying) {
            this.oscillator.frequency.setValueAtTime(this.carrierFreq, this.context.currentTime);
            this._updatePulseRate();
        }
    }

    /**
     * Set pulse width (duty cycle)
     * @param {number} width - Pulse width between 0 and 1
     */
    setPulseWidth(width) {
        this.pulseWidth = Math.max(0.1, Math.min(0.9, width));
        if (this.isPlaying) {
            this._updatePulseRate();
        }
    }

    /**
     * Update the pulse rate of the LFO
     * @private
     */
    _updatePulseRate() {
        const bufferSize = this.context.sampleRate / this.pulseFreq;
        const pulseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const channelData = pulseBuffer.getChannelData(0);

        // Create square wave with specified duty cycle
        for (let i = 0; i < bufferSize; i++) {
            const phase = (i / bufferSize) % 1;
            channelData[i] = phase < this.pulseWidth ? 1 : 0;
        }

        if (this.lfoNode) {
            this.lfoNode.disconnect();
        }

        this.lfoNode = this.context.createBufferSource();
        this.lfoNode.buffer = pulseBuffer;
        this.lfoNode.loop = true;
        this.lfoNode.connect(this.gainNode.gain);
        this.lfoNode.start();
    }

    /**
     * Initialize oscillator and gain for isochronic tone
     * @protected
     */
    async _onStart() {
        // Create carrier oscillator
        this.oscillator = this.context.createOscillator();
        this.oscillator.frequency.setValueAtTime(this.carrierFreq, this.context.currentTime);

        // Create gain node for amplitude modulation
        this.gainNode = this.context.createGain();
        
        // Connect oscillator through gain to output
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.output);

        // Create and start the pulse LFO
        this._updatePulseRate();

        // Start the carrier oscillator
        this.oscillator.start();
    }

    /**
     * Stop and clean up
     * @protected
     */
    async _onStop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.lfoNode) {
            this.lfoNode.stop();
            this.lfoNode.disconnect();
            this.lfoNode = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
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