let audioContext;
let masterGain;
let binauralOsc1, binauralOsc2;
let ambientOsc;
let soundTypeNodes = [];
let analyser;
const AMBIENT_VOLUME = 0.2;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);
        masterGain.gain.value = 0.5;
        
        // Create analyzer node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Increased for better frequency resolution
        masterGain.connect(analyser);
        
        console.log("Audio initialization complete. Context state:", audioContext.state);
        return true;
    } catch (error) {
        console.error("Error initializing audio:", error);
        return false;
    }
}

// Expose function to get the analyser
window.getAnalyser = function() {
    if (!analyser && audioContext) {
        // Create if it doesn't exist yet
        console.log("Creating new analyzer as none exists");
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; 
        masterGain.connect(analyser);
    }
    
    if (!analyser) {
        console.error("Analyzer not available! Audio context may not be initialized.");
        return null;
    }
    
    console.log("Returning analyzer with fftSize:", analyser.fftSize);
    return analyser;
}

// Generate track - main entry point called from app.js
function generateTrack(stressLevel, duration, ambientSound, soundType) {
    console.log('Generating track with settings:', { stressLevel, duration, ambientSound, soundType });
    
    // Initialize audio context if not already done
    if (!audioContext) {
        try {
            initAudio();
            console.log("Audio context initialized successfully:", audioContext.state);
        } catch (error) {
            console.error("Failed to initialize audio context:", error);
            return false;
        }
    }
    
    // Make sure audio context is running
    if (audioContext.state === 'suspended') {
        try {
            audioContext.resume();
            console.log("Audio context resumed from suspended state");
        } catch (error) {
            console.error("Failed to resume audio context:", error);
            return false;
        }
    }
    
    // Generate the actual audio based on selected type
    try {
        generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType);
        return true; // Indicate success
    } catch (error) {
        console.error("Error generating track:", error);
        alert("There was an error generating the track. Please try again.");
        return false;
    }
}

// Generate personalized track based on user input
function generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType) {
    stopCurrentTrack();
    
    // Clear previous sound type nodes
    soundTypeNodes.forEach(node => {
        if (node) node.disconnect();
    });
    soundTypeNodes = [];
    
    console.log("Generating track with soundType:", soundType);
    
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
        generateBinauralBeats(adjustedStressLevel, duration);
    } else if (soundType === 'isochronicEnergy' || soundType === 'isochronicMeditate' || 
               soundType === 'isochronic') {
        // For new specific isochronic types, adjust the stress level based on intent
        let adjustedStressLevel = stressLevel;
        if (soundType === 'isochronicEnergy') {
            adjustedStressLevel = Math.min(stressLevel + 3, 10); // Higher pulse for energy
        } else if (soundType === 'isochronicMeditate') {
            adjustedStressLevel = Math.max(stressLevel - 2, 1); // Lower pulse for meditation
        }
        generateIsochronicTones(adjustedStressLevel, duration);
    } else if (soundType === 'pinkNoise') {
        generatePinkNoise(duration);
    } else if (soundType === 'nature') {
        generateNatureEnhancedSound(ambientSound, duration);
    } else if (soundType === 'solfeggio') {
        generateSolfeggioFrequencies(stressLevel, duration);
    } else if (soundType === 'monaural') {
        generateMonauralBeats(stressLevel, duration);
    } else if (soundType === 'gamma') {
        generateGammaWaves(duration);
    } else if (soundType === 'hrv') {
        generateHRVCoherence(duration);
    } else if (soundType === 'soundBath') {
        generateSoundBath(duration);
    } else if (soundType === 'psychoacoustic') {
        generatePsychoacousticMood(stressLevel, duration);
    } else if (soundType === 'neuroacoustic') {
        generateNeuroacoustic(stressLevel, duration);
    } else {
        console.error("Unknown sound type:", soundType);
        // Default to binaural beats as a fallback
        generateBinauralBeats(stressLevel, duration);
    }
    
    if (ambientSound !== 'none' && soundType !== 'nature' && soundType !== 'soundBath') {
        generateAmbientSound(ambientSound, duration);
    }
    
    // Set duration
    setTimeout(stopCurrentTrack, duration * 60 * 1000);
    setPlayingState(true);
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
function generateBinauralBeats(stressLevel, duration = 10) {
    console.log('Generating binaural beats with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
    // Show spatial indicator for binaural beats as they use left/right channels
    toggleSpatialIndicator(true);
    
    // Increase base frequency to audible range while keeping beat frequencies appropriate
    // Human hearing typically starts around 20Hz
    const baseFreq = stressLevel <= 3 ? 200 : stressLevel <= 6 ? 180 : 160;
    const beatFreq = stressLevel <= 3 ? 8 : stressLevel <= 6 ? 6 : 4;
    
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
        console.log('Using StereoPanner for binaural beats');
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
        console.log('Using ChannelSplitter fallback for binaural beats');
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
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed for binaural beats');
        }).catch(err => {
            console.error('Failed to resume audio context for binaural beats:', err);
        });
    }
    
    // Stop after the specified duration (converted from minutes to seconds)
    const durationInSeconds = duration * 60;
    binauralOsc1.stop(audioContext.currentTime + durationInSeconds);
    binauralOsc2.stop(audioContext.currentTime + durationInSeconds);
    console.log('Binaural beats scheduled to stop after', durationInSeconds, 'seconds');
}

// Generate pink noise for deep sleep and memory
function generatePinkNoise(duration = 10) {
    console.log('Generating pink noise with duration:', duration, 'minutes');
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    
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
        data[i] *= 0.11; // Adjust volume
        b6 = white * 0.115926;
    }
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(masterGain);
    noiseSource.start();
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    noiseSource.stop(audioContext.currentTime + durationInSeconds);
    console.log('Pink noise scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(noiseSource);
}

// Generate isochronic tones for focus and meditation
function generateIsochronicTones(stressLevel, duration = 10) {
    console.log('Generating isochronic tones with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    const baseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 6; // Beta/Alpha range for focus/meditation
    const pulseFreq = stressLevel <= 3 ? 10 : stressLevel <= 6 ? 8 : 5;
    
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    
    // Ensure gain node is connected
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    // Start the oscillator immediately
    osc.start();
    
    // Use a more direct and consistent approach for pulsing
    let isOn = true;
    const pulseInterval = 1000 / pulseFreq; // Time in ms for each pulse cycle
    
    // More pronounced gain contrast for better audibility
    const pulseTimer = setInterval(() => {
        if (!audioContext) {
            clearInterval(pulseTimer);
            return;
        }
        
        if (isOn) {
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime); // Higher "on" volume
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); // Faster fade
        } else {
            gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.8, audioContext.currentTime + 0.1); // Faster rise
        }
        isOn = !isOn;
    }, pulseInterval / 2);
    
    // Store timer reference for cleanup
    soundTypeNodes.push({
        disconnect: () => clearInterval(pulseTimer)
    });
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    osc.stop(audioContext.currentTime + durationInSeconds);
    setTimeout(() => clearInterval(pulseTimer), durationInSeconds * 1000);
    console.log('Isochronic tones scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(osc, gainNode);
    
    // Add a volume boost specific to isochronic tones
    const isoBoost = audioContext.createGain();
    isoBoost.gain.value = 1.2;
    masterGain.connect(isoBoost);
    isoBoost.connect(audioContext.destination);
    soundTypeNodes.push(isoBoost);
}

// Enhance ambient sound for nature selection
function generateNatureEnhancedSound(ambientSound, duration = 10) {
    // Default to forest sounds if none selected
    const soundType = ambientSound === 'none' ? 'forest' : ambientSound;
    
    console.log('Generating enhanced nature sound:', soundType, 'with duration:', duration, 'minutes');
    const freqMap = {
        'rain': 200,
        'ocean': 120,
        'forest': 300
    };
    
    // Create two oscillators for richer nature sounds
    const baseFreq = freqMap[soundType];
    ambientOsc = audioContext.createOscillator();
    const secondaryOsc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const secondaryGain = audioContext.createGain();
    
    // Primary tone
    ambientOsc.type = 'triangle';
    ambientOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    
    // Secondary tone for richness
    secondaryOsc.type = 'sine';
    secondaryOsc.frequency.setValueAtTime(baseFreq * 1.5, audioContext.currentTime);
    
    // Random gentle modulation of frequency to simulate nature
    setInterval(() => {
        if (!audioContext || !ambientOsc) return;
        const randomVariation = (Math.random() * 10) - 5; // -5 to +5 Hz
        ambientOsc.frequency.setTargetAtTime(
            baseFreq + randomVariation, 
            audioContext.currentTime, 
            0.5
        );
        secondaryOsc.frequency.setTargetAtTime(
            baseFreq * 1.5 + randomVariation, 
            audioContext.currentTime, 
            0.5
        );
    }, 1000); // Update every second
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    secondaryGain.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    ambientOsc.connect(gainNode);
    secondaryOsc.connect(secondaryGain);
    gainNode.connect(masterGain);
    secondaryGain.connect(masterGain);
    
    ambientOsc.start();
    secondaryOsc.start();
    
    // Volume boost for nature sounds
    const natureBoost = audioContext.createGain();
    natureBoost.gain.value = 1.3;
    masterGain.connect(natureBoost);
    natureBoost.connect(audioContext.destination);
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    ambientOsc.stop(audioContext.currentTime + durationInSeconds);
    secondaryOsc.stop(audioContext.currentTime + durationInSeconds);
    console.log('Nature sound scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(ambientOsc, secondaryOsc, gainNode, secondaryGain, natureBoost);
}

// Generate ambient background sound
function generateAmbientSound(type, duration = 10) {
    if (type === 'none') return;
    
    console.log('Generating ambient sound:', type, 'with duration:', duration, 'minutes');
    const freqMap = {
        'rain': 200,
        'ocean': 120,
        'forest': 300
    };
    
    const baseFreq = freqMap[type];
    ambientOsc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    ambientOsc.type = 'triangle';
    ambientOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(AMBIENT_VOLUME, audioContext.currentTime);
    
    ambientOsc.connect(gainNode);
    gainNode.connect(masterGain);
    ambientOsc.start();
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    ambientOsc.stop(audioContext.currentTime + durationInSeconds);
    console.log('Ambient sound scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(ambientOsc, gainNode);
}

// Stop current track
function stopCurrentTrack() {
    console.log('Stopping current track');
    
    // Hide spatial indicator when stopping
    toggleSpatialIndicator(false);
    
    if (binauralOsc1) {
        try {
            binauralOsc1.stop();
            binauralOsc1.disconnect();
        } catch (e) {
            console.log('Error stopping binauralOsc1', e);
        }
        binauralOsc1 = null;
    }
    
    if (binauralOsc2) {
        try {
            binauralOsc2.stop();
            binauralOsc2.disconnect();
        } catch (e) {
            console.log('Error stopping binauralOsc2', e);
        }
        binauralOsc2 = null;
    }
    
    if (ambientOsc) {
        try {
            ambientOsc.stop();
            ambientOsc.disconnect();
        } catch (e) {
            console.log('Error stopping ambientOsc', e);
        }
        ambientOsc = null;
    }
    
    soundTypeNodes.forEach(node => {
        if (node) {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (e) {
                console.log('Error stopping node', e);
            }
        }
    });
    
    // Reset master gain connection
    if (masterGain) {
        try {
            masterGain.disconnect();
            masterGain.connect(audioContext.destination);
        } catch (e) {
            console.log('Error resetting masterGain', e);
        }
    }
    
    soundTypeNodes = [];
    setPlayingState(false);
}

// Adjust volume
function adjustVolume(value) {
    masterGain.gain.value = value;
}

// Get audio context for visualizer connection
function getAudioContext() {
    return audioContext;
}

// Get master gain for volume control and analyser connection
function getMasterGain() {
    return masterGain;
}

// Stop audio
function stopAudio() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}

// Generate Solfeggio frequencies based on stress level
function generateSolfeggioFrequencies(stressLevel, duration = 10) {
    console.log('Generating Solfeggio frequencies with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
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
    
    console.log(`Selected Solfeggio frequency: ${selectedFreq} Hz (${solfeggioFreqs[selectedFreq]})`);
    
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
            console.log('Audio context resumed for Solfeggio frequencies');
        }).catch(err => {
            console.error('Failed to resume audio context for Solfeggio frequencies:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    solfOsc.stop(audioContext.currentTime + durationInSeconds);
    overtone1.stop(audioContext.currentTime + durationInSeconds);
    overtone2.stop(audioContext.currentTime + durationInSeconds);
    
    console.log('Solfeggio frequencies scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(solfOsc, envelope, overtone1, overtone1Gain, overtone2, overtone2Gain);
}

// Generate monaural beats based on stress level
function generateMonauralBeats(stressLevel, duration = 10) {
    console.log('Generating monaural beats with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
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
            console.log('Audio context resumed for monaural beats');
        }).catch(err => {
            console.error('Failed to resume audio context for monaural beats:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    carrier.stop(audioContext.currentTime + durationInSeconds);
    lfo.stop(audioContext.currentTime + durationInSeconds);
    constantSource.stop(audioContext.currentTime + durationInSeconds);
    
    console.log('Monaural beats scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(carrier, modulationGain, lfo, lfoGain, constantSource);
}

// Generate gamma waves for cognitive enhancement
function generateGammaWaves(duration = 10) {
    console.log('Generating gamma waves with duration:', duration, 'minutes');
    
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
            console.log('Audio context resumed for gamma waves');
        }).catch(err => {
            console.error('Failed to resume audio context for gamma waves:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    gammaOsc.stop(audioContext.currentTime + durationInSeconds);
    carrierOsc.stop(audioContext.currentTime + durationInSeconds);
    
    console.log('Gamma waves scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(gammaOsc, gammaGain, carrierOsc, carrierGain);
}

// Generate HRV coherence patterns for heart-brain synchronization
function generateHRVCoherence(duration = 10) {
    console.log('Generating HRV coherence pattern with duration:', duration, 'minutes');
    
    // HRV coherence occurs around 0.1 Hz (6 breaths per minute)
    const breathingRate = 0.1; // Hz (one breath cycle every 10 seconds)
    
    // Create a low-frequency oscillator for breathing guidance
    const breathingLFO = audioContext.createOscillator();
    breathingLFO.type = 'sine';
    breathingLFO.frequency.setValueAtTime(breathingRate, audioContext.currentTime);
    
    // Create a gain node for the breathing modulation
    const breathingGain = audioContext.createGain();
    breathingGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Connect the breathing LFO to its gain
    breathingLFO.connect(breathingGain);
    
    // Create a carrier tone
    const carrierOsc = audioContext.createOscillator();
    carrierOsc.type = 'sine';
    carrierOsc.frequency.setValueAtTime(256, audioContext.currentTime); // C4 note
    
    // Create a gain node for the carrier
    const carrierGain = audioContext.createGain();
    carrierGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    // Connect the carrier
    carrierOsc.connect(carrierGain);
    carrierGain.connect(masterGain);
    
    // Create another oscillator for gentle pulse on inhale
    const pulseOsc = audioContext.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.setValueAtTime(432, audioContext.currentTime); // Harmony frequency
    
    const pulseGain = audioContext.createGain();
    pulseGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    pulseOsc.connect(pulseGain);
    pulseGain.connect(masterGain);
    
    // Start oscillators
    breathingLFO.start();
    carrierOsc.start();
    pulseOsc.start();
    
    // Set up rhythmic modulation for inhale/exhale cycle
    const rhythmInterval = setInterval(() => {
        if (!audioContext) {
            clearInterval(rhythmInterval);
            return;
        }
        
        // Inhale phase (4 seconds)
        carrierGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        carrierGain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 4);
        pulseGain.gain.setValueAtTime(0, audioContext.currentTime);
        pulseGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 4);
        
        // Exhale phase (6 seconds)
        setTimeout(() => {
            if (audioContext) {
                carrierGain.gain.setValueAtTime(0.6, audioContext.currentTime);
                carrierGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 6);
                pulseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
                pulseGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 6);
            }
        }, 4000);
        
    }, 10000); // Complete cycle every 10 seconds (0.1 Hz)
    
    // Store timer reference for cleanup
    soundTypeNodes.push({
        disconnect: () => clearInterval(rhythmInterval)
    });
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed for HRV coherence');
        }).catch(err => {
            console.error('Failed to resume audio context for HRV coherence:', err);
        });
    }
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    breathingLFO.stop(audioContext.currentTime + durationInSeconds);
    carrierOsc.stop(audioContext.currentTime + durationInSeconds);
    pulseOsc.stop(audioContext.currentTime + durationInSeconds);
    setTimeout(() => clearInterval(rhythmInterval), durationInSeconds * 1000);
    
    console.log('HRV coherence pattern scheduled to stop after', durationInSeconds, 'seconds');
    
    soundTypeNodes.push(breathingLFO, breathingGain, carrierOsc, carrierGain, pulseOsc, pulseGain);
}

// Generate virtual sound bath experience
function generateSoundBath(duration = 10) {
    console.log('Generating sound bath with duration:', duration, 'minutes');
    
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
    const durationInSeconds = duration * 60;
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
    
    console.log('Sound bath scheduled to stop after', durationInSeconds, 'seconds');
}

// Generate psychoacoustic mood enhancement
function generatePsychoacousticMood(stressLevel, duration = 10) {
    console.log('Generating psychoacoustic mood enhancement with stress level:', stressLevel, 'and duration:', duration, 'minutes');
    
    // Show spatial indicator for psychoacoustic mood as it uses panning
    toggleSpatialIndicator(true);
    
    // Harmonic series based on mood
    const fundamentalFreq = stressLevel <= 3 ? 432 : stressLevel <= 6 ? 396 : 528; // Different base frequencies for different moods
    const harmonics = [1, 1.5, 2, 2.5, 3, 4]; // Harmonic series for rich timbre
    
    // Create oscillators for harmonic progression
    const oscillators = harmonics.map(harmonic => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const panner = audioContext.createStereoPanner();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamentalFreq * harmonic, audioContext.currentTime);
        
        // Set initial gains based on harmonic number (higher harmonics quieter)
        gain.gain.setValueAtTime(1 / harmonic, audioContext.currentTime);
        
        // Create spatial position
        panner.pan.setValueAtTime((harmonic % 2 === 0 ? 0.5 : -0.5), audioContext.currentTime);
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(masterGain);
        
        return { osc, gain, panner };
    });
    
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
    reverbGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    // Connect reverb chain
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(audioContext.destination);
    
    soundTypeNodes.push(convolver, reverbGain);
    
    // Stop after the specified duration
    const durationInSeconds = duration * 60;
    setTimeout(() => {
        oscillators.forEach(({ osc, gain }) => {
            const now = audioContext.currentTime;
            gain.gain.linearRampToValueAtTime(0, now + 2);
            osc.stop(now + 2);
        });
        filterLFO.stop(audioContext.currentTime + 2);
        clearInterval(evolutionInterval);
    }, (durationInSeconds - 2) * 1000);
    
    console.log('Psychoacoustic mood enhancement scheduled to stop after', durationInSeconds, 'seconds');
}

// Set playing state (exported for use in app.js)
function setPlayingState(state) {
    console.log('Audio playback state:', state ? 'Playing' : 'Paused/Stopped');
    
    if (state) {
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Audio context resumed successfully');
            }).catch(err => {
                console.error('Failed to resume audio context:', err);
            });
        }
    } else {
        // Suspend audio context to save resources
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend().then(() => {
                console.log('Audio context suspended successfully');
            }).catch(err => {
                console.error('Failed to suspend audio context:', err);
            });
        }
    }
    
    // Call the visualizer's setPlayingState if it exists
    if (window.setPlayingState) {
        window.setPlayingState(state);
    }
}

// Export the setPlayingState function
window.setPlayingState = setPlayingState; 