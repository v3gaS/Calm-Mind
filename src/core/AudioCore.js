/**
 * Core audio functionality handling Web Audio API context and basic operations
 */
export class AudioCore {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.initialized = false;
        this.nodes = new Map();
    }

    /**
     * Initialize the audio context and master gain
     */
    async initialize() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.initialized = true;
            
            // Resume context if in suspended state
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
        } catch (error) {
            console.error('Failed to initialize AudioCore:', error);
            throw new Error('Audio system initialization failed');
        }
    }

    /**
     * Get the current audio context
     */
    getContext() {
        if (!this.initialized) {
            throw new Error('AudioCore not initialized');
        }
        return this.context;
    }

    /**
     * Set master volume
     * @param {number} value - Volume value between 0 and 1
     */
    setMasterVolume(value) {
        if (!this.initialized) {
            throw new Error('AudioCore not initialized');
        }
        this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }

    /**
     * Create and register a new audio node
     * @param {string} nodeId - Unique identifier for the node
     * @param {AudioNode} node - The audio node to register
     */
    registerNode(nodeId, node) {
        if (!this.initialized) {
            throw new Error('AudioCore not initialized');
        }
        this.nodes.set(nodeId, node);
        return node;
    }

    /**
     * Remove and disconnect an audio node
     * @param {string} nodeId - ID of the node to remove
     */
    removeNode(nodeId) {
        if (this.nodes.has(nodeId)) {
            const node = this.nodes.get(nodeId);
            node.disconnect();
            this.nodes.delete(nodeId);
        }
    }

    /**
     * Clean up all resources
     */
    dispose() {
        if (this.initialized) {
            this.nodes.forEach(node => {
                node.disconnect();
            });
            this.nodes.clear();
            this.masterGain.disconnect();
            this.context.close();
            this.initialized = false;
        }
    }
} 