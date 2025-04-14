import { BaseEffect } from './BaseEffect.js';

export class FilterEffect extends BaseEffect {
    constructor(options = {}) {
        super(options);
        this.type = 'Filter';
        this.defaultOptions = {
            type: 'lowpass',
            frequency: 1000,
            Q: 1,
            gain: 0
        };
        this.options = { ...this.defaultOptions, ...options };
    }

    async initialize() {
        await super.initialize();
        
        // Create filter node
        this.filter = this.audioContext.createBiquadFilter();
        
        // Configure filter
        this.filter.type = this.options.type;
        this.filter.frequency.value = this.options.frequency;
        this.filter.Q.value = this.options.Q;
        this.filter.gain.value = this.options.gain;

        // Connect nodes
        this.input.connect(this.filter);
        this.filter.connect(this.output);
    }

    setType(type) {
        this.options.type = type;
        if (this.filter) {
            this.filter.type = type;
        }
    }

    setFrequency(frequency) {
        this.options.frequency = frequency;
        if (this.filter) {
            this.filter.frequency.value = frequency;
        }
    }

    setQ(Q) {
        this.options.Q = Q;
        if (this.filter) {
            this.filter.Q.value = Q;
        }
    }

    setGain(gain) {
        this.options.gain = gain;
        if (this.filter) {
            this.filter.gain.value = gain;
        }
    }

    // Convenience methods for common filter types
    setLowpass(frequency, Q = 1) {
        this.setType('lowpass');
        this.setFrequency(frequency);
        this.setQ(Q);
    }

    setHighpass(frequency, Q = 1) {
        this.setType('highpass');
        this.setFrequency(frequency);
        this.setQ(Q);
    }

    setBandpass(frequency, Q = 1) {
        this.setType('bandpass');
        this.setFrequency(frequency);
        this.setQ(Q);
    }

    setNotch(frequency, Q = 1) {
        this.setType('notch');
        this.setFrequency(frequency);
        this.setQ(Q);
    }

    setPeaking(frequency, Q = 1, gain = 0) {
        this.setType('peaking');
        this.setFrequency(frequency);
        this.setQ(Q);
        this.setGain(gain);
    }

    setLowshelf(frequency, gain = 0) {
        this.setType('lowshelf');
        this.setFrequency(frequency);
        this.setGain(gain);
    }

    setHighshelf(frequency, gain = 0) {
        this.setType('highshelf');
        this.setFrequency(frequency);
        this.setGain(gain);
    }

    dispose() {
        if (this.filter) {
            this.filter.disconnect();
        }
        super.dispose();
    }
} 