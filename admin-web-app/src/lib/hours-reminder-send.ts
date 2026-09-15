/**
 * CID-inline the hours-reminder logo, header pixel, and bell GIF so Gmail
 * shows them without waiting on "Display images". The 8×8 forest-green pixel
 * is the header `background` so Apple Mail skips dark-mode inversion of the
 * white body copy. Type is live HTML - do not inline type PNGs.
 * The shipping GIF on order emails stays hosted (too large to CID).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildHoursReminderEmailHtml,
  HOURS_REMINDER_ASSET_BASE,
  type HoursReminderEmailInput,
} from './hours-reminder-email-html';

export type HoursReminderInlineAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  inlineContentId: string;
};

function emailPublicDir(): string {
  const fromCwd = join(process.cwd(), 'public/email');
  if (existsSync(join(fromCwd, 'nudge-bell.gif'))) return fromCwd;
  return join(dirname(fileURLToPath(import.meta.url)), '../../public/email');
}

export function buildHoursReminderEmailForSend(
  input: HoursReminderEmailInput = {},
): { html: string; attachments: HoursReminderInlineAttachment[] } {
  const assetDir = emailPublicDir();
  const assetBase = (input.assetBase?.trim() || HOURS_REMINDER_ASSET_BASE).replace(/\/$/, '');
  const html = buildHoursReminderEmailHtml(input)
    .replaceAll(`${assetBase}/logo-mark.png`, 'cid:logo-mark.png')
    .replaceAll(`${assetBase}/header-pixel.png`, 'cid:header-pixel.png')
    .replaceAll(`${assetBase}/nudge-bell.gif`, 'cid:nudge-bell.gif');
  return {
    html,
    attachments: [
      {
        filename: 'logo-mark.png',
        content: readFileSync(join(assetDir, 'logo-mark.png')),
        contentType: 'image/png',
        inlineContentId: 'logo-mark.png',
      },
      {
        filename: 'header-pixel.png',
        content: readFileSync(join(assetDir, 'header-pixel.png')),
        contentType: 'image/png',
        inlineContentId: 'header-pixel.png',
      },
      {
        filename: 'nudge-bell.gif',
        content: readFileSync(join(assetDir, 'nudge-bell.gif')),
        contentType: 'image/gif',
        inlineContentId: 'nudge-bell.gif',
      },
    ],
  };
}
