/**
 * Punch forest-green `#009540` out of the email GIFs (1-bit GIF transparency)
 * so the header shows through in light and dark mode.
 *
 *   node scripts/make-email-gifs-transparent.mjs
 *
 * Re-run only on GIFs that still have a baked green fill. Prefer
 * `render-nudge-bell-gif.mjs` when regenerating the bell from Lottie.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const emailDir = join(here, '..', 'public', 'email');
const GREEN = '0x009540';

function punchGreen(filename, maxColors) {
  const path = join(emailDir, filename);
  const palette = maxColors
    ? `palettegen=reserve_transparent=1:stats_mode=diff:max_colors=${maxColors}`
    : 'palettegen=reserve_transparent=1:stats_mode=diff';
  execFileSync('ffmpeg', [
    '-y',
    '-i',
    path,
    '-filter_complex',
    `[0:v]colorkey=${GREEN}:0.12:0.18,format=rgba,split[a][b];[a]${palette}[p];[b][p]paletteuse=dither=none:alpha_threshold=128`,
    '-loop',
    '0',
    path,
  ], { stdio: 'inherit' });
  console.log(`Wrote ${path}`);
}

punchGreen('nudge-bell.gif');
punchGreen('shipping.gif', 16);
