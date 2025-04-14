/**
 * Base class for audio effects
 */
export class AudioEffect {
    constructor(audioContext) {
        this.context = audioContext;
        this.input = this.context.createGain();
        this.output = this.context.createGain();
        this.wet = this.context.createGain();
        this.dry = this.context.createGain();
        this.mix = 1.0; // Default to 100% wet

        // Set up routing
        this.input.connect(this.dry);
        this.dry.connect(this.output);
        this.wet.connect(this.output);

        this.updateMix();
    }

    /**
     * Set wet/dry mix
     * @param {number} value - Mix value between 0 (dry) and 1 (wet)
     */
    setMix(value) {
        this.mix = Math.max(0, Math.min(1, value));
        this.updateMix();
    }

    /**
     * Update the wet/dry mix levels
     * @protected
     */
    updateMix() {
        this.wet.gain.setValueAtTime(this.mix, this.context.currentTime);
        this.dry.gain.setValueAtTime(1 - this.mix, this.context.currentTime);
    }

    /**
     * Connect the effect to an audio node
     * @param {AudioNode} node - The node to connect to
     */
    connect(node) {
        this.output.connect(node);
    }

    /**
     * Disconnect the effect
     */
    disconnect() {
        this.output.disconnect();
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.disconnect();
        this.input.disconnect();
        this.output.disconnect();
        this.wet.disconnect();
        this.dry.disconnect();
    }
} 