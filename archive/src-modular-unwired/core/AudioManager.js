import { AudioCore } from './AudioCore.js';
import { BinauralGenerator } from '../generators/BinauralGenerator.js';
import { SolfeggioGenerator } from '../generators/SolfeggioGenerator.js';
import { MonauralGenerator } from '../generators/MonauralGenerator.js';

/**
 * High-level manager for audio generation and control
 */
export class AudioManager {
    constructor() {
        this.audioCore = new AudioCore();
        this.generators = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the audio system
     */
    async initialize() {
        if (!this.initialized) {
            await this.audioCore.initialize();
            this.initialized = true;
        }
    }

    /**
     * Create a new generator instance
     * @param {string} type - Generator type ('binaural', 'solfeggio', 'monaural')
     * @param {string} id - Unique identifier for the generator
     * @returns {BaseGenerator} The created generator instance
     */
    createGenerator(type, id) {
        if (!this.initialized) {
            throw new Error('AudioManager not initialized');
        }

        if (this.generators.has(id)) {
            throw new Error(`Generator with ID ${id} already exists`);
        }

        let generator;
        switch (type.toLowerCase()) {
            case 'binaural':
                generator = new BinauralGenerator(this.audioCore);
                break;
            case 'solfeggio':
                generator = new SolfeggioGenerator(this.audioCore);
                break;
            case 'monaural':
                generator = new MonauralGenerator(this.audioCore);
                break;
            default:
                throw new Error(`Unknown generator type: ${type}`);
        }

        this.generators.set(id, generator);
        return generator;
    }

    /**
     * Get a generator by ID
     * @param {string} id - Generator identifier
     * @returns {BaseGenerator} The generator instance
     */
    getGenerator(id) {
        if (!this.generators.has(id)) {
            throw new Error(`Generator with ID ${id} not found`);
        }
        return this.generators.get(id);
    }

    /**
     * Remove a generator
     * @param {string} id - Generator identifier
     */
    removeGenerator(id) {
        if (this.generators.has(id)) {
            const generator = this.generators.get(id);
            generator.dispose();
            this.generators.delete(id);
        }
    }

    /**
     * Set master volume
     * @param {number} value - Volume between 0 and 1
     */
    setMasterVolume(value) {
        this.audioCore.setMasterVolume(value);
    }

    /**
     * Create a therapeutic session with multiple generators
     * @param {Object} config - Session configuration
     * @returns {Object} Session control object
     */
    async createTherapeuticSession(config) {
        const session = {
            generators: new Map(),
            start: async () => {
                for (const [id, generator] of session.generators) {
                    await generator.start();
                }
            },
            stop: async () => {
                for (const [id, generator] of session.generators) {
                    await generator.stop();
                }
            },
            dispose: () => {
                for (const [id, generator] of session.generators) {
                    this.removeGenerator(id);
                }
                session.generators.clear();
            }
        };

        // Create generators based on config
        if (config.binaural) {
            const gen = this.createGenerator('binaural', `binaural_${Date.now()}`);
            gen.setFrequencies(config.binaural.carrier, config.binaural.beat);
            session.generators.set('binaural', gen);
        }

        if (config.solfeggio) {
            const gen = this.createGenerator('solfeggio', `solfeggio_${Date.now()}`);
            gen.setFrequency(config.solfeggio.frequency);
            session.generators.set('solfeggio', gen);
        }

        if (config.monaural) {
            const gen = this.createGenerator('monaural', `monaural_${Date.now()}`);
            gen.setFrequencies(config.monaural.carrier, config.monaural.beat);
            session.generators.set('monaural', gen);
        }

        return session;
    }

    /**
     * Clean up all resources
     */
    dispose() {
        for (const [id, generator] of this.generators) {
            generator.dispose();
        }
        this.generators.clear();
        this.audioCore.dispose();
        this.initialized = false;
    }
} 