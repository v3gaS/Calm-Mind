import { BaseGenerator } from './BaseGenerator.js';

export class EMDRGenerator extends BaseGenerator {
    constructor(options = {}) {
        super(options);
        this.type = 'EMDR';
        this.defaultOptions = {
            frequency: 1.5, // Hz - typical EMDR frequency
            amplitude: 0.5,
            panning: 1.0, // Full stereo width
            phase: 0
        };
        this.options = { ...this.defaultOptions, ...options };
    }

    async initialize() {
        await super.initialize();
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        this.stereoPanner = this.audioContext.createStereoPanner();

        // Configure nodes
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = this.options.frequency;
        this.gainNode.gain.value = this.options.amplitude;
        this.stereoPanner.pan.value = this.options.panning;

        // Connect nodes
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.stereoPanner);
        this.stereoPanner.connect(this.output);
    }

    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        this.oscillator.start();
        this.isPlaying = true;
    }

    async stop() {
        if (this.oscillator) {
            this.oscillator.stop();
        }
        this.isPlaying = false;
    }

    setFrequency(frequency) {
        this.options.frequency = frequency;
        if (this.oscillator) {
            this.oscillator.frequency.value = frequency;
        }
    }

    setAmplitude(amplitude) {
        this.options.amplitude = amplitude;
        if (this.gainNode) {
            this.gainNode.gain.value = amplitude;
        }
    }

    setPanning(panning) {
        this.options.panning = panning;
        if (this.stereoPanner) {
            this.stereoPanner.pan.value = panning;
        }
    }

    dispose() {
        if (this.oscillator) {
            this.oscillator.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.stereoPanner) {
            this.stereoPanner.disconnect();
        }
        super.dispose();
    }
} 