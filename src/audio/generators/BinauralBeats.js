import { BaseSoundGenerator } from './BaseSoundGenerator.js';
import { audioEffects } from '../effects/AudioEffects.js';
import { bufferPool } from '../core/BufferPool.js';
import { eventBus, EventTypes } from '../../core/EventBus.js';

/**
 * @class BinauralBeats
 * @description Generates binaural beats for relaxation and focus
 * @extends BaseSoundGenerator
 */
export class BinauralBeats extends BaseSoundGenerator {
    constructor() {
        super();
        this.leftOscillator = null;
        this.rightOscillator = null;
        this.leftPanner = null;
        this.rightPanner = null;
        this.baseFrequency = 200;
        this.beatFrequency = 8;
        this.effectsEnabled = false;
    }
    
    /**
     * Initialize the binaural beats generator
     * @param {number} stressLevel - Stress level (1-10)
     * @returns {boolean} Success status
     */
    initialize(stressLevel = 5) {
        if (!super.initialize()) return false;
        
        try {
            // Initialize audio effects
            if (!audioEffects.initialize()) {
                console.warn('Failed to initialize audio effects');
            }
            
            // Adjust frequencies based on stress level
            this.baseFrequency = this.calculateBaseFrequency(stressLevel);
            this.beatFrequency = this.calculateBeatFrequency(stressLevel);
            
            // Create oscillators
            this.leftOscillator = this.trackNode(this.context.createOscillator());
            this.rightOscillator = this.trackNode(this.context.createOscillator());
            
            // Configure oscillators
            this.leftOscillator.type = 'sine';
            this.rightOscillator.type = 'sine';
            
            this.leftOscillator.frequency.setValueAtTime(this.baseFrequency, this.context.currentTime);
            this.rightOscillator.frequency.setValueAtTime(this.baseFrequency + this.beatFrequency, this.context.currentTime);
            
            // Create stereo panners
            this.leftPanner = this.trackNode(this.context.createStereoPanner());
            this.rightPanner = this.trackNode(this.context.createStereoPanner());
            
            this.leftPanner.pan.value = -1; // Full left
            this.rightPanner.pan.value = 1; // Full right
            
            // Connect nodes with effects
            if (this.effectsEnabled) {
                audioEffects.connectEffects(this.leftOscillator, this.leftPanner);
                audioEffects.connectEffects(this.rightOscillator, this.rightPanner);
            } else {
                this.leftOscillator.connect(this.leftPanner);
                this.rightOscillator.connect(this.rightPanner);
            }
            
            this.leftPanner.connect(this.masterGain);
            this.rightPanner.connect(this.masterGain);
            
            return true;
        } catch (error) {
            console.error('Error initializing binaural beats:', error);
            eventBus.emit(EventTypes.SYSTEM.ERROR, {
                message: 'Failed to initialize binaural beats',
                error: error
            });
            return false;
        }
    }
    
    /**
     * Calculate base frequency based on stress level
     * @param {number} stressLevel - Stress level (1-10)
     * @returns {number} Base frequency
     */
    calculateBaseFrequency(stressLevel) {
        // Higher stress levels use lower base frequencies
        return 200 - (stressLevel * 5);
    }
    
    /**
     * Calculate beat frequency based on stress level
     * @param {number} stressLevel - Stress level (1-10)
     * @returns {number} Beat frequency
     */
    calculateBeatFrequency(stressLevel) {
        // Higher stress levels use lower beat frequencies
        return 10 - (stressLevel * 0.5);
    }
    
    /**
     * Start playing binaural beats
     * @param {number} duration - Duration in seconds
     * @param {number} stressLevel - Stress level (1-10)
     */
    start(duration, stressLevel = 5) {
        if (!this.initialize(stressLevel)) return;
        
        super.start(duration);
        
        // Start oscillators
        this.leftOscillator.start();
        this.rightOscillator.start();
        
        // Schedule stop
        setTimeout(() => {
            this.stop();
        }, duration * 1000);
    }
    
    /**
     * Stop playing binaural beats
     */
    stop() {
        if (this.leftOscillator) {
            this.leftOscillator.stop();
        }
        if (this.rightOscillator) {
            this.rightOscillator.stop();
        }
        
        super.stop();
    }
    
    /**
     * Update binaural beats parameters
     * @param {number} stressLevel - New stress level
     */
    update(stressLevel) {
        if (!this.isPlaying) return;
        
        const newBaseFreq = this.calculateBaseFrequency(stressLevel);
        const newBeatFreq = this.calculateBeatFrequency(stressLevel);
        
        // Smoothly transition frequencies
        this.leftOscillator.frequency.linearRampToValueAtTime(
            newBaseFreq,
            this.context.currentTime + 0.5
        );
        
        this.rightOscillator.frequency.linearRampToValueAtTime(
            newBaseFreq + newBeatFreq,
            this.context.currentTime + 0.5
        );
        
        // Update effects based on stress level
        if (this.effectsEnabled) {
            this.updateEffects(stressLevel);
        }
    }
    
    /**
     * Update audio effects based on stress level
     * @param {number} stressLevel - Current stress level
     */
    updateEffects(stressLevel) {
        // Adjust reverb based on stress level
        audioEffects.updateEffect('reverb', {
            wet: 0.3 + (stressLevel * 0.05),
            decay: 1 + (stressLevel * 0.2)
        });
        
        // Adjust filter based on stress level
        audioEffects.updateEffect('filter', {
            frequency: 2000 - (stressLevel * 100),
            Q: 1 + (stressLevel * 0.1)
        });
    }
    
    /**
     * Toggle audio effects
     * @param {boolean} enabled - Whether effects should be enabled
     */
    toggleEffects(enabled) {
        this.effectsEnabled = enabled;
        if (this.isPlaying) {
            this.initialize(this.currentStressLevel);
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.leftOscillator = null;
        this.rightOscillator = null;
        this.leftPanner = null;
        this.rightPanner = null;
        super.cleanup();
    }
} 