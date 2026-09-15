/**
 * CID-inline order-email images when they are present in `assets/email/`
 * (copied into the Fly image). Falls back to hosted HTTPS URLs otherwise.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { letterheadAssetsDir } from '../letterhead/assetsPath.js';
import {
  buildOrderEmailHtml,
  ORDER_EMAIL_ASSET_BASE,
  ORDER_EMAIL_PRODUCT_FILES,
  ORDER_EMAIL_SHIPPING_GIF_QUERY,
  type OrderEmailInput,
} from './order-email-html.js';

export type OrderEmailInlineAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  inlineContentId: string;
};

function emailAssetDir(): string {
  return join(letterheadAssetsDir(), 'email');
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
  const assetDir = emailAssetDir();
  const assetBase = ORDER_EMAIL_ASSET_BASE.replace(/\/$/, '');
  let html = buildOrderEmailHtml(input);

  const attachments: OrderEmailInlineAttachment[] = [];
  const seen = new Set<string>();

  for (const filename of ['logo-mark.png', 'header-pixel.png', 'shipping.gif'] as const) {
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
