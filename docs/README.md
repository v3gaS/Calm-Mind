# CalmMind Documentation

**Start here.** This index routes agents and contributors to the **canonical** doc for each task.

**Legal:** [LICENSE](../LICENSE) (© John Valachovic — [JValachovic@gmail.com](mailto:JValachovic@gmail.com)) · [DISCLAIMER](../DISCLAIMER.md) · [NOTICE](../NOTICE.md) · Research limitations: [research/README.md](research/README.md)

Runnable app quick start: [root README](../README.md).

---

## Task router

| If you need to… | Read |
|-----------------|------|
| Change playback, globals, or DOM contract | [`integration/frontend-reference.md`](integration/frontend-reference.md) |
| Understand system layout / script load order | [`architecture/overview.md`](architecture/overview.md) |
| Work on `src/` modules or Jest tests | [`architecture/modular-api.md`](architecture/modular-api.md) + [`guides/development.md`](guides/development.md) |
| Build audio-reactive custom UI | [`integration/audio-reactive.md`](integration/audio-reactive.md) |
| Audio subsystem details (shipped + modular) | [`subsystems/audio.md`](subsystems/audio.md) |
| Visualizer behavior | [`subsystems/visualization.md`](subsystems/visualization.md) |
| Repo conventions / PR checklist | [`guides/development.md`](guides/development.md) |
| Publish or refresh GitHub repo | [`guides/github-publication.md`](guides/github-publication.md) |
| Current status / roadmap | [`project/status-and-roadmap.md`](project/status-and-roadmap.md) |
| Release notes | [`project/changelog.md`](project/changelog.md) |
| Therapy / product content context | [`guides/therapy.md`](guides/therapy.md) |
| Custom front-end overlay plan | [`integration/custom-front-end-plan.md`](integration/custom-front-end-plan.md) |
| Claude Design alignment handoff | [`integration/claude-design-alignment.md`](integration/claude-design-alignment.md) |
| Research background | [`research/`](research/) (historical) |

---

## Documentation maintenance (required)

**All agents must update documentation in the same session/PR as code changes.** Never ship code that contradicts the canonical docs.

When you change code, update every affected file from this matrix:

| Code change | Update at minimum |
|-------------|-------------------|
| `client/js/*` globals, script order, DOM IDs | `integration/frontend-reference.md`; `architecture/overview.md` if load order changes |
| `client/js/audio.js` sound types / graph | `subsystems/audio.md`, `integration/frontend-reference.md` |
| `client/js/visualizer.js` viz types | `subsystems/visualization.md`, `integration/frontend-reference.md` |
| `CalmMindAudioReactive` API | `integration/audio-reactive.md`, `integration/frontend-reference.md` §8 |
| `src/*` public module API | `architecture/modular-api.md`, relevant `subsystems/*` |
| New ambient asset / manifest key | `subsystems/audio.md`, `integration/frontend-reference.md` presets section |
| Archive moves / new top-level modules | `architecture/overview.md`, this README folder map |
| User-visible release | `project/changelog.md`, `project/status-and-roadmap.md` |

If you add a new public API with no existing doc section, add one to the appropriate canonical file above.

Also see [`AGENTS.md`](../AGENTS.md) for the same maintenance rules.

---

## Folder map

| Folder | Purpose |
|--------|---------|
| [`architecture/`](architecture/) | System layout, dual-stack overview, modular `src/` API |
| [`integration/`](integration/) | Shipped `window.*` contract, audio-reactive API, design alignment |
| [`api/`](api/) | Pointer to integration docs (no separate OpenAPI) |
| [`subsystems/`](subsystems/) | Deep dives: audio, visualization |
| [`guides/`](guides/) | Development conventions, therapy/product notes |
| [`project/`](project/) | Status, roadmap, changelog |
| [`history/`](history/) | **Read-only** stale snapshots — do not use for active decisions |
| [`research/`](research/) | **Historical** research notes — update only when asked |

---

## What not to edit

- **`docs/history/`** — archived timelines and reports; superseded by `project/status-and-roadmap.md`
- **`docs/research/`** — background research; not the source of truth for implementation
- **Root `docs/*.md` stubs** — redirect pointers only; edit the canonical file in a subfolder

---

## Contributing

See root [CONTRIBUTING.md](../CONTRIBUTING.md) and [`guides/development.md`](guides/development.md).
