# Experimental core modules (broken / unused)

- `Analytics.js`, `PerformanceMonitor.js` — import `./EventBus` without `.js` extension; reference undefined `EventTypes`; never imported by active code.
- `ErrorHandler.js` — duplicate of [`src/utils/ErrorHandler.js`](../../src/utils/ErrorHandler.js) used by the Enhanced audio stack.

Do not import from shipped code without repair.
