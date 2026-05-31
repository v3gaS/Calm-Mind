/**
 * CalmMind design UI bridge — catalog, frequency readouts, engine wiring, shared viz frame.
 * @global CalmMind
 * @depends client/js/audio.js, audio-reactive-bridge.js, protocols.js, ambient-loader.js
 */
(function () {
    'use strict';

    const SOUND_TYPES = [
        { key: 'binauralRelax', label: 'Binaural · Relaxation', group: 'Binaural' },
        { key: 'binauralFocus', label: 'Binaural · Focus', group: 'Binaural' },
        { key: 'binauralSleep', label: 'Binaural · Sleep', group: 'Binaural' },
        { key: 'isochronicEnergy', label: 'Isochronic · Energy', group: 'Isochronic' },
        { key: 'isochronicMeditate', label: 'Isochronic · Meditation', group: 'Isochronic' },
        { key: 'isochronicSleep', label: 'Isochronic · Sleep', group: 'Isochronic' },
        { key: 'pinkNoise', label: 'Pink noise · Deep sleep', group: 'Noise' },
        { key: 'whiteNoise', label: 'White noise · Focus', group: 'Noise' },
        { key: 'brownNoise', label: 'Brown noise · Sleep', group: 'Noise' },
        { key: 'nature', label: 'Nature · Enhanced', group: 'Ambient' },
        { key: 'solfeggio', label: 'Solfeggio frequencies', group: 'Tonal' },
        { key: 'monaural', label: 'Monaural beats', group: 'Beats' },
        { key: 'gamma', label: 'Gamma waves', group: 'Brainwave' },
        { key: 'hrv', label: 'HRV coherence', group: 'Brainwave' },
        { key: 'emdrBls', label: 'Bilateral stimulation (BLS)', group: 'Beats' },
        { key: 'soundBath', label: 'Sound bath', group: 'Tonal' },
        { key: 'psychoacoustic', label: 'Psychoacoustic mood', group: 'Tonal' },
        { key: 'neuroacoustic', label: 'Neuroacoustic', group: 'Brainwave' },
    ];

    const HINTS = {
        binauralRelax: "Binaural beats near Earth's resonance (~7.83 Hz) for deep relaxation.",
        binauralFocus: 'Beta-range binaural beats to support concentration and alertness.',
        binauralSleep: 'Delta-range binaural beats for sleep and regeneration.',
        isochronicEnergy: 'Isochronic pulses in higher beta for energy and motivation.',
        isochronicMeditate: 'Isochronic pulses in the alpha range for calm, creative focus.',
        isochronicSleep: 'Slow delta/theta isochronic pulses for sleep — keep volume low.',
        pinkNoise: 'Broad-spectrum pink noise to mask distractions and aid sleep.',
        whiteNoise: 'Flat-spectrum white noise for focus and distraction masking.',
        brownNoise: 'Deep brown noise — softer low end, often used for sleep and calm focus.',
        nature: 'Layered nature-inspired tones with gentle modulation.',
        solfeggio: 'Single-tone Solfeggio-related frequency chosen by stress level.',
        monaural: 'Monaural beating — works without headphones; theta-oriented.',
        gamma: '40 Hz content associated with alertness and cognitive binding.',
        hrv: 'Slow ~0.1 Hz modulation to pace breathing and heart-brain coherence.',
        soundBath: 'Singing-bowl tones with spatial movement. Best on headphones.',
        psychoacoustic: 'Harmonic stacks and gentle motion — an immersive mood wash.',
        neuroacoustic: 'Clear detuned carriers for a steady focus wash.',
        emdrBls: 'Alternating L/R tones (~1.5 Hz) for self-regulation. Use headphones.',
    };

    const HEADPHONES = new Set(['binauralRelax', 'binauralFocus', 'binauralSleep', 'emdrBls', 'soundBath']);

    const AMBIENT_LABELS = {
        rain: 'Rain',
        'rain-heavy': 'Rain · heavy',
        'rain-tent': 'Rain · tent',
        'rain-concrete': 'Rain · concrete',
        ocean: 'Ocean',
        'ocean-calm': 'Ocean · calm',
        'ocean-dellec': 'Ocean · dellec',
        'ocean-terns': 'Ocean · terns',
        forest: 'Forest',
        'forest-stream': 'Forest stream',
        fireplace: 'Fireplace',
        'night-crickets': 'Night crickets',
        'wind-grass': 'Wind · grass',
    };

    /** Canvas viz mode per guided protocol (design UI). */
    const PROTOCOL_VIZ = {
        anxietyReset: 'tissue',
        sleepOnset: 'tissue',
        focusSprint: 'mandala',
        coherenceBreath: 'tissue',
        blsCalm: 'neural',
        deepSleep: 'tissue',
        focusStudy: 'mandala',
        windDown: 'tissue',
        boxBreath: 'tissue',
    };

    const BAND_DESC = {
        Delta: 'Deep sleep & regeneration. Slowest cortical rhythm.',
        Theta: 'Deep relaxation, meditation & memory consolidation.',
        Alpha: 'Relaxed, present awareness — the calm-but-alert state.',
        Beta: 'Active concentration, alertness and engaged focus.',
        Gamma: 'Peak focus & neural binding — high-level processing.',
        Coherence: 'Heart-brain coherence — breath and pulse in sync.',
        Tonal: 'Single-tone or harmonic wash.',
        Broadband: 'Full-spectrum noise masking.',
        Ambient: 'Nature-inspired wash.',
        Harmonic: 'Resonant bowl harmonics.',
        Bilateral: 'Alternating left/right stimulation.',
        Focus: 'Steady detuned carrier wash.',
    };

    function buildAmbients() {
        const list = [{ key: 'none', label: 'None' }];
        const manifest = window.AmbientLoader?.AMBIENT_MANIFEST;
        if (manifest) {
            Object.keys(manifest).forEach((key) => {
                list.push({ key, label: AMBIENT_LABELS[key] || key });
            });
        }
        return list;
    }

    function buildPresets() {
        const presets = [{ id: 'none', name: 'Custom', sub: 'Your settings' }];
        const protocols = window.CalmMindProtocols?.PROTOCOLS;
        if (!protocols) return presets;

        Object.keys(protocols).forEach((id) => {
            const p = protocols[id];
            if (!p) return;
            const sub = (p.description || '').split('.')[0] || `${p.durationMin} min`;
            presets.push({
                id,
                name: p.name,
                sub,
                durationMin: p.durationMin,
                soundType: p.soundType,
                stressLevel: p.stressLevel,
                ambientSound: p.ambientSound || 'none',
                frequencyPhases: p.frequencyPhases || null,
                breathPattern: p.breathPattern || null,
                viz: PROTOCOL_VIZ[id] || 'neural',
                evidence: p.evidence,
            });
        });
        return presets;
    }

    function bandFromBeat(hz) {
        if (hz < 4) return 'Delta';
        if (hz < 8) return 'Theta';
        if (hz < 13) return 'Alpha';
        if (hz < 30) return 'Beta';
        return 'Gamma';
    }

    function freqInfoLocal(soundType, stress) {
        stress = Math.min(10, Math.max(1, stress));
        let carrier = 0;
        let beat = 0;
        let binaural = false;
        let band;
        let hzLabel;
        let breathRate = null;
        const clamp = (s) => Math.min(10, Math.max(1, s));

        if (soundType.startsWith('binaural')) {
            let s = stress;
            if (soundType === 'binauralFocus') s = clamp(stress + 2);
            if (soundType === 'binauralSleep') s = clamp(stress - 2);
            carrier = s <= 3 ? 200 : s <= 6 ? 180 : 160;
            beat = s <= 3 ? 8 : s <= 6 ? 6 : 4;
            binaural = true;
            band = bandFromBeat(beat);
            hzLabel = `${beat.toFixed(2)} Hz`;
        } else if (soundType.startsWith('isochronic')) {
            if (soundType === 'isochronicSleep') {
                beat = 2.5;
                carrier = 180;
            } else {
                const s = soundType === 'isochronicEnergy' ? clamp(stress + 3) : clamp(stress - 2);
                beat = s <= 3 ? 14 : s <= 6 ? 10 : 6;
                carrier = 180 + s * 12;
            }
            band = bandFromBeat(beat);
            hzLabel = `${beat.toFixed(1)} Hz pulse`;
        } else if (soundType === 'monaural') {
            carrier = stress <= 3 ? 200 : stress <= 6 ? 160 : 120;
            beat = stress <= 3 ? 8 : stress <= 6 ? 6 : 4;
            band = bandFromBeat(beat);
            hzLabel = `${beat.toFixed(1)} Hz`;
        } else if (soundType === 'gamma') {
            carrier = 200;
            beat = 40;
            band = 'Gamma';
            hzLabel = '40 Hz';
        } else if (soundType === 'hrv') {
            carrier = 256;
            beat = 0.1;
            band = 'Coherence';
            hzLabel = '0.1 Hz · 5.5 bpm';
            breathRate = 0.1;
        } else if (soundType === 'solfeggio') {
            const tone = stress >= 8 ? 396 : stress >= 6 ? 417 : stress >= 4 ? 639 : stress >= 2 ? 528 : 852;
            carrier = tone;
            band = 'Tonal';
            hzLabel = `${tone} Hz`;
        } else if (soundType === 'psychoacoustic') {
            const tone = stress <= 3 ? 432 : stress <= 6 ? 396 : 528;
            carrier = tone;
            band = 'Tonal';
            hzLabel = `${tone} Hz base`;
        } else if (soundType === 'neuroacoustic') {
            carrier = 200 + stress * 16;
            beat = +(carrier * 0.025).toFixed(1);
            binaural = true;
            band = 'Focus';
            hzLabel = `detune ${beat} Hz`;
        } else if (soundType === 'emdrBls') {
            carrier = 440;
            beat = 1.5;
            band = 'Bilateral';
            hzLabel = '1.5 Hz pan';
        } else if (soundType === 'pinkNoise' || soundType === 'whiteNoise' || soundType === 'brownNoise') {
            band = 'Broadband';
            hzLabel = soundType === 'whiteNoise' ? 'flat spectrum' : soundType === 'brownNoise' ? 'deep spectrum' : 'full spectrum';
        } else if (soundType === 'nature') {
            band = 'Ambient';
            hzLabel = 'nature wash';
        } else if (soundType === 'soundBath') {
            carrier = 264;
            band = 'Harmonic';
            hzLabel = 'bowls 264–495 Hz';
        } else {
            band = '—';
            hzLabel = '—';
        }

        const left = carrier;
        const right = binaural ? +(carrier + beat).toFixed(2) : carrier;
        return {
            carrier,
            beat,
            binaural,
            band,
            hzLabel,
            breathRate,
            left,
            right,
            headphones: HEADPHONES.has(soundType),
            hint: HINTS[soundType] || '',
        };
    }

    function freqInfo(soundType, stress) {
        const bridge = window.CalmMindAudioReactive;
        if (bridge?.estimateTargetFrequencies) {
            const est = bridge.estimateTargetFrequencies(stress, soundType);
            const beat = est.beatHz ?? est.pulseHz;
            const carrier = est.carrierHz;
            const binaural = est.headphonesRequired && beat != null && carrier != null;
            const band = est.brainBand?.label || (beat != null ? bandFromBeat(beat) : '—');
            let hzLabel = '—';
            if (beat != null && beat >= 0.5) hzLabel = `${Number(beat).toFixed(beat < 10 ? 2 : 1)} Hz`;
            else if (carrier != null) hzLabel = `${carrier} Hz`;
            if (soundType === 'hrv') hzLabel = '0.1 Hz · 5.5 bpm';
            const local = freqInfoLocal(soundType, stress);
            return {
                carrier: carrier ?? local.carrier,
                beat: beat ?? local.beat,
                binaural: binaural || local.binaural,
                band,
                hzLabel: hzLabel !== '—' ? hzLabel : local.hzLabel,
                breathRate: soundType === 'hrv' ? 0.1 : local.breathRate,
                left: carrier ?? local.left,
                right: binaural && carrier != null && beat != null ? +(carrier + beat).toFixed(2) : (carrier ?? local.right),
                headphones: est.headphonesRequired ?? local.headphones,
                hint: HINTS[soundType] || est.description || local.hint,
            };
        }
        return freqInfoLocal(soundType, stress);
    }

    function bandMeters(band) {
        const base = { Delta: 0.16, Theta: 0.2, Alpha: 0.28, Beta: 0.22, Gamma: 0.14 };
        const m = { ...base };
        if (m[band] !== undefined) {
            Object.keys(m).forEach((k) => { m[k] *= 0.55; });
            m[band] = 0.88;
        }
        return m;
    }

    const PALETTES = {
        neural: { a: [139, 92, 246], b: [34, 211, 238], c: [120, 150, 255] },
        tissue: { a: [16, 185, 129], b: [56, 189, 248], c: [110, 243, 200] },
        mandala: { a: [167, 139, 250], b: [34, 211, 238], c: [52, 211, 153] },
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionScale = reducedMotion ? 0.35 : 1;

    const frame = {
        amp: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        data: null,
        breath: 0.5,
        breathLabel: null,
        playing: false,
        motionScale,
        a: PALETTES.neural.a,
        b: PALETTES.neural.b,
        c: PALETTES.neural.c,
    };

    let analyser = null;
    let realData = null;
    const demoData = new Uint8Array(256);
    let breathPeriod = 10.9;
    let activeBreathPatternId = 'coherent';
    let sessionStartPerf = performance.now();
    let tStart = performance.now();
    const CMlive = { active: false, session: null, peak: 0 };

    function tryAttachAnalyser() {
        if (analyser) return true;
        if (typeof window.getAnalyser === 'function') {
            try {
                const a = window.getAnalyser();
                if (a?.frequencyBinCount) {
                    analyser = a;
                    realData = new Uint8Array(a.frequencyBinCount);
                    return true;
                }
            } catch (e) { /* noop */ }
        }
        return false;
    }

    function range(arr, a, b) {
        let s = 0;
        let n = 0;
        for (let i = a; i < b && i < arr.length; i++) {
            s += arr[i];
            n++;
        }
        return n ? s / n / 255 : 0;
    }

    function scaleMotion(v) {
        return v * frame.motionScale;
    }

    function updateFrame() {
        const t = (performance.now() - tStart) / 1000;
        const setBreath = (per) => {
            const p = (t % per) / per;
            frame.breath = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
            if (frame.playing && window.CalmMindBreathPatterns?.phaseAtElapsed) {
                const elapsed = (performance.now() - sessionStartPerf) / 1000;
                const phase = window.CalmMindBreathPatterns.phaseAtElapsed(activeBreathPatternId, elapsed);
                frame.breathLabel = window.CalmMindBreathPatterns.breathWordForPhase(phase.name);
            } else {
                frame.breathLabel = null;
            }
        };
        let data;
        let amp;
        let handled = false;

        if (frame.playing && window.CalmMindAudioReactive?.getAudioFrame) {
            let af = null;
            try {
                af = window.CalmMindAudioReactive.getAudioFrame({ includeSpectrum: true });
            } catch (e) { /* noop */ }
            if (af) {
                frame.amp = scaleMotion(af.level || 0);
                frame.bass = scaleMotion(af.bass || 0);
                frame.mid = scaleMotion(af.mid || 0);
                frame.treble = scaleMotion(af.treble || 0);
                frame.data = af.spectrum?.length ? af.spectrum : frame.data;
                CMlive.active = true;
                CMlive.session = af.session || null;
                CMlive.peak = af.peakFrequencyHz || 0;
                const bHz = af.session?.beatHz;
                setBreath(bHz && bHz > 0 && bHz < 2 ? 1 / bHz : breathPeriod);
                return;
            }
        }
        CMlive.active = false;
        CMlive.session = null;

        if (frame.playing && tryAttachAnalyser()) {
            analyser.getByteFrequencyData(realData);
            data = realData;
            handled = true;
            let s = 0;
            for (let i = 0; i < data.length; i++) s += data[i];
            amp = s / data.length / 255;
        }

        if (!handled) {
            const env = frame.playing ? 0.55 + 0.4 * frame.breath : 0;
            for (let i = 0; i < demoData.length; i++) {
                const fall = Math.pow(1 - i / demoData.length, 1.6);
                const wob = 0.5 + 0.5 * Math.sin(i * 0.2 - t * 4 + Math.sin(t * 0.7) * 2);
                const bump = Math.exp(-Math.pow((i - (20 + 30 * frame.breath)) / 26, 2));
                demoData[i] = Math.max(0, Math.min(255, 255 * env * (fall * (0.55 + 0.45 * wob) + bump * 0.5)));
            }
            data = demoData;
            let s = 0;
            for (let i = 0; i < data.length; i++) s += data[i];
            amp = s / data.length / 255;
        }

        setBreath(breathPeriod);
        frame.data = frame.playing ? data : null;
        frame.amp = scaleMotion(amp);
        frame.bass = scaleMotion(range(data, 0, 12));
        frame.mid = scaleMotion(range(data, 12, 90));
        frame.treble = scaleMotion(range(data, 90, Math.min(255, data.length)));
    }

    function loop() {
        updateFrame();
        requestAnimationFrame(loop);
    }
    loop();

    const Engine = {
        real: false,
        async start(s) {
            this.real = false;
            try {
                if (typeof window.playGeneratedTrack === 'function') {
                    window.initAudio?.();
                    const ctx = window.getAudioContext?.();
                    if (ctx?.state === 'suspended') await ctx.resume();

                    const vizMap = s.viz === 'mandala' ? 'meshWave' : 'particles';
                    const result = window.playGeneratedTrack(
                        s.stress,
                        s.duration,
                        s.ambient,
                        s.soundType,
                        vizMap,
                        s.options || {}
                    );
                    const ok = await Promise.resolve(result);
                    if (ok !== false) {
                        window.setPlayingState?.(true);
                        this.real = true;
                    }
                }
            } catch (e) {
                console.warn('[CalmMind] engine start fallback to demo:', e);
            }
            analyser = null;
            sessionStartPerf = performance.now();
            tStart = performance.now();
            frame.playing = true;
            return this.real;
        },
        pause(paused) {
            try {
                const ctx = typeof window.getAudioContext === 'function' ? window.getAudioContext() : null;
                if (ctx) {
                    if (paused) ctx.suspend();
                    else ctx.resume();
                }
                window.setPlayingState?.(!paused);
            } catch (e) { /* noop */ }
            frame.playing = !paused;
        },
        stop() {
            try {
                window.stopCurrentTrack?.();
                window.setPlayingState?.(false);
            } catch (e) { /* noop */ }
            frame.playing = false;
            analyser = null;
        },
        setVolume(v) {
            try {
                window.setVolume?.(v);
            } catch (e) { /* noop */ }
        },
    };

    window.CalmMind = {
        SOUND_TYPES,
        HINTS,
        HEADPHONES,
        get PRESETS() { return buildPresets(); },
        get AMBIENTS() { return buildAmbients(); },
        PALETTES,
        PROTOCOL_VIZ,
        freqInfo,
        bandMeters,
        bandFromBeat,
        BAND_DESC,
        frame,
        Engine,
        live: CMlive,
        reducedMotion,
        setPalette(mode) {
            const p = PALETTES[mode] || PALETTES.neural;
            frame.a = p.a;
            frame.b = p.b;
            frame.c = p.c;
        },
        setBreathRate(hz) {
            breathPeriod = hz ? 1 / hz : 10.9;
        },
        setBreathPattern(patternId) {
            activeBreathPatternId = patternId || 'coherent';
            const p = window.CalmMindBreathPatterns?.getBreathPattern?.(activeBreathPatternId);
            if (p?.cycleSec) {
                breathPeriod = p.cycleSec;
            }
        },
        applyProtocol(protocolId, form) {
            if (!protocolId || protocolId === 'none' || !window.CalmMindProtocols) {
                return { ...form, protocolId: 'none', frequencyPhases: null, breathPattern: null };
            }
            const applied = window.CalmMindProtocols.applyProtocolToSettings(protocolId, {
                stressLevel: form.stress,
                duration: form.duration,
                ambientSound: form.ambient,
                soundType: form.soundType,
                vizType: 'particles',
            });
            if (!applied.protocol) {
                return { ...form, protocolId: 'none', frequencyPhases: null, breathPattern: null };
            }
            return {
                stress: applied.stressLevel,
                duration: applied.duration,
                ambient: applied.ambientSound,
                soundType: applied.soundType,
                protocolId,
                frequencyPhases: applied.protocol.frequencyPhases || null,
                breathPattern: applied.breathPattern || applied.protocol.breathPattern || null,
                viz: PROTOCOL_VIZ[protocolId] || 'neural',
            };
        },
    };
})();
