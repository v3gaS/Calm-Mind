# Privacy

## Summary

CalmMind is a **local-first browser application**. It does not implement user accounts,
cloud sync, or analytics telemetry in the shipped [`client/js/`](client/js/) bundle.

## What is stored on your device

| Data | Storage | Purpose |
|------|---------|---------|
| UI preferences (stress, duration, viz mode, volume, etc.) | `localStorage` key `calmMindState` | Restore settings between visits |
| Session history entries | Same `localStorage` object | Optional session log in the UI |

Data stays in **your browser** on the machine where you run the app. Clearing site
data removes it.

## What is not collected by this repository’s code

- No mandatory sign-in
- No payment or health-record fields in the open-source client
- No built-in transmission of `localStorage` to a project server (static server serves files only)

## Third parties

- **Legacy UI** loads **Three.js from a CDN** ([`index-legacy.html`](index-legacy.html)) — subject to the CDN operator’s policies when that entry is used.
- **Ambient audio** files are loaded from your served origin (`assets/audio/ambient/`), not from a tracking endpoint.

## Sensitive information

Do **not** store clinical notes, client identifiers, or passwords in `localStorage`
via forks or custom builds. Do **not** commit such data to git.

## Contact

Permission and privacy questions: [JValachovic@gmail.com](mailto:JValachovic@gmail.com) or see [LICENSE](LICENSE).

**Created by John Valachovic.**
