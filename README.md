# CalmMind (Audiotistic application)

Browser-based relaxation audio: binaural beats, isochronic tones, ambient layers, and a reactive Three.js visualizer. Serve over **HTTP** (not `file://`) so Web Audio and scripts behave correctly.

**Repository:** [github.com/v3gaS/Audiotistic_application](https://github.com/v3gaS/Audiotistic_application)

## Quick start

```bash
git clone https://github.com/v3gaS/Audiotistic_application.git
cd Audiotistic_application
npm install
```

**Run locally (recommended):** picks a free port in the 3000–3099 range and opens the browser (macOS uses `open`; other platforms print the URL).

```bash
npm run launch
```

**Or** start the static server only:

```bash
npm run dev
# Then open http://127.0.0.1:3000 (or the port shown if 3000 is busy)
```

On macOS you can also double-click `CalmMind.command` in the project folder.

## Stack

| Layer | Files |
|--------|--------|
| UI | [`index.html`](index.html), [`styles.css`](styles.css), [`app.js`](app.js) |
| Audio | [`audio.js`](audio.js) (Web Audio API) |
| Visuals | [`visualizer.js`](visualizer.js) + Three.js **r128** from CDN (see [`index.html`](index.html)) |
| Server | [`server.js`](server.js), [`launch.cjs`](launch.cjs) |

## Modular source & tests

Refactored modules under [`src/`](src/) and Jest tests under [`tests/`](tests/) cover generators, visualization setup, and related utilities. The **shipped** app in the repo root (`index.html` + `*.js`) is what you open in the browser; `src/` is the structured codebase used by tests and future consolidation.

```text
.
├── index.html          # Entry page
├── app.js              # UI wiring
├── audio.js            # Audio graph & generators
├── visualizer.js       # Three.js visualizer
├── styles.css
├── server.js           # Static file server
├── launch.cjs          # Dev launcher + browser open
├── CalmMind.command    # macOS shortcut → launch.cjs
├── src/                # Modular JS (tests / future bundle)
├── tests/              # Jest
└── docs/               # Design notes, guides, status
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run launch` | `launch.cjs`: serve + open browser |
| `npm run dev` / `npm start` | `server.js`: static server only |
| `npm test` | Jest |
| `npm run test:coverage` | Jest with coverage |

## Browser support

Chrome, Firefox, Safari, and Edge (recent versions). **Headphones** recommended for binaural content.

## Contributing

1. Fork the repo and create a branch from `main`.
2. Run `npm test` before opening a PR.
3. Keep the root SPA contract stable (IDs used in `app.js` / `audio.js`).

See [CONTRIBUTING.md](CONTRIBUTING.md) in the repository root (GitHub surfaces it automatically).

## License

MIT — see [LICENSE](LICENSE).
