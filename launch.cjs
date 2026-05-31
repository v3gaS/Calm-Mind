#!/usr/bin/env node
/**
 * Serves the app and opens the default browser.
 * Usage:  node launch.cjs
 *         PORT=8080 node launch.cjs
 */
'use strict';

const path = require('path');
const { spawn } = require('child_process');
const { listenWithPortFallback, resolvePortRange } = require('./lib/static-server.cjs');

const ROOT = __dirname;
const { explicit, first, last } = resolvePortRange();

function openBrowser(url) {
    const platform = process.platform;
    if (platform === 'darwin') {
        const child = spawn('/usr/bin/open', [url], {
            detached: true,
            stdio: 'ignore',
            env: process.env,
        });
        child.on('error', (err) => {
            console.error('Could not open browser:', err.message);
            console.error('Open this URL manually:', url);
        });
        child.unref();
        return;
    }
    if (platform === 'win32') {
        spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', shell: true }).unref();
        return;
    }
    const xdg = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    xdg.on('error', () => console.error('Open this URL manually:', url));
    xdg.unref();
}

listenWithPortFallback({
    root: ROOT,
    firstPort: first,
    lastPort: last,
    explicitPort: explicit,
    onListen(url, port, host) {
        console.log(`CalmMind → ${url}`);
        if (host === '0.0.0.0') {
            console.log(`(listening on ${host}:${port}; also try http://localhost:${port}/)`);
        }
        console.log('Press Ctrl+C to stop.');
        openBrowser(url);
    },
});
