/**
 * CID-inline the order-email logo, header pixel, shipping GIF, and product
 * thumbs so Gmail shows them without waiting on "Display images". Hosted
 * HTTPS URLs remain in HTML until replaced here at send time.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildOrderEmailHtml,
  ORDER_EMAIL_ASSET_BASE,
  ORDER_EMAIL_PRODUCT_FILES,
  ORDER_EMAIL_SHIPPING_GIF_QUERY,
  type OrderEmailInput,
} from './order-email-html';

export type OrderEmailInlineAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  inlineContentId: string;
};

function emailPublicDir(): string {
  const fromCwd = join(process.cwd(), 'public/email');
  if (existsSync(join(fromCwd, 'logo-mark.png'))) return fromCwd;
  return join(dirname(fileURLToPath(import.meta.url)), '../../public/email');
}

function contentTypeFor(filename: string): string {
  if (filename.endsWith('.gif')) return 'image/gif';
  return 'image/png';
}

function attachIfPresent(
  assetDir: string,
  filename: string,
  seen: Set<string>,
  attachments: OrderEmailInlineAttachment[],
): void {
  if (seen.has(filename)) return;
  const path = join(assetDir, filename);
  if (!existsSync(path)) return;
  seen.add(filename);
  attachments.push({
    filename,
    content: readFileSync(path),
    contentType: contentTypeFor(filename),
    inlineContentId: filename,
  });
}

export function buildOrderEmailForSend(input: OrderEmailInput): {
  html: string;
  attachments: OrderEmailInlineAttachment[];
} {
  const assetDir = emailPublicDir();
  const assetBase = ORDER_EMAIL_ASSET_BASE.replace(/\/$/, '');
  let html = buildOrderEmailHtml(input);

  const attachments: OrderEmailInlineAttachment[] = [];
  const seen = new Set<string>();

  const coreFiles = ['logo-mark.png', 'header-pixel.png', 'shipping.gif'] as const;
  for (const filename of coreFiles) {
    attachIfPresent(assetDir, filename, seen, attachments);
  }

  const productFiles = new Set<string>(['product-placeholder.png']);
  for (const item of input.items ?? []) {
    const id = item.id?.trim();
    if (id && ORDER_EMAIL_PRODUCT_FILES[id]) {
      productFiles.add(ORDER_EMAIL_PRODUCT_FILES[id]);
    }
  }
  for (const filename of productFiles) {
    attachIfPresent(assetDir, filename, seen, attachments);
  }

  html = html.replaceAll(
    `${assetBase}/shipping.gif?${ORDER_EMAIL_SHIPPING_GIF_QUERY}`,
    'cid:shipping.gif',
  );
  for (const attachment of attachments) {
    if (attachment.filename === 'shipping.gif') continue;
    html = html.replaceAll(`${assetBase}/${attachment.filename}`, `cid:${attachment.filename}`);
  }

  return { html, attachments };
}
