/**
 * CalmMind browser audio engine (Web Audio API).
 * Exposes window.initAudio, playGeneratedTrack, getAnalyser, setVolume, stopCurrentTrack, setPlayingState.
 */
'use strict';

const DEBUG_AUDIO = false;
const AMBIENT_VOLUME = 0.2;
const ANALYSER_FFT_SIZE = 512;
const ANALYSER_SMOOTHING = 0.8;
const DEFAULT_MASTER_GAIN = 0.5;

let audioContext = null;
let masterGain = null;
let binauralOsc1;
let binauralOsc2;
let ambientOsc;
let soundTypeNodes = [];
let analyser = null;
/** Track-level flag (separate from app.js UI `isPlaying`). */
let audioEnginePlaying = false;
let trackStopTimerId = null;
/** @type {Array|null} set per track from session protocol */
let activeFrequencyPhases = null;
/** @type {string} breath pattern key for HRV sessions */
let activeBreathPattern = 'coherent';

function debugLog(...args) {
    if (DEBUG_AUDIO) console.log('[CalmMind audio]', ...args);
}

function safeDisconnect(node) {
    if (!node) return;
    try {
        node.disconnect();
    } catch {
        /* already disconnected */
    }
}

/** masterGain → analyser → destination */
function connectOutputChain() {
    if (!audioContext || !masterGain) return;
    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
    }
    safeDisconnect(masterGain);
    safeDisconnect(analyser);
    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);
}

function initAudio() {
    try {
        if (audioContext) {
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch((err) => console.error('Failed to resume AudioContext:', err));
            }
            if (masterGain) window.masterGain = masterGain;
            return true;
        }

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            console.error('Web Audio API is not supported in this browser.');
            return false;
        }

        audioContext = new Ctx();
        masterGain = audioContext.createGain();
        masterGain.gain.value = DEFAULT_MASTER_GAIN;
        connectOutputChain();
        window.masterGain = masterGain;
        debugLog('AudioContext ready:', audioContext.state);
        return true;
    } catch (error) {
        console.error('Error initializing audio:', error);
        return false;
    }
}

window.getAnalyser = function getAnalyser() {
    if (!audioContext && !initAudio()) return null;

    if (!analyser && audioContext) {
        try {
            if (!masterGain) {
                masterGain = audioContext.createGain();
                masterGain.gain.value = DEFAULT_MASTER_GAIN;
                window.masterGain = masterGain;
            }
            connectOutputChain();
        } catch (error) {
            console.error('Error creating analyser:', error);
            return null;
        }
    }

    return analyser;
};

// Expose functions to get audio context and master gain
window.getAudioContext = function() {
    if (!audioContext) {
        initAudio();
    }
    return audioContext;
};

window.getMasterGain = function() {
    if (!masterGain && audioContext) {
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.5;
        connectOutputChain();
        window.masterGain = masterGain;
    }
    return masterGain;
};

window.setVolume = function (value) {
    if (!audioContext) initAudio();
    if (masterGain) {
        masterGain.gain.value = Math.max(0, Math.min(1, Number(value)));
    }
};

// Expose initAudio function globally
window.initAudio = initAudio;

/**
 * Main entry from UI: generate audio and wire visualizer.
 * @param {string} [vizType] — from #visualizerType (particles | meshWave)
 * @returns {boolean|Promise<boolean>}
 */
function playGeneratedTrack(stressLevel, duration, ambientSound, soundType, vizType, options = {}) {
    debugLog('Generating track with settings:', { stressLevel, duration, ambientSound, soundType, vizType, options });
    activeFrequencyPhases = options.frequencyPhases || null;
    activeBreathPattern = options.breathPattern || 'coherent';

    if (!audioContext) {
        try {
            if (!initAudio()) {
                console.error("Failed to initialize audio");
                return false;
            }
        } catch (error) {
            console.error("Failed to initialize audio context:", error);
            return false;
        }
    }

    function generateAndStartTrack() {
        try {
            generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType);

            const canvas = document.getElementById('visualizerCanvas');
            if (window.setupVisualizer && analyser && canvas) {
                const inferred =
                    soundType.includes('binaural') ? 'particles' :
                    soundType.includes('isochronic') ? 'meshWave' : 'particles';
                const resolvedViz =
                    vizType === 'meshWave' || vizType === 'particles' || vizType === 'spectrum'
                        ? vizType
                        : inferred;

                window.setupVisualizer(canvas, analyser, resolvedViz);
                debugLog("Visualizer set up with analyzer and type:", resolvedViz);
            }

            setPlayingState(true);

            return true;
        } catch (error) {
            console.error("Error generating track:", error);
            console.error('Error generating track');
            return false;
        }
    }

    if (audioContext.state === 'suspended') {
        return audioContext.resume()
            .then(() => {
                debugLog("Audio context resumed from suspended state");
                return generateAndStartTrack();
            })
            .catch((error) => {
                console.error("Failed to resume audio context:", error);
                return false;
            });
    }

    return generateAndStartTrack();
}

window.playGeneratedTrack = playGeneratedTrack;

// Generate personalized track based on user input
function generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType) {
    stopCurrentTrack();
    
    // Clear previous sound type nodes
    soundTypeNodes.forEach(node => {
        if (node) node.disconnect();
    });
    soundTypeNodes = [];
    
    debugLog("Generating track with soundType:", soundType);
    
    if (!analyser && audioContext) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
    }
    if (masterGain && analyser && audioContext) {
        connectOutputChain();
    }
    
    // Convert duration from minutes to seconds for the rest of the system
    let durationMinutes = Number(duration);
    if (!Number.isFinite(durationMinutes)) durationMinutes = 10;
    durationMinutes = Math.max(1, Math.min(60, durationMinutes));
    const durationSeconds = durationMinutes * 60;
    
    // Handle both old and new sound type values with mapping
    if (soundType === 'binauralRelax' || soundType === 'binauralFocus' || 
        soundType === 'binauralSleep' || soundType === 'binaural') {
        // For new specific binaural types, adjust the stress level based on intent
        let adjustedStressLevel = stressLevel;
        if (soundType === 'binauralFocus') {
            adjustedStressLevel = Math.min(stressLevel + 2, 10); // Higher frequency for focus
        } else if (soundType === 'binauralSleep') {
            adjustedStressLevel = Math.max(stressLevel - 2, 1); // Lower frequency for sleep
        }
        generateBinauralBeats(adjustedStressLevel, durationSeconds);
    } else if (soundType === 'isochronicEnergy' || soundType === 'isochronicMeditate' ||
               soundType === 'isochronicSleep' || soundType === 'isochronic') {
        let adjustedStressLevel = stressLevel;
        let isoOpts = {};
        if (soundType === 'isochronicEnergy') {
            adjustedStressLevel = Math.min(stressLevel + 3, 10);
        } else if (soundType === 'isochronicMeditate') {
            adjustedStressLevel = Math.max(stressLevel - 2, 1);
        } else if (soundType === 'isochronicSleep') {
            adjustedStressLevel = Math.max(stressLevel - 3, 1);
            isoOpts = { pulseOverride: 2.5, carrierHz: 180 };
        }
        generateIsochronicTones(adjustedStressLevel, durationSeconds, isoOpts);
    } else if (soundType === 'pinkNoise' || soundType === 'whiteNoise' || soundType === 'brownNoise') {
        const spectrum = soundType.replace('Noise', '').toLowerCase();
        generateColoredNoise(spectrum, durationSeconds);
    } else if (soundType === 'nature') {
        generateNatureEnhancedSound(ambientSound, durationSeconds);
    } else if (soundType === 'solfeggio') {
        generateSolfeggioFrequencies(stressLevel, durationSeconds);
    } else if (soundType === 'monaural') {
        generateMonauralBeats(stressLevel, durationSeconds);
    } else if (soundType === 'gamma') {
        generateGammaWaves(durationSeconds);
    } else if (soundType === 'hrv') {
        generateHRVCoherence(durationSeconds, activeBreathPattern);
    } else if (soundType === 'soundBath') {
        generateSoundBath(durationSeconds);
    } else if (soundType === 'psychoacoustic') {
        generatePsychoacousticMood(stressLevel, durationSeconds);
    } else if (soundType === 'neuroacoustic') {
        generateNeuroacoustic(stressLevel, durationSeconds);
    } else if (soundType === 'emdrBls') {
        if (typeof window.generateEMDRBilateral === 'function') {
            window.generateEMDRBilateral(audioContext, masterGain, durationSeconds, soundTypeNodes);
            toggleSpatialIndicator(true);
        }
    } else {
        console.error("Unknown sound type:", soundType);
        generateBinauralBeats(stressLevel, durationSeconds);
    }
    
    if (ambientSound !== 'none' && soundType !== 'nature' && soundType !== 'soundBath') {
        playAmbientLayer(ambientSound, durationSeconds);
    }
    
    if (durationSeconds > 0) {
        if (trackStopTimerId) clearTimeout(trackStopTimerId);
        trackStopTimerId = setTimeout(() => {
            trackStopTimerId = null;
            stopCurrentTrack();
        }, durationSeconds * 1000);
        debugLog(`Track stops in ${durationSeconds}s`);
    }
}

// Toggle spatial audio indicator visibility
function toggleSpatialIndicator(show) {
    const indicator = document.getElementById('spatialIndicator');
    if (indicator) {
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
}

// Generate binaural beats based on stress level
/** @param {number} trackDurationSec total playback length in seconds (UI minutes already converted by caller) */
function generateBinauralBeats(stressLevel, trackDurationSec = 600) {
    debugLog('Generating binaural beats with stress level:', stressLevel, 'and duration:', trackDurationSec, 'seconds');
    
    // Ensure audioContext is initialized
    if (!audioContext) {
        if (!initAudio()) {
            console.error("Failed to initialize audio context in generateBinauralBeats");
            return false;
        }
    }
    
    // Show spatial indicator for binaural beats as they use left/right channels
    toggleSpatialIndicator(true);
    
    // Increase base frequency to audible range while keeping beat frequencies appropriate
    // Human hearing typically starts around 20Hz
    const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 180 : 160;
    const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4;
    
    try {
        binauralOsc1 = audioContext.createOscillator();
        binauralOsc2 = audioContext.createOscillator();
        
        binauralOsc1.type = 'sine';
        binauralOsc2.type = 'sine';
        
        binauralOsc1.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        binauralOsc2.frequency.setValueAtTime(baseFreq + beatFreq, audioContext.currentTime);
        
        // Define variables for use throughout the function
        let leftPanner, rightPanner, merger;
        
        // Use StereoPannerNode if available, otherwise fallback to a different approach
        if (audioContext.createStereoPanner) {
            debugLog('Using StereoPanner for binaural beats');
            leftPanner = audioContext.createStereoPanner();
            rightPanner = audioContext.createStereoPanner();
            
            leftPanner.pan.value = -1; // Full left
            rightPanner.pan.value = 1; // Full right
            
            binauralOsc1.connect(leftPanner);
            binauralOsc2.connect(rightPanner);
            
            // Don't connect to masterGain yet, we'll connect through volumeBoost
            // leftPanner.connect(masterGain); 
            // rightPanner.connect(masterGain);
            
            soundTypeNodes.push(binauralOsc1, binauralOsc2, leftPanner, rightPanner);
        } else {
            // Fallback for browsers without StereoPanner
            debugLog('Using ChannelSplitter fallback for binaural beats');
            merger = audioContext.createChannelMerger(2);
            const leftGain = audioContext.createGain();
            const rightGain = audioContext.createGain();
            
            leftGain.gain.value = 1;
            rightGain.gain.value = 1;
            
            binauralOsc1.connect(leftGain);
            binauralOsc2.connect(rightGain);
            
            // Connect left oscillator to left channel, right oscillator to right channel
            leftGain.connect(merger, 0, 0);  // Connect to left channel
            rightGain.connect(merger, 0, 1); // Connect to right channel
            
            merger.connect(masterGain);
            
            soundTypeNodes.push(binauralOsc1, binauralOsc2, leftGain, rightGain, merger);
        }
        
        // Fix volume boost implementation to avoid feedback loop
        const volumeBoost = audioContext.createGain();
        volumeBoost.gain.value = 1.5; // Boost volume for binaural beats
        
        // Disconnect oscillators from their current connections
        if (audioContext.createStereoPanner) {
            leftPanner.disconnect();
            rightPanner.disconnect();
            
            // Connect to volume boost instead
            leftPanner.connect(volumeBoost);
            rightPanner.connect(volumeBoost);
        } else {
            merger.disconnect();
            merger.connect(volumeBoost);
        }
        
        // Connect boost directly to master gain
        volumeBoost.connect(masterGain);
        soundTypeNodes.push(volumeBoost);
        
        binauralOsc1.start();
        binauralOsc2.start();

        if (activeFrequencyPhases?.length && window.FrequencyScheduler) {
            window.FrequencyScheduler.scheduleBinauralPhases(
                audioContext,
                binauralOsc1,
                binauralOsc2,
                activeFrequencyPhases,
                volumeBoost
            );
        }
        
        // Ensure audio context is running
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                debugLog('Audio context resumed for binaural beats');
            }).catch(err => {
                console.error('Failed to resume audio context for binaural beats:', err);
            });
        }
        
        const durationInSeconds = Math.max(0, trackDurationSec);
        binauralOsc1.stop(audioContext.currentTime + durationInSeconds);
        binauralOsc2.stop(audioContext.currentTime + durationInSeconds);
        debugLog('Binaural beats scheduled to stop after', durationInSeconds, 'seconds');
    } catch (error) {
        console.error("Error generating binaural beats:", error);
        return false;
    }
}

// Colored noise buffers: white | pink | brown
function createNoiseBuffer(spectrum) {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    if (spectrum === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
        }
        return noiseBuffer;
    }

    if (spectrum === 'brown') {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.5;
        }
        return noiseBuffer;
    }

    // pink (default)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
    }
    return noiseBuffer;
}

/** @param {'white'|'pink'|'brown'} spectrum @param {number} trackDurationSec */
function generateColoredNoise(spectrum, trackDurationSec = 600) {
    debugLog('Generating', spectrum, 'noise with duration:', trackDurationSec, 'seconds');
    const noiseBuffer = createNoiseBuffer(spectrum);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(masterGain);
    noiseSource.start();

    const durationInSeconds = Math.max(0, trackDurationSec);
    noiseSource.stop(audioContext.currentTime + durationInSeconds);
    debugLog(spectrum, 'noise scheduled to stop after', durationInSeconds, 'seconds');
    soundTypeNodes.push(noiseSource);
}

/** @deprecated use generateColoredNoise('pink', ...) */
function generatePinkNoise(trackDurationSec = 600) {
    generateColoredNoise('pink', trackDurationSec);
}

// Generate isochronic tones for focus and meditation
/** @param {number} trackDurationSec seconds @param {{ pulseOverride?: number, carrierHz?: number }} [opts] */
function generateIsochronicTones(stressLevel, trackDurationSec = 600, opts = {}) {
    let pulseFreq = opts.pulseOverride ?? (stressLevel <= 3 ? 14 : stressLevel <= 6 ? 10 : 6);
    let carrierHz = opts.carrierHz ?? (180 + stressLevel * 12);

    if (activeFrequencyPhases?.length) {
        pulseFreq = activeFrequencyPhases[0].beatHz ?? pulseFreq;
        carrierHz = activeFrequencyPhases[0].carrierHz ?? carrierHz;
    }

    debugLog('Generating isochronic tones:', { stressLevel, pulseHz: pulseFreq, carrierHz, trackDurationSec });

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(carrierHz, audioContext.currentTime);

    const gainNode = audioContext.createGain();
    const isoBoost = audioContext.createGain();
    isoBoost.gain.value = 1.15;

    osc.connect(gainNode);
    gainNode.connect(isoBoost);
    isoBoost.connect(masterGain);

    let pulseTimer = null;
    let isOn = true;
    let cancelPhaseScheduler = () => {};

    const startPulse = () => {
        if (pulseTimer) clearInterval(pulseTimer);
        const halfPeriodMs = (1000 / pulseFreq) / 2;
        const rampSec = Math.min(0.09, halfPeriodMs / 1000 * 0.85);
        pulseTimer = setInterval(() => {
            if (!audioContext) {
                clearInterval(pulseTimer);
                return;
            }
            const t = audioContext.currentTime;
            if (isOn) {
                gainNode.gain.setValueAtTime(0.38, t);
                gainNode.gain.linearRampToValueAtTime(0.07, t + rampSec);
            } else {
                gainNode.gain.setValueAtTime(0.07, t);
                gainNode.gain.linearRampToValueAtTime(0.38, t + rampSec);
            }
            isOn = !isOn;
        }, halfPeriodMs);
    };

    if (activeFrequencyPhases?.length && window.FrequencyScheduler) {
        cancelPhaseScheduler = window.FrequencyScheduler.scheduleIsochronicPhases(
            audioContext,
            activeFrequencyPhases,
            (beatHz, carrier) => {
                pulseFreq = beatHz ?? pulseFreq;
                carrierHz = carrier ?? carrierHz;
                osc.frequency.setValueAtTime(carrierHz, audioContext.currentTime);
                startPulse();
            }
        );
    }

    gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
    osc.start();
    startPulse();

    const durationInSeconds = Math.max(0, trackDurationSec);
    osc.stop(audioContext.currentTime + durationInSeconds);
    setTimeout(() => {
        clearInterval(pulseTimer);
        cancelPhaseScheduler();
    }, durationInSeconds * 1000);

    soundTypeNodes.push({
        disconnect: () => {
            clearInterval(pulseTimer);
            cancelPhaseScheduler();
        },
    });
    soundTypeNodes.push(osc, gainNode, isoBoost);
    debugLog('Isochronic tones scheduled to stop after', durationInSeconds, 'seconds');
}

function resolveNatureAmbientKey(ambientSound) {
    if (ambientSound && ambientSound !== 'none') return ambientSound;
    return 'forest';
}

function playAmbientLayer(type, trackDurationSec = 600) {
    if (type === 'none' || !audioContext || !masterGain) return;
    debugLog('Playing ambient layer:', type, trackDurationSec);
    window.AmbientLoader?.stopAllAmbient?.();
    if (window.AmbientLoader?.playAmbient) {
        window.AmbientLoader.playAmbient(
            type,
            trackDurationSec,
            AMBIENT_VOLUME,
            audioContext,
            masterGain,
            soundTypeNodes
        );
    }
}

function generateNatureEnhancedSound(ambientSound, trackDurationSec = 600) {
    const key = resolveNatureAmbientKey(ambientSound);
    if (key === 'forest-stream' || key === 'forest') {
        playAmbientLayer(key, trackDurationSec);
        return;
    }
    playAmbientLayer(key, trackDurationSec);
}

// Stop current track
function stopCurrentTrack() {
    if (trackStopTimerId) {
        clearTimeout(trackStopTimerId);
        trackStopTimerId = null;
    }

    debugLog('Stopping current track');

    if (!audioContext) {
        console.warn("No audio context to stop");
        return;
    }
    
    try {
        // Stop oscillators for binaural beats
        if (binauralOsc1) {
            binauralOsc1.stop();
            binauralOsc1.disconnect();
            binauralOsc1 = null;
        }
        
        if (binauralOsc2) {
            binauralOsc2.stop();
            binauralOsc2.disconnect();
            binauralOsc2 = null;
        }
        
        if (ambientOsc) {
            try {
                ambientOsc.stop();
                ambientOsc.disconnect();
            } catch {
                /* noop */
            }
            ambientOsc = null;
        }
        window.AmbientLoader?.stopAllAmbient?.();
        activeFrequencyPhases = null;
        
        // Stop all sound type nodes (for special sound types)
        soundTypeNodes.forEach(node => {
            if (node && node.stop) {
                try {
                    node.stop();
                } catch (error) {
                    console.warn("Error stopping node:", error);
                }
            }
            if (node && node.disconnect) {
                try {
                    node.disconnect();
                } catch (error) {
                    console.warn("Error disconnecting node:", error);
                }
            }
        });
        
        // Clear sound type nodes array
        soundTypeNodes = [];
        
        toggleSpatialIndicator(false);

        if (window.setPlayingState) {
            window.setPlayingState(false);
        }
    } catch (error) {
        console.error("Error stopping track:", error);
    }
}

// Expose stopCurrentTrack function globally
window.stopCurrentTrack = stopCurrentTrack;

// Generate Solfeggio frequencies based on stress level
function generateSolfeggioFrequencies(stressLevel, trackDurationSec = 600) {
    debugLog('Generating Solfeggio frequencies with stress level:', stressLevel, 'and duration:', trackDurationSec, 'seconds');
    
    // Solfeggio frequencies and their associated effects
    const solfeggioFreqs = {
        396: 'Liberating guilt and fear',
        417: 'Facilitating change',
        432: 'Universal harmony',
        528: 'Transformation and miracles',
        639: 'Connecting relationships',
        741: 'Awakening intuition',
        852: 'Returning to spiritual order'
    };
    
    // Select the appropriate Solfeggio frequency based on stress level
    let selectedFreq;
    if (stressLevel >= 8) {
        selectedFreq = 396; // High stress: liberate guilt and fear
    } else if (stressLevel >= 6) {
        selectedFreq = 417; // Moderate-high stress: facilitate change
    } else if (stressLevel >= 4) {
        selectedFreq = 639; // Moderate stress: connect relationships
    } else if (stressLevel >= 2) {
        selectedFreq = 528; // Low-moderate stress: transformation
    } else {
        selectedFreq = 852; // Low stress: spiritual order
    }
    
    debugLog(`Selected Solfeggio frequency: ${selectedFreq} Hz (${solfeggioFreqs[selectedFreq]})`);
    
    // Create oscillator for the main Solfeggio frequency
    const solfOsc = audioContext.createOscillator();
    solfOsc.type = 'sine';
    solfOsc.frequency.setValueAtTime(selectedFreq, audioContext.currentTime);
    
    // Create an envelope to shape the sound
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 2);
    
    // Add subtle harmonic overtones for a richer sound
    const overtone1 = audioContext.createOscillator();
    overtone1.type = 'sine';
    overtone1.frequency.setValueAtTime(selectedFreq * 2, audioContext.currentTime);
    
    const overtone2 = audioContext.createOscillator();
    overtone2.type = 'sine';
    overtone2.frequency.setValueAtTime(selectedFreq * 3, audioContext.currentTime);
    
    // Create gain nodes for the overtones (at lower volume)
    const overtone1Gain = audioContext.createGain();
    overtone1Gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    const overtone2Gain = audioContext.createGain();
    overtone2Gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    // Connect everything
    solfOsc.connect(envelope);
    envelope.connect(masterGain);
    
    overtone1.connect(overtone1Gain);
    overtone1Gain.connect(masterGain);
    
    overtone2.connect(overtone2Gain);
    overtone2Gain.connect(masterGain);
    
    // Start the oscillators
    solfOsc.start();
    overtone1.start();
    overtone2.start();
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            debugLog('Audio context resumed for Solfeggio frequencies');
        }).catch(err => {
            console.error('Failed to resume audio context for Solfeggio frequencies:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = Math.max(0, trackDurationSec);
    solfOsc.stop(audioContext.currentTime + durationInSeconds);
    overtone1.stop(audioContext.currentTime + durationInSeconds);
    overtone2.stop(audioContext.currentTime + durationInSeconds);
    
    debugLog('Solfeggio frequencies scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(solfOsc, envelope, overtone1, overtone1Gain, overtone2, overtone2Gain);
}

// Generate monaural beats based on stress level
function generateMonauralBeats(stressLevel, trackDurationSec = 600) {
    debugLog('Generating monaural beats with stress level:', stressLevel, 'and duration:', trackDurationSec, 'seconds');
    
    // Determine frequencies based on stress level (similar to binaural but with a single carrier)
    const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 160 : 120;
    const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4; // Alpha/Theta range
    
    // Create oscillator for the carrier tone
    const carrier = audioContext.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    
    // Create gain node for amplitude modulation
    const modulationGain = audioContext.createGain();
    modulationGain.gain.setValueAtTime(1, audioContext.currentTime);
    
    // Connect the carrier to the modulation gain
    carrier.connect(modulationGain);
    modulationGain.connect(masterGain);
    
    // Start the oscillator
    carrier.start();
    
    // Create LFO for amplitude modulation at the beat frequency
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(beatFreq, audioContext.currentTime);
    
    // Scale the LFO output to modulate between 0.3 and 0.8
    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(0.5, audioContext.currentTime); // Modulation depth
    
    // Scale and offset the LFO
    const lfoOffset = audioContext.createGain();
    lfoOffset.gain.setValueAtTime(0.5, audioContext.currentTime); // Center point of modulation
    
    // Connect LFO chain
    lfo.connect(lfoGain);
    lfoGain.connect(modulationGain.gain);
    
    // Add a constant offset to keep the gain positive
    const constantSource = audioContext.createConstantSource();
    constantSource.offset.setValueAtTime(0.5, audioContext.currentTime);
    constantSource.connect(modulationGain.gain);
    constantSource.start();
    
    // Start the LFO
    lfo.start();
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            debugLog('Audio context resumed for monaural beats');
        }).catch(err => {
            console.error('Failed to resume audio context for monaural beats:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = Math.max(0, trackDurationSec);
    carrier.stop(audioContext.currentTime + durationInSeconds);
    lfo.stop(audioContext.currentTime + durationInSeconds);
    constantSource.stop(audioContext.currentTime + durationInSeconds);
    
    debugLog('Monaural beats scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(carrier, modulationGain, lfo, lfoGain, constantSource);
}

// Generate gamma waves for cognitive enhancement
function generateGammaWaves(trackDurationSec = 600) {
    debugLog('Generating gamma waves with duration:', trackDurationSec, 'seconds');
    
    // Gamma frequency range (30-100 Hz)
    const gammaFreq = 40; // 40 Hz is associated with cognitive processing
    
    const gammaOsc = audioContext.createOscillator();
    gammaOsc.type = 'sine';
    gammaOsc.frequency.setValueAtTime(gammaFreq, audioContext.currentTime);
    
    // Create a gain node for the gamma oscillator
    const gammaGain = audioContext.createGain();
    gammaGain.gain.setValueAtTime(0.6, audioContext.currentTime); // Lower gain for comfort
    
    // Connect the oscillator to the gain node
    gammaOsc.connect(gammaGain);
    gammaGain.connect(masterGain);
    
    // Add a carrier frequency to make gamma waves more audible
    const carrierOsc = audioContext.createOscillator();
    carrierOsc.type = 'sine';
    carrierOsc.frequency.setValueAtTime(200, audioContext.currentTime);
    
    const carrierGain = audioContext.createGain();
    carrierGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    // Create a modulator to affect the carrier with gamma rhythms
    const modulatorGain = audioContext.createGain();
    carrierOsc.connect(carrierGain);
    carrierGain.connect(masterGain);
    
    // Start the oscillators
    gammaOsc.start();
    carrierOsc.start();
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            debugLog('Audio context resumed for gamma waves');
        }).catch(err => {
            console.error('Failed to resume audio context for gamma waves:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = Math.max(0, trackDurationSec);
    gammaOsc.stop(audioContext.currentTime + durationInSeconds);
    carrierOsc.stop(audioContext.currentTime + durationInSeconds);
    
    debugLog('Gamma waves scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(gammaOsc, gammaGain, carrierOsc, carrierGain);
}

// Generate HRV coherence patterns for heart-brain synchronization
function generateHRVCoherence(trackDurationSec = 600, breathPatternId = 'coherent') {
    const patternApi = window.CalmMindBreathPatterns;
    const pattern = patternApi?.getBreathPattern
        ? patternApi.getBreathPattern(breathPatternId)
        : { cycleSec: 10, phases: [{ name: 'inhale', durationSec: 4, carrierStart: 0.3, carrierEnd: 0.6, pulseEnd: 0.3 }, { name: 'exhale', durationSec: 6, carrierStart: 0.6, carrierEnd: 0.3, pulseEnd: 0 }] };

    debugLog('Generating HRV coherence:', { trackDurationSec, breathPatternId, cycleSec: pattern.cycleSec });

    const breathingLFO = audioContext.createOscillator();
    breathingLFO.type = 'sine';
    breathingLFO.frequency.setValueAtTime(1 / pattern.cycleSec, audioContext.currentTime);

    const breathingGain = audioContext.createGain();
    breathingGain.gain.setValueAtTime(0, audioContext.currentTime);
    breathingLFO.connect(breathingGain);

    const carrierOsc = audioContext.createOscillator();
    carrierOsc.type = 'sine';
    carrierOsc.frequency.setValueAtTime(256, audioContext.currentTime);

    const carrierGain = audioContext.createGain();
    carrierGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    carrierOsc.connect(carrierGain);
    carrierGain.connect(masterGain);

    const pulseOsc = audioContext.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.setValueAtTime(432, audioContext.currentTime);

    const pulseGain = audioContext.createGain();
    pulseGain.gain.setValueAtTime(0, audioContext.currentTime);
    pulseOsc.connect(pulseGain);
    pulseGain.connect(masterGain);

    breathingLFO.start();
    carrierOsc.start();
    pulseOsc.start();

    const runPhase = (phase) => {
        if (!audioContext) return;
        const t = audioContext.currentTime;
        const dur = Math.max(0.05, phase.durationSec);
        carrierGain.gain.cancelScheduledValues(t);
        carrierGain.gain.setValueAtTime(phase.carrierStart, t);
        carrierGain.gain.linearRampToValueAtTime(phase.carrierEnd, t + dur);
        pulseGain.gain.cancelScheduledValues(t);
        pulseGain.gain.setValueAtTime(phase.name === 'inhale' ? 0 : pulseGain.gain.value, t);
        if (phase.name === 'inhale') {
            pulseGain.gain.linearRampToValueAtTime(phase.pulseEnd ?? 0.3, t + dur);
        } else {
            pulseGain.gain.linearRampToValueAtTime(phase.pulseEnd ?? 0, t + dur);
        }
    };

    let phaseIndex = 0;
    const phaseTimeouts = [];

    const scheduleNextPhase = () => {
        if (!audioContext) return;
        const phase = pattern.phases[phaseIndex % pattern.phases.length];
        runPhase(phase);
        const tid = setTimeout(() => {
            phaseIndex += 1;
            scheduleNextPhase();
        }, phase.durationSec * 1000);
        phaseTimeouts.push(tid);
    };

    scheduleNextPhase();

    soundTypeNodes.push({
        disconnect: () => phaseTimeouts.forEach((id) => clearTimeout(id)),
    });

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            debugLog('Audio context resumed for HRV coherence');
        }).catch(err => {
            console.error('Failed to resume audio context for HRV coherence:', err);
        });
    }

    const durationInSeconds = Math.max(0, trackDurationSec);
    breathingLFO.stop(audioContext.currentTime + durationInSeconds);
    carrierOsc.stop(audioContext.currentTime + durationInSeconds);
    pulseOsc.stop(audioContext.currentTime + durationInSeconds);
    setTimeout(() => phaseTimeouts.forEach((id) => clearTimeout(id)), durationInSeconds * 1000);

    debugLog('HRV coherence scheduled to stop after', durationInSeconds, 'seconds');
    soundTypeNodes.push(breathingLFO, breathingGain, carrierOsc, carrierGain, pulseOsc, pulseGain);
}

// Generate virtual sound bath experience
function generateSoundBath(trackDurationSec = 600) {
    debugLog('Generating sound bath with duration:', trackDurationSec, 'seconds');
    
    // Show spatial indicator for sound bath as it uses spatial positioning
    toggleSpatialIndicator(true);
    
    // Singing bowl frequencies (traditional Tibetan bowls)
    const bowlFreqs = [
        264, // C4 - Root chakra
        297, // D4 - Sacral chakra
        330, // E4 - Solar plexus
        352, // F4 - Heart chakra
        396, // G4 - Throat chakra
        440, // A4 - Third eye
        495  // B4 - Crown chakra
    ];
    
    // Create oscillators for each bowl
    const bowls = bowlFreqs.map(freq => {
        // Main oscillator for fundamental frequency
        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        // Overtone oscillators for rich harmonics
        const overtones = [
            { freq: freq * 2.0, gain: 0.3 },  // First overtone
            { freq: freq * 3.2, gain: 0.2 },  // Second overtone (slightly detuned for realism)
            { freq: freq * 4.1, gain: 0.1 }   // Third overtone
        ].map(({ freq: overtoneFreq, gain }) => {
            const overtoneOsc = audioContext.createOscillator();
            overtoneOsc.type = 'sine';
            overtoneOsc.frequency.setValueAtTime(overtoneFreq, audioContext.currentTime);
            
            const overtoneGain = audioContext.createGain();
            overtoneGain.gain.setValueAtTime(gain, audioContext.currentTime);
            
            overtoneOsc.connect(overtoneGain);
            return { osc: overtoneOsc, gain: overtoneGain };
        });
        
        // Create spatial position for each bowl
        const panner = audioContext.createPanner();
        const angle = (bowlFreqs.indexOf(freq) / bowlFreqs.length) * Math.PI * 2;
        panner.setPosition(Math.cos(angle) * 3, Math.sin(angle) * 3, -1);
        
        // Main gain node for bowl volume envelope
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        // Connect everything
        osc.connect(gainNode);
        overtones.forEach(({ gain }) => gain.connect(gainNode));
        gainNode.connect(panner);
        panner.connect(masterGain);
        
        return {
            fundamental: osc,
            overtones,
            gain: gainNode,
            panner
        };
    });
    
    // Create a large gong for occasional deep resonance
    const gong = {
        fundamental: audioContext.createOscillator(),
        gain: audioContext.createGain(),
        panner: audioContext.createPanner()
    };
    
    gong.fundamental.type = 'sine';
    gong.fundamental.frequency.setValueAtTime(56, audioContext.currentTime); // Very low frequency
    gong.gain.gain.setValueAtTime(0, audioContext.currentTime);
    gong.panner.setPosition(0, 0, -5); // Gong positioned further back
    
    gong.fundamental.connect(gong.gain);
    gong.gain.connect(gong.panner);
    gong.panner.connect(masterGain);
    
    // Start all oscillators
    bowls.forEach(bowl => {
        bowl.fundamental.start();
        bowl.overtones.forEach(({ osc }) => osc.start());
    });
    gong.fundamental.start();
    
    // Create a sequence of bowl activations
    let lastBowlIndex = -1;
    const playBowl = () => {
        // Select a random bowl that wasn't the last one played
        let bowlIndex;
        do {
            bowlIndex = Math.floor(Math.random() * bowls.length);
        } while (bowlIndex === lastBowlIndex);
        lastBowlIndex = bowlIndex;
        
        const bowl = bowls[bowlIndex];
        
        // Create a natural envelope
        const now = audioContext.currentTime;
        bowl.gain.gain.cancelScheduledValues(now);
        bowl.gain.gain.setValueAtTime(0, now);
        bowl.gain.gain.linearRampToValueAtTime(0.7, now + 0.1);
        bowl.gain.gain.exponentialRampToValueAtTime(0.001, now + 8);
        
        // Subtle frequency modulation for more realism
        const freq = bowlFreqs[bowlIndex];
        bowl.fundamental.frequency.setValueAtTime(freq, now);
        bowl.fundamental.frequency.linearRampToValueAtTime(freq * 1.002, now + 0.1);
        bowl.fundamental.frequency.linearRampToValueAtTime(freq, now + 4);
    };
    
    // Play gong occasionally
    const playGong = () => {
        const now = audioContext.currentTime;
        gong.gain.gain.cancelScheduledValues(now);
        gong.gain.gain.setValueAtTime(0, now);
        gong.gain.gain.linearRampToValueAtTime(1, now + 0.05);
        gong.gain.gain.exponentialRampToValueAtTime(0.001, now + 15);
        
        // Complex frequency modulation for gong-like sound
        gong.fundamental.frequency.setValueAtTime(56, now);
        gong.fundamental.frequency.linearRampToValueAtTime(60, now + 0.1);
        gong.fundamental.frequency.exponentialRampToValueAtTime(56, now + 10);
    };
    
    // Schedule bowl and gong sounds
    const bowlInterval = setInterval(() => {
        if (!audioContext) {
            clearInterval(bowlInterval);
            return;
        }
        playBowl();
    }, 4000); // New bowl every 4 seconds
    
    const gongInterval = setInterval(() => {
        if (!audioContext) {
            clearInterval(gongInterval);
            return;
        }
        playGong();
    }, 30000); // Gong every 30 seconds
    
    // Store timer references for cleanup
    soundTypeNodes.push(
        {
            disconnect: () => {
                clearInterval(bowlInterval);
                clearInterval(gongInterval);
            }
        }
    );
    
    // Add all oscillators and gains to soundTypeNodes for cleanup
    bowls.forEach(bowl => {
        soundTypeNodes.push(
            bowl.fundamental,
            bowl.gain,
            bowl.panner,
            ...bowl.overtones.map(o => o.osc),
            ...bowl.overtones.map(o => o.gain)
        );
    });
    soundTypeNodes.push(gong.fundamental, gong.gain, gong.panner);
    
    // Stop after the specified duration
    const durationInSeconds = Math.max(0, trackDurationSec);
    setTimeout(() => {
        bowls.forEach(bowl => {
            const now = audioContext.currentTime;
            bowl.gain.gain.linearRampToValueAtTime(0, now + 2);
            bowl.fundamental.stop(now + 2);
            bowl.overtones.forEach(({ osc }) => osc.stop(now + 2));
        });
        gong.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);
        gong.fundamental.stop(audioContext.currentTime + 2);
    }, (durationInSeconds - 2) * 1000);
    
    debugLog('Sound bath scheduled to stop after', durationInSeconds, 'seconds');
}

// Generate psychoacoustic mood enhancement
function generatePsychoacousticMood(stressLevel, trackDurationSec = 600) {
    debugLog('Generating psychoacoustic mood enhancement with stress level:', stressLevel, 'and duration:', trackDurationSec, 'seconds');
    
    // Show spatial indicator for psychoacoustic mood as it uses panning
    toggleSpatialIndicator(true);
    
    // Harmonic series based on mood
    const fundamentalFreq = stressLevel <= 3 ? 432 : stressLevel <= 6 ? 396 : 528; // Different base frequencies for different moods
    const harmonics = [1, 1.5, 2, 2.5, 3, 4]; // Harmonic series for rich timbre

    const subMix = audioContext.createGain();
    subMix.gain.value = 1;

    // Create oscillators for harmonic progression
    const oscillators = harmonics.map((harmonic) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const panner = audioContext.createStereoPanner();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamentalFreq * harmonic, audioContext.currentTime);

        gain.gain.setValueAtTime(1 / harmonic, audioContext.currentTime);

        panner.pan.setValueAtTime((harmonic % 2 === 0 ? 0.5 : -0.5), audioContext.currentTime);

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(subMix);

        return { osc, gain, panner };
    });

    const dryGain = audioContext.createGain();
    dryGain.gain.value = 0.9;
    subMix.connect(dryGain);
    dryGain.connect(masterGain);
    
    // Start all oscillators
    oscillators.forEach(({ osc }) => osc.start());
    
    // Create timbral evolution sequence
    let phase = 0;
    const evolutionInterval = setInterval(() => {
        if (!audioContext) {
            clearInterval(evolutionInterval);
            return;
        }
        
        const now = audioContext.currentTime;
        phase = (phase + 1) % 4;
        
        // Evolve the timbre over time
        oscillators.forEach(({ gain, panner }, index) => {
            // Amplitude modulation
            const amplitude = 0.5 + 0.3 * Math.sin(phase + index * Math.PI / 3);
            gain.gain.linearRampToValueAtTime(amplitude / harmonics[index], now + 2);
            
            // Stereo movement
            const panPosition = 0.8 * Math.sin(phase + index * Math.PI / 2);
            panner.pan.linearRampToValueAtTime(panPosition, now + 2);
        });
        
    }, 4000); // Evolution every 4 seconds
    
    // Store evolution interval for cleanup
    soundTypeNodes.push({
        disconnect: () => clearInterval(evolutionInterval)
    });
    
    // Add all audio nodes to soundTypeNodes for cleanup
    oscillators.forEach(({ osc, gain, panner }) => {
        soundTypeNodes.push(osc, gain, panner);
    });
    
    // Create dynamic filter for additional color
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(fundamentalFreq * 2, audioContext.currentTime);
    filter.Q.setValueAtTime(1, audioContext.currentTime);
    
    // Modulate filter frequency
    const filterLFO = audioContext.createOscillator();
    const filterLFOGain = audioContext.createGain();
    filterLFO.frequency.setValueAtTime(0.1, audioContext.currentTime);
    filterLFOGain.gain.setValueAtTime(fundamentalFreq, audioContext.currentTime);
    
    filterLFO.connect(filterLFOGain);
    filterLFOGain.connect(filter.frequency);
    filterLFO.start();
    
    soundTypeNodes.push(filter, filterLFO, filterLFOGain);
    
    // Add reverb for spaciousness
    const convolver = audioContext.createConvolver();
    const reverbTime = 2.0;
    const sampleRate = audioContext.sampleRate;
    const reverbBuffer = audioContext.createBuffer(2, reverbTime * sampleRate, sampleRate);
    
    // Create reverb impulse response
    for (let channel = 0; channel < 2; channel++) {
        const channelData = reverbBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * reverbTime / 3));
        }
    }
    
    convolver.buffer = reverbBuffer;
    const reverbGain = audioContext.createGain();
    reverbGain.gain.setValueAtTime(0.28, audioContext.currentTime);

    subMix.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);

    soundTypeNodes.push(subMix, dryGain, convolver, reverbGain);
    
    // Stop after the specified duration
    const durationInSeconds = Math.max(0, trackDurationSec);
    setTimeout(() => {
        oscillators.forEach(({ osc, gain }) => {
            const now = audioContext.currentTime;
            gain.gain.linearRampToValueAtTime(0, now + 2);
            osc.stop(now + 2);
        });
        filterLFO.stop(audioContext.currentTime + 2);
        clearInterval(evolutionInterval);
    }, (durationInSeconds - 2) * 1000);
    
    debugLog('Psychoacoustic mood enhancement scheduled to stop after', durationInSeconds, 'seconds');
}

/** Layered detuned carriers for cognitive focus; @param {number} trackDurationSec seconds */
function generateNeuroacoustic(stressLevel, trackDurationSec = 600) {
    debugLog('Generating neuroacoustic with stress level:', stressLevel, 'duration (sec):', trackDurationSec);
    const t0 = audioContext.currentTime;
    const base = 200 + stressLevel * 16;
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(base, t0);
    osc2.frequency.setValueAtTime(base * 1.025, t0);
    const g1 = audioContext.createGain();
    const g2 = audioContext.createGain();
    g1.gain.value = 0.22;
    g2.gain.value = 0.22;
    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(masterGain);
    g2.connect(masterGain);
    osc1.start(t0);
    osc2.start(t0);
    const dur = Math.max(0, trackDurationSec);
    osc1.stop(t0 + dur);
    osc2.stop(t0 + dur);
    soundTypeNodes.push(osc1, osc2, g1, g2);
}

// Playing state: UI + analyser chain + visualizer (via window.__vizSetPlayingState from visualizer.js)
function setPlayingState(state) {
    audioEnginePlaying = state;

    const spatialIndicator = document.querySelector('.spatial-indicator');
    if (spatialIndicator) {
        spatialIndicator.classList.toggle('hidden', !state);
    }

    if (window.__vizSetPlayingState) {
        try {
            window.__vizSetPlayingState(state);
        } catch (error) {
            console.error("Error updating visualizer state:", error);
        }
    }

    if (state && audioContext && masterGain) {
        try {
            connectOutputChain();
        } catch (error) {
            console.error("Error reconnecting output chain:", error);
        }
    }

    debugLog(`Playing state set to: ${state}`);
}

window.setPlayingState = setPlayingState;