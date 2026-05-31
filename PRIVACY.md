# Privacy

## Summary

CalmMind is a **browser-based wellness tool** served at [https://usecalmmind.com](https://usecalmmind.com).
There is no account system or cloud sync of session preferences. Most data stays on your device.

## What is stored on your device

| Data | Storage | Purpose |
|------|---------|---------|
| UI preferences (stress, duration, viz mode, volume, etc.) | `localStorage` key `calmMindState` | Restore settings between visits |
| Session history entries | Same `localStorage` object | Optional session log in the UI |

Data stays in **your browser**. Clearing site data removes it.

## What is not collected by the shipped client

- No mandatory sign-in
- No payment or health-record fields
- No built-in transmission of `localStorage` to a CalmMind-operated backend (static hosting)

## Web analytics (production site)

The public site uses **Vercel Web Analytics** (`@vercel/analytics` via [`client/js/vercel-analytics-init.js`](client/js/vercel-analytics-init.js)).
Vercel may collect privacy-oriented metrics such as page views, referrers, and coarse device/browser data.
See [Vercel Analytics documentation](https://vercel.com/docs/analytics) and [privacy.html](privacy.html).

## Third parties

- **Google Fonts** — typography loaded from Google’s CDN when you open the app.
- **Legacy UI** ([`index-legacy.html`](index-legacy.html)) loads **Three.js from a CDN** when that entry is used.
- **Ambient audio** — served from your origin (`assets/audio/ambient/`), not a tracking endpoint.

## Sensitive information

Do **not** store clinical notes, client identifiers, or passwords in `localStorage`
via forks or custom builds. Do **not** commit such data to git.

## Contact

Permission and privacy questions: [JValachovic@gmail.com](mailto:JValachovic@gmail.com) or see [LICENSE](LICENSE).

**Created by John Valachovic.**
