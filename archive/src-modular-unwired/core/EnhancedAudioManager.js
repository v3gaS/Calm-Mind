/**
 * EnhancedAudioManager.js
 * High-level manager for audio generation and control with advanced features
 */

import { EnhancedAudioCore } from './EnhancedAudioCore.js';
import { BinauralGenerator } from '../generators/BinauralGenerator.js';
import { SolfeggioGenerator } from '../generators/SolfeggioGenerator.js';
import { MonauralGenerator } from '../generators/MonauralGenerator.js';
import { EMDRGenerator } from '../generators/EMDRGenerator.js';
import { HRVGenerator } from '../generators/HRVGenerator.js';
import { IsochronicGenerator } from '../generators/IsochronicGenerator.js';
import { AmbientGenerator } from '../generators/AmbientGenerator.js';
import { SpatialAudioEffect } from '../effects/SpatialAudioEffect.js';
import { FilterEffect } from '../effects/FilterEffect.js';
import { ReverbEffect } from '../effects/ReverbEffect.js';
import { WorkerPool } from '../utils/MemoryManager.js';
import { GeneratorError, ParameterError, defaultHandler } from '../utils/ErrorHandler.js';

/**
 * Enhanced Audio Manager with advanced features and optimizations
 */
export class EnhancedAudioManager {
  /**
   * Create an EnhancedAudioManager instance
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      sampleRate: options.sampleRate || 44100,
      latencyHint: options.latencyHint || 'interactive',
      channelCount: options.channelCount || 2,
      useWorkers: options.useWorkers !== false,
      maxWorkers: options.maxWorkers || 4,
      autoStartOnUserGesture: options.autoStartOnUserGesture !== false,
      errorHandler: options.errorHandler || defaultHandler
    };
    
    this.audioCore = new EnhancedAudioCore({
      sampleRate: this.options.sampleRate,
      latencyHint: this.options.latencyHint,
      channelCount: this.options.channelCount,
      errorHandler: this.options.errorHandler
    });
    
    this.generators = new Map();
    this.effects = new Map();
    this.sessions = new Map();
    this.workerPool = null;
    this.initialized = false;
    this.errorHandler = this.options.errorHandler;
    
    // Available generator types
    this.generatorTypes = {
      binaural: BinauralGenerator,
      solfeggio: SolfeggioGenerator,
      monaural: MonauralGenerator,
      emdr: EMDRGenerator,
      hrv: HRVGenerator,
      isochronic: IsochronicGenerator,
      ambient: AmbientGenerator
    };
    
    // Available effect types
    this.effectTypes = {
      spatial: SpatialAudioEffect,
      filter: FilterEffect,
      reverb: ReverbEffect
    };
    
    // Setup auto-start on user gesture if enabled
    if (this.options.autoStartOnUserGesture) {
      this._setupUserGestureHandlers();
    }
  }

  /**
   * Set up event handlers to initialize audio on user gesture
   * @private
   */
  _setupUserGestureHandlers() {
    const userGestureHandler = async () => {
      if (!this.initialized) {
        try {
          await this.initialize();
        } catch (error) {
          // Just log the error, don't throw
          console.warn('Failed to initialize audio on user gesture:', error);
        }
      }
      
      // Remove handlers after successful initialization
      if (this.initialized) {
        ['click', 'touchstart', 'touchend', 'keydown'].forEach(eventType => {
          document.removeEventListener(eventType, userGestureHandler);
        });
      }
    };
    
    ['click', 'touchstart', 'touchend', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, userGestureHandler, { once: false, passive: true });
    });
  }

  /**
   * Initialize the audio system and worker pool
   * @returns {Promise<EnhancedAudioManager>} This instance
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }
    
    try {
      // Initialize audio core
      await this.audioCore.initialize();
      
      // Initialize worker pool if enabled
      if (this.options.useWorkers) {
        this.workerPool = new WorkerPool('../workers/AudioProcessingWorker.js', {
          size: this.options.maxWorkers,
          initMessage: {
            sampleRate: this.options.sampleRate,
            channels: this.options.channelCount
          }
        });
        
        await this.workerPool.initialize();
      }
      
      this.initialized = true;
      return this;
    } catch (error) {
      // Handle error
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'initialize' });
      throw error;
    }
  }

  /**
   * Create a new generator instance
   * @param {string} type - Generator type
   * @param {string} id - Unique identifier for the generator
   * @param {Object} options - Generator options
   * @returns {BaseGenerator} The created generator instance
   */
  createGenerator(type, id, options = {}) {
    if (!this.initialized) {
      const error = new GeneratorError('AudioManager not initialized');
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createGenerator' });
      throw error;
    }
    
    if (this.generators.has(id)) {
      const error = new GeneratorError(`Generator with ID ${id} already exists`);
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createGenerator' });
      throw error;
    }
    
    const normalizedType = type.toLowerCase();
    const GeneratorClass = this.generatorTypes[normalizedType];
    
    if (!GeneratorClass) {
      const error = new GeneratorError(
        `Unknown generator type: ${type}`,
        'UNKNOWN_GENERATOR',
        { availableTypes: Object.keys(this.generatorTypes) }
      );
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createGenerator' });
      throw error;
    }
    
    try {
      // Create generator with AudioCore and worker pool if available
      const generator = new GeneratorClass(this.audioCore, {
        ...options,
        workerPool: this.workerPool
      });
      
      // Register generator
      this.generators.set(id, generator);
      
      return generator;
    } catch (error) {
      const enhancedError = new GeneratorError(
        `Failed to create generator of type ${type}`,
        'GENERATOR_CREATION_FAILED',
        { originalError: error.message }
      );
      this.errorHandler.handleError(enhancedError, { component: 'EnhancedAudioManager', method: 'createGenerator' });
      throw enhancedError;
    }
  }

  /**
   * Create a new audio effect
   * @param {string} type - Effect type
   * @param {string} id - Unique identifier for the effect
   * @param {Object} options - Effect options
   * @returns {AudioEffect} The created effect instance
   */
  createEffect(type, id, options = {}) {
    if (!this.initialized) {
      const error = new ParameterError('AudioManager not initialized');
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createEffect' });
      throw error;
    }
    
    if (this.effects.has(id)) {
      const error = new ParameterError(`Effect with ID ${id} already exists`);
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createEffect' });
      throw error;
    }
    
    const normalizedType = type.toLowerCase();
    const EffectClass = this.effectTypes[normalizedType];
    
    if (!EffectClass) {
      const error = new ParameterError(
        `Unknown effect type: ${type}`,
        'UNKNOWN_EFFECT',
        { availableTypes: Object.keys(this.effectTypes) }
      );
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'createEffect' });
      throw error;
    }
    
    try {
      // Create effect with AudioCore
      const effect = new EffectClass(this.audioCore, options);
      
      // Register effect
      this.effects.set(id, effect);
      
      return effect;
    } catch (error) {
      const enhancedError = new ParameterError(
        `Failed to create effect of type ${type}`,
        'EFFECT_CREATION_FAILED',
        { originalError: error.message }
      );
      this.errorHandler.handleError(enhancedError, { component: 'EnhancedAudioManager', method: 'createEffect' });
      throw enhancedError;
    }
  }

  /**
   * Get a generator by ID
   * @param {string} id - Generator identifier
   * @returns {BaseGenerator} The generator instance
   */
  getGenerator(id) {
    if (!this.generators.has(id)) {
      const error = new ParameterError(`Generator with ID ${id} not found`);
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'getGenerator' });
      throw error;
    }
    
    return this.generators.get(id);
  }

  /**
   * Get an effect by ID
   * @param {string} id - Effect identifier
   * @returns {AudioEffect} The effect instance
   */
  getEffect(id) {
    if (!this.effects.has(id)) {
      const error = new ParameterError(`Effect with ID ${id} not found`);
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'getEffect' });
      throw error;
    }
    
    return this.effects.get(id);
  }

  /**
   * Remove a generator
   * @param {string} id - Generator identifier
   * @returns {boolean} Whether the generator was removed
   */
  removeGenerator(id) {
    if (!this.generators.has(id)) {
      return false;
    }
    
    try {
      const generator = this.generators.get(id);
      generator.dispose();
      this.generators.delete(id);
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        new GeneratorError(`Error removing generator ${id}`, 'GENERATOR_REMOVAL_ERROR', { originalError: error.message }),
        { component: 'EnhancedAudioManager', method: 'removeGenerator' }
      );
      return false;
    }
  }

  /**
   * Remove an effect
   * @param {string} id - Effect identifier
   * @returns {boolean} Whether the effect was removed
   */
  removeEffect(id) {
    if (!this.effects.has(id)) {
      return false;
    }
    
    try {
      const effect = this.effects.get(id);
      effect.dispose();
      this.effects.delete(id);
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        new ParameterError(`Error removing effect ${id}`, 'EFFECT_REMOVAL_ERROR', { originalError: error.message }),
        { component: 'EnhancedAudioManager', method: 'removeEffect' }
      );
      return false;
    }
  }

  /**
   * Set master volume
   * @param {number} value - Volume between 0 and 1
   * @returns {EnhancedAudioManager} This instance for chaining
   */
  setMasterVolume(value) {
    this.audioCore.setMasterVolume(value);
    return this;
  }

  /**
   * Create a therapeutic session with multiple generators and effects
   * @param {Object} config - Session configuration
   * @returns {Object} Session control object
   */
  async createTherapeuticSession(config) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const session = {
      id: sessionId,
      generators: new Map(),
      effects: new Map(),
      connections: [],
      active: false,
      
      // Methods
      start: async () => {
        if (session.active) return;
        
        try {
          // Start all generators
          const startPromises = [];
          for (const [id, generator] of session.generators) {
            startPromises.push(generator.start());
          }
          await Promise.all(startPromises);
          
          session.active = true;
        } catch (error) {
          this.errorHandler.handleError(
            new GeneratorError('Failed to start session', 'SESSION_START_ERROR', { originalError: error.message }),
            { component: 'EnhancedAudioManager', method: 'startSession', sessionId }
          );
          throw error;
        }
      },
      
      stop: async () => {
        if (!session.active) return;
        
        try {
          // Stop all generators
          const stopPromises = [];
          for (const [id, generator] of session.generators) {
            stopPromises.push(generator.stop());
          }
          await Promise.all(stopPromises);
          
          session.active = false;
        } catch (error) {
          this.errorHandler.handleError(
            new GeneratorError('Failed to stop session', 'SESSION_STOP_ERROR', { originalError: error.message }),
            { component: 'EnhancedAudioManager', method: 'stopSession', sessionId }
          );
        }
      },
      
      dispose: () => {
        if (session.active) {
          session.stop().catch(e => console.error('Error stopping session during disposal:', e));
        }
        
        // Remove all generators and effects from the manager
        for (const id of session.generators.keys()) {
          this.removeGenerator(id);
        }
        
        for (const id of session.effects.keys()) {
          this.removeEffect(id);
        }
        
        session.generators.clear();
        session.effects.clear();
        this.sessions.delete(sessionId);
      },
      
      // Event callbacks
      onAudioData: (callback) => {
        if (typeof callback !== 'function') {
          throw new ParameterError('Callback must be a function');
        }
        
        const analyzer = this.audioCore.getAnalyzer();
        
        if (!analyzer) {
          throw new GeneratorError('Audio analyzer not available');
        }
        
        let animationFrameId = null;
        const analyzeFrame = () => {
          analyzer.analyze();
          const data = analyzer.getFeatures();
          callback(data);
          
          animationFrameId = requestAnimationFrame(analyzeFrame);
        };
        
        // Start analysis loop
        analyzeFrame();
        
        // Return function to cancel the analysis
        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        };
      },
      
      connectNodes: (sourceId, destinationId) => {
        const source = session.generators.get(sourceId) || session.effects.get(sourceId);
        const destination = session.effects.get(destinationId);
        
        if (!source || !destination) {
          throw new ParameterError('Source or destination not found');
        }
        
        source.connect(destination.getInputNode());
        session.connections.push({ sourceId, destinationId });
      }
    };
    
    // Process config to create generators and effects
    try {
      // Create generators
      if (config.binaural) {
        const genId = `binaural_${sessionId}`;
        const gen = this.createGenerator('binaural', genId, config.binaural);
        session.generators.set(genId, gen);
      }
      
      if (config.solfeggio) {
        const genId = `solfeggio_${sessionId}`;
        const gen = this.createGenerator('solfeggio', genId, config.solfeggio);
        session.generators.set(genId, gen);
      }
      
      if (config.monaural) {
        const genId = `monaural_${sessionId}`;
        const gen = this.createGenerator('monaural', genId, config.monaural);
        session.generators.set(genId, gen);
      }
      
      if (config.emdr) {
        const genId = `emdr_${sessionId}`;
        const gen = this.createGenerator('emdr', genId, config.emdr);
        session.generators.set(genId, gen);
      }
      
      if (config.hrv) {
        const genId = `hrv_${sessionId}`;
        const gen = this.createGenerator('hrv', genId, config.hrv);
        session.generators.set(genId, gen);
      }
      
      if (config.isochronic) {
        const genId = `isochronic_${sessionId}`;
        const gen = this.createGenerator('isochronic', genId, config.isochronic);
        session.generators.set(genId, gen);
      }
      
      if (config.ambient) {
        const genId = `ambient_${sessionId}`;
        const gen = this.createGenerator('ambient', genId, config.ambient);
        session.generators.set(genId, gen);
      }
      
      // Create effects
      if (config.effects) {
        if (config.effects.spatial) {
          const effectId = `spatial_${sessionId}`;
          const effect = this.createEffect('spatial', effectId, config.effects.spatial);
          session.effects.set(effectId, effect);
        }
        
        if (config.effects.filter) {
          const effectId = `filter_${sessionId}`;
          const effect = this.createEffect('filter', effectId, config.effects.filter);
          session.effects.set(effectId, effect);
        }
        
        if (config.effects.reverb) {
          const effectId = `reverb_${sessionId}`;
          const effect = this.createEffect('reverb', effectId, config.effects.reverb);
          session.effects.set(effectId, effect);
        }
      }
      
      // Store session
      this.sessions.set(sessionId, session);
      
      return session;
    } catch (error) {
      // Clean up any created generators or effects if there's an error
      for (const id of session.generators.keys()) {
        this.removeGenerator(id);
      }
      
      for (const id of session.effects.keys()) {
        this.removeEffect(id);
      }
      
      this.errorHandler.handleError(
        new GeneratorError('Failed to create therapeutic session', 'SESSION_CREATION_ERROR', { originalError: error.message }),
        { component: 'EnhancedAudioManager', method: 'createTherapeuticSession' }
      );
      
      throw error;
    }
  }

  /**
   * Get a session by ID
   * @param {string} id - Session identifier
   * @returns {Object} Session object
   */
  getSession(id) {
    if (!this.sessions.has(id)) {
      const error = new ParameterError(`Session with ID ${id} not found`);
      this.errorHandler.handleError(error, { component: 'EnhancedAudioManager', method: 'getSession' });
      throw error;
    }
    
    return this.sessions.get(id);
  }

  /**
   * Get all available generator types
   * @returns {Array<string>} List of available generator types
   */
  getAvailableGeneratorTypes() {
    return Object.keys(this.generatorTypes);
  }

  /**
   * Get all available effect types
   * @returns {Array<string>} List of available effect types
   */
  getAvailableEffectTypes() {
    return Object.keys(this.effectTypes);
  }

  /**
   * Get system status and metrics
   * @returns {Object} System status
   */
  getSystemStatus() {
    const audioCoreMetrics = this.audioCore.getMetrics();
    
    return {
      initialized: this.initialized,
      generators: {
        count: this.generators.size,
        types: [...this.generators.values()].map(gen => gen.constructor.name)
      },
      effects: {
        count: this.effects.size,
        types: [...this.effects.values()].map(effect => effect.constructor.name)
      },
      sessions: {
        count: this.sessions.size,
        active: [...this.sessions.values()].filter(session => session.active).length
      },
      workers: {
        enabled: this.options.useWorkers,
        initialized: this.workerPool ? this.workerPool.isInitialized : false,
        count: this.workerPool ? this.workerPool.workers.length : 0
      },
      audioCore: audioCoreMetrics
    };
  }

  /**
   * Clean up all resources
   */
  async dispose() {
    // Stop and dispose all sessions
    for (const [id, session] of this.sessions) {
      session.dispose();
    }
    this.sessions.clear();
    
    // Clean up any remaining generators
    for (const [id, generator] of this.generators) {
      generator.dispose();
    }
    this.generators.clear();
    
    // Clean up any remaining effects
    for (const [id, effect] of this.effects) {
      effect.dispose();
    }
    this.effects.clear();
    
    // Terminate worker pool
    if (this.workerPool) {
      this.workerPool.terminate();
      this.workerPool = null;
    }
    
    // Dispose audio core
    await this.audioCore.dispose();
    
    this.initialized = false;
  }
}

export default EnhancedAudioManager; 