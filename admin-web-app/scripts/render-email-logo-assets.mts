/**
 * Renders shared email / BIMI logo PNGs from the filled welcome-logo paths.
 *
 *   npx tsx scripts/render-email-logo-assets.mts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const emailDir = join(here, '..', 'public', 'email');
const backendEmailDir = join(here, '..', '..', 'backend', 'sessions', 'assets', 'email');

const PRIMARY = '#009540';
const WHITE = '#ffffff';

const PATHS = {
  legs: 'M0 54C0 54 4.5 112.5 6 112.5C7.5 112.5 13.5 78 16.5 78C19.5 78 36 112.5 37.5 112.5C39 112.5 27 54 27 54H0Z',
  torso:
    'M12 24C3.6 33.6 0.5 46 0 51L27 52.5C27 31.5 55.5 24.5 69 24C82.5 23.5 40.5 24 40.5 24H12Z',
  head: 'M34.5 10.5C34.5 16.299 29.799 21 24 21C18.201 21 13.5 16.299 13.5 10.5C13.5 4.70101 18.201 0 24 0C29.799 0 34.5 4.70101 34.5 10.5Z',
  bin: readFileSync(
    join(here, '..', '..', 'frontend', 'assets', 'figma', 'onboarding', 'welcome-logo.svg'),
    'utf8',
  )
    .match(/<path d="(M89 56[^"]+)"/)?.[1] ?? '',
};

function markSvg(fill: string, width: number, height: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 89 114">
  <path d="${PATHS.legs}" fill="${fill}"/>
  <path d="${PATHS.torso}" fill="${fill}"/>
  <path d="${PATHS.head}" fill="${fill}"/>
  <path d="${PATHS.bin}" fill="${fill}"/>
</svg>`;
}

function squareAvatarSvg(size: number): string {
  const pad = size * 0.12;
  const scale = Math.min((size - pad * 2) / 89, (size - pad * 2) / 114);
  const w = 89 * scale;
  const h = 114 * scale;
  const tx = (size - w) / 2;
  const ty = (size - h) / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PRIMARY}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <path d="${PATHS.legs}" fill="${WHITE}"/>
    <path d="${PATHS.torso}" fill="${WHITE}"/>
    <path d="${PATHS.head}" fill="${WHITE}"/>
    <path d="${PATHS.bin}" fill="${WHITE}"/>
  </g>
</svg>`;
}

function bimiSvg(): string {
  const size = 128;
  const pad = 10;
  const scale = Math.min((size - pad * 2) / 89, (size - pad * 2) / 114);
  const w = 89 * scale;
  const h = 114 * scale;
  const tx = (size - w) / 2;
  const ty = (size - h) / 2;
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>Clean Up Give Back</title>
  <rect x="0" y="0" width="${size}" height="${size}" fill="${PRIMARY}"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${PATHS.legs}" fill="${WHITE}"/>
    <path d="${PATHS.torso}" fill="${WHITE}"/>
    <path d="${PATHS.head}" fill="${WHITE}"/>
    <path d="${PATHS.bin}" fill="${WHITE}"/>
  </g>
</svg>`;
}

async function pngFromSvg(svg: string, width: number, height: number, outPath: string): Promise<void> {
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(outPath);
}

mkdirSync(emailDir, { recursive: true });
mkdirSync(backendEmailDir, { recursive: true });

writeFileSync(join(emailDir, 'bimi-logo.svg'), bimiSvg());

await pngFromSvg(markSvg(WHITE, 89, 114), 64, 82, join(emailDir, 'logo-mark.png'));
await pngFromSvg(markSvg(PRIMARY, 89, 114), 64, 82, join(emailDir, 'logo-mark-green.png'));
await pngFromSvg(squareAvatarSvg(256), 256, 256, join(emailDir, 'sender-avatar.png'));

writeFileSync(join(backendEmailDir, 'logo-mark.png'), readFileSync(join(emailDir, 'logo-mark.png')));

console.log('render-email-logo-assets: ok');
console.log('  admin-web-app/public/email/bimi-logo.svg');
console.log('  admin-web-app/public/email/logo-mark.png');
console.log('  admin-web-app/public/email/logo-mark-green.png');
console.log('  admin-web-app/public/email/sender-avatar.png');
console.log('  backend/sessions/assets/email/logo-mark.png');
