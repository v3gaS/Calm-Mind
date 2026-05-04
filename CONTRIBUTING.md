# Contributing

Thanks for helping improve CalmMind / Audiotistic.

## Workflow

1. Fork [Audiotistic_application](https://github.com/v3gaS/Audiotistic_application) and create a feature branch.
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run the app over HTTP: `npm run launch` (or `npm run dev` and open the printed URL).
5. Open a PR with a clear description of behavior changes.

## Conventions

- **Preserve DOM IDs** used in [`app.js`](../app.js) and [`audio.js`](../audio.js) unless you update all call sites.
- Prefer **small, focused commits**; match existing formatting in the files you touch.
- **Jest** covers [`src/`](../src/) and [`tests/`](../tests/). Add or update tests when changing covered modules.

## Security

Do not commit secrets, API keys, or machine-specific paths.
