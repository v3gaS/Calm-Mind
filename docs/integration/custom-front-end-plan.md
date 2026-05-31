# Claude Design — Front-End Integration Plan

**Status:** Phase 1 complete (canvas viz primary) · Phase 2 polish optional  
**Last updated:** 2026-05-31  
**Owner:** CalmMind / Audiotistic application

---

## Goal

Replace or overlay the legacy CalmMind UI (`index.html` + `client/js/app.js`) with a **Claude Design front-end** that:

1. Keeps the existing **Web Audio engine** (no rewrite of sound generation).
2. Shows a **generated session image** that **reacts to audio in real time** (CSS/canvas, not per-frame AI regen).
3. Preserves session controls: stress, duration, sound type, ambient, protocols, play/pause/stop.

---

## Architecture decision (locked)

| Layer | Approach |
|-------|----------|
| Audio playback | Keep `client/js/audio.js` globals |
| Live visual data | **`CalmMindAudioReactive`** bridge (`client/js/audio-reactive-bridge.js`) |
| Real-time transport | **None** — browser `AnalyserNode` only; no server/WebSocket |
| Generated art | **One static asset** per session + motion from `subscribe()` |
| Framework | **Vanilla JS** contract today; React/Vue may wrap globals later |
| Serve | HTTP via `server.js` (`npm run dev` / `npm run launch`) |

```
┌─────────────────────────────────────────────────────────┐
│  Claude Design UI (new)                                  │
│    · layout, typography, session image, controls         │
│    · CalmMindAudioReactive.subscribe → image motion      │
├─────────────────────────────────────────────────────────┤
│  Existing engine (unchanged behavior)                    │
│    playGeneratedTrack · stopCurrentTrack · setVolume     │
│    client/js/audio.js · ambient-loader · protocols       │
└─────────────────────────────────────────────────────────┘
```

---

## Documentation map (hand to Claude Design)

| Document | Use when |
|----------|----------|
| **[`audio-reactive.md`](audio-reactive.md)** | **Primary** — reactive image API, examples, presets, troubleshooting |
| [`frontend-reference.md`](frontend-reference.md) | Full engine: sound types, state, ambient paths, lifecycle |
| [`custom-front-end-plan.md`](custom-front-end-plan.md) | This file — phases, checklist, acceptance criteria |

---

## Phase 0 — Bridge & docs ✅ Done

| Item | Status | Artifact |
|------|--------|----------|
| Live analyser already on master bus | ✅ | `client/js/audio.js` → `getAnalyser()` |
| Normalized audio frame API | ✅ | `client/js/audio-reactive-bridge.js` |
| Auto-hooks on play/stop/pause | ✅ | Wraps `playGeneratedTrack`, `setPlayingState`, `stopCurrentTrack` |
| Script wired in entry page | ✅ | `index.html` loads bridge after `audio.js` |
| Claude Design reference doc | ✅ | `docs/integration/audio-reactive.md` |
| Full integration reference | ✅ | `docs/integration/frontend-reference.md` §8 |

**Deliverable for design:** `window.CalmMindAudioReactive.subscribe(callback, { autoApplyTo: '#sessionArt' })`

---

## Phase 1 — Claude Design UI (in progress / next)

### 1.1 Page shell

- [ ] New layout (or restyle `#app`) — mobile-first; use existing CSS tokens from `styles.css` (`--bg-color`, `--color-accent-primary`, etc.).
- [ ] Load required scripts in order (see [audio-reactive.md § Required scripts](audio-reactive.md#required-scripts)).
- [ ] Mount root without breaking `#visualizerCanvas` if legacy viz is kept; **or** hide legacy viz and use image-only stage.

### 1.2 Session hero image

- [ ] `<img id="sessionArt">` (or div with `background-image`) — placeholder until generated art URL is set.
- [ ] CSS: `transform-origin: center`, `will-change: transform, filter`, no CSS `transition` on properties the bridge animates.
- [ ] Wire `subscribe()` **after** successful `playGeneratedTrack()`.
- [ ] Call `unsubscribe()` + reset styles on stop.

**Recommended preset by sound type:**

| Sound type | Preset |
|------------|--------|
| `binauralSleep`, `hrv`, `pinkNoise` | `breathe` |
| `isochronicEnergy`, `gamma` | `pulse` |
| `soundBath`, `psychoacoustic` | `glow` |
| Default | `calm` or `pulse` |

### 1.3 Session controls (wire to existing globals)

- [ ] **Generate** → `generateTrackFromSettings` logic or direct `playGeneratedTrack(stress, durationMin, ambient, soundType, vizType, options)`.
- [ ] **Play / Pause** → `AudioContext.resume()` / `suspend()` + `setPlayingState` (see `client/js/app.js` `togglePlay`).
- [ ] **Stop** → `stopCurrentTrack()` + unsubscribe reactive loop.
- [ ] **Volume** → `setVolume(0–1)`.
- [ ] Optional: persist via `CalmMindState.persistSettings` / `restoreSettingsToForm`.

### 1.4 Labels & metadata (static, not live EEG)

- [ ] Brain band / Hz copy from `frame.session.brainBand`, `frame.session.beatHz`.
- [ ] Pre-session preview: `estimateTargetFrequencies(stress, soundType)`.
- [ ] Progress: `frame.session.elapsedSec`, `remainingSec` (no dedicated progress event yet).
- [ ] Headphones hint when `headphonesRequired` or sound type in binaural/emdr set.

### 1.5 Accessibility & motion

- [ ] Respect `prefers-reduced-motion: reduce` — disable or cap `subscribe` multipliers.
- [ ] AVE/flicker: keep optional; photosensitivity warning if reintroduced.

### Phase 1 acceptance criteria

1. User gesture → audio plays; image visibly reacts within one second.
2. Pause dampens motion; stop clears motion and session.
3. Changing sound type + regenerate updates labels and motion character.
4. Works on Chrome/Safari over `http://127.0.0.1:*` (not `file://`).
5. No console errors from bridge when generate/stop cycle repeats.

---

## Phase 2 — Integration polish (planned)

| Item | Priority | Notes |
|------|----------|-------|
| `design-preview.html` minimal harness | Medium | Image + generate/stop only; for design QA without full legacy UI |
| Jest tests for `estimateTargetFrequencies`, phased beat resolution | Medium | Mock analyser + DOM |
| `prefers-reduced-motion` built into bridge | Low | Optional flag on `subscribe` |
| TypeScript `.d.ts` for `CalmMindAudioReactive` | Low | For TS front-end |
| Export `onSessionProgress` callback from bridge | Low | Avoid polling `elapsedSec` in UI |

---

## Phase 3 — Out of scope (unless requested)

- Per-frame AI image regeneration synced to audio.
- Separate L/R analysers for stereo visualization.
- Live oscillator frequency readback (beat Hz remains config-derived).
- Replacing `client/js/audio.js` with `archive/src-modular-unwired/core/EnhancedAudioManager` in the shipped page.
- Backend session sync / user accounts.

---

## API contract summary (do not break)

```javascript
// Audio
window.initAudio()
window.playGeneratedTrack(stress, durationMin, ambient, soundType, vizType, options?)
window.stopCurrentTrack()
window.setVolume(0–1)
window.setPlayingState(boolean)

// Reactive visuals (Claude Design)
window.CalmMindAudioReactive.subscribe(fn, options?)  → unsubscribe()
window.CalmMindAudioReactive.getAudioFrame(options?)
window.CalmMindAudioReactive.estimateTargetFrequencies(stress, soundType)

// State / presets (optional)
window.CalmMindState
window.CalmMindProtocols
```

**`playGeneratedTrack` options used today:**

```javascript
{
  protocolId: 'none' | 'anxietyReset' | 'sleepOnset' | 'focusSprint' | 'coherenceBreath' | 'blsCalm',
  frequencyPhases: [{ durationSec, beatHz, carrierHz, fadeOut? }],
  moodBefore: number,
}
```

---

## File checklist for implementers

| Path | Role |
|------|------|
| `client/js/audio-reactive-bridge.js` | Live metrics + subscribe loop |
| `client/js/audio.js` | Engine + analyser |
| `client/js/app.js` | Reference UI lifecycle (copy patterns) |
| `client/js/protocols.js` | Guided presets |
| `client/js/ambient-loader.js` | Ambient `.ogg` URLs |
| `index.html` | Current entry; script order reference |
| `styles.css` | Theme tokens |
| `docs/integration/audio-reactive.md` | **Design implementation guide** |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Audio blocked until user click | Always `await getAudioContext().resume()` in click handler |
| Image doesn’t move | Subscribe after `playGeneratedTrack`; verify selector |
| Motion janky on mobile | Cap scale to ~1.08; use `transform`/`filter` only |
| Wrong Hz on screen | Labels are **targets**, not analyser — document in UI |
| Legacy `#app` ID conflicts | New UI can replace inner HTML of `#app`; keep script tags in `index.html` or duplicate load order |

---

## Suggested implementation order

1. Read [`audio-reactive.md`](audio-reactive.md) Quick start.
2. Build static mock (image + labels, no audio) — layout approval.
3. Add generate/stop with `playGeneratedTrack` + `subscribe({ autoApplyTo })`.
4. Add play/pause, volume, sound type, ambient dropdowns (values from integration reference).
5. Add protocol selector + `CalmMindProtocols`.
6. Polish: reduced motion, session progress, favorites/history if needed.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Phase 0 complete: `audio-reactive-bridge.js`, design reference, integration doc §8 |
| 2026-05-31 | Plan created; Phase 1 checklist for Claude Design |
