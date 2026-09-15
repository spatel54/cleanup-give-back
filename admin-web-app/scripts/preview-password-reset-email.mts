/**
 * Renders the Figma Forgot Password email to HTML and asserts copy.
 *
 *   npx tsx scripts/preview-password-reset-email.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPasswordResetEmailHtml,
  PASSWORD_RESET_EMAIL_COPY,
  PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
} from '../src/lib/password-reset-email-html';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');

const html = buildPasswordResetEmailHtml({
  resetUrl: PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
});

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'password-reset-email.html');
writeFileSync(outPath, html);

function assertContains(needle: string, label: string): void {
  if (!html.includes(needle)) {
    throw new Error(`${label} missing expected string: ${needle}`);
  }
}

function assertMissing(needle: string, label: string): void {
  if (html.includes(needle)) {
    throw new Error(`${label} unexpectedly contains: ${needle}`);
  }
}

assertContains(PASSWORD_RESET_EMAIL_COPY.headline, 'headline');
assertContains('okay, it happens', 'body');
assertContains('ignore this message', 'body close');
assertContains(PASSWORD_RESET_EMAIL_COPY.cta, 'cta');
assertContains(PASSWORD_RESET_EMAIL_PLACEHOLDER_URL, 'resetUrl');
assertContains('support@example.org', 'support email');
assertContains('For assistance, email', 'assistance copy');
assertContains('Contact Us', 'footer contact');
assertContains('Privacy Policy', 'footer privacy');
assertContains('Unsubscribe', 'footer unsubscribe');
assertContains('bgcolor="#bdcaba"', 'full-width sage footer');
assertContains('email-footer', 'footer stretch class');
assertContains('min-width:100%', 'footer full width');
assertContains('logo-mark-green.png', 'logo');
assertContains('<h1', 'HTML headline');
assertContains('font-weight:700;color:#009540', 'headline bold primary');
assertContains('pr-body-text', 'HTML body class');
assertContains('background-color:#009540', 'primary CTA');
assertContains('border:2px solid #004d21', 'CTA stroke');
assertContains('color:#ffffff', 'CTA text color');
assertMissing('background-color:#fcab29', 'no amber CTA');
assertMissing('prefers-color-scheme: dark', 'no dark-mode CTA query');
assertMissing('background-color: #c2d832 !important', 'no lime CTA dark');
assertContains('supported-color-schemes" content="light"', 'light-only color scheme');
assertContains('max-width:600px', 'order-email width');
assertContains('@media only screen and (max-width: 600px)', 'phone body size bump');
assertContains("Georgia, 'Times New Roman', serif", 'Sanchez fallback');
assertContains("'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif", 'Noto Sans fallback');
assertContains('letter-spacing:0.02em', 'consistent tracking');
assertContains('background-color:#fcf9f8', 'cream card');
assertContains('bgcolor="#fcf9f8"', 'cream card Outlook');
assertMissing('background-color:#ffffff', 'plain white card');
assertMissing('forgot-password-headline.png', 'legacy headline PNG');
assertMissing('forgot-password-body.png', 'legacy body PNG');
assertMissing('reset-password-button.png', 'legacy CTA PNG');
assertMissing('forgot-password-support.png', 'legacy support PNG');
assertMissing('forgot-password-contact-us.png', 'legacy footer PNG');
assertMissing('forgot-password-shadow', 'sliced shadow');
assertMissing('fonts.googleapis.com', 'google webfonts');
assertMissing('messsage', 'figma typo');
assertMissing('looks like you have been inactive', 'off-canvas leftover');

console.log(`Wrote ${outPath}`);
console.log('preview-password-reset-email: ok');
