/**
 * @class AudioContextManager
 * @description Manages the Web Audio API context and provides a singleton instance
 */
class AudioContextManager {
    constructor() {
        if (AudioContextManager.instance) {
            return AudioContextManager.instance;
        }
        
        this.context = null;
        this.masterGain = null;
        this.analyser = null;
        this.isInitialized = false;
        this.bufferPool = new AudioBufferPool();
        
        AudioContextManager.instance = this;
    }
    
    /**
     * Initialize the audio context with error handling
     * @returns {boolean} Success status
     */
    initialize() {
        try {
            if (this.isInitialized) return true;
            
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.5;
            
            // Create analyzer with optimal settings
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 512;
            this.masterGain.connect(this.analyser);
            
            this.isInitialized = true;
            console.log("Audio context initialized successfully");
            return true;
        } catch (error) {
            console.error("Failed to initialize audio context:", error);
            this.handleError(error);
            return false;
        }
    }
    
    /**
     * Handle audio context errors
     * @param {Error} error - The error to handle
     */
    handleError(error) {
        // Log error details
        console.error("Audio Context Error:", {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Attempt recovery
        this.attemptRecovery();
    }
    
    /**
     * Attempt to recover from audio context errors
     */
    attemptRecovery() {
        try {
            if (this.context && this.context.state === 'suspended') {
                this.context.resume();
            }
        } catch (error) {
            console.error("Recovery attempt failed:", error);
        }
    }
    
    /**
     * Get the audio context instance
     * @returns {AudioContext|null}
     */
    getContext() {
        return this.context;
    }
    
    /**
     * Get the master gain node
     * @returns {GainNode|null}
     */
    getMasterGain() {
        return this.masterGain;
    }
    
    /**
     * Get the analyzer node
     * @returns {AnalyserNode|null}
     */
    getAnalyser() {
        return this.analyser;
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        if (this.context) {
            this.context.close();
        }
        this.isInitialized = false;
    }
}

/**
 * @class AudioBufferPool
 * @description Manages a pool of audio buffers for better performance
 */
class AudioBufferPool {
    constructor(size = 10) {
        this.pool = new Array(size);
        this.available = new Set();
        this.size = size;
    }
    
    /**
     * Acquire a buffer from the pool
     * @returns {AudioBuffer}
     */
    acquire() {
        if (this.available.size > 0) {
            const index = this.available.values().next().value;
            this.available.delete(index);
            return this.pool[index];
        }
        return null;
    }
    
    /**
     * Release a buffer back to the pool
     * @param {AudioBuffer} buffer
     */
    release(buffer) {
        const index = this.pool.indexOf(buffer);
        if (index !== -1) {
            this.available.add(index);
        }
    }
}

// Export singleton instance
export const audioContextManager = new AudioContextManager(); 