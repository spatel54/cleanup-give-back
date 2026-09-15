#!/usr/bin/env node
/**
 * Fail if a 'use client' module imports runtime values from server-only paths.
 * Prevents recurrence of the payments-data / next/headers client-bundle incident.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FORBIDDEN = [
  '@/lib/supabase/server',
  'lib/supabase/server',
  'next/headers',
  '@/lib/payments-data',
  'lib/payments-data',
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.next') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/^['"]use client['"]\s*;?/m.test(src)) continue;
  for (const line of src.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('import ')) continue;
    if (trimmed.startsWith('import type ')) continue;
    for (const bad of FORBIDDEN) {
      if (trimmed.includes(bad)) {
        violations.push(`${path.relative(ROOT, file)}: ${trimmed}`);
      }
    }
  }
}

if (violations.length) {
  console.error('Client/server import boundary violations:');
  for (const v of violations) console.error(' ', v);
  process.exit(1);
}
console.log('import-boundary: ok');
