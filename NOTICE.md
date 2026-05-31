# Legal notice & third-party attributions

## Copyright

**CalmMind (Audiotistic application)**  
**Created by:** John Valachovic  
**Copyright © 2026 John Valachovic.** All rights reserved.

Use of this project requires **express written permission** from the copyright holder.
See [LICENSE](LICENSE).

## Sensitive information

This repository is intended for **public source review** only. Do **not** commit:

- API keys, tokens, passwords, or `.env` files
- Personal health records, client identifiers, or session notes
- Private URLs, internal hostnames, or non-public credentials

If sensitive data was committed by mistake, rotate credentials and contact [JValachovic@gmail.com](mailto:JValachovic@gmail.com).

## Third-party software (runtime / dev)

| Component | License | Notes |
|-----------|---------|--------|
| [Jest](https://jestjs.io/), [Babel](https://babeljs.io/) | MIT | Dev/test toolchain only |
| [Three.js r128](https://threejs.org/) (CDN) | MIT | Legacy UI [`index-legacy.html`](index-legacy.html) only |
| Node.js / npm ecosystem | Per-package | See `package-lock.json` |

## Third-party audio (CC0)

Nature ambient loops under [`assets/audio/ambient/`](assets/audio/ambient/) are
**CC0** from [BigSoundBank](https://bigsoundbank.com). Full table:
[`assets/audio/ATTRIBUTION.md`](assets/audio/ATTRIBUTION.md).

Pink/brown noise and synthesis tones are **generated in the browser** (no sample files).

## Third-party design & documentation

- Claude Design UI patterns were integrated into [`client/css/design.css`](client/css/design.css) and related client scripts; proprietary project license still applies to the combined work.
- Research summaries in [`docs/research/`](docs/research/) cite external literature and websites for **background only** — not medical endorsement (see [`docs/research/README.md`](docs/research/README.md)).

## Promotional assets

[`assets/promo/calmmind-promo.gif`](assets/promo/calmmind-promo.gif) is generated
by [`scripts/generate-promo-gif.py`](scripts/generate-promo-gif.py) for README
promotion. Regenerate after visual branding changes; do not imply clinical efficacy.
