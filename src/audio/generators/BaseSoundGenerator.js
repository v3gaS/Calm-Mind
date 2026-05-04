import { audioContextManager } from '../../core/AudioContext.js';
import { eventBus, EventTypes } from '../../core/EventBus.js';

/**
 * @class BaseSoundGenerator
 * @description Base class for all sound generators with common functionality
 */
export class BaseSoundGenerator {
    constructor() {
        this.context = audioContextManager.getContext();
        this.masterGain = audioContextManager.getMasterGain();
        this.nodes = new Set();
        this.isPlaying = false;
        this.startTime = 0;
        this.duration = 0;
    }
    
    /**
     * Initialize the sound generator
     * @returns {boolean} Success status
     */
    initialize() {
        if (!this.context) {
            console.error('Audio context not available');
            return false;
        }
        return true;
    }
    
    /**
     * Start playing the sound
     * @param {number} duration - Duration in seconds
     */
    start(duration) {
        if (!this.initialize()) return;
        
        this.duration = duration;
        this.startTime = this.context.currentTime;
        this.isPlaying = true;
        
        eventBus.emit(EventTypes.AUDIO.PLAY, {
            type: this.constructor.name,
            duration: duration
        });
    }
    
    /**
     * Stop playing the sound
     */
    stop() {
        this.isPlaying = false;
        this.cleanup();
        
        eventBus.emit(EventTypes.AUDIO.STOP, {
            type: this.constructor.name
        });
    }
    
    /**
     * Pause the sound
     */
    pause() {
        this.isPlaying = false;
        
        eventBus.emit(EventTypes.AUDIO.PAUSE, {
            type: this.constructor.name
        });
    }
    
    /**
     * Resume playing the sound
     */
    resume() {
        if (!this.initialize()) return;
        
        this.isPlaying = true;
        this.startTime = this.context.currentTime;
        
        eventBus.emit(EventTypes.AUDIO.PLAY, {
            type: this.constructor.name,
            duration: this.duration
        });
    }
    
    /**
     * Set the volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
            
            eventBus.emit(EventTypes.AUDIO.VOLUME_CHANGE, {
                volume: volume
            });
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.nodes.forEach(node => {
            try {
                node.disconnect();
            } catch (error) {
                console.error('Error disconnecting node:', error);
            }
        });
        this.nodes.clear();
    }
    
    /**
     * Create and track an audio node
     * @param {AudioNode} node - Audio node to track
     * @returns {AudioNode} The tracked node
     */
    trackNode(node) {
        this.nodes.add(node);
        return node;
    }
    
    /**
     * Get the current playback time
     * @returns {number} Current time in seconds
     */
    getCurrentTime() {
        return this.context.currentTime - this.startTime;
    }
    
    /**
     * Check if the sound is still playing
     * @returns {boolean} Playing status
     */
    isStillPlaying() {
        return this.isPlaying && this.getCurrentTime() < this.duration;
    }
    
    /**
     * Update the sound (to be implemented by subclasses)
     */
    update() {
        // To be implemented by subclasses
    }
} 