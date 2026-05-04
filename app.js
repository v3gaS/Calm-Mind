let isPlaying = false;
let currentVisualizerType = 'particles';

const SOUND_TYPE_HINTS = {
    binauralRelax:
        'Binaural beats around Earth’s resonance (~7.83 Hz) for deep relaxation. Best with headphones.',
    binauralFocus:
        'Beta-range binaural beats (~12–15 Hz) to support concentration and alertness. Best with headphones.',
    binauralSleep:
        'Delta-range binaural beats (~2–4 Hz) for sleep and regeneration. Best with headphones.',
    isochronicEnergy:
        'Isochronic pulses in a higher beta range for energy and motivation.',
    isochronicMeditate:
        'Isochronic pulses in the alpha range for meditation and a calm, creative state.',
    pinkNoise: 'Broad-spectrum pink noise to mask distractions and support sleep.',
    nature: 'Layered nature-inspired tones with gentle modulation for stress relief.',
    solfeggio: 'Single-tone Solfeggio-related frequencies chosen by stress level.',
    monaural: 'Monaural beating—works without headphones; theta-oriented modulation.',
    gamma: 'Higher-frequency content associated with alertness and cognitive engagement.',
    hrv: 'Slow rhythmic modulation (~0.1 Hz) to suggest relaxed breathing and coherence.',
    soundBath: 'Singing-bowl–like tones with spatial variation. Best on headphones.',
    psychoacoustic: 'Harmonic stacks and gentle motion for an immersive, mood-oriented wash.',
    neuroacoustic: 'Clear, detuned carriers for a steady “focus wash” without harsh peaks.',
};

function updateSoundTypeHint() {
    const sel = document.getElementById('soundType');
    const hint = document.getElementById('soundTypeHint');
    if (!sel || !hint) return;
    const text = SOUND_TYPE_HINTS[sel.value];
    hint.textContent = text || '';
}

function updateStressDisplay(value) {
    const stressDisplay = document.getElementById('stressDisplay');
    if (!stressDisplay) {
        console.warn('Stress display element not found');
        return;
    }
    stressDisplay.textContent = value;
    const hue = 120 - value * 12;
    stressDisplay.style.color = `hsl(${hue}, 70%, 50%)`;
}

function addButtonPulse(button) {
    if (!button) return;
    button.classList.add('pulse-animation');
    setTimeout(() => button.classList.remove('pulse-animation'), 600);
}

function togglePlay() {
    const playBtn = document.getElementById('playButton');
    const audioCtx = typeof window.getAudioContext === 'function' ? window.getAudioContext() : null;
    const spatialIndicator = document.getElementById('spatialIndicator');

    if (!audioCtx) {
        console.error('Audio context not initialized in togglePlay');
        return;
    }

    addButtonPulse(playBtn);

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch((err) => console.error('Failed to resume audio context in togglePlay:', err));
    }

    if (isPlaying) {
        audioCtx.suspend().then(() => {
            isPlaying = false;
            if (playBtn) playBtn.textContent = 'Play';
            if (window.setPlayingState) window.setPlayingState(false);
            if (spatialIndicator) spatialIndicator.classList.add('hidden');
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            if (playBtn) playBtn.textContent = 'Pause';
            if (window.setPlayingState) window.setPlayingState(true);
            if (spatialIndicator) spatialIndicator.classList.remove('hidden');
        });
    }
}

function skipTrack() {
    const skipBtn = document.getElementById('skipBtn');
    if (skipBtn) addButtonPulse(skipBtn);
    if (typeof window.stopCurrentTrack === 'function') window.stopCurrentTrack();
    generateTrackFromSettings().catch((err) => console.error(err));
}

function toggleLoop() {
    const loopBtn = document.getElementById('loopBtn');
    if (!loopBtn) return;
    loopBtn.classList.toggle('active', !loopBtn.classList.contains('active'));
    addButtonPulse(loopBtn);
}

function stopTrack() {
    if (typeof window.stopCurrentTrack === 'function') {
        window.stopCurrentTrack();
    }

    isPlaying = false;
    const playBtn = document.getElementById('playButton');
    if (playBtn) {
        playBtn.textContent = 'Play';
        playBtn.disabled = false;
        playBtn.removeAttribute('disabled');
    }

    const trackInfoEl = document.getElementById('trackInfo');
    if (trackInfoEl) trackInfoEl.textContent = 'No track playing';

    const stopButton = document.getElementById('stopButton');
    if (stopButton) {
        stopButton.disabled = true;
        stopButton.setAttribute('disabled', 'disabled');
    }
    const volumeControls = document.getElementById('volumeControls');
    if (volumeControls) volumeControls.classList.add('disabled');
}

async function generateTrackFromSettings() {
    const trackInfoEl = document.getElementById('trackInfo');

    const stressRaw = parseInt(document.getElementById('stressLevel').value, 10);
    const durationRaw = parseInt(document.getElementById('duration').value, 10);

    if (!Number.isFinite(stressRaw) || !Number.isFinite(durationRaw)) {
        if (trackInfoEl) {
            trackInfoEl.textContent = 'Enter a valid stress level (1–10) and duration (1–60 minutes).';
        }
        return;
    }

    const stressLevel = Math.min(10, Math.max(1, stressRaw));
    const duration = Math.min(60, Math.max(1, durationRaw));

    const ambientSound = document.getElementById('ambientSound').value;
    const soundType = document.getElementById('soundType').value;
    const visualizerTypeElement = document.getElementById('visualizerType');
    const vizType = visualizerTypeElement ? visualizerTypeElement.value : 'particles';
    currentVisualizerType = vizType;

    const genBtn = document.getElementById('generateButton');
    if (genBtn) {
        genBtn.disabled = true;
        genBtn.textContent = 'Generating…';
    }

    try {
        if (typeof window.stopCurrentTrack === 'function') {
            window.stopCurrentTrack();
        }

        ensureVisualizerElements();

        if (typeof window.initAudio === 'function') {
            window.initAudio();
        }

        // Resume in the same user-gesture chain as Generate (critical for Safari / WebKit).
        const ctx = typeof window.getAudioContext === 'function' ? window.getAudioContext() : null;
        if (ctx && ctx.state === 'suspended') {
            await ctx.resume();
        }

        if (typeof window.playGeneratedTrack !== 'function') {
            alert('Audio engine failed to load. Check the console.');
            return;
        }

        const result = window.playGeneratedTrack(stressLevel, duration, ambientSound, soundType, vizType);
        const ok = await Promise.resolve(result);

        if (ok === false) {
            console.error('Failed to generate track');
            if (trackInfoEl) {
                trackInfoEl.textContent = 'Could not start the track. Check the console or try again.';
            }
            return;
        }

        updateTrackInfo(stressLevel, duration, ambientSound, soundType);
        enablePlayerControls();
        isPlaying = true;
        const playBtn = document.getElementById('playButton');
        if (playBtn) {
            playBtn.textContent = 'Pause';
            playBtn.disabled = false;
            playBtn.removeAttribute('disabled');
        }
    } catch (err) {
        console.error('Generate track failed:', err);
        const info = document.getElementById('trackInfo');
        if (info) {
            info.textContent = 'Could not start audio. Try again, or allow sound for this site.';
        }
    } finally {
        if (genBtn) {
            genBtn.disabled = false;
            genBtn.textContent = 'Generate track';
        }
    }
}

function ensureVisualizerElements() {
    let visualizerContainer = document.getElementById('visualizerContainer');
    if (!visualizerContainer) {
        visualizerContainer = document.createElement('div');
        visualizerContainer.id = 'visualizerContainer';
        visualizerContainer.style.width = '100%';
        visualizerContainer.style.height = '300px';
        const mainContent = document.querySelector('#app');
        if (mainContent) mainContent.appendChild(visualizerContainer);
        else document.body.appendChild(visualizerContainer);
    }

    let canvas = document.getElementById('visualizerCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'visualizerCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        const stage = visualizerContainer.querySelector('.viz-panel__stage') || visualizerContainer;
        stage.appendChild(canvas);
    }

    const stage = visualizerContainer.querySelector('.viz-panel__stage');
    const sizeHost = stage || visualizerContainer;
    const containerWidth = sizeHost.clientWidth || sizeHost.offsetWidth;
    const containerHeight = sizeHost.clientHeight || sizeHost.offsetHeight;

    if (containerWidth > 0 && containerHeight > 0) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    } else {
        canvas.width = 400;
        canvas.height = 300;
    }

    visualizerContainer.style.display = 'block';
}

function updateTrackInfo(stressLevel, duration, ambientSound, soundType) {
    const trackInfoEl = document.getElementById('trackInfo');
    if (!trackInfoEl) return;

    const formattedSoundType = soundType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());

    let infoText = `${formattedSoundType} · Level ${stressLevel} · ${duration} min`;
    if (ambientSound && ambientSound !== 'none') {
        const formattedAmbient = ambientSound.charAt(0).toUpperCase() + ambientSound.slice(1);
        infoText += ` · ${formattedAmbient} ambient`;
    }
    trackInfoEl.textContent = infoText;
}

function enablePlayerControls() {
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    if (playButton) {
        playButton.disabled = false;
        playButton.removeAttribute('disabled');
        playButton.textContent = 'Pause';
    }
    if (stopButton) {
        stopButton.disabled = false;
        stopButton.removeAttribute('disabled');
    }
}

function disablePlayerControls() {
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const volumeControls = document.getElementById('volumeControls');
    if (playButton) {
        playButton.textContent = 'Play';
        playButton.disabled = true;
        playButton.setAttribute('disabled', 'disabled');
    }
    if (stopButton) {
        stopButton.disabled = true;
        stopButton.setAttribute('disabled', 'disabled');
    }
    if (volumeControls) volumeControls.classList.add('disabled');
}

function applyVolumeSliderVisual(volumeInput, volume) {
    const percent = Number(volume) * 100;
    volumeInput.style.background = `linear-gradient(to right, var(--color-accent-primary) ${percent}%, rgba(255, 255, 255, 0.1) ${percent}%)`;
}

function adjustVolume() {
    const volumeInput = document.getElementById('volumeSlider');
    if (!volumeInput) return;
    const volume = parseFloat(volumeInput.value);
    if (typeof window.setVolume === 'function') {
        window.setVolume(volume);
    } else if (typeof getMasterGain === 'function') {
        const g = getMasterGain();
        if (g) g.gain.value = volume;
    }
    applyVolumeSliderVisual(volumeInput, volume);
}

function switchTheme(themeName) {
    const body = document.body;
    body.classList.remove('light-theme', 'space-gray-theme', 'silver-theme', 'gold-theme', 'midnight-green-theme');
    if (themeName !== 'dark') {
        body.classList.add(`${themeName}-theme`);
    }
    const darkUiThemes = ['dark', 'space-gray', 'midnight-green'];
    document.documentElement.style.colorScheme = darkUiThemes.includes(themeName) ? 'dark' : 'light';
    localStorage.setItem('calmMindTheme', themeName);
    updateVisualizerTheme(themeName);
}

function initTheme() {
    const savedTheme = localStorage.getItem('calmMindTheme');
    if (savedTheme) {
        switchTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        switchTheme(prefersDark ? 'dark' : 'light');
    }
}

function updateVisualizerTheme(themeName) {
    console.log(`Visualizer theme updated to ${themeName}`);
}

function toggleAnimations(state) {
    const body = document.body;
    if (state === 'disabled') body.classList.add('animations-disabled');
    else body.classList.remove('animations-disabled');
    localStorage.setItem('calmMindAnimations', state);
}

function initAnimations() {
    const savedAnimations = localStorage.getItem('calmMindAnimations');
    if (savedAnimations) toggleAnimations(savedAnimations);
    else toggleAnimations('enabled');
}

function initGestures() {
    const container = document.getElementById('visualizerContainer');
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    container.addEventListener(
        'touchstart',
        (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        },
        { passive: true }
    );

    container.addEventListener(
        'touchmove',
        (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            if (window.camera) {
                window.camera.position.x += deltaX * 0.01;
                window.camera.position.y -= deltaY * 0.01;
            }
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        },
        { passive: true }
    );

    container.addEventListener('touchend', () => {
        isDragging = false;
    }, { passive: true });
}

function adjustVolumeGesture(delta) {
    const volumeInput = document.getElementById('volumeSlider');
    if (!volumeInput) return;
    let currentVolume = parseFloat(volumeInput.value);
    currentVolume = Math.max(0, Math.min(1, currentVolume + delta));
    volumeInput.value = String(currentVolume);
    adjustVolume();
}

function updateVisualizerType(type) {
    currentVisualizerType = type;
    if (typeof window.changeVisualizerType === 'function') {
        window.changeVisualizerType(type);
        return;
    }
    const canvas = document.getElementById('visualizerCanvas');
    const analyser = typeof window.getAnalyser === 'function' ? window.getAnalyser() : null;
    if (!canvas || !analyser || !window.setupVisualizer) return;
    window.setupVisualizer(canvas, analyser, type);
}

function animateSections() {
    const sections = document.querySelectorAll('.glass-section');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sections.forEach((section) => {
            section.style.opacity = '1';
            section.style.transform = 'none';
        });
        return;
    }
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(12px)';
        setTimeout(() => {
            section.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 80 + index * 100);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.setProperty('--app-transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');

    initTheme();
    initAnimations();
    initGestures();

    if (typeof window.initAudio === 'function') {
        window.initAudio();
    }
    ensureVisualizerElements();

    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        const currentTheme =
            localStorage.getItem('calmMindTheme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        themeSelector.value = currentTheme;
        themeSelector.addEventListener('change', function () {
            switchTheme(this.value);
        });
    }

    const animationsToggle = document.getElementById('animationsToggle');
    if (animationsToggle) {
        animationsToggle.value = localStorage.getItem('calmMindAnimations') || 'enabled';
        animationsToggle.addEventListener('change', function () {
            toggleAnimations(this.value);
        });
    }

    const stressLevelInput = document.getElementById('stressLevel');
    if (stressLevelInput) {
        stressLevelInput.addEventListener('input', () => {
            updateStressDisplay(parseInt(stressLevelInput.value, 10));
        });
        updateStressDisplay(stressLevelInput.value);
    }

    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', () => {
            generateTrackFromSettings().catch((err) => console.error(err));
        });
    }

    const playBtn = document.getElementById('playButton');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }

    const volumeInput = document.getElementById('volumeSlider');
    if (volumeInput) {
        volumeInput.addEventListener('input', adjustVolume);
        adjustVolume();
    }

    const stopBtn = document.getElementById('stopButton');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTrack);
    }

    const visualizerType = document.getElementById('visualizerType');
    if (visualizerType) {
        currentVisualizerType = visualizerType.value;
        visualizerType.addEventListener('change', (e) => {
            updateVisualizerType(e.target.value);
        });
    }

    const soundTypeSelect = document.getElementById('soundType');
    if (soundTypeSelect) {
        soundTypeSelect.addEventListener('change', updateSoundTypeHint);
        updateSoundTypeHint();
    }

    animateSections();
});
