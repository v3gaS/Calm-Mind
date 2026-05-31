/**
 * CalmMind design shell — DOM wiring for compose/playing UI + canvas visualizers.
 * @depends design-bridge.js, calm-viz.js
 */
(function () {
    'use strict';

    const CM = window.CalmMind;
    const VZ = window.CalmViz;
    const $ = (id) => document.getElementById(id);
    const app = $('app');
    const canvas = $('viz');

    let vizInst = null;
    let vizMode = 'neural';
    let currentProtocolId = 'none';
    let currentPhases = null;
    let currentBreathPattern = null;

    function mountViz(mode) {
        if (vizInst) vizInst.destroy();
        CM.setPalette(mode);
        vizInst = VZ[mode](canvas, () => CM.frame);
        vizMode = mode;
        document.querySelectorAll('[data-viz]').forEach((b) => {
            b.classList.toggle('on', b.dataset.viz === mode);
        });
        updateBreathVisibility();
    }

    let rT;
    window.addEventListener('resize', () => {
        clearTimeout(rT);
        rT = setTimeout(() => vizInst?.resize(), 120);
    });

    const soundSel = $('soundType');
    const ambSel = $('ambient');

    CM.SOUND_TYPES.forEach((s) => {
        const o = document.createElement('option');
        o.value = s.key;
        o.textContent = s.label;
        soundSel.appendChild(o);
    });

    CM.AMBIENTS.forEach((a) => {
        const o = document.createElement('option');
        o.value = a.key;
        o.textContent = a.label;
        ambSel.appendChild(o);
    });

    const presetRow = $('presetRow');
    CM.PRESETS.forEach((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'preset';
        b.dataset.id = p.id;
        b.innerHTML = `<span>${p.name}</span><span class="ps">${p.sub}</span>`;
        if (p.id === 'none') b.classList.add('on');
        b.addEventListener('click', () => applyPreset(p));
        presetRow.appendChild(b);
    });

    function setPresetActive(id) {
        document.querySelectorAll('#presetRow .preset').forEach((b) => {
            b.classList.toggle('on', b.dataset.id === id);
        });
    }

    function applyPreset(p) {
        setPresetActive(p.id);
        currentProtocolId = p.id;
        if (p.id === 'none') {
            currentPhases = null;
            currentBreathPattern = null;
            refreshReadout();
            return;
        }
        $('stress').value = p.stressLevel;
        $('duration').value = p.durationMin;
        soundSel.value = p.soundType;
        ambSel.value = p.ambientSound || 'none';
        currentPhases = p.frequencyPhases || null;
        currentBreathPattern = p.breathPattern || null;
        if (currentBreathPattern) CM.setBreathPattern(currentBreathPattern);
        if (p.viz) mountViz(p.viz);
        syncStress();
        syncDuration();
        refreshReadout();
        updateHeadphonesHint();
    }

    function stressLabel(v) {
        if (v <= 2) return 'Deeply calm';
        if (v <= 4) return 'Calm';
        if (v === 5) return 'Balanced';
        if (v <= 7) return 'Tense';
        return 'Stressed';
    }

    function syncStress() {
        const v = +$('stress').value;
        $('stressVal').textContent = v;
        $('stressLabel').textContent = stressLabel(v);
    }

    function syncDuration() {
        const v = +$('duration').value;
        $('durationVal').innerHTML = `${v}<span style="font-size:12px"> min</span>`;
        $('total').textContent = fmt(v * 60);
    }

    function syncMoodDisplay(id, displayId, val) {
        const el = $(displayId);
        if (el) el.textContent = val;
    }

    $('stress').addEventListener('input', () => {
        syncStress();
        markCustom();
        refreshReadout();
    });
    $('duration').addEventListener('input', () => {
        syncDuration();
        markCustom();
    });
    soundSel.addEventListener('change', () => {
        markCustom();
        refreshReadout();
        updateHeadphonesHint();
    });
    ambSel.addEventListener('change', markCustom);

    $('moodBefore')?.addEventListener('input', (e) => {
        syncMoodDisplay('moodBefore', 'moodBeforeVal', e.target.value);
    });

    $('moodAfter')?.addEventListener('input', (e) => {
        syncMoodDisplay('moodAfter', 'moodAfterVal', e.target.value);
    });

    document.querySelectorAll('#vizSeg button,#vizSeg2 button').forEach((b) => {
        b.addEventListener('click', () => mountViz(b.dataset.viz));
    });

    function markCustom() {
        currentPhases = null;
        currentBreathPattern = null;
        currentProtocolId = 'none';
        setPresetActive('none');
    }

    function fmt(s) {
        s = Math.max(0, Math.round(s));
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }

    const HEADPHONES_HINT_MS = 4500;
    let headphonesHintTimer = null;

    function hideHeadphonesHint() {
        const hint = $('headphonesHint');
        if (!hint) return;
        clearTimeout(headphonesHintTimer);
        headphonesHintTimer = null;
        hint.classList.remove('fading');
        hint.classList.add('hidden');
    }

    function showHeadphonesHintBriefly() {
        const hint = $('headphonesHint');
        if (!hint || app.classList.contains('state-playing')) return;
        const info = CM.freqInfo(soundSel.value, +$('stress').value);
        if (!info.headphones) {
            hideHeadphonesHint();
            return;
        }
        clearTimeout(headphonesHintTimer);
        hint.classList.remove('fading', 'hidden');
        headphonesHintTimer = setTimeout(() => {
            hint.classList.add('fading');
            headphonesHintTimer = setTimeout(() => {
                hint.classList.add('hidden');
                hint.classList.remove('fading');
                headphonesHintTimer = null;
            }, 350);
        }, HEADPHONES_HINT_MS);
    }

    function updateHeadphonesHint() {
        if (app.classList.contains('state-playing')) {
            hideHeadphonesHint();
            return;
        }
        const info = CM.freqInfo(soundSel.value, +$('stress').value);
        if (info.headphones) showHeadphonesHintBriefly();
        else hideHeadphonesHint();
    }

    function refreshReadout() {
        const st = soundSel.value;
        const stress = +$('stress').value;
        const info = CM.freqInfo(st, stress);
        const label = (CM.SOUND_TYPES.find((s) => s.key === st) || {}).label || st;

        $('soundHint').innerHTML = info.hint + (info.headphones ? ' <span class="hp">· headphones recommended</span>' : '');
        $('bandName').textContent = info.band;
        $('bandHz').textContent = info.hzLabel;
        $('bandDesc').textContent = CM.BAND_DESC[info.band] || info.hint;
        const m = CM.bandMeters(info.band);
        document.querySelectorAll('#meters .fill').forEach((f) => {
            const v = m[f.dataset.band];
            f.style.width = `${((v !== undefined ? v : 0.08) * 100)}%`;
        });
        $('leftHz').textContent = info.left ? info.left.toFixed(info.left % 1 ? 1 : 0) : '—';
        $('rightHz').textContent = info.right ? info.right.toFixed(info.right % 1 ? 1 : 0) : '—';
        $('beatHz').textContent = info.binaural ? `${info.beat} Hz` : info.hzLabel;
        $('binNote').textContent = info.binaural
            ? 'True L/R offset — wear headphones for the beat.'
            : st === 'monaural'
                ? 'Monaural — beat is pre-mixed; speakers OK.'
                : st === 'emdrBls'
                    ? 'Alternating L/R panning.'
                    : 'No binaural offset for this type.';
        $('nowTitle').textContent = label;
        $('nowSub').textContent = `· Level ${stress} · ${$('duration').value} min`;
        if (currentBreathPattern && window.CalmMindBreathPatterns) {
            const bp = window.CalmMindBreathPatterns.getBreathPattern(currentBreathPattern);
            CM.setBreathPattern(currentBreathPattern);
            CM.setBreathRate(1 / bp.cycleSec);
        } else {
            CM.setBreathRate(info.breathRate);
        }
        updateBreathVisibility();
        buildTimeline();
    }

    function buildTimeline() {
        const track = $('tlTrack');
        const empty = $('tlEmpty');
        track.innerHTML = '';
        if (!currentPhases?.length) {
            track.style.display = 'none';
            empty.style.display = 'block';
            return;
        }
        track.style.display = 'flex';
        empty.style.display = 'none';
        const totalSec = currentPhases.reduce((a, p) => a + p.durationSec, 0);
        currentPhases.forEach((ph, i) => {
            const d = document.createElement('div');
            d.className = 'tl-phase';
            d.style.width = `${(ph.durationSec / totalSec) * 100}%`;
            const t = i / (currentPhases.length - 1 || 1);
            d.style.background = `linear-gradient(180deg,rgba(167,139,250,${0.1 + 0.18 * (1 - t)}),rgba(34,211,238,${0.1 + 0.18 * t}))`;
            d.innerHTML = `<span>${ph.beatHz}Hz${ph.fadeOut ? ' ↓' : ''}</span>`;
            track.appendChild(d);
        });
        const prog = document.createElement('div');
        prog.className = 'tl-prog';
        prog.id = 'tlProg';
        prog.style.left = '0%';
        track.appendChild(prog);
    }

    function breathSubLabel() {
        if (currentBreathPattern && window.CalmMindBreathPatterns) {
            return window.CalmMindBreathPatterns.getBreathPattern(currentBreathPattern).subLabel;
        }
        const st = soundSel.value;
        if (st === 'hrv' || currentProtocolId === 'coherenceBreath') {
            return '5.5 breaths / min';
        }
        return 'follow the bloom';
    }

    function updateBreathVisibility() {
        const st = soundSel.value;
        const breathProtocols = new Set(['coherenceBreath', 'boxBreath']);
        const show = st === 'hrv' || breathProtocols.has(currentProtocolId) || vizMode === 'tissue';
        $('breathCue').classList.toggle('show', show && app.classList.contains('state-playing'));
        $('breathSub').textContent = breathSubLabel();
    }

    function applyState(isPlaying) {
        app.classList.toggle('state-playing', isPlaying);
        app.classList.toggle('state-setup', !isPlaying);
        const s = $('setup');
        s.style.opacity = isPlaying ? '0' : '1';
        s.style.pointerEvents = isPlaying ? 'none' : 'auto';
        s.style.transform = isPlaying ? 'translateY(-10px) scale(0.98)' : 'none';
        document.querySelectorAll('.edge').forEach((e) => {
            e.style.opacity = isPlaying ? '1' : '0';
            e.style.pointerEvents = isPlaying ? 'auto' : 'none';
        });
        if (isPlaying) hideHeadphonesHint();
    }

    let playing = false;
    let paused = false;
    let elapsed = 0;
    let total = 600;
    let timer = null;
    let lastTick = 0;
    let sessionMeta = null;

    async function startSession() {
        refreshReadout();
        let stress = +$('stress').value;
        let dur = +$('duration').value;
        let ambient = ambSel.value;
        let soundType = soundSel.value;
        const moodBefore = parseInt($('moodBefore')?.value || '3', 10);

        let breathPattern = currentBreathPattern;

        if (currentProtocolId !== 'none') {
            const applied = CM.applyProtocol(currentProtocolId, {
                stress,
                duration: dur,
                ambient,
                soundType,
            });
            stress = applied.stress;
            dur = applied.duration;
            ambient = applied.ambient;
            soundType = applied.soundType;
            currentPhases = applied.frequencyPhases;
            breathPattern = applied.breathPattern || breathPattern;
            currentBreathPattern = breathPattern;
            if (breathPattern) CM.setBreathPattern(breathPattern);
            $('stress').value = stress;
            $('duration').value = dur;
            soundSel.value = soundType;
            ambSel.value = ambient;
            syncStress();
            syncDuration();
            buildTimeline();
        }

        total = dur * 60;
        elapsed = 0;
        sessionMeta = {
            protocolId: currentProtocolId,
            soundType,
            duration: dur,
            moodBefore,
        };

        const real = await CM.Engine.start({
            stress,
            duration: dur,
            ambient,
            soundType,
            viz: vizMode,
            options: {
                frequencyPhases: currentPhases,
                breathPattern: breathPattern || (soundType === 'hrv' ? 'coherent' : undefined),
                protocolId: currentProtocolId,
                moodBefore,
            },
        });

        CM.Engine.setVolume(+$('volume').value / 100);
        applyState(true);
        $('statusText').textContent = real ? 'SYNTHESIZING' : 'DEMO · NO ENGINE';
        playing = true;
        paused = false;
        setPlayIcon();
        lastLiveBand = '';
        updateBreathVisibility();
        updateHeadphonesHint();
        lastTick = performance.now();
        clearInterval(timer);
        timer = setInterval(tick, 250);

        if (real) {
            window.CalmMindState?.persistSettings?.({
                stressLevel: stress,
                duration: dur,
                ambientSound: ambient,
                soundType,
                protocolId: currentProtocolId,
                vizType: vizMode,
                volume: +$('volume').value / 100,
            });
            const moodAfterEl = $('moodAfter');
            if (moodAfterEl) moodAfterEl.disabled = false;
        }
    }

    function tick() {
        if (!playing || paused) return;
        const now = performance.now();
        const ses = CM.live.active && CM.live.session;
        if (ses?.elapsedSec != null) {
            elapsed = ses.elapsedSec;
            if (ses.remainingSec != null) total = Math.max(1, ses.elapsedSec + ses.remainingSec);
        } else {
            elapsed += (now - lastTick) / 1000;
        }
        lastTick = now;
        if (elapsed >= total) {
            elapsed = total;
            render();
            stopSession();
            return;
        }
        render();
    }

    function render() {
        const f = Math.min(1, elapsed / total);
        $('scrubDone').style.width = `${f * 100}%`;
        $('scrubKnob').style.left = `${f * 100}%`;
        $('elapsed').textContent = fmt(elapsed);
        const tp = $('tlProg');
        if (tp) tp.style.left = `${f * 100}%`;
    }

    function setPlayIcon() {
        $('playIcon').innerHTML = playing && !paused
            ? '<path d="M6 19h4V5H6zM14 5v14h4V5z"/>'
            : '<path d="M8 5v14l11-7z"/>';
    }

    function togglePlay() {
        if (!playing) {
            startSession();
            return;
        }
        paused = !paused;
        CM.Engine.pause(paused);
        lastTick = performance.now();
        setPlayIcon();
        $('statusText').textContent = paused ? 'PAUSED' : (CM.Engine.real ? 'SYNTHESIZING' : 'DEMO · NO ENGINE');
    }

    function stopSession() {
        clearInterval(timer);
        if (playing && sessionMeta && CM.Engine.real) {
            const moodAfter = parseInt($('moodAfter')?.value || '3', 10);
            window.CalmMindState?.addSession?.({
                ...sessionMeta,
                moodAfter,
            });
        }
        CM.Engine.stop();
        playing = false;
        paused = false;
        sessionMeta = null;
        applyState(false);
        $('statusText').textContent = 'READY';
        $('breathCue').classList.remove('show');
        updateHeadphonesHint();
        const moodAfterEl = $('moodAfter');
        if (moodAfterEl) moodAfterEl.disabled = true;
    }

    $('playBtn').addEventListener('click', togglePlay);
    $('stopBtn').addEventListener('click', stopSession);
    $('editBtn').addEventListener('click', stopSession);
    $('generate').addEventListener('click', startSession);
    $('volume').addEventListener('input', () => CM.Engine.setVolume(+$('volume').value / 100));
    $('scrub').addEventListener('click', (e) => {
        if (!playing) return;
        const r = $('scrub').getBoundingClientRect();
        elapsed = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total;
        render();
    });

    let lastBreath = 0.5;
    let lastLiveBand = '';

    function highlightPhase(idx) {
        $('tlTrack').querySelectorAll('.tl-phase').forEach((el, i) => {
            el.style.filter = i === idx ? 'brightness(1.7)' : '';
        });
    }

    function uiFrame() {
        const f = CM.frame;
        $('ampFill').style.width = `${Math.min(1, f.amp * 1.4) * 100}%`;

        if (app.classList.contains('state-playing')) {
            const lr = document.querySelector('.ear.l .ring');
            const rr = document.querySelector('.ear.r .ring');
            if (lr) lr.style.boxShadow = `0 0 ${12 + f.bass * 26}px rgba(139,92,246,${0.35 + f.bass * 0.4})`;
            if (rr) rr.style.boxShadow = `0 0 ${12 + f.treble * 26}px rgba(34,211,238,${0.35 + f.treble * 0.4})`;
        }

        const ses = CM.live.active && CM.live.session;
        if (ses) {
            if (ses.brainBand?.label && ses.brainBand.label !== lastLiveBand) {
                lastLiveBand = ses.brainBand.label;
                $('bandName').textContent = ses.brainBand.label;
                if (CM.BAND_DESC[ses.brainBand.label]) {
                    $('bandDesc').textContent = CM.BAND_DESC[ses.brainBand.label];
                }
                const m = CM.bandMeters(ses.brainBand.label);
                document.querySelectorAll('#meters .fill').forEach((fl) => {
                    const v = m[fl.dataset.band];
                    fl.style.width = `${((v !== undefined ? v : 0.08) * 100)}%`;
                });
            }
            if (ses.beatHz != null) {
                $('bandHz').textContent = `${ses.beatHz.toFixed(2)} Hz`;
                $('beatHz').textContent = `${ses.beatHz.toFixed(2)} Hz`;
            }
            if (ses.carrierHz != null) {
                $('leftHz').textContent = Math.round(ses.carrierHz);
                $('rightHz').textContent = ses.beatHz
                    ? (ses.carrierHz + ses.beatHz).toFixed(1)
                    : Math.round(ses.carrierHz);
            }
            if (ses.phaseIndex != null) highlightPhase(ses.phaseIndex);
        }

        const cue = $('breathCue');
        if (cue.classList.contains('show')) {
            if (f.breathLabel) {
                $('breathWord').textContent = f.breathLabel;
            } else {
                const rising = f.breath > lastBreath;
                $('breathWord').textContent = f.breath < 0.04 || f.breath > 0.96
                    ? 'Hold'
                    : rising ? 'Breathe in' : 'Breathe out';
            }
        }
        lastBreath = f.breath;
        requestAnimationFrame(uiFrame);
    }

    function restoreSettings() {
        if (!window.CalmMindState) return;
        const state = window.CalmMindState.load();
        const s = state.settings;
        if (s.stressLevel != null) $('stress').value = s.stressLevel;
        if (s.duration != null) $('duration').value = s.duration;
        if (s.ambientSound) ambSel.value = s.ambientSound;
        if (s.soundType) soundSel.value = s.soundType;
        if (s.volume != null) $('volume').value = Math.round(Number(s.volume) * 100);
        if (s.protocolId && s.protocolId !== 'none') {
            const preset = CM.PRESETS.find((p) => p.id === s.protocolId);
            if (preset) {
                currentProtocolId = s.protocolId;
                applyPreset(preset);
                return;
            }
        }
        const vizKey = window.CalmMindState?.normalizeCanvasVizType?.(s.vizType) || s.vizType;
        if (vizKey === 'neural' || vizKey === 'tissue' || vizKey === 'mandala') {
            mountViz(vizKey);
        } else if (s.protocolId && CM.PROTOCOL_VIZ[s.protocolId]) {
            mountViz(CM.PROTOCOL_VIZ[s.protocolId]);
        }
    }

    syncStress();
    syncDuration();
    syncMoodDisplay('moodBefore', 'moodBeforeVal', $('moodBefore')?.value || '3');
    restoreSettings();
    if (!vizInst) mountViz('neural');
    refreshReadout();
    updateHeadphonesHint();
    requestAnimationFrame(uiFrame);
})();
