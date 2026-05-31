'use strict';

const path = require('path');
const { listenWithPortFallback, resolvePortRange } = require('./lib/static-server.cjs');

const ROOT = __dirname;
const { explicit, first, last } = resolvePortRange();

listenWithPortFallback({
    root: ROOT,
    firstPort: first,
    lastPort: last,
    explicitPort: explicit,
});
