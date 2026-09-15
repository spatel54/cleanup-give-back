/**
 * Send both Figma order-email variants through Resend.
 *
 *   npx tsx scripts/send-test-order-email.mts --to=you@example.com
 *
 * Loads `admin-web-app/.env.local` for RESEND_API_KEY / EMAIL_FROM / ADMIN_NOTIFY_EMAIL.
 * CID-inlines logo, header pixel, shipping GIF, and product thumbs.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resend } from 'resend';

import { ORDER_EMAIL_SUBJECTS } from '../src/lib/order-email-html';
import { buildOrderEmailForSend } from '../src/lib/order-email-send';

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

const variants: Array<{
  label: string;
  subject: string;
  payload: ReturnType<typeof buildOrderEmailForSend>;
}> = [
  {
    label: 'placed',
    subject: ORDER_EMAIL_SUBJECTS.placed,
    payload: buildOrderEmailForSend({ variant: 'placed' }),
  },
  {
    label: 'shipped',
    subject: ORDER_EMAIL_SUBJECTS.shipped,
    payload: buildOrderEmailForSend({
      variant: 'shipped',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
    }),
  },
  {
    label: 'tracker-bundle',
    subject: `${ORDER_EMAIL_SUBJECTS.placed} (tracker $59.99)`,
    payload: buildOrderEmailForSend({
      variant: 'placed',
      volunteerName: 'Jordan Rivera',
      orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      createdAt: '2026-08-12T12:00:00.000Z',
      totalCents: 5999,
      includesKit: true,
      shippingLabel: 'FREE',
      shippingAddress: {
        line1: '600 E Algonquin Road',
        city: 'Example City',
        state: 'IL',
        postalCode: '60018',
        country: 'US',
      },
      items: [
        { id: 'tracker-access', name: 'Tracking access (one-time)', qty: 1, unitCents: 5999 },
        { id: 'cleanup-kit', name: 'Trash Clean Up Kit', qty: 1, unitCents: 0 },
      ],
    }),
  },
];

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

for (const { label, subject: templateSubject, payload } of variants) {
  const subject = `[TEST] ${templateSubject} · ${stamp}`;
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: payload.html,
    attachments: payload.attachments,
  });
  if (error) {
    console.error(`${label} send failed:`, error.message);
    process.exit(1);
  }
  console.log(`${label} sent to ${to} id=${data?.id ?? 'unknown'}`);
}
