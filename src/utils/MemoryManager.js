/**
 * MemoryManager.js
 * Utilities for memory management and optimization
 */

/**
 * Buffer pool for reusing AudioBuffer objects
 */
export class BufferPool {
  /**
   * Create a buffer pool
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {Object} options - Configuration options
   * @param {number} options.initialSize - Initial number of buffers to create
   * @param {number} options.maxSize - Maximum number of buffers in the pool
   * @param {number[]} options.durations - Array of buffer durations in seconds
   * @param {number} options.channels - Number of channels for buffers
   */
  constructor(audioContext, options = {}) {
    this.audioContext = audioContext;
    this.options = {
      initialSize: options.initialSize || 5,
      maxSize: options.maxSize || 20,
      durations: options.durations || [1, 5, 10, 30, 60],
      channels: options.channels || 2
    };
    
    // Create pools for each duration
    this.pools = {};
    this.stats = {
      created: 0,
      reused: 0,
      returned: 0
    };
    
    this._initialize();
  }

  /**
   * Initialize buffer pools
   * @private
   */
  _initialize() {
    this.options.durations.forEach(duration => {
      this.pools[duration] = {
        available: [],
        inUse: new Set()
      };
      
      // Pre-create initial buffers
      for (let i = 0; i < this.options.initialSize; i++) {
        const buffer = this._createBuffer(duration);
        this.pools[duration].available.push(buffer);
        this.stats.created++;
      }
    });
  }

  /**
   * Create a new AudioBuffer
   * @param {number} duration - Duration in seconds
   * @returns {AudioBuffer} New audio buffer
   * @private
   */
  _createBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(duration * sampleRate);
    return this.audioContext.createBuffer(
      this.options.channels,
      length,
      sampleRate
    );
  }

  /**
   * Get the closest available duration
   * @param {number} requestedDuration - Requested duration in seconds
   * @returns {number} Closest available duration
   * @private
   */
  _getClosestDuration(requestedDuration) {
    return this.options.durations.reduce((prev, curr) => {
      return (Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration)) 
        ? curr 
        : prev;
    });
  }

  /**
   * Get a buffer from the pool
   * @param {number} duration - Requested duration in seconds
   * @returns {AudioBuffer} Audio buffer
   */
  getBuffer(duration) {
    const closestDuration = this._getClosestDuration(duration);
    const pool = this.pools[closestDuration];
    
    // If there's an available buffer, use it
    if (pool.available.length > 0) {
      const buffer = pool.available.pop();
      pool.inUse.add(buffer);
      this.stats.reused++;
      return buffer;
    }
    
    // If we've reached max size, clear one buffer
    if (pool.inUse.size >= this.options.maxSize) {
      console.warn(`Buffer pool for duration ${closestDuration}s is at capacity. Creating new buffer anyway.`);
    }
    
    // Create a new buffer
    const buffer = this._createBuffer(closestDuration);
    pool.inUse.add(buffer);
    this.stats.created++;
    return buffer;
  }

  /**
   * Return a buffer to the pool
   * @param {AudioBuffer} buffer - Buffer to return
   * @returns {boolean} Whether the buffer was returned successfully
   */
  returnBuffer(buffer) {
    // Find which pool this buffer belongs to
    for (const duration of this.options.durations) {
      const pool = this.pools[duration];
      
      if (pool.inUse.has(buffer)) {
        pool.inUse.delete(buffer);
        
        // Clear the buffer data
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          channelData.fill(0);
        }
        
        pool.available.push(buffer);
        this.stats.returned++;
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get statistics about buffer usage
   * @returns {Object} Statistics object
   */
  getStats() {
    const pools = {};
    
    for (const duration of this.options.durations) {
      pools[duration] = {
        available: this.pools[duration].available.length,
        inUse: this.pools[duration].inUse.size
      };
    }
    
    return {
      ...this.stats,
      pools
    };
  }

  /**
   * Clear all unused buffers
   */
  clearUnused() {
    for (const duration of this.options.durations) {
      this.pools[duration].available = [];
    }
  }

  /**
   * Reset the pool
   */
  reset() {
    for (const duration of this.options.durations) {
      const pool = this.pools[duration];
      pool.available = [...pool.available, ...pool.inUse];
      pool.inUse = new Set();
    }
    
    this.stats.returned += this.stats.reused - this.stats.returned;
  }
}

/**
 * WorkerPool for offloading heavy computation to Web Workers
 */
export class WorkerPool {
  /**
   * Create a worker pool
   * @param {string} workerScript - Path to worker script
   * @param {Object} options - Configuration options
   * @param {number} options.size - Number of workers to create
   * @param {Object} options.initMessage - Initial message to send to workers
   */
  constructor(workerScript, options = {}) {
    this.workerScript = workerScript;
    this.options = {
      size: options.size || navigator.hardwareConcurrency || 4,
      initMessage: options.initMessage || null
    };
    
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the worker pool
   * @returns {Promise} Promise that resolves when all workers are initialized
   */
  async initialize() {
    if (this.isInitialized) return Promise.resolve();
    
    const initPromises = [];
    
    for (let i = 0; i < this.options.size; i++) {
      const worker = new Worker(this.workerScript, { type: 'module' });
      this.workers.push(worker);
      
      const initPromise = new Promise((resolve) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'initialized') {
            // Replace the onmessage handler
            worker.onmessage = null;
            this.availableWorkers.push({
              worker,
              taskId: null
            });
            resolve();
          }
        };
      });
      
      initPromises.push(initPromise);
      
      // Send init message if provided
      if (this.options.initMessage) {
        worker.postMessage({
          type: 'init',
          data: this.options.initMessage
        });
      }
    }
    
    await Promise.all(initPromises);
    this.isInitialized = true;
    
    // Process any queued tasks
    this._processQueue();
    
    return Promise.resolve();
  }

  /**
   * Process next task in the queue
   * @private
   */
  _processQueue() {
    // If no available workers or no tasks, return
    if (this.availableWorkers.length === 0 || this.taskQueue.length === 0) {
      return;
    }
    
    // Get next worker and task
    const workerInfo = this.availableWorkers.shift();
    const { task, resolve, reject } = this.taskQueue.shift();
    workerInfo.taskId = task.id;
    
    // Set up message handler for this task
    workerInfo.worker.onmessage = (e) => {
      if (e.data.id === task.id) {
        // Task completed
        workerInfo.taskId = null;
        this.availableWorkers.push(workerInfo);
        
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.result);
        }
        
        // Process next task
        this._processQueue();
      }
    };
    
    // Set up error handler
    workerInfo.worker.onerror = (err) => {
      workerInfo.taskId = null;
      this.availableWorkers.push(workerInfo);
      reject(err);
      this._processQueue();
    };
    
    // Send the task to the worker
    workerInfo.worker.postMessage(task);
  }

  /**
   * Execute a task on a worker
   * @param {string} type - Task type
   * @param {Object} data - Task data
   * @returns {Promise} Promise that resolves with the task result
   */
  executeTask(type, data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data
      };
      
      this.taskQueue.push({ task, resolve, reject });
      
      // If pool is initialized, attempt to process the queue
      if (this.isInitialized) {
        this._processQueue();
      } else {
        // Otherwise initialize the pool first
        this.initialize().then(() => this._processQueue());
      }
    });
  }

  /**
   * Terminate all workers
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.isInitialized = false;
  }
}

/**
 * Exports
 */
export default {
  BufferPool,
  WorkerPool
}; 