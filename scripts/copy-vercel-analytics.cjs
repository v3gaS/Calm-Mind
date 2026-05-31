'use strict';

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/@vercel/analytics/dist/index.mjs');
const dest = path.join(__dirname, '../client/js/vercel-analytics.mjs');

if (!fs.existsSync(src)) {
    console.error('[copy-vercel-analytics] Run npm install first (@vercel/analytics missing).');
    process.exit(1);
}

fs.copyFileSync(src, dest);
console.log('[copy-vercel-analytics] Wrote client/js/vercel-analytics.mjs');
