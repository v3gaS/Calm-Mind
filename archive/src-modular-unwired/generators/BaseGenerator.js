/**
 * Base class for all sound generators
 */
export class BaseGenerator {
    constructor(audioCore) {
        if (!audioCore) {
            throw new Error('AudioCore instance required');
        }
        this.audioCore = audioCore;
        this.context = audioCore.getContext();
        this.output = this.context.createGain();
        this.output.connect(audioCore.masterGain);
        this.isPlaying = false;
    }

    /**
     * Initialize the generator
     */
    async initialize() {
        // Override in subclasses
    }

    /**
     * Start sound generation
     */
    async start() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            await this._onStart();
        }
    }

    /**
     * Stop sound generation
     */
    async stop() {
        if (this.isPlaying) {
            await this._onStop();
            this.isPlaying = false;
        }
    }

    /**
     * Set output volume
     * @param {number} value - Volume between 0 and 1
     */
    setVolume(value) {
        this.output.gain.value = Math.max(0, Math.min(1, value));
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        this.output.disconnect();
    }

    /**
     * Override in subclasses to implement start behavior
     * @protected
     */
    async _onStart() {
        // Override in subclasses
    }

    /**
     * Override in subclasses to implement stop behavior
     * @protected
     */
    async _onStop() {
        // Override in subclasses
    }
} 