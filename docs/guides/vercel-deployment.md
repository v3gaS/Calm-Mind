# Vercel deployment guide

Deploy **CalmMind** as a **static site** on Vercel at [https://useCalmMind.com](https://useCalmMind.com).
Production does **not** run [`server.js`](../../server.js) or [`lib/static-server.cjs`](../../lib/static-server.cjs) — those are for local development only.

**Copyright © John Valachovic.** Public deployment does not grant use rights beyond [LICENSE](../../LICENSE).

---

## How production differs from local dev

| | Local (`npm run launch`) | Vercel production |
|--|--------------------------|-------------------|
| Server | Node static HTTP on port 3000–3099 | Vercel CDN serves files from repo root |
| Entry | [`index.html`](../../index.html) | Same |
| Ambient audio | `fetch('/assets/audio/ambient/...')` | Same absolute paths |
| Build | None | None (`vercel.json` empty install/build) |

---

## Repository config

| File | Purpose |
|------|---------|
| [`vercel.json`](../../vercel.json) | Static overrides, cache headers for `/assets/` and `/client/`, security headers |
| [`.vercelignore`](../../.vercelignore) | Excludes `archive/`, `tests/`, `src/`, `docs/`, dev server — keeps Hobby upload under limits |

Tracked deploy footprint is **~71 MB** (ambient `.ogg` files dominate), under the **Hobby 100 MB** static upload limit.

---

## Vercel Hobby limits

| Limit | Value | Notes |
|-------|--------|--------|
| Static file upload | 100 MB | Per deployment |
| Bandwidth | 100 GB / month | Ambient streams count toward usage |
| Build time | 45 min | N/A for zero-build deploys |

Monitor **Usage** in the Vercel dashboard if traffic grows. Long-cache headers on `/assets/` are configured in `vercel.json`.

---

## Dashboard setup (one-time)

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project** → Import [github.com/v3gaS/Calm-Mind](https://github.com/v3gaS/Calm-Mind).
2. **Framework Preset:** Other.
3. **Build & Development Settings** (must match `vercel.json`):
   - **Install Command:** *(empty)*
   - **Build Command:** *(empty)*
   - **Output Directory:** `.` (repository root)
   - **Root Directory:** `.`
4. **Production Branch:** `main`.
5. **Environment variables:** none required.
6. Deploy and confirm the build log uploads **static files**, not a Node server for `server.js`.

### Domain (useCalmMind.com)

Domain purchased on Vercel — DNS is usually automatic:

1. Project → **Settings** → **Domains** → Add `useCalmMind.com`.
2. Add `www.usecalmmind.com` → redirect to apex (also configured in [`vercel.json`](../../vercel.json) `redirects`).
3. Set `useCalmMind.com` as the **Production** domain.
4. Wait until SSL shows **Valid**.

Verify:

- `https://useCalmMind.com/` → primary UI
- `https://useCalmMind.com/assets/audio/ambient/rain.ogg` → HTTP 200, `audio/ogg`
- `https://useCalmMind.com/index-legacy.html` → optional legacy smoke

---

## Deploy paths

### GitHub (automatic)

- Push to `main` → production deployment.
- Other branches → preview URLs.

CI still runs Jest via [`.github/workflows/test.yml`](../../.github/workflows/test.yml); Vercel does not run tests unless you add a separate check.

### CLI (manual / hotfix)

```bash
npm i -g vercel
vercel login
cd /path/to/Calm-Mind
vercel link          # once, tie to the Vercel project
vercel               # preview deployment
vercel --prod        # production
```

Or from `package.json`:

```bash
npm run vercel-deploy
```

---

## Post-deploy smoke checklist

Run on preview URL first, then production:

- [ ] Load `/` — Claude Design UI renders; logo at `assets/branding/CalmMind_Logo.jpg`
- [ ] **Play** after a user click — Web Audio starts (gesture policy)
- [ ] Select an ambient layer (e.g. rain) — no console errors for `fetch('/assets/audio/ambient/...')`
- [ ] Canvas visualizer reacts while playing (Neural / Tissue / Mandala)
- [ ] Volume and transport controls work
- [ ] Optional: `/index-legacy.html` loads (Three.js CDN)
- [ ] Mobile viewport layout acceptable

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Deploy fails: size limit | Upload > 100 MB (Hobby) | Confirm `.vercelignore` is committed; trim assets or upgrade plan |
| 404 on ambient `.ogg` | Wrong output directory or missing `assets/` | Output Directory must be `.`; do not ignore `assets/` in `.vercelignore` |
| Node function / `server.js` errors | Auto-detected as Node app | Empty install/build in dashboard + `vercel.json`; Framework: Other |
| Audio silent on first load | No user gesture | Click Play (browser policy) |
| `file://` works but prod fails | Absolute paths | Always test over HTTPS on Vercel, not `file://` |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [github-publication.md](github-publication.md) | Pre-push GitHub checklist |
| [development.md](development.md) | Conventions |
| [architecture/overview.md](../architecture/overview.md) | Script load order |
