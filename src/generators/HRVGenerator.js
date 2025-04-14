import { BaseGenerator } from './BaseGenerator.js';

export class HRVGenerator extends BaseGenerator {
    constructor(options = {}) {
        super(options);
        this.type = 'HRV';
        this.defaultOptions = {
            baseFrequency: 0.1, // 0.1 Hz - typical HRV breathing rate
            amplitude: 0.5,
            modulationDepth: 0.3,
            modulationRate: 0.05 // 0.05 Hz - slow modulation for HRV
        };
        this.options = { ...this.defaultOptions, ...options };
    }

    async initialize() {
        await super.initialize();
        
        // Create audio nodes
        this.carrierOsc = this.audioContext.createOscillator();
        this.modOsc = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        this.modGain = this.audioContext.createGain();

        // Configure carrier oscillator
        this.carrierOsc.type = 'sine';
        this.carrierOsc.frequency.value = this.options.baseFrequency;

        // Configure modulation oscillator
        this.modOsc.type = 'sine';
        this.modOsc.frequency.value = this.options.modulationRate;
        
        // Configure gains
        this.gainNode.gain.value = this.options.amplitude;
        this.modGain.gain.value = this.options.modulationDepth;

        // Connect modulation
        this.modOsc.connect(this.modGain);
        this.modGain.connect(this.carrierOsc.frequency);
        
        // Connect carrier to output
        this.carrierOsc.connect(this.gainNode);
        this.gainNode.connect(this.output);
    }

    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        this.carrierOsc.start();
        this.modOsc.start();
        this.isPlaying = true;
    }

    async stop() {
        if (this.carrierOsc) {
            this.carrierOsc.stop();
        }
        if (this.modOsc) {
            this.modOsc.stop();
        }
        this.isPlaying = false;
    }

    setBaseFrequency(frequency) {
        this.options.baseFrequency = frequency;
        if (this.carrierOsc) {
            this.carrierOsc.frequency.value = frequency;
        }
    }

    setModulationRate(rate) {
        this.options.modulationRate = rate;
        if (this.modOsc) {
            this.modOsc.frequency.value = rate;
        }
    }

    setModulationDepth(depth) {
        this.options.modulationDepth = depth;
        if (this.modGain) {
            this.modGain.gain.value = depth;
        }
    }

    setAmplitude(amplitude) {
        this.options.amplitude = amplitude;
        if (this.gainNode) {
            this.gainNode.gain.value = amplitude;
        }
    }

    dispose() {
        if (this.carrierOsc) {
            this.carrierOsc.disconnect();
        }
        if (this.modOsc) {
            this.modOsc.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.modGain) {
            this.modGain.disconnect();
        }
        super.dispose();
    }
} 