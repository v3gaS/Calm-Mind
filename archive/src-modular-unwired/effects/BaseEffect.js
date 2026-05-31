/**
 * Base class for graph-style effects used by EnhancedAudioManager.
 * Subclasses implement initialize() to wire Web Audio nodes.
 */
export class BaseEffect {
    constructor(options = {}) {
        this.options = options;
        this.audioContext = null;
        this.input = null;
        this.output = null;
        this.initialized = false;
    }

    /**
     * @param {AudioContext} audioContext
     */
    async initialize(audioContext) {
        this.audioContext = audioContext;
        this.input = audioContext.createGain();
        this.output = audioContext.createGain();
        this.initialized = true;
    }

    dispose() {
        try {
            this.input?.disconnect();
            this.output?.disconnect();
        } catch {
            /* already disconnected */
        }
        this.initialized = false;
    }
}
