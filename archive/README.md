# Archive

Code moved here is **not loaded** by the shipped app (`index.html` + `client/js/`) and is **not exercised** by Jest unless noted otherwise.

Archived on **2026-05-31** as part of the client migration and repo cleanup pass.

| Path | Status | Reason |
|------|--------|--------|
| [`js/`](js/) | Superseded | Legacy intermediate audio layer; replaced by [`client/js/`](../client/js/) |
| [`src-interfaces/`](src-interfaces/) | Unwired | Alternate UI shell; never linked from root `index.html` |
| [`src-core-experimental/`](src-core-experimental/) | Broken / unused | Analytics, PerformanceMonitor, duplicate ErrorHandler — missing `EventTypes`, no consumers |
| [`design-prototype/`](design-prototype/) | Superseded | Claude Design HTML/JS export before integration into `index.html` + `client/js/design-*` |
| [`src-modular-unwired/`](src-modular-unwired/) | Unwired | EnhancedAudioManager, `src/generators/`, alt visualizers, workers — not Jest-tested or SPA-wired |
| [`assets/`](assets/) | Unused | Static images not referenced by HTML/CSS (e.g. `images_waves.png`) |

## Restoring

To revive a tree for reference or experimentation:

```bash
git mv archive/js js                    # example: restore legacy js layer
git mv archive/src-interfaces src/interfaces
```

Fix imports and wire into `index.html` before expecting runtime behavior.

## Active code

- **Shipped SPA:** [`client/js/`](../client/js/), [`index.html`](../index.html)
- **Modular ES modules (Jest):** [`src/`](../src/) minus archived files
- **Tests:** [`tests/`](../tests/)

See [`docs/architecture/overview.md`](../docs/architecture/overview.md) for the current architecture.
