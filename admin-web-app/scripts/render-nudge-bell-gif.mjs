/**
 * Recolor is already applied in public/email/nudge-bell.json.
 * This script plays that Lottie in headless Chrome and writes an email-safe GIF
 * with a transparent background (1-bit GIF alpha) so the header shows through
 * in light and dark mode.
 *
 *   WORKDIR=$(mktemp -d) && cd "$WORKDIR" && npm init -y && npm install puppeteer
 *   cp "$REPO/admin-web-app/scripts/render-nudge-bell-gif.mjs" "$WORKDIR/render.mjs"
 *   NUDGE_BELL_EMAIL_DIR="$REPO/admin-web-app/public/email" node "$WORKDIR/render.mjs"
 *
 * If you only have a green-baked GIF, use `make-email-gifs-transparent.mjs`.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

async function loadPuppeteer() {
  return (await import('puppeteer')).default;
}

const puppeteer = await loadPuppeteer();

const here = dirname(fileURLToPath(import.meta.url));
const emailDir = process.env.NUDGE_BELL_EMAIL_DIR || join(here, '..', 'public', 'email');
const jsonPath = join(emailDir, 'nudge-bell.json');
const outGif = join(emailDir, 'nudge-bell.gif');
const framesDir = join(here, '..', 'tmp', 'nudge-bell-frames');

const SIZE = 340;
const FRAME_STEP = 4;
const FPS = 15;

mkdirSync(framesDir, { recursive: true });

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; background: transparent; }
    #lottie { width: ${SIZE}px; height: ${SIZE}px; }
  </style>
</head>
<body>
  <div id="lottie"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
  <script>
    window.anim = lottie.loadAnimation({
      container: document.getElementById('lottie'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: ${JSON.stringify('file://' + jsonPath)},
    });
  </script>
</body>
</html>`;

const htmlPath = join(framesDir, 'player.html');
writeFileSync(htmlPath, html);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const page = await browser.newPage();
await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.anim && window.anim.isLoaded, { timeout: 15000 });

const totalFrames = await page.evaluate(() => window.anim.totalFrames);
const frameIndexes = [];
for (let i = 0; i < totalFrames; i += FRAME_STEP) frameIndexes.push(i);
if (frameIndexes[frameIndexes.length - 1] !== totalFrames - 1) {
  frameIndexes.push(totalFrames - 1);
}

for (let n = 0; n < frameIndexes.length; n += 1) {
  const frame = frameIndexes[n];
  await page.evaluate((f) => {
    window.anim.goToAndStop(f, true);
  }, frame);
  await page.screenshot({
    path: join(framesDir, `frame-${String(n).padStart(3, '0')}.png`),
    type: 'png',
    omitBackground: true,
  });
}

await browser.close();

const palette = join(framesDir, 'palette.png');
execFileSync('ffmpeg', [
  '-y',
  '-framerate',
  String(FPS),
  '-i',
  join(framesDir, 'frame-%03d.png'),
  '-vf',
  'palettegen=reserve_transparent=1:stats_mode=diff',
  palette,
], { stdio: 'inherit' });

execFileSync('ffmpeg', [
  '-y',
  '-framerate',
  String(FPS),
  '-i',
  join(framesDir, 'frame-%03d.png'),
  '-i',
  palette,
  '-lavfi',
  'paletteuse=dither=none:alpha_threshold=128',
  '-loop',
  '0',
  outGif,
], { stdio: 'inherit' });

rmSync(framesDir, { recursive: true, force: true });
console.log(`Wrote ${outGif}`);
