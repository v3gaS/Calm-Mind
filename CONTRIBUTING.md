# Contributing

Thank you for your interest in CalmMind (Audiotistic application).

## Copyright & permission

**Created by John Valachovic.**  
**© 2026 John Valachovic. All rights reserved.**

Contributing to this repository **does not** grant you a license to use, fork, or
deploy the project outside [LICENSE](LICENSE). You must have **express written
permission** from the copyright holder for your intended use, or be the copyright
holder.

To request permission, email **[JValachovic@gmail.com](mailto:JValachovic@gmail.com)** or use the GitHub issue template **Permission request** (label
`permission`).

## Workflow

1. Confirm your permission scope (see above).
2. Fork [Audiotistic_application](https://github.com/v3gaS/Audiotistic_application) and create a feature branch.
3. `npm install`
4. `npm test`
5. `npm run launch` — smoke-test primary UI; test [`index-legacy.html`](index-legacy.html) if you change shared engine code.
6. Open a PR using the [pull request template](.github/pull_request_template.md).

## Conventions

- Preserve `window.*` globals documented in [`docs/integration/frontend-reference.md`](docs/integration/frontend-reference.md).
- Primary UI DOM IDs: [`docs/integration/claude-design-alignment.md`](docs/integration/claude-design-alignment.md).
- Update **canonical docs** when code changes — [`docs/README.md`](docs/README.md#documentation-maintenance-required), [`AGENTS.md`](AGENTS.md).
- Small, focused changes; match existing file style.

## Wellness & research copy

- User-facing text must remain consistent with [DISCLAIMER.md](DISCLAIMER.md) (wellness tool, not medical device).
- Do not add clinical efficacy claims without context in [`docs/research/`](docs/research/).
- BLS presets are **self-regulation**, not licensed EMDR treatment.

## Security & sensitive data

Per [SECURITY.md](SECURITY.md):

- **Never** commit `.env`, API keys, tokens, or credentials.
- **Never** commit personal health information, client names, or private URLs.
- Redact sensitive paths from issue and PR descriptions.

## Tests

| Scope | Command |
|-------|---------|
| Modular `src/` | `npm test` |
| Shipped `client/js/` | Manual browser test via `npm run launch` |

## Publishing

Maintainers pushing to GitHub: [`docs/guides/github-publication.md`](docs/guides/github-publication.md) (inventory, gitignore, CI, pitfalls).

## Questions

- Technical docs: [`docs/README.md`](docs/README.md)
- Questions: [JValachovic@gmail.com](mailto:JValachovic@gmail.com) · [LICENSE](LICENSE) · [NOTICE.md](NOTICE.md)
