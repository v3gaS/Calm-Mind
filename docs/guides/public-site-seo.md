# Public site SEO and copy

Guide for [useCalmMind.com](https://usecalmmind.com) — canonical pages, positioning, and maintenance.

**Copyright © John Valachovic.** Public copy does not grant use rights beyond [LICENSE](../../LICENSE).

---

## Product positioning

| Term | Use on the public site |
|------|------------------------|
| **Wellness tool** | CalmMind helps people with stress, sleep, focus, and breathing — browser-based, no account |
| **Neurological research** | Presets informed by published brainwave / auditory-stimulation literature — **not** a clinical trial of this build |
| **Not a medical device** | Always pair research language with disclaimer boundaries |

**Wording guardrails**

| OK | Avoid |
|----|--------|
| “Informed by years of neurological research” | “Clinically proven by CalmMind” |
| “Research-informed guided recipes” | FDA-approved / doctor-approved device |
| “Helps people calm, rest, focus” | “Treats anxiety” / “cures insomnia” |

---

## Public files (deployed)

| File | Role |
|------|------|
| [`index.html`](../../index.html) | Primary app + meta / OG / JSON-LD |
| [`about.html`](../../about.html) | Research-informed About + protocol table |
| [`privacy.html`](../../privacy.html) | Privacy (analytics, fonts, localStorage) |
| [`disclaimer.html`](../../disclaimer.html) | Legal disclaimer |
| [`robots.txt`](../../robots.txt) | Crawler rules + sitemap URL |
| [`sitemap.xml`](../../sitemap.xml) | Indexable URLs |
| [`client/css/legal.css`](../../client/css/legal.css) | About / legal page styles |
| [`assets/promo/og-share.jpg`](../../assets/promo/og-share.jpg) | Social preview image |

Repo [`docs/`](../../docs/) and root `*.md` (except README) are **not** deployed — see [`.vercelignore`](../../.vercelignore).

---

## Copy locations

| String type | Update in |
|-------------|-----------|
| Home title / meta / OG | [`index.html`](../../index.html) `<head>` |
| Compose subcopy + legal links | [`index.html`](../../index.html) `.compose-legal` + [`client/css/design.css`](../../client/css/design.css) |
| Guided protocol table | [`about.html`](../../about.html) — **sync when [`client/js/protocols.js`](../../client/js/protocols.js) changes** |
| Evidence tier definitions | `about.html` + [`protocols.js`](../../client/js/protocols.js) `EVIDENCE` |
| Privacy (analytics) | [`privacy.html`](../../privacy.html) + [`PRIVACY.md`](../../PRIVACY.md) |

---

## About page sync checklist

When adding or changing a protocol in `protocols.js`:

1. Update the **Guided recipes** table in `about.html` (duration, stimulation type, Hz summary, evidence badge, intended use).
2. Confirm sound modality bullets still match shipped `soundType` keys.
3. Append [`docs/project/changelog.md`](../project/changelog.md) if user-visible.

---

## Regenerating og-share.jpg

Social crawlers prefer a static image (1200×630 ideal). Current file is copied from [`assets/branding/CalmMind_Logo.jpg`](../../assets/branding/CalmMind_Logo.jpg). To use a app screenshot instead:

1. Capture a 1200×630 frame from [`assets/promo/calmmind-promo.gif`](../../assets/promo/calmmind-promo.gif) or `scripts/capture-app-promo.mjs`.
2. Save as `assets/promo/og-share.jpg`.
3. Redeploy.

---

## Post-deploy verification

1. **URLs return 200:** `/`, `/about.html`, `/privacy.html`, `/disclaimer.html`, `/robots.txt`, `/sitemap.xml`
2. **Rich Results Test:** JSON-LD in `index.html`
3. **Social preview:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), Twitter Card Validator
4. **Google Search Console:** Add property `https://usecalmmind.com`, verify, submit `sitemap.xml`

---

## Related

- [vercel-deployment.md](vercel-deployment.md) — hosting and analytics enable
- [DISCLAIMER.md](../../DISCLAIMER.md) — legal boundaries
- [docs/research/README.md](../research/README.md) — research notes (repo only)
