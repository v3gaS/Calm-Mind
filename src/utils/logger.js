/** Lightweight logger for shared modules (no external deps). */
export const logger = {
    info: (...args) => console.log('[CalmMind]', ...args),
    warn: (...args) => console.warn('[CalmMind]', ...args),
    error: (...args) => console.error('[CalmMind]', ...args),
    debug: (...args) => (typeof console.debug === 'function' ? console.debug('[CalmMind]', ...args) : console.log('[CalmMind]', ...args)),
};
