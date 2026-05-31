# Development Guidelines

Conventions for **CalmMind** (Audiotistic application). The shipped app uses globals in `client/js/`; modular code uses ES modules in `src/`.

**Copyright © John Valachovic.** Contributing or deploying requires express permission — [LICENSE](../../LICENSE), [DISCLAIMER](../../DISCLAIMER.md). Do not commit secrets or health data — [SECURITY](../../SECURITY.md).

**Documentation index:** [`../README.md`](../README.md) — task router and maintenance rules.

## Directory layout

```text
.
├── index.html, index-legacy.html
├── client/css/design.css      # Primary UI styles
├── styles.css                 # Legacy UI only
├── client/js/                 # Shipped browser app (IIFE / window globals)
├── assets/audio/ambient/      # CC0 .ogg ambient loops
├── lib/static-server.cjs      # Shared HTTP static server
├── src/                       # Modular ES modules (Jest, future bundle)
├── tests/                     # Jest tests (mock Web Audio / DOM)
├── archive/                   # Superseded / unwired code (not loaded at runtime)
├── server.js, launch.cjs      # Dev entrypoints
└── docs/                      # Topical documentation (see docs/README.md)
```

**Which stack to edit:**

| Change | Edit |
|--------|------|
| Primary UI, canvas viz | `design-shell.js`, `design-bridge.js`, `calm-viz.js`, `index.html`, `client/css/design.css` |
| Legacy UI, Three.js viz | `app.js`, `visualizer.js`, `index-legacy.html`, `styles.css` |
| Shared audio / protocols | `audio.js`, `protocols.js`, `ambient-loader.js`, … |
| Unit-tested generators | `src/*`, `tests/*` |
| Integrator API docs | `docs/integration/frontend-reference.md`, `docs/integration/claude-design-alignment.md` |

Do not import from `archive/` in shipped code without explicit repair and wiring.

## JavaScript conventions

### Shipped client (`client/js/`)

- **Pattern:** `'use strict'` IIFE or top-level functions attached to `window`
- **File names:** camelCase (`audio-reactive-bridge.js`, `state-manager.js`)
- **Classes:** PascalCase when used (`AmbientLoader` as object namespace)
- **Globals:** Document with `@global` in file header; keep names stable for integrators
- **Debug logging:** Gate behind flags (`DEBUG_AUDIO`, `DEBUG_VIZ`) — do not log per-frame in production paths

### Modular `src/`

- **Pattern:** ES modules with explicit `.js` extensions in import paths
- **Classes:** PascalCase (`BinauralBeats`, `VisualizerManager`)
- **Logging:** Prefer [`src/utils/logger.js`](../../src/utils/logger.js) over raw `console.log`
- **Events:** [`src/core/EventBus.js`](../../src/core/EventBus.js) singleton `eventBus`

There is **no TypeScript**, **no ESLint**, and **no Prettier** config in this repo today. Match formatting in the file you touch.

## Web Audio rules

1. **User gesture** — Create/resume `AudioContext` after a click/tap (`initAudio()` from UI).
2. **HTTP only** — Do not expect correct behavior from `file://` (modules, fetch for `.ogg`, autoplay policies).
3. **Single graph** — Shipped app uses one context in `client/js/audio.js`. Avoid second contexts unless building an isolated experiment.
4. **Cleanup** — Stop oscillators and `AudioBufferSourceNode` instances on session end; disconnect nodes when replacing tracks.
5. **Analyser** — Master bus analyser feeds `calm-viz.js`, `CalmMindAudioReactive`, and legacy `visualizer.js`; do not tap a separate graph for the same session.

## DOM contract

Two entry pages with **different** element IDs. Changing IDs requires updating call sites and docs.

| Concern | Primary (`index.html`) | Legacy (`index-legacy.html`) |
|---------|------------------------|------------------------------|
| Spec | [`integration/claude-design-alignment.md`](../integration/claude-design-alignment.md) | [`integration/frontend-reference.md`](../integration/frontend-reference.md) §7 legacy |
| Stress | `#stress` | `#stressLevel` |
| Ambient | `#ambient` | `#ambientSound` |
| Volume | `#volume` (0–100) | `#volumeSlider` (0–1) |
| Canvas / viz | `#viz`, modes `neural`/`tissue`/`mandala` | `#visualizerCanvas`, `particles`/`meshWave`/`spectrum` |
| Controller | `design-shell.js` | `app.js` |

Shared engine globals are the same on both entries.

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

- Tests live under [`tests/`](../../tests/); Jest roots: `src/`, `tests/`
- **Client code is not Jest-covered** — verify playback and UI manually via `npm run launch`
- When changing `src/` modules that have tests, add or update tests in the matching `tests/` path

## Pull request checklist

Before the first public push or a large release, also see [`github-publication.md`](github-publication.md).

1. `npm test` passes
2. If touching shipped UI/audio: smoke-test **primary** (`index.html`) and spot-check **legacy** (`index-legacy.html`) when changing shared engine code
3. Preserve `window.*` signatures in [`integration/frontend-reference.md`](../integration/frontend-reference.md)
4. Small, focused diff — no drive-by refactors
5. **Update all affected canonical docs** (see [`../README.md`](../README.md) maintenance matrix)

## Documentation maintenance (required)

When you change code, update every affected canonical doc in the **same PR/session**. See the full matrix in [`docs/README.md`](../README.md).

| Doc | When to update |
|-----|----------------|
| [`architecture/overview.md`](../architecture/overview.md) | Stack layout, script order, archive moves |
| [`integration/frontend-reference.md`](../integration/frontend-reference.md) | Public API or session model changes |
| [`subsystems/audio.md`](../subsystems/audio.md) | Audio engine, ambient assets, sound types |
| [`subsystems/visualization.md`](../subsystems/visualization.md) | Viz types, Three.js integration |
| [`architecture/modular-api.md`](../architecture/modular-api.md) | `src/` module APIs |
| [`project/changelog.md`](../project/changelog.md) | User-visible releases |

Do **not** update `docs/history/` or `docs/research/` for routine code changes.

## Security

- No secrets in repo (`.env`, API keys)
- Static server only — no auth layer in shipped app
- Validate user paths are not accepted by the static server (`server.js` rejects `..` in URLs)
