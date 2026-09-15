#!/usr/bin/env node
/**
 * macOS Tahoe: eas-cli-local-build-plugin uses `security find-identity -v`
 * against an ephemeral keychain that has no Apple trust chain, so the import
 * presence-check fails even when the .p12 imported. Drop `-v`.
 * https://github.com/expo/eas-cli/issues/3678
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const NEEDLE = "['find-identity', '-v', '-s',";
const REPLACEMENT = "['find-identity', '-s',";

function walk(dir, hits, depth = 0) {
  if (depth > 12) {
    return;
  }
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (name === 'keychain.js' || name === 'node_modules' || name === '@expo' || name === 'build-tools' || name === 'dist' || name === 'ios' || name === 'credentials' || name === '_npx' || name.startsWith('eas-cli') || /^[a-f0-9]{8,}$/.test(name)) {
        walk(full, hits, depth + 1);
      } else if (depth < 4) {
        walk(full, hits, depth + 1);
      }
    } else if (name === 'keychain.js' && full.includes('build-tools') && full.includes('credentials')) {
      hits.push(full);
    }
  }
}

const roots = [
  join(homedir(), '.npm/_npx'),
  tmpdir(),
  '/var/folders/jb/4gkhgpz15bbgklmqj7_zh0hm0000gn/T/cursor-sandbox-cache',
];

const hits = [];
for (const root of roots) {
  walk(root, hits);
}

const unique = [...new Set(hits)];
let patched = 0;
for (const file of unique) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes(NEEDLE)) {
    continue;
  }
  writeFileSync(file, before.replaceAll(NEEDLE, REPLACEMENT));
  patched += 1;
  console.log(`Patched ${file}`);
}

if (patched === 0) {
  console.log('No eas-cli keychain.js with find-identity -v found yet (ok if plugin is not cached).');
}
