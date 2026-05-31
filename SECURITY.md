# Security policy

## Supported versions

Security fixes are applied on the **default branch** of this repository. There is
no separate LTS release channel.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security-sensitive reports.

1. Contact **John Valachovic** at [JValachovic@gmail.com](mailto:JValachovic@gmail.com) for private reports.
2. If email is unavailable, open a GitHub issue with the title prefix
   `[SECURITY]` and **avoid** attaching exploit payloads, user data, or secrets.
3. Allow reasonable time for triage before public disclosure.

## What to report

- Remote code execution via the static server or client bundles
- Path traversal or arbitrary file read in [`lib/static-server.cjs`](lib/static-server.cjs)
- XSS or script injection in shipped HTML/JS
- Dependency vulnerabilities with a demonstrated impact on this app

## Out of scope (typically)

- Social engineering
- Denial of service against a local `npm run dev` instance on your own machine
- Issues in archived code under [`archive/`](archive/) that is not loaded by the SPA

## Safe development practices

- Never commit `.env`, API keys, tokens, or personal health information.
- Serve the app over **HTTP on localhost** for development; do not expose an
  unauthenticated static server to the public internet without hardening.
- Review third-party CDN scripts (legacy Three.js entry only) before enabling in production.

## Sensitive data in issues and PRs

Contributors must **redact** paths, emails, client names, and session notes from
bug reports. Use synthetic reproduction steps.
