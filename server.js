'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

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
                    ? `Port ${port} is already in use.`
                    : `No free port between ${FIRST_PORT} and ${LAST_PORT}.`
            );
        } else {
            console.error(err);
        }
        process.exit(1);
    });

    server.listen(port, HOST, () => {
        if (!EXPLICIT_PORT && port !== FIRST_PORT) {
            console.log(`(Port ${FIRST_PORT} was busy — using ${port}.)`);
        }
        console.log(`CalmMind static server http://127.0.0.1:${port}/`);
    });
}

startOnPort(FIRST_PORT);
