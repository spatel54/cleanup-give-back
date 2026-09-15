/**
 * Renders placeholder-first and filled hours-reminder emails to HTML files
 * and asserts Figma copy.
 *
 *   npx tsx scripts/preview-hours-reminder-email.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildHoursReminderEmailHtml,
  HOURS_REMINDER_CTA_LABEL,
  HOURS_REMINDER_OPEN_APP_URL,
  HOURS_REMINDER_PLACEHOLDERS,
  HOURS_REMINDER_SUBJECT,
  hoursReminderHeadline,
  hoursReminderHoursLine,
} from '../src/lib/hours-reminder-email-html';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');

mkdirSync(outDir, { recursive: true });

const placeholder = buildHoursReminderEmailHtml();
const filled = buildHoursReminderEmailHtml({
  volunteerName: 'Jordan Rivera',
  currentHours: 12.5,
});

writeFileSync(join(outDir, 'hours-reminder-email.html'), placeholder);
writeFileSync(join(outDir, 'hours-reminder-email-filled.html'), filled);

function assertContains(html: string, needle: string, label: string): void {
  if (!html.includes(needle)) {
    throw new Error(`${label} missing expected string: ${needle}`);
  }
}

function assertMissing(html: string, needle: string, label: string): void {
  if (html.includes(needle)) {
    throw new Error(`${label} unexpectedly contains: ${needle}`);
  }
}

assertContains(placeholder, HOURS_REMINDER_SUBJECT, 'placeholder');
assertContains(placeholder, hoursReminderHeadline(), 'placeholder');
assertContains(placeholder, hoursReminderHoursLine(), 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CTA_LABEL, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_OPEN_APP_URL, 'placeholder');
assertContains(placeholder, 'support@example.org', 'placeholder');
assertContains(placeholder, 'For assistance, email', 'placeholder assistance copy');
assertContains(placeholder, '501(c)(3)', 'placeholder');
assertContains(placeholder, 'bgcolor="#bdcaba"', 'placeholder full-width footer');
assertContains(placeholder, 'hr-footer', 'placeholder footer in main table');
assertContains(placeholder, 'email-footer', 'placeholder footer stretch');
assertContains(placeholder, 'min-width:100%', 'placeholder footer full width');
assertContains(placeholder, 'nudge-bell.gif', 'placeholder');
assertContains(placeholder, 'header-pixel.png', 'placeholder header pixel');
assertContains(placeholder, 'hr-body-text', 'placeholder HTML body');
assertContains(placeholder, 'background-color:#009540', 'placeholder primary CTA');
assertContains(placeholder, 'border:2px solid #004d21', 'placeholder CTA stroke');
assertContains(placeholder, 'color:#ffffff', 'placeholder hours and CTA white');
assertMissing(placeholder, 'background-color:#c2d832', 'placeholder no lime CTA');
assertMissing(placeholder, 'prefers-color-scheme: dark', 'placeholder no dark CTA swap');
assertContains(placeholder, 'supported-color-schemes" content="light"', 'placeholder light-only color scheme');
assertContains(placeholder, "color:#ffffff", 'placeholder body white');
assertContains(placeholder, "Georgia, 'Times New Roman', serif", 'placeholder Sanchez fallback');
assertContains(placeholder, "'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif", 'placeholder Noto fallback');
assertContains(placeholder, 'letter-spacing:0.02em', 'placeholder tracking');
assertContains(placeholder, 'background-color:#fcf9f8', 'placeholder cream card');
assertContains(placeholder, 'bgcolor="#fcf9f8"', 'placeholder cream Outlook');
assertMissing(placeholder, 'background-color:#ffffff', 'placeholder plain white card');
assertContains(placeholder, `Hi ${HOURS_REMINDER_PLACEHOLDERS.firstName},`, 'placeholder');
assertContains(placeholder, `Current hours: ${HOURS_REMINDER_PLACEHOLDERS.currentHours}`, 'placeholder');
assertMissing(placeholder, 'hours-reminder-body.png', 'placeholder type PNG');
assertMissing(placeholder, 'forgot-password-support.png', 'placeholder chrome PNG');
assertMissing(placeholder, 'fonts.googleapis.com', 'placeholder');
assertMissing(placeholder, 'Hi Alex,', 'placeholder');
assertMissing(placeholder, 'Alex Johnson', 'placeholder');

assertContains(filled, 'Hi Jordan,', 'filled');
assertMissing(filled, 'Hi Volunteer,', 'filled');
assertContains(filled, 'Current hours: 12.5', 'filled');
assertMissing(filled, 'Current hours: XXX', 'filled');

console.log(`Wrote ${outDir}/hours-reminder-email.html`);
console.log(`Wrote ${outDir}/hours-reminder-email-filled.html`);
console.log('preview-hours-reminder-email: ok');
