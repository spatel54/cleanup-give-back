import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const svgPath = path.join(
  repoRoot,
  'frontend/assets/figma/onboarding/welcome-logo-black.svg',
);
const svg = fs.readFileSync(svgPath, 'utf8').replaceAll('#1C1B1B', '#009540');
const png = await sharp(Buffer.from(svg))
  .resize(178, 228, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const dests = [
  path.join(repoRoot, 'frontend/assets/images/logos/logo-letterhead.png'),
  path.join(repoRoot, 'backend/sessions/assets/logo-letterhead.png'),
];
for (const dest of dests) {
  fs.writeFileSync(dest, png);
  console.log(path.relative(repoRoot, dest), png.length);
}
