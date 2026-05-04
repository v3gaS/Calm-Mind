import { BaseSoundGenerator } from './BaseSoundGenerator.js';
import { eventBus, EventTypes } from '../../core/EventBus.js';

/**
 * PinkNoiseGenerator creates pink noise sound for relaxation and sound masking.
 * 
 * Pink noise has power inversely proportional to frequency (1/f spectrum),
 * with equal energy per octave. This makes it sound more natural than white noise
 * and is often preferred for relaxation, improving sleep, and concentration.
 * 
 * The generator's intensity is dynamically adjusted based on the user's stress level.
 * 
 * @extends BaseSoundGenerator
 */
export class PinkNoiseGenerator extends BaseSoundGenerator {
    /**
     * Create a new PinkNoiseGenerator
     */
    constructor() {
        super();
        this.noiseBuffer = null;
        this.bufferSource = null;
        this.gainNode = null;
        this.intensity = 0.5; // Default intensity
    }

    /**
     * Initialize the pink noise generator
     * @param {AudioContext} context - The audio context
     * @param {number} [stressLevel=5] - Initial stress level (1-10)
     * @returns {Promise<boolean>} - Success/failure of initialization
     */
    async initialize(context, stressLevel = 5) {
        try {
            // Call parent initialization
            await super.initialize(context);
            
            // Create gain node for volume control
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.outputNode);
            
            // Create pink noise buffer
            this.noiseBuffer = this.createPinkNoiseBuffer();
            
            // Set initial intensity based on stress level
            this.intensity = this.mapStressToIntensity(stressLevel);
            this.gainNode.gain.value = this.intensity;
            
            eventBus.emit(EventTypes.LOG_INFO, 'Pink noise generator initialized');
            return true;
        } catch (error) {
            eventBus.emit(EventTypes.LOG_ERROR, `Failed to initialize pink noise generator: ${error.message}`);
            return false;
        }
    }

    /**
     * Creates a buffer with pink noise
     * @returns {AudioBuffer} - Audio buffer containing pink noise
     */
    createPinkNoiseBuffer() {
        const bufferSize = 2 * this.context.sampleRate; // 2 seconds of noise
        const buffer = this.context.createBuffer(2, bufferSize, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            
            // Pink noise coefficients
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            
            for (let i = 0; i < bufferSize; i++) {
                // Generate white noise
                const white = Math.random() * 2 - 1;
                
                // Apply pink noise filtering algorithm
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                
                // Sum the filtered noise and scale output
                data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                data[i] *= 0.11; // Scale to avoid clipping
                
                // Update b6 coefficient for next iteration
                b6 = white * 0.115926;
            }
        }
        
        eventBus.emit(EventTypes.LOG_INFO, 'Pink noise buffer created');
        return buffer;
    }

    /**
     * Maps stress level to sound intensity
     * @param {number} stressLevel - Stress level (1-10)
     * @returns {number} - Intensity value (0-1)
     */
    mapStressToIntensity(stressLevel) {
        // Higher stress = higher intensity, with progressive scaling
        if (stressLevel <= 0) return 0.2;
        if (stressLevel >= 10) return 0.8;
        
        // Non-linear mapping for a more natural response
        return 0.2 + (stressLevel / 10) * 0.6;
    }

    /**
     * Start playing pink noise
     * @param {number} [duration=0] - Duration in seconds (0 = play indefinitely)
     * @returns {boolean} - Success/failure of start
     */
    start(duration = 0) {
        if (!this.isInitialized) {
            eventBus.emit(EventTypes.LOG_ERROR, 'Cannot start pink noise generator: not initialized');
            return false;
        }
        
        try {
            // Create and configure buffer source
            this.bufferSource = this.context.createBufferSource();
            this.bufferSource.buffer = this.noiseBuffer;
            this.bufferSource.loop = true;
            this.bufferSource.connect(this.gainNode);
            
            // Start playback
            this.bufferSource.start();
            this.isPlaying = true;
            
            eventBus.emit(EventTypes.LOG_INFO, `Pink noise started${duration ? ` for ${duration} seconds` : ''}`);
            
            // Schedule stop if duration is specified
            if (duration > 0) {
                setTimeout(() => {
                    this.stop();
                }, duration * 1000);
            }
            
            return true;
        } catch (error) {
            eventBus.emit(EventTypes.LOG_ERROR, `Failed to start pink noise: ${error.message}`);
            return false;
        }
    }

    /**
     * Stop playing pink noise
     * @returns {boolean} - Success/failure of stop
     */
    stop() {
        if (!this.isPlaying) {
            return true; // Already stopped, consider it successful
        }
        
        try {
            // Stop and clean up buffer source
            if (this.bufferSource) {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
                this.bufferSource = null;
            }
            
            this.isPlaying = false;
            eventBus.emit(EventTypes.LOG_INFO, 'Pink noise stopped');
            return true;
        } catch (error) {
            eventBus.emit(EventTypes.LOG_ERROR, `Failed to stop pink noise: ${error.message}`);
            return false;
        }
    }

    /**
     * Update generator parameters based on stress level
     * @param {number} [stressLevel] - New stress level (1-10)
     * @param {number} [intensity] - Direct intensity value (0-1, overrides stress mapping)
     * @returns {boolean} - Success/failure of update
     */
    update(stressLevel, intensity) {
        if (!this.isInitialized) {
            eventBus.emit(EventTypes.LOG_ERROR, 'Cannot update pink noise generator: not initialized');
            return false;
        }
        
        try {
            // Update intensity either directly or via stress level mapping
            if (intensity !== undefined) {
                this.intensity = Math.max(0, Math.min(1, intensity));
            } else if (stressLevel !== undefined) {
                this.intensity = this.mapStressToIntensity(stressLevel);
            }
            
            // Apply new intensity if playing
            if (this.isPlaying && this.gainNode) {
                // Smooth transition to new gain value
                this.gainNode.gain.setTargetAtTime(
                    this.intensity,
                    this.context.currentTime,
                    0.1 // Time constant
                );
                
                eventBus.emit(EventTypes.LOG_INFO, `Pink noise intensity updated to ${this.intensity.toFixed(2)}`);
            }
            
            return true;
        } catch (error) {
            eventBus.emit(EventTypes.LOG_ERROR, `Failed to update pink noise: ${error.message}`);
            return false;
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Stop playback first
        if (this.isPlaying) {
            this.stop();
        }
        
        // Disconnect and clean up nodes
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        this.noiseBuffer = null;
        this.isInitialized = false;
        
        eventBus.emit(EventTypes.LOG_INFO, 'Pink noise generator cleaned up');
        
        // Call parent cleanup
        super.cleanup();
    }
} 