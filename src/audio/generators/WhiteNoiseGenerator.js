import { BaseSoundGenerator } from './BaseSoundGenerator.js';
import { eventBus, EventTypes } from '../../core/EventBus.js';
import { audioEffects } from '../effects/AudioEffects.js';

/**
 * WhiteNoiseGenerator creates white noise sound with optional filtering
 * for relaxation, focus, or masking background noise.
 * 
 * White noise contains equal intensity across different frequencies and can be
 * used to mask distracting sounds or create a consistent ambient background.
 * 
 * Filtering options:
 * - Lowpass: Emphasizes lower frequencies (brown noise-like)
 * - Bandpass: Emphasizes middle frequencies (pink noise-like)
 * - Highpass: Emphasizes higher frequencies (blue noise-like)
 * 
 * @extends BaseSoundGenerator
 */
export class WhiteNoiseGenerator extends BaseSoundGenerator {
    /**
     * Create a new WhiteNoiseGenerator
     */
    constructor() {
        super();
        this.noiseNode = null;
        this.gainNode = null;
        this.filter = null;
        this.bufferSize = 2 * this.context.sampleRate;
        this.filterType = 'none'; // 'none', 'lowpass', 'bandpass', 'highpass'
        this.effectsEnabled = false;
    }
    
    /**
     * Initialize the white noise generator
     * @param {number} stressLevel - Stress level (1-10)
     * @param {Object} options - Optional configuration
     * @param {string} options.filterType - Type of filter to apply ('none', 'lowpass', 'bandpass', 'highpass')
     * @returns {boolean} Success status
     */
    initialize(stressLevel = 5, options = {}) {
        if (!super.initialize()) return false;
        
        const { filterType = this.determineFilterType(stressLevel) } = options;
        
        try {
            // Create and connect gain node
            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = 0.7; // Default 70% volume
            this.trackNode(this.gainNode);
            
            // Create audio buffer
            const noiseBuffer = this.context.createBuffer(
                2, // Stereo
                this.bufferSize,
                this.context.sampleRate
            );
            
            // Fill buffer with random values (white noise)
            for (let channel = 0; channel < noiseBuffer.numberOfChannels; channel++) {
                const outputData = noiseBuffer.getChannelData(channel);
                for (let i = 0; i < this.bufferSize; i++) {
                    outputData[i] = Math.random() * 2 - 1;
                }
            }
            
            // Create buffer source
            this.noiseNode = this.context.createBufferSource();
            this.noiseNode.buffer = noiseBuffer;
            this.noiseNode.loop = true;
            this.trackNode(this.noiseNode);
            
            // Apply filter if specified
            this.filterType = filterType;
            if (this.filterType !== 'none') {
                this.applyFilter(stressLevel);
            }
            
            // Set up audio routing
            if (this.effectsEnabled) {
                audioEffects.initialize();
                this.noiseNode.connect(this.gainNode);
                audioEffects.connectEffects(this.gainNode, this.masterGain);
            } else {
                this.noiseNode.connect(this.gainNode);
                this.gainNode.connect(this.masterGain);
            }
            
            eventBus.emit(EventTypes.AUDIO.INITIALIZED, {
                type: this.constructor.name,
                filterType: this.filterType
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize WhiteNoiseGenerator:', error);
            eventBus.emit(EventTypes.SYSTEM.ERROR, {
                source: 'WhiteNoiseGenerator',
                message: 'Failed to initialize white noise generator',
                error: error.message
            });
            return false;
        }
    }
    
    /**
     * Determine appropriate filter type based on stress level
     * @param {number} stressLevel - Stress level (1-10)
     * @returns {string} Filter type
     */
    determineFilterType(stressLevel) {
        if (stressLevel <= 3) {
            return 'lowpass'; // Relaxing brown noise-like for low stress
        } else if (stressLevel <= 7) {
            return 'bandpass'; // Balanced pink noise-like for medium stress
        } else {
            return 'highpass'; // Energizing blue noise-like for high stress
        }
    }
    
    /**
     * Apply filter to the noise
     * @param {number} stressLevel - Stress level (1-10)
     */
    applyFilter(stressLevel) {
        // Clean up existing filter if any
        if (this.filter) {
            this.filter.disconnect();
            this.nodes.delete(this.filter);
        }
        
        // Create new filter
        this.filter = this.context.createBiquadFilter();
        this.trackNode(this.filter);
        
        // Set filter type
        this.filter.type = this.filterType;
        
        // Set filter parameters based on stress level
        switch (this.filterType) {
            case 'lowpass':
                // Lower cutoff frequency for higher stress within low range
                this.filter.frequency.value = 1000 - (stressLevel * 50);
                this.filter.Q.value = 0.7;
                break;
            case 'bandpass':
                // Center frequency shifts with stress level
                this.filter.frequency.value = 800 + (stressLevel * 100);
                this.filter.Q.value = 1.0;
                break;
            case 'highpass':
                // Higher cutoff frequency for higher stress within high range
                this.filter.frequency.value = 2000 + (stressLevel * 200);
                this.filter.Q.value = 0.7;
                break;
        }
        
        // Insert filter in the signal chain
        if (this.noiseNode) {
            this.noiseNode.disconnect();
            this.noiseNode.connect(this.filter);
            this.filter.connect(this.gainNode);
        }
    }
    
    /**
     * Start playing the white noise
     * @param {number} duration - Duration in seconds
     * @param {number} stressLevel - Stress level (1-10)
     */
    start(duration, stressLevel = 5) {
        if (!this.initialize(stressLevel)) return;
        
        this.duration = duration;
        this.startTime = this.context.currentTime;
        this.isPlaying = true;
        
        this.noiseNode.start();
        
        eventBus.emit(EventTypes.AUDIO.PLAY, {
            type: this.constructor.name,
            duration: duration,
            filterType: this.filterType
        });
        
        // If duration is specified, schedule stop
        if (duration > 0) {
            setTimeout(() => {
                if (this.isPlaying) {
                    this.stop();
                }
            }, duration * 1000);
        }
    }
    
    /**
     * Stop playing the white noise
     */
    stop() {
        if (!this.isPlaying) return;
        
        try {
            this.noiseNode.stop();
        } catch (error) {
            console.error('Error stopping noise node:', error);
        }
        
        this.isPlaying = false;
        this.cleanup();
        
        eventBus.emit(EventTypes.AUDIO.STOP, {
            type: this.constructor.name
        });
    }
    
    /**
     * Update the noise parameters
     * @param {number} stressLevel - Stress level (1-10)
     */
    update(stressLevel) {
        if (!this.isPlaying) return;
        
        // Determine if filter type should change
        const newFilterType = this.determineFilterType(stressLevel);
        
        // If filter type changed or filter parameters need updating
        if (newFilterType !== this.filterType || this.filter) {
            this.filterType = newFilterType;
            this.applyFilter(stressLevel);
            
            eventBus.emit(EventTypes.AUDIO.UPDATE, {
                type: this.constructor.name,
                filterType: this.filterType,
                stressLevel: stressLevel
            });
        }
        
        // Update effects if enabled
        if (this.effectsEnabled) {
            audioEffects.updateEffect('reverb', { 
                wetDry: 0.3 - (stressLevel * 0.02) // Less reverb for higher stress
            });
            
            audioEffects.updateEffect('delay', {
                delayTime: 0.5 - (stressLevel * 0.03), // Shorter delay for higher stress
                feedback: 0.3 - (stressLevel * 0.02)  // Less feedback for higher stress
            });
        }
    }
    
    /**
     * Set the volume of the white noise
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
            
            eventBus.emit(EventTypes.AUDIO.VOLUME_CHANGE, {
                type: this.constructor.name,
                volume: volume
            });
        }
    }
    
    /**
     * Toggle audio effects
     * @param {boolean} enabled - Whether effects should be enabled
     */
    toggleEffects(enabled) {
        this.effectsEnabled = enabled;
        
        // If already playing, reinitialize to apply/remove effects
        if (this.isPlaying) {
            const wasPlaying = this.isPlaying;
            const currentTime = this.context.currentTime - this.startTime;
            const remainingTime = this.duration - currentTime;
            
            this.stop();
            this.initialize();
            
            if (wasPlaying && remainingTime > 0) {
                this.start(remainingTime);
            }
        }
        
        eventBus.emit(EventTypes.AUDIO.EFFECTS_TOGGLE, {
            type: this.constructor.name,
            enabled: this.effectsEnabled
        });
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        super.cleanup();
        this.noiseNode = null;
        this.gainNode = null;
        this.filter = null;
    }
} 