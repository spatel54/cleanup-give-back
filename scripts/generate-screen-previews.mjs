import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlDir = path.join(root, 'frontend/design/stitch_htmls');
const outDir = path.join(root, 'docs/screens/mobile/previews');

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html')).sort();

for (const file of files) {
  const filePath = path.join(htmlDir, file);
  const outPath = path.join(outDir, file.replace('.html', '.png'));
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('OK', file);
}

await browser.close();
