import { AudioManager } from '../core/AudioManager.js';
import { AudioVisualizer } from '../visualization/AudioVisualizer.js';
import { ReverbEffect } from '../effects/ReverbEffect.js';

class AudioTherapyUI {
    constructor() {
        this.audioManager = new AudioManager();
        this.currentGenerator = null;
        this.visualizer = null;
        this.reverbEffect = null;
        this.isPlaying = false;

        // Initialize audio system
        this.audioManager.initialize().then(() => {
            console.log('Audio system initialized');
            this.setupVisualizer();
            this.setupEffects();
        });

        // Bind UI elements
        this.bindUIElements();
        this.setupEventListeners();
    }

    bindUIElements() {
        this.elements = {
            generatorType: document.getElementById('generatorType'),
            carrierFreq: document.getElementById('carrierFreq'),
            carrierFreqValue: document.getElementById('carrierFreqValue'),
            beatFreq: document.getElementById('beatFreq'),
            beatFreqValue: document.getElementById('beatFreqValue'),
            volume: document.getElementById('volume'),
            reverbEffect: document.getElementById('reverbEffect'),
            playButton: document.getElementById('playButton'),
            stopButton: document.getElementById('stopButton'),
            visType: document.getElementById('visType'),
            sessionInfo: document.getElementById('sessionInfo')
        };
    }

    setupEventListeners() {
        // Generator type change
        this.elements.generatorType.addEventListener('change', () => {
            if (this.isPlaying) {
                this.stopSound();
            }
            this.updateControls();
        });

        // Frequency controls
        this.elements.carrierFreq.addEventListener('input', (e) => {
            this.elements.carrierFreqValue.textContent = `${e.target.value} Hz`;
            if (this.currentGenerator) {
                this.updateGeneratorSettings();
            }
        });

        this.elements.beatFreq.addEventListener('input', (e) => {
            this.elements.beatFreqValue.textContent = `${e.target.value} Hz`;
            if (this.currentGenerator) {
                this.updateGeneratorSettings();
            }
        });

        // Volume control
        this.elements.volume.addEventListener('input', (e) => {
            this.audioManager.setMasterVolume(parseFloat(e.target.value));
        });

        // Effect controls
        this.elements.reverbEffect.addEventListener('change', (e) => {
            if (this.currentGenerator) {
                this.toggleReverb(e.target.checked);
            }
        });

        // Playback controls
        this.elements.playButton.addEventListener('click', () => this.playSound());
        this.elements.stopButton.addEventListener('click', () => this.stopSound());

        // Visualization type
        this.elements.visType.addEventListener('change', (e) => {
            if (this.visualizer) {
                this.visualizer.setType(e.target.value);
            }
        });
    }

    setupVisualizer() {
        const canvas = document.getElementById('visualizer');
        this.visualizer = new AudioVisualizer(this.audioManager.audioCore.context, canvas);
        
        // Set up canvas size
        const resize = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();
    }

    setupEffects() {
        this.reverbEffect = new ReverbEffect(this.audioManager.audioCore.context);
    }

    updateControls() {
        const type = this.elements.generatorType.value;
        
        // Show/hide relevant controls based on generator type
        switch (type) {
            case 'solfeggio':
                this.elements.beatFreq.parentElement.style.display = 'none';
                break;
            case 'ambient':
                this.elements.carrierFreq.parentElement.style.display = 'none';
                this.elements.beatFreq.parentElement.style.display = 'none';
                break;
            default:
                this.elements.carrierFreq.parentElement.style.display = 'block';
                this.elements.beatFreq.parentElement.style.display = 'block';
        }
    }

    updateGeneratorSettings() {
        const type = this.elements.generatorType.value;
        const carrierFreq = parseFloat(this.elements.carrierFreq.value);
        const beatFreq = parseFloat(this.elements.beatFreq.value);

        switch (type) {
            case 'binaural':
            case 'monaural':
            case 'isochronic':
                this.currentGenerator.setFrequencies(carrierFreq, beatFreq);
                break;
            case 'solfeggio':
                this.currentGenerator.setFrequency(carrierFreq);
                break;
        }
    }

    toggleReverb(enabled) {
        if (!this.currentGenerator) return;

        if (enabled) {
            this.currentGenerator.output.disconnect();
            this.currentGenerator.output.connect(this.reverbEffect.input);
            this.reverbEffect.connect(this.audioManager.audioCore.masterGain);
        } else {
            this.currentGenerator.output.disconnect();
            this.currentGenerator.output.connect(this.audioManager.audioCore.masterGain);
            this.reverbEffect.disconnect();
        }
    }

    async playSound() {
        if (this.isPlaying) return;

        const type = this.elements.generatorType.value;
        
        // Create new generator
        this.currentGenerator = this.audioManager.createGenerator(type, 'main');
        
        // Apply current settings
        this.updateGeneratorSettings();
        
        // Connect to visualizer
        this.currentGenerator.output.connect(this.visualizer.input);
        
        // Apply effects if enabled
        if (this.elements.reverbEffect.checked) {
            this.toggleReverb(true);
        }
        
        // Start playback
        await this.currentGenerator.start();
        this.visualizer.start();
        this.isPlaying = true;
        
        // Update session info
        this.updateSessionInfo();
    }

    async stopSound() {
        if (!this.isPlaying) return;

        await this.currentGenerator.stop();
        this.visualizer.stop();
        this.isPlaying = false;
        
        // Update session info
        this.elements.sessionInfo.textContent = 'No active session';
    }

    updateSessionInfo() {
        const type = this.elements.generatorType.value;
        const carrierFreq = this.elements.carrierFreq.value;
        const beatFreq = this.elements.beatFreq.value;
        
        let info = `Active Session:\n`;
        info += `Type: ${type}\n`;
        
        if (type !== 'ambient') {
            info += `Carrier Frequency: ${carrierFreq} Hz\n`;
            if (type !== 'solfeggio') {
                info += `Beat Frequency: ${beatFreq} Hz\n`;
            }
        }
        
        this.elements.sessionInfo.textContent = info;
    }
}

// Initialize the UI when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new AudioTherapyUI();
}); 