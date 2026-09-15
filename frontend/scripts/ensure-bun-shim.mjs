#!/usr/bin/env node
/**
 * Puts a no-op `bun` on PATH so `npm ci` can ignore
 * @kingstinct/react-native-activity-kit's `bun run specs` postinstall.
 * EAS also sets NPM_CONFIG_IGNORE_SCRIPTS; this is the fallback when that is off.
 */
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stub = `#!/bin/bash
if [ "$1" = "run" ] && [ "$2" = "specs" ]; then
  exit 0
fi
exit 0
`;

const here = dirname(fileURLToPath(import.meta.url));
const localShimDir = join(here, 'bun-shim');
mkdirSync(localShimDir, { recursive: true });
const localShim = join(localShimDir, 'bun');
writeFileSync(localShim, stub);
chmodSync(localShim, 0o755);

const pathDirs = process.env.PATH?.split(':') ?? [];
const writableBins = ['/opt/homebrew/bin', '/usr/local/bin'].filter((dir) => {
  if (!existsSync(dir)) {
    return false;
  }
  return pathDirs.includes(dir);
});

for (const dir of writableBins) {
  const target = join(dir, 'bun');
  if (existsSync(target)) {
    continue;
  }
  try {
    writeFileSync(target, stub);
    chmodSync(target, 0o755);
    console.log(`Wrote bun shim to ${target}`);
  } catch {
    // Local EAS may still inherit PATH from Fastfile / this script's sibling shim.
  }
}
