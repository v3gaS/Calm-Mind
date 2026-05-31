import { AudioEffect } from './AudioEffect.js';

/**
 * Reverb audio effect
 */
export class ReverbEffect extends AudioEffect {
    constructor(audioContext) {
        super(audioContext);
        this.convolver = this.context.createConvolver();
        this.input.connect(this.convolver);
        this.convolver.connect(this.wet);
        
        this.decayTime = 2.0;  // Default decay time in seconds
        this.generateImpulseResponse();
    }

    /**
     * Set reverb decay time
     * @param {number} time - Decay time in seconds
     */
    setDecayTime(time) {
        this.decayTime = Math.max(0.1, Math.min(10, time));
        this.generateImpulseResponse();
    }

    /**
     * Generate impulse response for reverb
     * @private
     */
    generateImpulseResponse() {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * this.decayTime;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                // Exponential decay
                const decay = Math.exp(-6.91 * i / length);
                
                // White noise with decay
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        // Apply low-pass filter effect to make it sound more natural
        const nyquist = sampleRate / 2;
        const filterFreq = nyquist / 4; // Cut off high frequencies
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, this.context.currentTime);
        
        const tempSource = this.context.createBufferSource();
        tempSource.buffer = impulse;
        
        // Create a temporary buffer for the filtered result
        const filteredImpulse = this.context.createBuffer(2, length, sampleRate);
        
        // Process each channel through the filter
        for (let channel = 0; channel < 2; channel++) {
            const tempGain = this.context.createGain();
            const tempFilter = this.context.createBiquadFilter();
            tempFilter.type = 'lowpass';
            tempFilter.frequency.value = filterFreq;
            
            const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
            const offlineSource = offlineCtx.createBufferSource();
            const offlineFilter = offlineCtx.createBiquadFilter();
            
            offlineFilter.type = 'lowpass';
            offlineFilter.frequency.value = filterFreq;
            
            offlineSource.buffer = impulse;
            offlineSource.connect(offlineFilter);
            offlineFilter.connect(offlineCtx.destination);
            
            offlineSource.start();
            offlineCtx.startRendering().then((filteredBuffer) => {
                filteredImpulse.copyToChannel(filteredBuffer.getChannelData(0), channel);
            });
        }
        
        // Set the filtered impulse response
        this.convolver.buffer = filteredImpulse;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.convolver.disconnect();
        super.dispose();
    }
} 