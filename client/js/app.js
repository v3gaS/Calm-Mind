/**
 * CalmMind UI controller — themes, session form, playback controls, visualizer wiring.
 * Depends on client/js/audio.js and client/js/visualizer.js (global window APIs).
 */
'use strict';

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
    isochronicSleep:
        'Slow delta/theta isochronic pulses for sleep — keep volume low.',
    pinkNoise: 'Broad-spectrum pink noise to mask distractions and support sleep.',
    whiteNoise: 'Flat-spectrum white noise to mask distractions and support focus.',
    brownNoise: 'Deep brown noise with softer highs — often used for sleep and calm focus.',
    nature: 'Layered nature-inspired tones with gentle modulation for stress relief.',
    solfeggio: 'Single-tone Solfeggio-related frequencies chosen by stress level.',
    monaural: 'Monaural beating—works without headphones; theta-oriented modulation.',
    gamma: 'Higher-frequency content associated with alertness and cognitive engagement.',
    hrv: 'Slow rhythmic modulation (~0.1 Hz) to suggest relaxed breathing and coherence.',
    soundBath: 'Singing-bowl–like tones with spatial variation. Best on headphones.',
    psychoacoustic: 'Harmonic stacks and gentle motion for an immersive, mood-oriented wash.',
    neuroacoustic: 'Clear, detuned carriers for a steady “focus wash” without harsh peaks.',
    emdrBls: 'Alternating L/R tones (~1.5 Hz) for self-regulation — not clinical EMDR. Use headphones.',
};

const HEADPHONES_SOUND_TYPES = new Set([
    'binauralRelax', 'binauralFocus', 'binauralSleep', 'emdrBls',
]);

let breathPacerTimer = null;
let avePulseTimer = null;

function updateSoundTypeHint() {
    const sel = document.getElementById('soundType');
    const hint = document.getElementById('soundTypeHint');
    if (!sel || !hint) return;
    hint.textContent = SOUND_TYPE_HINTS[sel.value] || '';
    updateHeadphonesHint(sel.value);
    updateFreqDisplay();
}

function updateStressDisplay(value) {
    const stressDisplay = document.getElementById('stressDisplay');
    if (!stressDisplay) return;
    stressDisplay.textContent = value;
    const hue = 120 - value * 12;
    stressDisplay.style.color = `hsl(${hue}, 70%, 50%)`;
}
window.updateStressDisplay = updateStressDisplay;

function updateMoodDisplay(id, displayId, value) {
    const el = document.getElementById(displayId);
    if (el) el.textContent = value;
}

function updateProtocolHint() {
    const sel = document.getElementById('sessionProtocol');
    const hint = document.getElementById('protocolHint');
    const badge = document.getElementById('protocolEvidence');
    if (!sel || !window.CalmMindProtocols) return;
    const protocol = window.CalmMindProtocols.getProtocol(sel.value);
    if (!protocol) {
        if (hint) hint.textContent = 'Manual mode — adjust stress, duration, and sound type below.';
        badge?.classList.add('hidden');
        return;
    }
    if (hint) hint.textContent = protocol.description;
    if (badge) {
        badge.textContent = protocol.evidence.label;
        badge.className = `evidence-badge ${protocol.evidence.class}`;
        badge.classList.remove('hidden');
    }
    applyProtocolToForm(protocol);
}

function applyProtocolToForm(protocol) {
    if (!protocol) return;
    const duration = document.getElementById('duration');
    const stress = document.getElementById('stressLevel');
    const sound = document.getElementById('soundType');
    const ambient = document.getElementById('ambientSound');
    const viz = document.getElementById('visualizerType');
    if (duration) duration.value = protocol.durationMin;
    if (stress) {
        stress.value = protocol.stressLevel;
        updateStressDisplay(protocol.stressLevel);
    }
    if (sound) sound.value = protocol.soundType;
    if (ambient) ambient.value = protocol.ambientSound;
    if (viz && protocol.vizType) viz.value = protocol.vizType;
    updateSoundTypeHint();
    updateFreqDisplay();
    updateHeadphonesHint(protocol.soundType);
}

function updateHeadphonesHint(soundType) {
    const el = document.getElementById('headphonesHint');
    if (!el) return;
    const needs = HEADPHONES_SOUND_TYPES.has(soundType);
    el.classList.toggle('hidden', !needs);
}

function updateFreqDisplay() {
    const el = document.getElementById('freqDisplay');
    const soundType = document.getElementById('soundType')?.value;
    const stress = parseInt(document.getElementById('stressLevel')?.value || '5', 10);
    if (!el) return;
    const base = stress <= 3 ? 200 : stress <= 6 ? 180 : 160;
    const beat = stress <= 3 ? 8 : stress <= 6 ? 6 : 4;
    if (soundType?.startsWith('binaural')) {
        el.textContent = `Carrier ~${base} Hz · beat ~${beat} Hz (protocols may ramp frequencies)`;
    } else if (soundType?.startsWith('isochronic')) {
        const pulse = soundType === 'isochronicSleep' ? 2.5 : (stress <= 3 ? 14 : stress <= 6 ? 10 : 6);
        el.textContent = `Pulse ~${pulse} Hz · carrier ~${180 + stress * 12} Hz`;
    } else {
        el.textContent = '';
    }
}

function startBreathPacer(patternId = 'coherent') {
    stopBreathPacer();
    const section = document.getElementById('breathPacerSection');
    const orb = document.getElementById('breathOrb');
    const label = document.getElementById('breathLabel');
    if (!section || !orb) return;
    section.classList.remove('hidden');

    const pattern = window.CalmMindBreathPatterns?.getBreathPattern?.(patternId)
        || { phases: [{ name: 'inhale', durationSec: 4 }, { name: 'exhale', durationSec: 6 }] };

    let phaseIndex = 0;
    const runPhase = () => {
        const phase = pattern.phases[phaseIndex % pattern.phases.length];
        const isExhale = phase.name === 'exhale';
        orb.classList.toggle('breath-orb--exhale', isExhale);
        if (label) {
            label.textContent = phase.name === 'inhale' ? 'Inhale'
                : phase.name === 'exhale' ? 'Exhale'
                    : 'Hold';
        }
        phaseIndex += 1;
        breathPacerTimer = setTimeout(runPhase, phase.durationSec * 1000);
    };

    runPhase();
}

function stopBreathPacer() {
    if (breathPacerTimer) clearTimeout(breathPacerTimer);
    breathPacerTimer = null;
    document.getElementById('breathPacerSection')?.classList.add('hidden');
}

function startAvePulse() {
    stopAvePulse();
    const toggle = document.getElementById('aveToggle')?.value;
    const overlay = document.getElementById('aveOverlay');
    if (toggle !== 'on' || !overlay) return;
    overlay.classList.remove('hidden');
    let on = false;
    avePulseTimer = setInterval(() => {
        on = !on;
        overlay.style.opacity = on ? '0.06' : '0';
    }, 500);
}

function stopAvePulse() {
    if (avePulseTimer) clearInterval(avePulseTimer);
    avePulseTimer = null;
    const overlay = document.getElementById('aveOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.opacity = '0';
    }
}

function renderSessionHistory() {
    const list = document.getElementById('sessionHistoryList');
    if (!list || !window.CalmMindState) return;
    const { sessionHistory } = window.CalmMindState.load();
    list.innerHTML = '';
    if (!sessionHistory.length) {
        list.innerHTML = '<li class="session-history-empty">No sessions yet.</li>';
        return;
    }
    sessionHistory.slice(0, 15).forEach((s) => {
        const li = document.createElement('li');
        const delta = s.moodAfter != null && s.moodBefore != null ? s.moodAfter - s.moodBefore : null;
        const deltaStr = delta != null ? ` · Δ calm ${delta >= 0 ? '+' : ''}${delta}` : '';
        li.textContent = `${new Date(s.at).toLocaleString()} — ${s.soundType || s.protocolId || 'session'} · ${s.duration} min${deltaStr}`;
        list.appendChild(li);
    });
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
        console.error('Audio context not initialized');
        return;
    }

    addButtonPulse(playBtn);

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch((err) => console.error('Failed to resume AudioContext:', err));
    }

    if (isPlaying) {
        audioCtx.suspend().then(() => {
            isPlaying = false;
            if (playBtn) playBtn.textContent = 'Play';
            if (window.setPlayingState) window.setPlayingState(false);
            spatialIndicator?.classList.add('hidden');
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            if (playBtn) playBtn.textContent = 'Pause';
            if (window.setPlayingState) window.setPlayingState(true);
            spatialIndicator?.classList.remove('hidden');
        });
    }
}

function stopTrack() {
    window.stopCurrentTrack?.();
    stopBreathPacer();
    stopAvePulse();

    const moodAfter = document.getElementById('moodAfter');
    if (moodAfter) moodAfter.disabled = false;

    isPlaying = false;
    const playBtn = document.getElementById('playButton');
    if (playBtn) {
        playBtn.textContent = 'Play';
        playBtn.disabled = false;
    }

    const trackInfoEl = document.getElementById('trackInfo');
    if (trackInfoEl) trackInfoEl.textContent = 'No track playing';

    const stopButton = document.getElementById('stopButton');
    if (stopButton) stopButton.disabled = true;
}

async function generateTrackFromSettings() {
    const trackInfoEl = document.getElementById('trackInfo');

    const stressRaw = parseInt(document.getElementById('stressLevel').value, 10);
    const durationRaw = parseInt(document.getElementById('duration').value, 10);

    if (!Number.isFinite(stressRaw) || !Number.isFinite(durationRaw)) {
        if (trackInfoEl) {
            trackInfoEl.textContent =
                'Enter a valid stress level (1–10) and duration (1–60 minutes).';
        }
        return;
    }

    let stressLevel = Math.min(10, Math.max(1, stressRaw));
    let duration = Math.min(60, Math.max(1, durationRaw));
    let ambientSound = document.getElementById('ambientSound').value;
    let soundType = document.getElementById('soundType').value;
    const visualizerTypeElement = document.getElementById('visualizerType');
    let vizType = visualizerTypeElement ? visualizerTypeElement.value : 'particles';
    const protocolId = document.getElementById('sessionProtocol')?.value || 'none';
    const moodBefore = parseInt(document.getElementById('moodBefore')?.value || '3', 10);

    let frequencyPhases = null;
    let breathPattern = null;
    if (window.CalmMindProtocols && protocolId !== 'none') {
        const applied = window.CalmMindProtocols.applyProtocolToSettings(protocolId, {
            stressLevel, duration, ambientSound, soundType, vizType,
        });
        if (applied.protocol) {
            duration = applied.duration;
            soundType = applied.soundType;
            ambientSound = applied.ambientSound;
            vizType = applied.vizType;
            stressLevel = applied.stressLevel;
            frequencyPhases = applied.protocol.frequencyPhases || null;
            breathPattern = applied.breathPattern || applied.protocol.breathPattern || null;
        }
    }

    currentVisualizerType = vizType;

    const genBtn = document.getElementById('generateButton');
    if (genBtn) {
        genBtn.disabled = true;
        genBtn.textContent = 'Generating…';
    }

    try {
        window.stopCurrentTrack?.();
        ensureVisualizerElements();
        window.initAudio?.();

        const ctx = window.getAudioContext?.();
        if (ctx?.state === 'suspended') await ctx.resume();

        if (typeof window.playGeneratedTrack !== 'function') {
            if (trackInfoEl) trackInfoEl.textContent = 'Audio engine failed to load.';
            return;
        }

        const result = window.playGeneratedTrack(
            stressLevel,
            duration,
            ambientSound,
            soundType,
            vizType,
            { frequencyPhases, protocolId, moodBefore, breathPattern: breathPattern || (soundType === 'hrv' ? 'coherent' : undefined) }
        );
        const ok = await Promise.resolve(result);

        if (ok === false) {
            if (trackInfoEl) {
                trackInfoEl.textContent = 'Could not start the track. Try again.';
            }
            return;
        }

        if (soundType === 'hrv' || protocolId === 'coherenceBreath' || protocolId === 'boxBreath') {
            startBreathPacer(breathPattern || (protocolId === 'boxBreath' ? 'box' : 'coherent'));
        } else {
            stopBreathPacer();
        }
        startAvePulse();

        window.CalmMindState?.persistSettings?.({
            stressLevel, duration, ambientSound, soundType,
            protocolId, vizType,
            volume: parseFloat(document.getElementById('volumeSlider')?.value || '0.5'),
        });

        updateTrackInfo(stressLevel, duration, ambientSound, soundType, protocolId);
        enablePlayerControls();
        const moodAfterEl = document.getElementById('moodAfter');
        if (moodAfterEl) moodAfterEl.disabled = false;
        isPlaying = true;
        const playBtn = document.getElementById('playButton');
        if (playBtn) {
            playBtn.textContent = 'Pause';
            playBtn.disabled = false;
        }
    } catch (err) {
        console.error('Generate track failed:', err);
        if (trackInfoEl) {
            trackInfoEl.textContent =
                'Could not start audio. Try again or allow sound for this site.';
        }
    } finally {
        if (genBtn) {
            genBtn.disabled = false;
            genBtn.textContent = 'Generate track';
        }
    }
}

function ensureVisualizerElements() {
    const visualizerContainer = document.getElementById('visualizerContainer');
    if (!visualizerContainer) return;

    let canvas = document.getElementById('visualizerCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'visualizerCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        const stage =
            visualizerContainer.querySelector('.viz-panel__stage') || visualizerContainer;
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

function updateTrackInfo(stressLevel, duration, ambientSound, soundType, protocolId) {
    const trackInfoEl = document.getElementById('trackInfo');
    if (!trackInfoEl) return;

    const formattedSoundType = soundType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());

    let infoText = `${formattedSoundType} · Level ${stressLevel} · ${duration} min`;
    if (protocolId && protocolId !== 'none') {
        const p = window.CalmMindProtocols?.getProtocol(protocolId);
        if (p) infoText = `${p.name} · ${infoText}`;
    }
    if (ambientSound && ambientSound !== 'none') {
        const formattedAmbient = ambientSound.replace(/-/g, ' ');
        infoText += ` · ${formattedAmbient}`;
    }
    trackInfoEl.textContent = infoText;
}

function enablePlayerControls() {
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    if (playButton) {
        playButton.disabled = false;
        playButton.textContent = 'Pause';
    }
    if (stopButton) stopButton.disabled = false;
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
    } else {
        const g = window.getMasterGain?.();
        if (g) g.gain.value = volume;
    }
    applyVolumeSliderVisual(volumeInput, volume);
}

function switchTheme(themeName) {
    document.body.classList.remove(
        'light-theme',
        'space-gray-theme',
        'silver-theme',
        'gold-theme',
        'midnight-green-theme'
    );
    if (themeName !== 'dark') {
        document.body.classList.add(`${themeName}-theme`);
    }
    const darkUiThemes = ['dark', 'space-gray', 'midnight-green'];
    document.documentElement.style.colorScheme = darkUiThemes.includes(themeName) ? 'dark' : 'light';
    localStorage.setItem('calmMindTheme', themeName);
}

function initTheme() {
    const savedTheme = localStorage.getItem('calmMindTheme');
    if (savedTheme) {
        switchTheme(savedTheme);
        return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    switchTheme(prefersDark ? 'dark' : 'light');
}

function toggleAnimations(state) {
    document.body.classList.toggle('animations-disabled', state === 'disabled');
    localStorage.setItem('calmMindAnimations', state);
}

function initAnimations() {
    const saved = localStorage.getItem('calmMindAnimations') || 'enabled';
    toggleAnimations(saved);
}

function initGestures() {
    const container = document.getElementById('visualizerContainer');
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let dragging = false;

    container.addEventListener(
        'touchstart',
        (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            dragging = true;
        },
        { passive: true }
    );

    container.addEventListener(
        'touchmove',
        (e) => {
            if (!dragging || !window.camera) return;
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            window.camera.position.x += deltaX * 0.01;
            window.camera.position.y -= deltaY * 0.01;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        },
        { passive: true }
    );

    container.addEventListener('touchend', () => {
        dragging = false;
    }, { passive: true });
}

function updateVisualizerType(type) {
    currentVisualizerType = type;
    if (typeof window.changeVisualizerType === 'function') {
        window.changeVisualizerType(type);
        return;
    }
    const canvas = document.getElementById('visualizerCanvas');
    const analyser = window.getAnalyser?.();
    if (canvas && analyser && window.setupVisualizer) {
        window.setupVisualizer(canvas, analyser, type);
    }
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
    document.documentElement.style.setProperty(
        '--app-transition',
        'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    );

    initTheme();
    initAnimations();
    initGestures();
    window.initAudio?.();
    ensureVisualizerElements();

    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value =
            localStorage.getItem('calmMindTheme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        themeSelector.addEventListener('change', function onThemeChange() {
            switchTheme(this.value);
        });
    }

    const animationsToggle = document.getElementById('animationsToggle');
    if (animationsToggle) {
        animationsToggle.value = localStorage.getItem('calmMindAnimations') || 'enabled';
        animationsToggle.addEventListener('change', function onAnimationsChange() {
            toggleAnimations(this.value);
        });
    }

    const stressLevelInput = document.getElementById('stressLevel');
    if (stressLevelInput) {
        stressLevelInput.addEventListener('input', () => {
            updateStressDisplay(parseInt(stressLevelInput.value, 10));
            updateFreqDisplay();
        });
        updateStressDisplay(stressLevelInput.value);
    }

    document.getElementById('generateButton')?.addEventListener('click', () => {
        generateTrackFromSettings().catch((err) => console.error(err));
    });
    document.getElementById('playButton')?.addEventListener('click', togglePlay);

    const volumeInput = document.getElementById('volumeSlider');
    if (volumeInput) {
        volumeInput.addEventListener('input', adjustVolume);
        adjustVolume();
    }

    document.getElementById('stopButton')?.addEventListener('click', () => {
        const moodBefore = parseInt(document.getElementById('moodBefore')?.value || '3', 10);
        const moodAfter = parseInt(document.getElementById('moodAfter')?.value || '3', 10);
        const protocolId = document.getElementById('sessionProtocol')?.value;
        const soundType = document.getElementById('soundType')?.value;
        const duration = parseInt(document.getElementById('duration')?.value || '10', 10);
        window.CalmMindState?.addSession?.({
            protocolId, soundType, duration, moodBefore, moodAfter,
        });
        renderSessionHistory();
        stopTrack();
    });

    document.getElementById('sessionProtocol')?.addEventListener('change', updateProtocolHint);

    document.getElementById('moodBefore')?.addEventListener('input', (e) => {
        updateMoodDisplay('moodBefore', 'moodBeforeDisplay', e.target.value);
    });
    document.getElementById('moodAfter')?.addEventListener('input', (e) => {
        updateMoodDisplay('moodAfter', 'moodAfterDisplay', e.target.value);
    });

    document.getElementById('saveFavoriteBtn')?.addEventListener('click', () => {
        const name = window.prompt('Name this favorite session:', 'My calm preset');
        if (!name) return;
        window.CalmMindState?.saveFavorite?.(name, {
            stressLevel: document.getElementById('stressLevel')?.value,
            duration: document.getElementById('duration')?.value,
            ambientSound: document.getElementById('ambientSound')?.value,
            soundType: document.getElementById('soundType')?.value,
            protocolId: document.getElementById('sessionProtocol')?.value,
            vizType: document.getElementById('visualizerType')?.value,
        });
    });

    window.CalmMindState?.restoreSettingsToForm?.();
    renderSessionHistory();
    updateProtocolHint();

    const visualizerType = document.getElementById('visualizerType');
    if (visualizerType) {
        currentVisualizerType = visualizerType.value;
        visualizerType.addEventListener('change', (e) => updateVisualizerType(e.target.value));
    }

    const soundTypeSelect = document.getElementById('soundType');
    if (soundTypeSelect) {
        soundTypeSelect.addEventListener('change', updateSoundTypeHint);
        updateSoundTypeHint();
    }

    animateSections();
});
