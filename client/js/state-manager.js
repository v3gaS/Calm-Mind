/**
 * Browser session state — favorites, history, mood check-ins (localStorage).
 * @global CalmMindState
 * @depends localStorage
 * @usedby client/js/design-shell.js, client/js/app.js (legacy)
 */
'use strict';

const STORAGE_KEY = 'calmMindState';

/** Map legacy Three.js viz types to canvas modes for primary UI restore. */
const LEGACY_VIZ_TO_CANVAS = {
    particles: 'neural',
    meshWave: 'mandala',
    spectrum: 'mandala',
};

function normalizeCanvasVizType(vizType) {
    if (!vizType) return 'neural';
    return LEGACY_VIZ_TO_CANVAS[vizType] || vizType;
}

const defaultState = () => ({
    favorites: [],
    sessionHistory: [],
    lastMoodBefore: null,
    settings: {
        stressLevel: 5,
        duration: 10,
        ambientSound: 'none',
        soundType: 'binauralRelax',
        protocolId: 'none',
        vizType: 'neural',
        volume: 0.5,
    },
});

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultState();
        const parsed = { ...defaultState(), ...JSON.parse(raw) };
        if (parsed.settings) {
            parsed.settings.vizType = normalizeCanvasVizType(parsed.settings.vizType);
        }
        return parsed;
    } catch {
        return defaultState();
    }
}

function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('[CalmMindState] save failed', err);
    }
}

function addSession(entry) {
    const state = load();
    state.sessionHistory.unshift({
        ...entry,
        at: new Date().toISOString(),
    });
    state.sessionHistory = state.sessionHistory.slice(0, 50);
    save(state);
    return state;
}

function saveFavorite(name, settings) {
    const state = load();
    state.favorites = state.favorites.filter((f) => f.name !== name);
    state.favorites.unshift({ name, settings, savedAt: new Date().toISOString() });
    state.favorites = state.favorites.slice(0, 10);
    save(state);
    return state;
}

function persistSettings(settings) {
    const state = load();
    state.settings = { ...state.settings, ...settings };
    if (settings.vizType !== undefined) {
        state.settings.vizType = normalizeCanvasVizType(settings.vizType);
    }
    save(state);
}

function setFirstFound(ids, val) {
    if (val === undefined) return;
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
            return;
        }
    }
}

/** Restore persisted settings — supports legacy and primary DOM IDs. */
function restoreSettingsToForm() {
    const state = load();
    const s = state.settings;

    setFirstFound(['stressLevel', 'stress'], s.stressLevel);
    setFirstFound(['duration'], s.duration);
    setFirstFound(['ambientSound', 'ambient'], s.ambientSound);
    setFirstFound(['soundType'], s.soundType);
    setFirstFound(['sessionProtocol'], s.protocolId || 'none');

    const canvasViz = normalizeCanvasVizType(s.vizType);
    setFirstFound(['visualizerType'], canvasViz);
    document.querySelectorAll('[data-viz]').forEach((btn) => {
        btn.classList.toggle('on', btn.dataset.viz === canvasViz);
    });

    if (s.volume !== undefined) {
        const legacyVol = document.getElementById('volumeSlider');
        const designVol = document.getElementById('volume');
        if (legacyVol) legacyVol.value = s.volume;
        if (designVol) designVol.value = Math.round(Number(s.volume) * 100);
    }

    if (typeof window.updateStressDisplay === 'function') {
        window.updateStressDisplay(s.stressLevel);
    }
    return state;
}

window.CalmMindState = {
    load,
    save,
    addSession,
    saveFavorite,
    persistSettings,
    restoreSettingsToForm,
    normalizeCanvasVizType,
    LEGACY_VIZ_TO_CANVAS,
};
