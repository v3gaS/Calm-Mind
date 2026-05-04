#!/usr/bin/env node
/**
 * One-file launcher: serves the app from this directory and opens your browser.
 * Usage:  node launch.cjs
 *         PORT=8080 node launch.cjs   (fixed port; fails if busy)
 * If PORT is unset and 3000 is busy, tries 3001, 3002, … up to 3099.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const HOST = process.env.HOST || '0.0.0.0';
const EXPLICIT_PORT = process.env.PORT !== undefined && process.env.PORT !== '';
const FIRST_PORT = EXPLICIT_PORT ? Number(process.env.PORT, 10) || 3000 : 3000;
const LAST_PORT = EXPLICIT_PORT ? FIRST_PORT : FIRST_PORT + 99;

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.map': 'application/json; charset=utf-8',
};

function handleRequest(req, res) {
    const raw = (req.url || '/').split('?')[0];
    let rel = decodeURIComponent(raw === '/' ? 'index.html' : raw.slice(1));
    if (!rel || rel.includes('..')) {
        res.writeHead(400);
        res.end('Bad request');
        return;
    }
    const filePath = path.join(ROOT, rel);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

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
    xdg.on('error', () => {
        console.error('Open this URL manually:', url);
    });
    xdg.unref();
}

function startOnPort(port) {
    const server = http.createServer(handleRequest);

    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && port < LAST_PORT) {
            if (!EXPLICIT_PORT && port === FIRST_PORT) {
                console.log(`Port ${port} is in use, trying ${port + 1}…`);
            }
            startOnPort(port + 1);
            return;
        }
        if (err.code === 'EADDRINUSE') {
            console.error(
                EXPLICIT_PORT
                    ? `Port ${port} is already in use. Stop the other process or choose a different PORT.`
                    : `No free port found between ${FIRST_PORT} and ${LAST_PORT}. Quit another app using those ports.`
            );
        } else {
            console.error(err);
        }
        process.exit(1);
    });

    server.listen(port, HOST, () => {
        const url = `http://127.0.0.1:${port}/`;
        if (!EXPLICIT_PORT && port !== FIRST_PORT) {
            console.log(`(Port ${FIRST_PORT} was busy — using ${port} instead.)`);
        }
        console.log(`CalmMind → ${url}`);
        if (HOST === '0.0.0.0') {
            console.log(`(listening on ${HOST}:${port}; also try http://localhost:${port}/ )`);
        }
        console.log('Press Ctrl+C to stop.');
        openBrowser(url);
    });
}

startOnPort(FIRST_PORT);
