/**
 * @class BufferPool
 * @description Manages a pool of audio buffers for efficient memory usage
 */
export class BufferPool {
    constructor(options = {}) {
        this.poolSize = options.poolSize || 10;
        this.bufferSize = options.bufferSize || 4096;
        this.channels = options.channels || 2;
        this.sampleRate = options.sampleRate || 44100;
        this.pool = new Map();
        this.available = new Set();
        this.initialized = false;
    }

    /**
     * Initialize the buffer pool
     * @returns {boolean} Success status
     */
    initialize() {
        if (this.initialized) return true;

        try {
            for (let i = 0; i < this.poolSize; i++) {
                const buffer = this.createBuffer();
                this.pool.set(i, buffer);
                this.available.add(i);
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize buffer pool:', error);
            return false;
        }
    }

    /**
     * Create a new audio buffer
     * @returns {AudioBuffer} The created buffer
     */
    createBuffer() {
        const buffer = new AudioBuffer({
            length: this.bufferSize,
            numberOfChannels: this.channels,
            sampleRate: this.sampleRate
        });
        return buffer;
    }

    /**
     * Acquire a buffer from the pool
     * @returns {AudioBuffer|null} The acquired buffer or null if none available
     */
    acquire() {
        if (!this.initialized) {
            if (!this.initialize()) return null;
        }

        if (this.available.size === 0) {
            console.warn('Buffer pool exhausted');
            return null;
        }

        const index = this.available.values().next().value;
        this.available.delete(index);
        return this.pool.get(index);
    }

    /**
     * Release a buffer back to the pool
     * @param {AudioBuffer} buffer - The buffer to release
     */
    release(buffer) {
        if (!this.initialized) return;

        for (const [index, poolBuffer] of this.pool.entries()) {
            if (poolBuffer === buffer) {
                this.available.add(index);
                return;
            }
        }
    }

    /**
     * Clear all buffers in the pool
     */
    clear() {
        this.pool.clear();
        this.available.clear();
        this.initialized = false;
    }

    /**
     * Get the number of available buffers
     * @returns {number} Number of available buffers
     */
    getAvailableCount() {
        return this.available.size;
    }

    /**
     * Get the total pool size
     * @returns {number} Total pool size
     */
    getPoolSize() {
        return this.poolSize;
    }
}

// Export singleton instance
export const bufferPool = new BufferPool(); 