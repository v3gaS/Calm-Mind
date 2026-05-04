import { audioContextManager } from '../../core/AudioContext.js';
import { eventBus, EventTypes } from '../../core/EventBus.js';

/**
 * @class AudioEffects
 * @description Manages audio effects processing chain
 */
export class AudioEffects {
    constructor() {
        this.context = audioContextManager.getContext();
        this.effects = new Map();
        this.effectsChain = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the effects system
     * @returns {boolean} Success status
     */
    initialize() {
        if (this.isInitialized) return true;

        try {
            // Create default effects
            this.createEffect('reverb', {
                decay: 2,
                reverse: false,
                wet: 0.5
            });

            this.createEffect('delay', {
                delayTime: 0.3,
                feedback: 0.4,
                wet: 0.3
            });

            this.createEffect('filter', {
                frequency: 1000,
                Q: 1,
                type: 'lowpass'
            });

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio effects:', error);
            eventBus.emit(EventTypes.SYSTEM.ERROR, {
                type: 'audio',
                error: error
            });
            return false;
        }
    }

    /**
     * Create a new audio effect
     * @param {string} type - Effect type
     * @param {Object} params - Effect parameters
     * @returns {AudioNode} The created effect node
     */
    createEffect(type, params) {
        if (!this.context) return null;

        try {
            let effectNode;

            switch (type) {
                case 'reverb':
                    effectNode = this.createReverb(params);
                    break;
                case 'delay':
                    effectNode = this.createDelay(params);
                    break;
                case 'filter':
                    effectNode = this.createFilter(params);
                    break;
                default:
                    throw new Error(`Unknown effect type: ${type}`);
            }

            this.effects.set(type, effectNode);
            return effectNode;
        } catch (error) {
            console.error(`Failed to create ${type} effect:`, error);
            return null;
        }
    }

    /**
     * Create a reverb effect
     * @param {Object} params - Reverb parameters
     * @returns {ConvolverNode} The reverb node
     */
    createReverb(params) {
        const convolver = this.context.createConvolver();
        const gainNode = this.context.createGain();
        
        // Generate impulse response
        const length = this.context.sampleRate * params.decay;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, params.decay);
            }
        }
        
        convolver.buffer = impulse;
        gainNode.gain.value = params.wet;
        
        return { node: convolver, gain: gainNode };
    }

    /**
     * Create a delay effect
     * @param {Object} params - Delay parameters
     * @returns {DelayNode} The delay node
     */
    createDelay(params) {
        const delay = this.context.createDelay();
        const feedback = this.context.createGain();
        const wet = this.context.createGain();
        
        delay.delayTime.value = params.delayTime;
        feedback.gain.value = params.feedback;
        wet.gain.value = params.wet;
        
        delay.connect(feedback);
        feedback.connect(delay);
        
        return { node: delay, wet: wet };
    }

    /**
     * Create a filter effect
     * @param {Object} params - Filter parameters
     * @returns {BiquadFilterNode} The filter node
     */
    createFilter(params) {
        const filter = this.context.createBiquadFilter();
        
        filter.type = params.type;
        filter.frequency.value = params.frequency;
        filter.Q.value = params.Q;
        
        return { node: filter };
    }

    /**
     * Connect effects in chain
     * @param {AudioNode} sourceNode - Source audio node
     * @param {AudioNode} destinationNode - Destination audio node
     */
    connectEffects(sourceNode, destinationNode) {
        if (!this.isInitialized) return;

        let currentNode = sourceNode;

        this.effectsChain.forEach(effectType => {
            const effect = this.effects.get(effectType);
            if (effect) {
                currentNode.connect(effect.node);
                if (effect.gain) {
                    effect.gain.connect(destinationNode);
                }
                currentNode = effect.node;
            }
        });

        currentNode.connect(destinationNode);
    }

    /**
     * Update effect parameters
     * @param {string} type - Effect type
     * @param {Object} params - New parameters
     */
    updateEffect(type, params) {
        const effect = this.effects.get(type);
        if (!effect) return;

        try {
            switch (type) {
                case 'reverb':
                    if (params.wet !== undefined) effect.gain.gain.value = params.wet;
                    break;
                case 'delay':
                    if (params.delayTime !== undefined) effect.node.delayTime.value = params.delayTime;
                    if (params.feedback !== undefined) effect.feedback.gain.value = params.feedback;
                    if (params.wet !== undefined) effect.wet.gain.value = params.wet;
                    break;
                case 'filter':
                    if (params.frequency !== undefined) effect.node.frequency.value = params.frequency;
                    if (params.Q !== undefined) effect.node.Q.value = params.Q;
                    if (params.type !== undefined) effect.node.type = params.type;
                    break;
            }
        } catch (error) {
            console.error(`Failed to update ${type} effect:`, error);
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.effects.forEach(effect => {
            try {
                effect.node.disconnect();
                if (effect.gain) effect.gain.disconnect();
                if (effect.feedback) effect.feedback.disconnect();
                if (effect.wet) effect.wet.disconnect();
            } catch (error) {
                console.error('Error cleaning up effect:', error);
            }
        });
        
        this.effects.clear();
        this.effectsChain = [];
        this.isInitialized = false;
    }
}

// Export singleton instance
export const audioEffects = new AudioEffects(); 