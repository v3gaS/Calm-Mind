import { BaseGenerator } from './BaseGenerator.js';

/**
 * Generator for ambient and nature sounds
 */
export class AmbientGenerator extends BaseGenerator {
    constructor(audioCore) {
        super(audioCore);
        this.bufferSource = null;
        this.soundBuffer = null;
        this.soundType = 'white';  // Default sound type
        this.loop = true;
    }

    /**
     * Available ambient sound types
     * @returns {Object} Map of sound types
     */
    static get soundTypes() {
        return {
            WHITE: 'white',
            PINK: 'pink',
            BROWN: 'brown',
            RAIN: 'rain',
            OCEAN: 'ocean',
            FOREST: 'forest'
        };
    }

    /**
     * Set the type of ambient sound
     * @param {string} type - Sound type from soundTypes
     */
    async setSoundType(type) {
        if (!Object.values(AmbientGenerator.soundTypes).includes(type)) {
            throw new Error('Invalid sound type');
        }

        this.soundType = type;
        
        // If already playing, restart with new sound type
        if (this.isPlaying) {
            await this.stop();
            await this.start();
        }
    }

    /**
     * Generate noise buffer
     * @private
     */
    _generateNoiseBuffer(type) {
        const bufferSize = 2 * this.context.sampleRate;  // 2 seconds of noise
        const buffer = this.context.createBuffer(2, bufferSize, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            let lastOut = 0;
            
            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                
                switch (type) {
                    case 'pink':
                        // Pink noise algorithm (filtered white noise)
                        lastOut = (lastOut + (0.02 * white)) / 1.02;
                        data[i] = lastOut * 3.5; // Amplify to compensate for filtering
                        break;
                        
                    case 'brown':
                        // Brown noise algorithm (integrated white noise)
                        lastOut = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = Math.min(Math.max(lastOut, -1), 1); // Prevent clipping
                        data[i] = lastOut * 3.5;
                        break;
                        
                    default: // white noise
                        data[i] = white;
                }
            }
        }
        
        return buffer;
    }

    /**
     * Load audio file for nature sounds
     * @private
     */
    async _loadAudioFile(type) {
        // In a real implementation, this would load actual audio files
        // For now, we'll simulate with noise
        return this._generateNoiseBuffer('pink');  // Use pink noise as placeholder
    }

    /**
     * Initialize sound playback
     * @protected
     */
    async _onStart() {
        // Generate or load the appropriate sound buffer
        if (['white', 'pink', 'brown'].includes(this.soundType)) {
            this.soundBuffer = this._generateNoiseBuffer(this.soundType);
        } else {
            this.soundBuffer = await this._loadAudioFile(this.soundType);
        }

        // Create and configure buffer source
        this.bufferSource = this.context.createBufferSource();
        this.bufferSource.buffer = this.soundBuffer;
        this.bufferSource.loop = this.loop;
        
        // Add subtle random pitch modulation for more natural sound
        if (['rain', 'ocean', 'forest'].includes(this.soundType)) {
            const pitchModulation = this.context.createOscillator();
            const modulationGain = this.context.createGain();
            pitchModulation.frequency.value = 0.1; // Very slow modulation
            modulationGain.gain.value = 0.002;     // Subtle effect
            pitchModulation.connect(modulationGain);
            modulationGain.connect(this.bufferSource.playbackRate);
            pitchModulation.start();
        }

        // Connect to output
        this.bufferSource.connect(this.output);
        this.bufferSource.start();
    }

    /**
     * Stop sound playback
     * @protected
     */
    async _onStop() {
        if (this.bufferSource) {
            this.bufferSource.stop();
            this.bufferSource.disconnect();
            this.bufferSource = null;
        }
    }

    /**
     * Set looping behavior
     * @param {boolean} shouldLoop - Whether the sound should loop
     */
    setLoop(shouldLoop) {
        this.loop = shouldLoop;
        if (this.bufferSource) {
            this.bufferSource.loop = shouldLoop;
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.isPlaying) {
            this.stop();
        }
        super.dispose();
    }
} 