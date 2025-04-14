let isPlaying = false;

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
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            playBtn.textContent = 'Pause';
            setPlayingState(true);
        });
    }
}

// Stop track with animation
function stopTrack() {
    const stopButton = document.getElementById('stopButton');
    // Add pulse animation
    addButtonPulse(stopButton);
    
    stopAudio();
    isPlaying = false;
    document.getElementById('playBtn').textContent = 'Play';
    setPlayingState(false);
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

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS variable for animations
    document.documentElement.style.setProperty('--app-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    
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