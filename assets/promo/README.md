# Promotional assets

| File | Purpose |
|------|---------|
| [`calmmind-promo.gif`](calmmind-promo.gif) | README hero — screen capture of playing UI |

## Regenerate README GIF (real capture)

1. Start the app: `npm run dev` or `npm run launch` (default `http://127.0.0.1:3000/`).
2. Install capture dependency once: `npm install --no-save puppeteer@23` (or add to devDependencies).
3. Run:

```bash
node scripts/capture-app-promo.mjs
```

The script opens headless Chrome, clicks **Generate track**, waits for the playing UI, and records ~4s of viewport frames into `calmmind-promo.gif` (720×405).

Optional env:

- `CALMMIND_URL` — base URL if not port 3000
- `PROMO_FRAMES` — frame count (default 40)
- `PROMO_FRAME_MS` — ms between frames (default 100)

Intermediate PNGs land in `capture-frames/` (gitignored).

Do not use promo assets to imply medical certification or guaranteed therapeutic outcomes.
