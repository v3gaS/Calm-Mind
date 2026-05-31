#!/usr/bin/env node
/**
 * Capture real CalmMind UI frames and build assets/promo/calmmind-promo.gif
 * Requires: local server (npm run dev), npx puppeteer, ImageMagick (magick)
 */
import { execSync } from 'child_process';
import { mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const framesDir = path.join(root, 'assets/promo/capture-frames');
const outGif = path.join(root, 'assets/promo/calmmind-promo.gif');
const baseUrl = process.env.CALMMIND_URL || 'http://127.0.0.1:3000/';
const FRAME_COUNT = Number(process.env.PROMO_FRAMES || 40);
const FRAME_MS = Number(process.env.PROMO_FRAME_MS || 100);

function buildGif() {
  const delay = Math.round(FRAME_MS / 10);
  execSync(
    `magick "${framesDir}"/frame_*.png -delay ${delay} -loop 0 ` +
      `-resize 720x405^ -gravity center -extent 720x405 ` +
      `-layers Optimize -colors 128 "${outGif}"`,
    { stdio: 'inherit' }
  );
}

async function main() {
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);

    await page.click('#generate');
    await page.waitForSelector('#app.state-playing', { timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    for (let i = 0; i < FRAME_COUNT; i++) {
      const file = path.join(framesDir, `frame_${String(i).padStart(3, '0')}.png`);
      await page.screenshot({ path: file, type: 'png' });
      await new Promise((r) => setTimeout(r, FRAME_MS));
    }

    console.log(`Captured ${FRAME_COUNT} frames in ${framesDir}`);
  } finally {
    await browser.close();
  }

  buildGif();
  const n = readdirSync(framesDir).filter((f) => f.endsWith('.png')).length;
  console.log(`Wrote ${outGif} from ${n} frames`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
