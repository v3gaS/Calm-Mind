'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.map': 'application/json; charset=utf-8',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
};

/**
 * @param {string} root - Absolute path to site root
 */
function createStaticServer(root) {
    function handleRequest(req, res) {
        const raw = (req.url || '/').split('?')[0];
        const rel = decodeURIComponent(raw === '/' ? 'index.html' : raw.slice(1));
        if (!rel || rel.includes('..')) {
            res.writeHead(400);
            res.end('Bad request');
            return;
        }
        const filePath = path.join(root, rel);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const ext = path.extname(filePath);
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
            res.end(data);
        });
    }

    return http.createServer(handleRequest);
}

/**
 * @param {object} options
 * @param {string} [options.root] - Site root (default: caller dirname)
 * @param {string} [options.host]
 * @param {number} [options.firstPort]
 * @param {number} [options.lastPort]
 * @param {boolean} [options.explicitPort]
 * @param {(url: string) => void} [options.onListen]
 */
function listenWithPortFallback(options) {
    const {
        root = path.dirname(module.parent?.filename || __dirname),
        host = process.env.HOST || '0.0.0.0',
        firstPort,
        lastPort,
        explicitPort,
        onListen,
    } = options;

    function startOnPort(port) {
        const server = createStaticServer(root);

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE' && port < lastPort) {
                if (!explicitPort && port === firstPort) {
                    console.log(`Port ${port} is in use, trying ${port + 1}…`);
                }
                startOnPort(port + 1);
                return;
            }
            if (err.code === 'EADDRINUSE') {
                console.error(
                    explicitPort
                        ? `Port ${port} is already in use.`
                        : `No free port between ${firstPort} and ${lastPort}.`
                );
            } else {
                console.error(err);
            }
            process.exit(1);
        });

        server.listen(port, host, () => {
            const url = `http://127.0.0.1:${port}/`;
            if (!explicitPort && port !== firstPort) {
                console.log(`(Port ${firstPort} was busy — using ${port}.)`);
            }
            if (onListen) onListen(url, port, host);
            else console.log(`CalmMind static server ${url}`);
        });
    }

    startOnPort(firstPort);
}

function resolvePortRange() {
    const explicit = process.env.PORT !== undefined && process.env.PORT !== '';
    const first = explicit ? Number(process.env.PORT, 10) || 3000 : 3000;
    const last = explicit ? first : first + 99;
    return { explicit, first, last };
}

module.exports = { createStaticServer, listenWithPortFallback, resolvePortRange, MIME };
