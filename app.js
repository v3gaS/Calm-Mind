let isPlaying = false;
let currentTrack = null;
let isLooping = false;
let currentVisualizerType = 'particles'; // Default visualizer

// Update stress level display with subtle animation
function updateStressDisplay() {
    const stressLevel = document.getElementById('stressLevel').value;
    const stressValue = document.getElementById('stressValue');
    
    // Determine color based on stress level (gradient from green to red)
    const hue = 120 - (stressLevel - 1) * 12; // 120 (green) at level 1, 0 (red) at level 10
    stressValue.style.color = `hsl(${hue}, 80%, 60%)`;
    
    // Animate the number change
    stressValue.style.transform = 'scale(1.2)';
    stressValue.textContent = stressLevel;
    
    setTimeout(() => {
        stressValue.style.transform = 'scale(1)';
    }, 150);
}

// Add pulse animation to button
function addButtonPulse(button) {
    button.classList.add('pulse-animation');
    setTimeout(() => {
        button.classList.remove('pulse-animation');
    }, 600);
}

// Generate and play the track with enhanced UX
function generateTrack() {
    if (isPlaying) {
        stopTrack();
    }

    const stressLevel = parseInt(document.getElementById('stressLevel').value);
    const duration = parseInt(document.getElementById('duration').value);
    const ambientSound = document.getElementById('ambientSound').value;
    const soundType = document.getElementById('soundType').value;
    
    // Add pulse animation to the generate button
    const generateButton = document.getElementById('generateButton');
    addButtonPulse(generateButton);
    
    // Show loading indicator
    generateButton.textContent = 'Generating...';
    generateButton.disabled = true;
    
    // Fade in the player section with a slight delay for a smoother experience
    setTimeout(() => {
        const playerSection = document.getElementById('playerSection');
        if (playerSection) {
            playerSection.classList.remove('hidden');
            
            // Add fade-in animation
            playerSection.style.opacity = '0';
            playerSection.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                playerSection.style.opacity = '1';
                playerSection.style.transform = 'translateY(0)';
            }, 50);
        } else {
            console.error('playerSection element not found in DOM');
        }
        
        // Style the stop button
        const stopButton = document.getElementById('stopButton');
        if (stopButton) {
            stopButton.disabled = false;
            stopButton.classList.remove('disabled');
            stopButton.classList.add('active');
        } else {
            console.error('stopButton element not found in DOM');
        }
        
        // Initialize audio context if not already done
        if (!getAudioContext()) {
            initAudio();
        }
        
        // Resume audio context if suspended (browser security restriction)
        const audioCtx = getAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                console.log('Audio context resumed after user interaction');
            }).catch(err => {
                console.error('Failed to resume audio context:', err);
            });
        } else {
            console.log('Audio context state:', audioCtx ? audioCtx.state : 'not initialized');
        }
        
        // Update track info
        updateTrackInfo(stressLevel, duration, ambientSound, soundType);
        
        // Generate the track
        generatePersonalizedTrack(stressLevel, duration, ambientSound, soundType);
        
        // Automatically play the track after generation
        if (!isPlaying) {
            togglePlay();
        }
        
        // Reset generate button
        generateButton.textContent = 'Generate Track';
        generateButton.disabled = false;
    }, 500); // Slight delay for better UX flow
}

// Update track info with details about the generated track
function updateTrackInfo(stressLevel, duration, ambientSound, soundType) {
    const trackInfo = document.getElementById('trackInfo');
    let soundTypeText;
    
    switch(soundType) {
        case 'binaural':
            soundTypeText = 'Binaural Beats';
            break;
        case 'pinkNoise':
            soundTypeText = 'Pink Noise';
            break;
        case 'isochronic':
            soundTypeText = 'Isochronic Tones';
            break;
        case 'nature':
            soundTypeText = 'Nature Sounds';
            break;
        case 'solfeggio':
            soundTypeText = 'Solfeggio Frequencies';
            break;
        case 'monaural':
            soundTypeText = 'Monaural Beats';
            break;
        case 'gamma':
            soundTypeText = 'Gamma Wave Entrainment';
            break;
        case 'hrv':
            soundTypeText = 'HRV Coherence';
            break;
        default:
            soundTypeText = 'Custom Sound';
    }
    
    let ambientText = ambientSound !== 'none' ? ` with ${ambientSound} background` : '';
    trackInfo.textContent = `${soundTypeText} for stress level ${stressLevel} | ${duration} min${ambientText}`;
    
    // Add fade-in animation
    trackInfo.style.opacity = '0';
    setTimeout(() => {
        trackInfo.style.opacity = '1';
    }, 100);
}

// Toggle play/pause with animation
function togglePlay() {
    const playBtn = document.getElementById('playBtn');
    const audioCtx = getAudioContext();
    const spatialIndicator = document.getElementById('spatialIndicator');
    
    if (!audioCtx) {
        console.error('Audio context not initialized in togglePlay');
        return;
    }
    
    // Add pulse animation
    addButtonPulse(playBtn);
    
    // Resume audio context if suspended
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log('Audio context resumed in togglePlay');
        }).catch(err => {
            console.error('Failed to resume audio context in togglePlay:', err);
        });
    }
    
    if (isPlaying) {
        audioCtx.suspend().then(() => {
            isPlaying = false;
            playBtn.textContent = 'Play';
            setPlayingState(false);
            if (spatialIndicator) {
                spatialIndicator.classList.add('hidden');
            }
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            playBtn.textContent = 'Pause';
            setPlayingState(true);
            if (spatialIndicator) {
                spatialIndicator.classList.remove('hidden');
            }
        });
    }
}

// Function to skip to the next track
function skipTrack() {
    const skipBtn = document.getElementById('skipBtn');
    addButtonPulse(skipBtn);
    // Placeholder for skipping to the next track
    console.log('Skipping to next track');
    // In a real implementation, this would stop the current track and generate or load a new one
    if (currentTrack) {
        // Stop current track
        stopTrack();
    }
    // Generate a new track based on current settings
    generateTrackFromSettings();
}

// Function to toggle loop mode
function toggleLoop() {
    const loopBtn = document.getElementById('loopBtn');
    isLooping = !isLooping;
    loopBtn.classList.toggle('active', isLooping);
    addButtonPulse(loopBtn);
    console.log('Loop mode:', isLooping ? 'Enabled' : 'Disabled');
    // In a real implementation, this would set a flag to restart the track when it ends
}

// Function to stop the track
function stopTrack() {
    console.log('Stopping track');
    
    // Hide spatial indicator
    const spatialIndicator = document.getElementById('spatialIndicator');
    if (spatialIndicator) {
        spatialIndicator.classList.add('hidden');
    }
    
    // Stop current track using audio.js function
    stopCurrentTrack();
    
    // Update play button text
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.classList.add('disabled');
        stopBtn.classList.remove('active');
    } else {
        console.error('stopButton element not found in DOM');
    }
}

// Function to generate track from current settings
function generateTrackFromSettings() {
    const stressLevel = parseInt(document.getElementById('stressLevel').value);
    const duration = parseInt(document.getElementById('duration').value);
    const ambientSound = document.getElementById('ambientSound').value;
    const soundType = document.getElementById('soundType').value;

    // Read the selected visualizer type
    currentVisualizerType = document.getElementById('visualizerType').value;
    
    console.log("Generating track with:", {stressLevel, duration, ambientSound, soundType, vizType: currentVisualizerType});
    
    // Stop any existing audio first
    stopTrack();
    
    // Call the audio generation function
    const success = generateTrack(stressLevel, duration, ambientSound, soundType);
    
    if (!success) {
        console.error("Failed to generate track");
        return;
    }
    
    // Setup the visualizer after a short delay to ensure audio context is ready
    setTimeout(() => {
        // Get necessary elements from the DOM
        const canvas = document.getElementById('visualizer');
        const analyser = getAnalyser(); // Get analyser from audio.js
        
        if (!canvas) {
            console.error("Visualizer canvas element not found");
            return;
        }
        
        if (!analyser) {
            console.error("Audio analyser not available");
            return;
        }
        
        if (!window.setupVisualizer) {
            console.error("setupVisualizer function not found globally");
            return;
        }
        
        console.log("Setting up visualizer with type:", currentVisualizerType);
        window.setupVisualizer(canvas, analyser, currentVisualizerType);
        
        // Update UI
        const trackInfoEl = document.getElementById('trackInfo');
        if (trackInfoEl) {
            // Format the sound type by adding spaces before capitals and capitalizing
            const formattedSoundType = soundType
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
                
            // Format the ambient sound by capitalizing first letter
            const formattedAmbient = ambientSound !== 'none' 
                ? ambientSound.charAt(0).toUpperCase() + ambientSound.slice(1) 
                : 'No ambient';
                
            trackInfoEl.textContent = `${formattedSoundType} | ${duration} min | ${formattedAmbient}`;
        }
        
        // Show player section if it's hidden
        const playerSection = document.getElementById('playerSection');
        if (playerSection && playerSection.classList.contains('hidden')) {
            playerSection.classList.remove('hidden');
        }
        
        // Reset play button state
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = 'Play';
        }
        
        // Reset isPlaying state
        isPlaying = false;
        
        // Hide spatial indicator if it exists
        const spatialIndicator = document.getElementById('spatialIndicator');
        if (spatialIndicator) {
            spatialIndicator.classList.add('hidden');
        }
    }, 300); // Slightly longer delay for audio context initialization
}

// Adjust volume with visual feedback
function adjustVolume() {
    const volume = document.getElementById('volume').value;
    const volumeInput = document.getElementById('volume');
    const masterGain = getMasterGain();
    
    // Visual feedback
    const percent = volume * 100;
    volumeInput.style.background = `linear-gradient(to right, var(--color-accent-primary) ${percent}%, rgba(255, 255, 255, 0.1) ${percent}%)`;
    
    if (masterGain) {
        masterGain.gain.value = volume;
    }
}

// Theme switching functionality for luxury Apple-inspired design
function switchTheme(themeName) {
    const body = document.body;
    // Remove any existing theme classes
    body.classList.remove('light-theme', 'space-gray-theme', 'silver-theme', 'gold-theme', 'midnight-green-theme');
    // Add the selected theme class
    if (themeName !== 'dark') {
        body.classList.add(`${themeName}-theme`);
    }
    // Store user preference in localStorage
    localStorage.setItem('calmMindTheme', themeName);
    // Update visualizer colors if necessary
    updateVisualizerTheme(themeName);
}

// Initialize theme based on user preference or system settings
function initTheme() {
    const savedTheme = localStorage.getItem('calmMindTheme');
    if (savedTheme) {
        switchTheme(savedTheme);
    } else {
        // Check system preference for dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        switchTheme(prefersDark ? 'dark' : 'light');
    }
}

// Placeholder for visualizer theme update
function updateVisualizerTheme(themeName) {
    // This will be implemented with visualizer.js updates
    console.log(`Visualizer theme updated to ${themeName}`);
}

// Function to toggle animations based on user preference
function toggleAnimations(state) {
    const body = document.body;
    if (state === 'disabled') {
        body.classList.add('animations-disabled');
    } else {
        body.classList.remove('animations-disabled');
    }
    // Store user preference in localStorage
    localStorage.setItem('calmMindAnimations', state);
}

// Initialize animations setting based on user preference
function initAnimations() {
    const savedAnimations = localStorage.getItem('calmMindAnimations');
    if (savedAnimations) {
        toggleAnimations(savedAnimations);
    } else {
        // Default to enabled
        toggleAnimations('enabled');
    }
}

// Gesture-based interactions for Apple-like UX
function initGestures() {
    const playerSection = document.getElementById('playerSection');
    let touchStartY = 0;
    
    playerSection.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        playerSection.classList.add('gesture-active');
    });
    
    playerSection.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchStartY - touchY;
        if (Math.abs(diff) > 10) { // Threshold to avoid accidental swipes
            if (diff > 0) {
                // Swipe up - increase volume
                adjustVolumeGesture(0.1);
            } else {
                // Swipe down - decrease volume
                adjustVolumeGesture(-0.1);
            }
            touchStartY = touchY; // Reset start to avoid jitter
        }
    });
    
    playerSection.addEventListener('touchend', () => {
        touchStartY = 0;
        playerSection.classList.remove('gesture-active');
    });
}

// Adjust volume based on gesture
function adjustVolumeGesture(delta) {
    const volumeInput = document.getElementById('volume');
    let currentVolume = parseFloat(volumeInput.value);
    currentVolume = Math.max(0, Math.min(1, currentVolume + delta));
    volumeInput.value = currentVolume;
    adjustVolume();
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS variable for animations
    document.documentElement.style.setProperty('--app-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Initialize theme
    initTheme();
    
    // Initialize animations setting
    initAnimations();
    
    // Initialize gestures for player section
    initGestures();
    
    // Initialize theme selector
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        // Set the selector to the current theme
        const currentTheme = localStorage.getItem('calmMindTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        themeSelector.value = currentTheme;
        
        // Add event listener for theme change
        themeSelector.addEventListener('change', function() {
            switchTheme(this.value);
        });
    } else {
        console.error('themeSelector element not found in DOM');
    }
    
    // Initialize animations toggle
    const animationsToggle = document.getElementById('animationsToggle');
    if (animationsToggle) {
        // Set the toggle to the current setting
        const currentAnimations = localStorage.getItem('calmMindAnimations') || 'enabled';
        animationsToggle.value = currentAnimations;
        
        // Add event listener for animations toggle
        animationsToggle.addEventListener('change', function() {
            toggleAnimations(this.value);
        });
    } else {
        console.error('animationsToggle element not found in DOM');
    }
    
    // Initialize stress display
    const stressLevelInput = document.getElementById('stressLevel');
    if (stressLevelInput) {
        stressLevelInput.addEventListener('input', updateStressDisplay);
        updateStressDisplay();
    } else {
        console.error('stressLevel element not found in DOM');
    }
    
    // Add event listener for Generate Track button
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateTrack);
    } else {
        console.error('generateButton element not found in DOM');
    }
    
    // Add event listeners for play and volume controls
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    } else {
        console.error('playBtn element not found in DOM');
    }
    
    const volumeInput = document.getElementById('volume');
    if (volumeInput) {
        volumeInput.addEventListener('input', adjustVolume);
        // Initialize volume slider gradient
        adjustVolume();
    } else {
        console.error('volume element not found in DOM');
    }
    
    const stopBtn = document.getElementById('stopButton');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTrack);
    } else {
        console.error('stopButton element not found in DOM');
    }
    
    // Add animation to sections
    animateSections();
});

// Animate sections on page load for a more engaging experience
function animateSections() {
    const sections = document.querySelectorAll('.glass-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        setTimeout(() => {
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 + index * 150);
    });
}

// Event listeners
function setupEventListeners() {
    document.getElementById('generateButton').addEventListener('click', () => {
        generateTrackFromSettings();
    });
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('stopButton').addEventListener('click', stopTrack);
    document.getElementById('skipBtn').addEventListener('click', skipTrack);
    document.getElementById('loopBtn').addEventListener('click', toggleLoop);

    // Listener for stress level slider
    const stressSlider = document.getElementById('stressLevel');
    const stressValueSpan = document.getElementById('stressLevelValue');
    stressSlider.addEventListener('input', () => {
        stressValueSpan.textContent = stressSlider.value;
    });

    // Listener for visualizer type change
    const visualizerSelect = document.getElementById('visualizerType');
    visualizerSelect.addEventListener('change', (event) => {
        currentVisualizerType = event.target.value;
        console.log('Visualizer type changed to:', currentVisualizerType);
        // Re-initialize or update the visualizer if audio is playing
        if (getAudioContext()) { // Check if context exists
             const analyser = getAnalyser();
             if (analyser) {
                 const canvas = document.getElementById('visualizer');
                 // We need a way to re-initialize the visualizer based on the new type
                 // This might involve clearing the old one and setting up the new one.
                 // For now, we just log the change. A function call like
                 // setupVisualizer(canvas, analyser, currentVisualizerType); might go here
                 // if setupVisualizer is designed to handle re-initialization.
                 if (window.setupVisualizer) {
                     // Assuming setupVisualizer can handle changes or re-init
                     window.setupVisualizer(canvas, analyser, currentVisualizerType);
                 } else {
                     console.warn('setupVisualizer function not found globally');
                 }
             }
        }
    });

    // Listener for volume control
    const volumeSlider = document.getElementById('volume');
    volumeSlider.addEventListener('input', () => {
        setVolume(volumeSlider.value);
    });

    // Theme switcher logic (if applicable, might need adjustments)
    // ... existing theme switcher code ...

    // Initialize UI elements based on default values
    stressValueSpan.textContent = stressSlider.value;
    setVolume(volumeSlider.value); // Set initial volume
}

// Ensure setupEventListeners is called, e.g., on DOMContentLoaded
document.addEventListener('DOMContentLoaded', setupEventListeners);