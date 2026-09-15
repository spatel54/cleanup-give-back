/**
 * Shared HTML sanitizer for every email-body HTML sink: the rich-text editor's
 * paste handler and preview render (client), and every template/ad-hoc-send
 * write path (server, defense-in-depth against a crafted direct call to a
 * server action bypassing the client-side sanitization).
 *
 * Uses `sanitize-html` (htmlparser2) rather than `isomorphic-dompurify`/`jsdom`.
 * The latter fails on Vercel Node 24 with ERR_REQUIRE_ESM from `@exodus/bytes`,
 * which took down `/emails`, `/attention`, and any route that imported the
 * shared email/notify graph. Restricted to the small tag/attribute set the
 * `RichTextEditor` toolbar can actually produce, plus http(s)/mailto schemes
 * so `javascript:`/`data:`/`vbscript:` hrefs never survive.
 */
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'p', 'br', 'div', 'span', 'font'];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title'],
    span: ['style', 'data-var', 'class'],
    p: ['style'],
    div: ['style'],
    font: ['color', 'face', 'size', 'style'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/],
      'font-size': [/^\d+(?:\.\d+)?px$/],
      'font-family': [/^[\w\s,"'-]+$/],
    },
  },
  allowedClasses: {
    span: ['email-token'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
    a: ['http', 'https', 'mailto'],
  },
  allowProtocolRelative: false,
};

export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}
