/**
 * EnhancedAudioCore.js
 * Core audio functionality with advanced memory management and error handling
 */

import { BufferPool } from '../utils/MemoryManager.js';
import { AudioSystemError, AudioContextError, defaultHandler } from '../utils/ErrorHandler.js';
import { AudioAnalyzer } from '../utils/AudioAnalyzer.js';

/**
 * Enhanced Audio Core with advanced features and optimizations
 */
export class EnhancedAudioCore {
  /**
   * Create an EnhancedAudioCore instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      sampleRate: options.sampleRate || 44100,
      latencyHint: options.latencyHint || 'interactive',
      channelCount: options.channelCount || 2,
      autoGainControl: options.autoGainControl || false,
      bufferPoolSize: options.bufferPoolSize || 10,
      bufferDurations: options.bufferDurations || [1, 5, 10, 30, 60],
      errorHandler: options.errorHandler || defaultHandler
    };
    
    this.context = null;
    this.masterGain = null;
    this.masterCompressor = null;
    this.masterAnalyzer = null;
    this.bufferPool = null;
    this.nodes = new Map();
    this.nodeGroups = new Map();
    this.initialized = false;
    this.errorHandler = this.options.errorHandler;
    this.resumeAttempts = 0;
    
    // Processing nodes
    this.processingChain = null;
    
    // Metrics tracking
    this.metrics = {
      nodeCount: 0,
      activeGenerators: 0,
      peakNodeCount: 0,
      resumeAttempts: 0,
      contextResets: 0,
      lastActivityTime: Date.now()
    };
  }

  /**
   * Initialize the audio context and master processing chain
   * @returns {Promise<EnhancedAudioCore>} This instance
   * @throws {AudioContextError} If initialization fails
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }
    
    try {
      // Create audio context with specified options
      const contextOptions = {
        latencyHint: this.options.latencyHint,
        sampleRate: this.options.sampleRate
      };
      
      this.context = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
      
      // Set up master processing chain
      this._createMasterChain();
      
      // Set up buffer pool for efficient memory usage
      this.bufferPool = new BufferPool(this.context, {
        initialSize: this.options.bufferPoolSize,
        maxSize: this.options.bufferPoolSize * 2,
        durations: this.options.bufferDurations,
        channels: this.options.channelCount
      });
      
      // Resume context if suspended
      if (this.context.state === 'suspended') {
        await this._resumeContext();
      }
      
      this.initialized = true;
      this.metrics.lastActivityTime = Date.now();
      
      return this;
    } catch (error) {
      const enhancedError = new AudioContextError(
        'Failed to initialize audio context',
        { originalError: error.message }
      );
      this.errorHandler.handleError(enhancedError, { component: 'EnhancedAudioCore' });
      throw enhancedError;
    }
  }

  /**
   * Create the master processing chain
   * @private
   */
  _createMasterChain() {
    // Create master gain node
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8; // Start with 80% volume
    
    // Create dynamics compressor for limiting
    this.masterCompressor = this.context.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -12; // in dB
    this.masterCompressor.knee.value = 12;       // in dB
    this.masterCompressor.ratio.value = 4;       // compression ratio
    this.masterCompressor.attack.value = 0.005;  // in seconds
    this.masterCompressor.release.value = 0.1;   // in seconds
    
    // Create analyzer for monitoring
    this.masterAnalyzer = new AudioAnalyzer(this.context);
    
    // Connect the processing chain
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.context.destination);
    this.masterAnalyzer.connect(this.masterCompressor);
    
    // Store processing chain reference for easier management
    this.processingChain = {
      gain: this.masterGain,
      compressor: this.masterCompressor,
      analyzer: this.masterAnalyzer.analyzer
    };
  }

  /**
   * Resume the audio context
   * @private
   * @returns {Promise<void>}
   */
  async _resumeContext() {
    if (this.context.state === 'running') {
      return;
    }
    
    this.resumeAttempts++;
    this.metrics.resumeAttempts++;
    
    try {
      await this.context.resume();
    } catch (error) {
      if (this.resumeAttempts < 3) {
        // Add a slight delay and try again
        await new Promise(resolve => setTimeout(resolve, 100));
        return this._resumeContext();
      } else {
        const enhancedError = new AudioContextError(
          'Failed to resume audio context after multiple attempts',
          { attempts: this.resumeAttempts }
        );
        this.errorHandler.handleError(enhancedError, { component: 'EnhancedAudioCore' });
        throw enhancedError;
      }
    }
  }

  /**
   * Reset the context in case of severe issues
   * @returns {Promise<boolean>} Success status
   */
  async resetContext() {
    try {
      // Disconnect all nodes
      this.nodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      });
      
      // Close current context
      await this.context.close();
      
      // Clear all maps
      this.nodes.clear();
      this.nodeGroups.clear();
      
      // Reset metrics
      this.metrics.nodeCount = 0;
      this.metrics.contextResets++;
      
      // Re-initialize from scratch
      this.initialized = false;
      this.resumeAttempts = 0;
      await this.initialize();
      
      return true;
    } catch (error) {
      const enhancedError = new AudioContextError(
        'Failed to reset audio context',
        { originalError: error.message }
      );
      this.errorHandler.handleError(enhancedError, { component: 'EnhancedAudioCore', critical: true });
      
      return false;
    }
  }

  /**
   * Get the current audio context
   * @returns {AudioContext} The Web Audio API context
   * @throws {AudioContextError} If context is not initialized
   */
  getContext() {
    if (!this.initialized) {
      const error = new AudioContextError('Audio context not initialized');
      this.errorHandler.handleError(error, { component: 'EnhancedAudioCore' });
      throw error;
    }
    
    return this.context;
  }

  /**
   * Get a buffer from the pool
   * @param {number} duration - Requested duration in seconds
   * @returns {AudioBuffer} The audio buffer
   */
  getBuffer(duration) {
    if (!this.initialized) {
      this.errorHandler.handleError(
        new AudioContextError('Cannot get buffer, audio core not initialized'),
        { component: 'EnhancedAudioCore' }
      );
      return this.context.createBuffer(this.options.channelCount, this.context.sampleRate * duration, this.context.sampleRate);
    }
    
    return this.bufferPool.getBuffer(duration);
  }

  /**
   * Return a buffer to the pool
   * @param {AudioBuffer} buffer - Buffer to return
   * @returns {boolean} Whether the buffer was returned successfully
   */
  returnBuffer(buffer) {
    if (!this.initialized || !this.bufferPool) {
      return false;
    }
    
    return this.bufferPool.returnBuffer(buffer);
  }

  /**
   * Set master volume
   * @param {number} value - Volume value between 0 and 1
   * @returns {EnhancedAudioCore} This instance for chaining
   */
  setMasterVolume(value) {
    if (!this.initialized) {
      this.errorHandler.handleError(
        new AudioContextError('Cannot set volume, audio core not initialized'),
        { component: 'EnhancedAudioCore' }
      );
      return this;
    }
    
    // Clamp value between 0 and 1
    const safeValue = Math.max(0, Math.min(1, value));
    
    // Use exponential scaling for more natural volume control
    // A value of 0 results in a gain of 0 (silence)
    // A value of 1 results in a gain of 1 (full volume)
    const targetGain = safeValue === 0 ? 0 : Math.pow(safeValue, 2);
    
    // Smooth transition to avoid clicks
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.05);
    
    return this;
  }

  /**
   * Create and register a new audio node
   * @param {string} nodeId - Unique identifier for the node
   * @param {AudioNode} node - The audio node to register
   * @param {string} [groupId=null] - Optional group identifier
   * @returns {AudioNode} The registered node
   */
  registerNode(nodeId, node, groupId = null) {
    if (!this.initialized) {
      this.errorHandler.handleError(
        new AudioContextError('Cannot register node, audio core not initialized'),
        { component: 'EnhancedAudioCore', nodeId, groupId }
      );
      return node;
    }
    
    // Check for duplicate node ID
    if (this.nodes.has(nodeId)) {
      this.errorHandler.handleError(
        new AudioSystemError(`Node ID ${nodeId} already exists`),
        { component: 'EnhancedAudioCore', nodeId, groupId }
      );
      // Remove the existing node first
      this.removeNode(nodeId);
    }
    
    // Register the node
    this.nodes.set(nodeId, node);
    this.metrics.nodeCount++;
    this.metrics.peakNodeCount = Math.max(this.metrics.peakNodeCount, this.metrics.nodeCount);
    this.metrics.lastActivityTime = Date.now();
    
    // Add to group if specified
    if (groupId) {
      if (!this.nodeGroups.has(groupId)) {
        this.nodeGroups.set(groupId, new Set());
      }
      this.nodeGroups.get(groupId).add(nodeId);
    }
    
    return node;
  }

  /**
   * Get a node by ID
   * @param {string} nodeId - ID of the node to retrieve
   * @returns {AudioNode|null} The audio node or null if not found
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Check if a node exists
   * @param {string} nodeId - ID of the node to check
   * @returns {boolean} Whether the node exists
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Remove and disconnect an audio node
   * @param {string} nodeId - ID of the node to remove
   * @returns {boolean} Whether the node was removed
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      return false;
    }
    
    try {
      const node = this.nodes.get(nodeId);
      node.disconnect();
      this.nodes.delete(nodeId);
      this.metrics.nodeCount--;
      this.metrics.lastActivityTime = Date.now();
      
      // Remove from any groups
      for (const [groupId, members] of this.nodeGroups) {
        if (members.has(nodeId)) {
          members.delete(nodeId);
          
          // If group is empty, remove it
          if (members.size === 0) {
            this.nodeGroups.delete(groupId);
          }
        }
      }
      
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        new AudioSystemError(`Error removing node ${nodeId}`, 'NODE_REMOVAL_ERROR', { originalError: error.message }),
        { component: 'EnhancedAudioCore', nodeId }
      );
      
      // Remove from maps even if disconnection failed
      this.nodes.delete(nodeId);
      
      return false;
    }
  }

  /**
   * Remove all nodes in a group
   * @param {string} groupId - ID of the group to remove
   * @returns {number} Number of nodes removed
   */
  removeNodeGroup(groupId) {
    if (!this.nodeGroups.has(groupId)) {
      return 0;
    }
    
    const members = [...this.nodeGroups.get(groupId)];
    let removedCount = 0;
    
    for (const nodeId of members) {
      if (this.removeNode(nodeId)) {
        removedCount++;
      }
    }
    
    this.nodeGroups.delete(groupId);
    return removedCount;
  }

  /**
   * Get the analyzer for audio monitoring
   * @returns {AudioAnalyzer} The audio analyzer
   */
  getAnalyzer() {
    return this.masterAnalyzer;
  }

  /**
   * Get current performance metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    const bufferPoolStats = this.bufferPool ? this.bufferPool.getStats() : null;
    
    return {
      ...this.metrics,
      bufferPool: bufferPoolStats,
      context: {
        state: this.context ? this.context.state : 'closed',
        sampleRate: this.context ? this.context.sampleRate : this.options.sampleRate,
        baseLatency: this.context ? this.context.baseLatency : null,
        outputLatency: this.context ? this.context.outputLatency : null
      }
    };
  }

  /**
   * Clean up all resources
   */
  async dispose() {
    if (!this.initialized) {
      return;
    }
    
    try {
      // Disconnect and clear all nodes
      this.nodes.forEach(node => {
        try {
          node.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      });
      
      this.nodes.clear();
      this.nodeGroups.clear();
      
      // Disconnect master chain
      if (this.masterGain) this.masterGain.disconnect();
      if (this.masterCompressor) this.masterCompressor.disconnect();
      if (this.masterAnalyzer) this.masterAnalyzer.dispose();
      
      // Close audio context
      if (this.context) {
        await this.context.close();
      }
      
      this.initialized = false;
    } catch (error) {
      this.errorHandler.handleError(
        new AudioSystemError('Error during audio core disposal', 'DISPOSAL_ERROR', { originalError: error.message }),
        { component: 'EnhancedAudioCore', critical: true }
      );
    }
  }
}

export default EnhancedAudioCore; 