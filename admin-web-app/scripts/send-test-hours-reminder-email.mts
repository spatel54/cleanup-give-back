/**
 * Send the Figma hours-reminder email through Resend.
 *
 *   npx tsx scripts/send-test-hours-reminder-email.mts --to=you@example.com
 *
 * Loads `admin-web-app/.env.local` for RESEND_API_KEY / EMAIL_FROM / ADMIN_NOTIFY_EMAIL.
 * HTML copy is live; logo + bell GIF are CID-inlined so Gmail shows the animation.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resend } from 'resend';

import { HOURS_REMINDER_SUBJECT } from '../src/lib/hours-reminder-email-html';
import { buildHoursReminderEmailForSend } from '../src/lib/hours-reminder-send';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const here = dirname(fileURLToPath(import.meta.url));
loadEnvFile(join(here, '..', '.env.local'));

const toArg = process.argv.find((arg) => arg.startsWith('--to='))?.slice(5);
const to = toArg || process.env.TEST_EMAIL_TO || process.env.ADMIN_NOTIFY_EMAIL;
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? 'noreply@example.org';

if (!apiKey) {
  console.error('RESEND_API_KEY is not set');
  process.exit(1);
}
if (!to) {
  console.error('Pass --to=email@example.com or set TEST_EMAIL_TO / ADMIN_NOTIFY_EMAIL');
  process.exit(1);
}

const resend = new Resend(apiKey);
const { html, attachments } = buildHoursReminderEmailForSend({});
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
const subject = `[TEST] ${HOURS_REMINDER_SUBJECT} · ${stamp}`;
const { data, error } = await resend.emails.send({ from, to, subject, html, attachments });
if (error) {
  console.error('hours-reminder send failed:', error.message);
  process.exit(1);
}
console.log(`hours-reminder sent to ${to} id=${data?.id ?? 'unknown'}`);
