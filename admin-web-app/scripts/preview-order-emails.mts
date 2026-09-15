/**
 * Renders placeholder-first order emails to HTML files and asserts Figma copy.
 *
 *   npx tsx scripts/preview-order-emails.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildOrderEmailHtml,
  ORDER_EMAIL_PLACEHOLDERS,
  trackingUrl,
} from '../src/lib/order-email-html';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');

const placed = buildOrderEmailHtml({ variant: 'placed' });
const shippedPlaceholder = buildOrderEmailHtml({ variant: 'shipped' });
const shippedTracked = buildOrderEmailHtml({
  variant: 'shipped',
  volunteerName: 'Jordan Rivera',
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  createdAt: '2026-08-12T12:00:00.000Z',
  totalCents: 5000,
  shippingAddress: {
    line1: '600 E Algonquin Road',
    city: 'Example City',
    state: 'IL',
    postalCode: '60018',
    country: 'US',
  },
  items: [
    { id: 'cleanup-kit', name: 'Trash Clean Up Kit', qty: 1, unitCents: 4999 },
    { id: 'tote-bags', name: 'Reusable Earth and Ocean Tote Bags', qty: 2, unitCents: 300 },
  ],
  trackingNumber: '1Z999AA10123456784',
  carrier: 'UPS',
  shippingLabel: '$10.00',
});
const trackerBundle = buildOrderEmailHtml({
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
});

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'order-email-placed.html'), placed);
writeFileSync(join(outDir, 'order-email-shipped.html'), shippedPlaceholder);
writeFileSync(join(outDir, 'order-email-shipped-tracked.html'), shippedTracked);
writeFileSync(join(outDir, 'order-email-tracker-bundle.html'), trackerBundle);

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

assertContains(placed, 'Your order is on its way!', 'placed');
assertContains(placed, '<h1', 'placed HTML headline');
assertContains(placed, 'oe-body-text', 'placed HTML body');
assertContains(placed, 'Thank you for your order,', 'placed');
assertContains(placed, 'Noto Sans', 'placed');
assertContains(placed, "Georgia, 'Times New Roman', serif", 'placed Sanchez fallback');
assertContains(placed, "'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif", 'placed Noto fallback');
assertContains(placed, 'letter-spacing:0.02em', 'placed tracking');
assertContains(placed, 'background-color:#fcf9f8', 'placed cream card');
assertContains(placed, 'bgcolor="#fcf9f8"', 'placed cream Outlook');
assertMissing(placed, 'background-color:#ffffff', 'placed plain white card');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.volunteerName, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.orderNumberHeader, 'placed');
assertContains(placed, 'Order Summary', 'placed');
assertContains(placed, 'Payment Method:', 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.address, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.paymentMethod, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.itemName, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.itemPrice, 'placed item price');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.itemsTotal, 'placed items total');
assertMissing(placed, '$23.99', 'placed fake item price');
assertMissing(placed, '$50.00', 'placed fake items total');
assertContains(placed, 'support@example.org', 'placed');
assertContains(placed, 'For assistance, email', 'placed assistance copy');
assertContains(placed, '501(c)(3)', 'placed');
assertContains(placed, 'bgcolor="#bdcaba"', 'placed full-width footer');
assertContains(placed, 'oe-footer', 'placed footer in main table');
assertContains(placed, 'email-footer', 'placed footer stretch');
assertContains(placed, 'min-width:100%', 'placed footer full width');
assertContains(placed, 'supported-color-schemes" content="light"', 'placed light-only color scheme');
assertContains(placed, 'header-pixel.png', 'placed header pixel');
assertContains(placed, 'shipping.gif?v=6', 'placed shipping gif');
assertMissing(placed, 'Alex Johnson', 'placed no sample name');
assertMissing(placed, 'Hi Alex,', 'placed no sample first name');
assertMissing(placed, 'order-on-its-way-headline.png', 'placed type PNG');
assertMissing(placed, 'order-placed-body.png', 'placed type PNG');
assertMissing(placed, 'forgot-password-support.png', 'placed chrome PNG');

assertContains(shippedPlaceholder, 'Your order is on its way!', 'shipped placeholder');
assertContains(shippedPlaceholder, 'text-align:left', 'shipped placeholder');
assertContains(shippedPlaceholder, '@media only screen and (max-width: 600px)', 'shipped placeholder');
assertContains(shippedPlaceholder, 'Please wait 24 hours', 'shipped placeholder');
assertContains(shippedPlaceholder, ORDER_EMAIL_PLACEHOLDERS.address, 'shipped placeholder');
assertMissing(shippedPlaceholder, 'Track Order', 'shipped placeholder');
assertMissing(shippedPlaceholder, 'order-shipped-body.png', 'shipped type PNG');

assertContains(shippedTracked, '600 E Algonquin Road', 'shipped tracked');
assertContains(shippedTracked, 'Trash Clean Up Kit', 'shipped tracked');
assertContains(shippedTracked, '$50.00', 'shipped tracked');
assertContains(shippedTracked, 'Track Order', 'shipped tracked');
assertContains(shippedTracked, 'background-color:#009540', 'shipped tracked primary CTA');
assertContains(shippedTracked, 'border:2px solid #004d21', 'shipped tracked CTA stroke');
assertContains(shippedTracked, 'color:#ffffff', 'shipped tracked CTA text');
assertMissing(shippedTracked, 'background-color:#c2d832', 'shipped tracked no lime CTA');
assertMissing(shippedTracked, 'prefers-color-scheme: dark', 'shipped tracked no dark CTA swap');
assertMissing(shippedTracked, 'track-order-button.png', 'shipped tracked CTA PNG');
const expectedTrack = trackingUrl('UPS', '1Z999AA10123456784');
if (!expectedTrack || !shippedTracked.includes(expectedTrack)) {
  throw new Error('shipped tracked missing UPS tracking URL');
}

assertMissing(placed, 'fonts.googleapis.com', 'placed');
assertMissing(shippedTracked, 'fonts.googleapis.com', 'shipped tracked');

assertContains(trackerBundle, 'Tracking access (one-time)', 'tracker bundle access line');
assertContains(trackerBundle, 'Trash Clean Up Kit', 'tracker bundle kit line');
assertContains(trackerBundle, '$0.00', 'tracker bundle free kit');
assertContains(trackerBundle, '$59.99', 'tracker bundle total');
assertContains(trackerBundle, 'Shipping:', 'tracker bundle shipping row');
assertContains(trackerBundle, 'FREE', 'tracker bundle free shipping');
assertContains(trackerBundle, 'support@example.org', 'tracker bundle support');

console.log(`Wrote ${outDir}/order-email-placed.html`);
console.log(`Wrote ${outDir}/order-email-shipped.html`);
console.log(`Wrote ${outDir}/order-email-shipped-tracked.html`);
console.log(`Wrote ${outDir}/order-email-tracker-bundle.html`);
console.log('preview-order-emails: ok');
