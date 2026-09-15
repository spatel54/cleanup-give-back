/**
 * Figma `1311:359` Order Shipped / order-placed email HTML.
 *
 * Table + inline CSS only. All copy is live HTML with system font stacks
 * (Georgia ≈ Sanchez, Trebuchet MS ≈ Noto Sans). Hosted `@font-face` for
 * clients that load webfonts. Logo, shipping GIF, and product thumbs are the
 * only raster assets. Placeholder-first: each field uses Figma sample copy
 * until a real `shop_orders` / volunteer value is present.
 *
 * Keep in sync with `admin-web-app/src/lib/order-email-html.ts`.
 */

export type OrderEmailVariant = 'placed' | 'shipped';

export type OrderEmailLineItem = {
  id?: string | null;
  name?: string | null;
  qty?: number | null;
  unitCents?: number | null;
};

export type OrderEmailAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type OrderEmailInput = {
  variant: OrderEmailVariant;
  volunteerName?: string | null;
  orderId?: string | null;
  createdAt?: string | Date | null;
  totalCents?: number | null;
  paymentMethod?: string | null;
  shippingAddress?: OrderEmailAddress | null;
  items?: OrderEmailLineItem[] | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  /** True when the order includes a cleanup kit (tracker bundle or shop). */
  includesKit?: boolean | null;
  /** Shipping summary label — `FREE`, `$12.50`, `Office pickup`, etc. */
  shippingLabel?: string | null;
};

export const ORDER_EMAIL_PLACEHOLDERS = {
  volunteerName: 'Volunteer Name',
  orderNumberHeader: 'X-XXXX',
  address: 'XXXXX, XXXXX, XX XXXXX',
  paymentMethod: '—',
  orderTotal: '$XX.XXX',
  orderNumberSummary: '######',
  orderDate: 'MM/DD/YYYY',
  itemName: 'Product Item',
  itemQty: 'X',
  itemPrice: '$XX.XXX',
  itemsTotal: '$XX.XXX',
} as const;

export const ORDER_EMAIL_SUBJECTS: Record<OrderEmailVariant, string> = {
  placed: 'Thank you for your order!',
  shipped: 'Your order is on its way!',
};

/** Hosted on the production admin deploy — Resend needs a public image URL. */
export const ORDER_EMAIL_ASSET_BASE = 'https://admin.example.com/email';

export const ORDER_EMAIL_SUPPORT_EMAIL = 'support@example.org';
const SUPPORT_EMAIL = ORDER_EMAIL_SUPPORT_EMAIL;

/** Primary green CTA with deep-green stroke — not lime. */
export const ORDER_EMAIL_CTA_BG = '#009540';
export const ORDER_EMAIL_CTA_FG = '#ffffff';
export const ORDER_EMAIL_CTA_BORDER = '#004d21';

export const ORDER_EMAIL_PRODUCT_FILES: Record<string, string> = {
  'cleanup-kit': 'cleanup-kit.png',
  'trash-grabber': 'trash-grabber.png',
  'tote-bags': 'tote-bags.png',
  'adult-safety-vest': 'adult-safety-vest.png',
  'child-safety-vest': 'child-safety-vest.png',
};

const PRODUCT_IMAGE_BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_EMAIL_PRODUCT_FILES).map(([id, file]) => [id, `${ORDER_EMAIL_ASSET_BASE}/${file}`]),
);

const PLACEHOLDER_IMAGE = `${ORDER_EMAIL_ASSET_BASE}/product-placeholder.png`;
const LOGO_MARK_URL = `${ORDER_EMAIL_ASSET_BASE}/logo-mark.png`;
const HEADER_PIXEL_URL = `${ORDER_EMAIL_ASSET_BASE}/header-pixel.png`;
export const ORDER_EMAIL_SHIPPING_GIF_QUERY = 'v=6';
const SHIPPING_ICON_URL = `${ORDER_EMAIL_ASSET_BASE}/shipping.gif?${ORDER_EMAIL_SHIPPING_GIF_QUERY}`;
const FONT_REGULAR_URL = `${ORDER_EMAIL_ASSET_BASE}/fonts/NotoSans-Regular.ttf`;
const FONT_BOLD_URL = `${ORDER_EMAIL_ASSET_BASE}/fonts/NotoSans-Bold.ttf`;
const FONT_SANCHEZ_URL = `${ORDER_EMAIL_ASSET_BASE}/fonts/Sanchez-Regular.ttf`;
const FONT_HEADING = "Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Trebuchet MS', Tahoma, Arial, Helvetica, sans-serif";
const EMAIL_SANS = `'Noto Sans', ${FONT_BODY}`;
const EMAIL_SERIF = `'Sanchez', ${FONT_HEADING}`;
const LETTER_SPACING = '0.02em';
/** Figma `cream/50` / `color/bg/app` — not plain white. */
const CARD_BG = '#fcf9f8';

const PLACEHOLDER_LINE_ITEMS: OrderEmailLineItem[] = [
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
];

export function resolveOrderEmailField(
  realValue: string | null | undefined,
  placeholder: string,
): string {
  const trimmed = realValue?.trim();
  return trimmed ? trimmed : placeholder;
}

export function trackingUrl(carrier: string | null | undefined, tracking: string | null | undefined): string | null {
  const code = tracking?.trim();
  const c = carrier?.trim().toLowerCase();
  if (!code || !c) return null;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}`;
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(code)}`;
  return null;
}

export function formatOrderDisplayId(orderId: string | null | undefined): string | null {
  if (!orderId?.trim()) return null;
  const compact = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return compact.length >= 4 ? compact : null;
}

export function formatUsdFromCents(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents) || cents < 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

export function isTrackerAccessOrder(items: OrderEmailLineItem[] | null | undefined): boolean {
  return (items ?? []).some((item) => item.id === 'tracker-access');
}

/** Keep in sync with `frontend/src/constants/commerce.ts` `PRODUCT_SHIPPING_RATE`. */
const PRODUCT_SHIPPING_RATE = 0.25;

function shopUspsShippingCents(items: OrderEmailLineItem[] | null | undefined): number {
  const productCents = (items ?? []).reduce((sum, item) => {
    if (item.id === 'tracker-access') return sum;
    const unitCents = item.unitCents ?? 0;
    if (item.id === 'cleanup-kit' && unitCents <= 0) return sum;
    if (unitCents <= 0) return sum;
    return sum + unitCents * (item.qty ?? 1);
  }, 0);
  return Math.round(productCents * PRODUCT_SHIPPING_RATE);
}

export function defaultShippingLabelForFulfillment(
  fulfillmentMethod: string | null | undefined,
  items: OrderEmailLineItem[] | null | undefined,
): string | null {
  if (isTrackerAccessOrder(items)) return 'FREE';
  if (fulfillmentMethod === 'office_pickup') return 'Office pickup';
  if (fulfillmentMethod === 'local_dropoff') return 'Local drop-off';
  if (fulfillmentMethod === 'usps_ship') {
    const shippingCents = shopUspsShippingCents(items);
    return shippingCents <= 0 ? 'FREE' : formatUsdFromCents(shippingCents);
  }
  return null;
}

export function resolveOrderShippingLabel(
  input: Pick<OrderEmailInput, 'shippingLabel' | 'items'>,
): string | null {
  const explicit = input.shippingLabel?.trim();
  if (explicit) return explicit;
  if (isTrackerAccessOrder(input.items)) return 'FREE';
  return null;
}

export function formatOrderDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

const ADDRESS_SENTINELS = new Set(['address not provided', '—', '-', 'n/a', 'na', 'none', 'unknown', 'tbd']);

function usableAddressPart(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (ADDRESS_SENTINELS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function formatShippingAddress(addr: OrderEmailAddress | null | undefined): string | null {
  if (!addr) return null;
  const line1 = usableAddressPart(addr.line1);
  const city = usableAddressPart(addr.city);
  if (!line1 || !city) return null;
  const cityLine = [city, usableAddressPart(addr.state), usableAddressPart(addr.postalCode)].filter(Boolean).join(', ');
  const countryRaw = usableAddressPart(addr.country);
  const countryUpper = countryRaw?.toUpperCase();
  const country = !countryRaw || countryUpper === 'US' || countryUpper === 'USA' ? 'USA' : countryRaw;
  return [line1, usableAddressPart(addr.line2), cityLine, country].filter(Boolean).join(', ');
}

export function parseShopOrderItems(items: unknown): OrderEmailLineItem[] {
  if (!Array.isArray(items)) return [];
  const rows: OrderEmailLineItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const qtyRaw = row.qty ?? row.quantity;
    const centsRaw = row.unitCents ?? row.unit_cents ?? row.price;
    rows.push({
      id: typeof row.id === 'string' ? row.id : null,
      name: typeof row.name === 'string' ? row.name : null,
      qty: typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw) || null,
      unitCents: typeof centsRaw === 'number' ? centsRaw : Number(centsRaw) || null,
    });
  }
  return rows;
}

export function parseShopOrderAddress(shippingData: unknown): OrderEmailAddress | null {
  if (!shippingData || typeof shippingData !== 'object') return null;
  const row = shippingData as Record<string, unknown>;
  const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
  return {
    name: str(row.name),
    line1: str(row.line1) ?? str(row.address),
    line2: str(row.line2),
    city: str(row.city),
    state: str(row.state),
    postalCode: str(row.postalCode) ?? str(row.postal_code) ?? str(row.zip),
    country: str(row.country),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function summaryRow(label: string, value: string): string {
  return `<tr>
      <td style="padding:0 0 20px;vertical-align:top;width:140px;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">${escapeHtml(label)}</td>
      <td style="padding:0 0 20px;font-family:${EMAIL_SANS};font-size:14px;font-weight:bold;color:#1c1b1b;vertical-align:top;letter-spacing:${LETTER_SPACING};">${escapeHtml(value)}</td>
    </tr>`;
}

function productImageUrl(productId: string | null | undefined): string {
  if (!productId) return PLACEHOLDER_IMAGE;
  return PRODUCT_IMAGE_BY_ID[productId] ?? PLACEHOLDER_IMAGE;
}

function lineItemRowsHtml(items: OrderEmailLineItem[]): string {
  return items
    .map((item) => {
      const name = resolveOrderEmailField(item.name, ORDER_EMAIL_PLACEHOLDERS.itemName);
      const qty =
        item.qty != null && Number.isFinite(item.qty) && item.qty > 0
          ? String(item.qty)
          : ORDER_EMAIL_PLACEHOLDERS.itemQty;
      const lineCents =
        item.unitCents != null && item.qty != null && item.qty > 0 ? item.unitCents * item.qty : item.unitCents;
      const price = formatUsdFromCents(lineCents) ?? ORDER_EMAIL_PLACEHOLDERS.itemPrice;
      const img = productImageUrl(item.id);
      return `<tr>
  <td style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td width="86" style="width:86px;vertical-align:middle;">
          <img src="${img}" width="86" height="86" alt="" style="display:block;width:86px;height:86px;object-fit:cover;border:0;">
        </td>
        <td style="padding-left:16px;vertical-align:middle;font-family:${EMAIL_SANS};font-size:16px;font-weight:bold;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">${escapeHtml(name)}</td>
      </tr>
    </table>
  </td>
  <td align="center" width="48" style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">${escapeHtml(qty)}</td>
  <td align="right" width="72" style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;font-family:${EMAIL_SANS};font-size:16px;color:#ba1a1a;white-space:nowrap;letter-spacing:${LETTER_SPACING};">${escapeHtml(price)}</td>
</tr>`;
    })
    .join('');
}

export function buildOrderEmailHtml(input: OrderEmailInput): string {
  const volunteerName = resolveOrderEmailField(input.volunteerName, ORDER_EMAIL_PLACEHOLDERS.volunteerName);
  const displayId = formatOrderDisplayId(input.orderId);
  const orderNumberHeader = resolveOrderEmailField(displayId, ORDER_EMAIL_PLACEHOLDERS.orderNumberHeader);
  const orderNumberSummary = resolveOrderEmailField(displayId, ORDER_EMAIL_PLACEHOLDERS.orderNumberSummary);
  const address = resolveOrderEmailField(
    formatShippingAddress(input.shippingAddress),
    ORDER_EMAIL_PLACEHOLDERS.address,
  );
  const paymentMethod = resolveOrderEmailField(input.paymentMethod, ORDER_EMAIL_PLACEHOLDERS.paymentMethod);
  const orderTotal = resolveOrderEmailField(
    formatUsdFromCents(input.totalCents),
    ORDER_EMAIL_PLACEHOLDERS.orderTotal,
  );
  const orderDate = resolveOrderEmailField(formatOrderDate(input.createdAt), ORDER_EMAIL_PLACEHOLDERS.orderDate);

  const realItems = (input.items ?? []).filter(
    (item) => item.name?.trim() || (item.unitCents != null && item.unitCents >= 0),
  );
  const items = realItems.length > 0 ? realItems : PLACEHOLDER_LINE_ITEMS;
  const itemsTotal =
    realItems.length > 0
      ? resolveOrderEmailField(formatUsdFromCents(input.totalCents), ORDER_EMAIL_PLACEHOLDERS.itemsTotal)
      : ORDER_EMAIL_PLACEHOLDERS.itemsTotal;
  const shippingLabel = resolveOrderShippingLabel(input);

  const isShipped = input.variant === 'shipped';
  const headline = 'Your order is on its way!';
  const greeting = `Thank you for your order, ${volunteerName}!`;
  const bodyCopy = isShipped
    ? 'Your package is on its way and will arrive soon! Please wait 24 hours to start tracking your order.'
    : "We've received your order and will email you when it ships.";

  const trackHref = isShipped ? trackingUrl(input.carrier, input.trackingNumber) : null;
  const ctaHtml = trackHref
    ? `<tr><td align="center" style="padding-top:12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center">
          <tr>
            <td class="oe-cta-cell" align="center" bgcolor="${ORDER_EMAIL_CTA_BG}" style="background-color:${ORDER_EMAIL_CTA_BG};border:2px solid ${ORDER_EMAIL_CTA_BORDER};border-radius:4px;">
              <a class="oe-cta-link" href="${escapeHtml(trackHref)}" style="display:inline-block;padding:16px 37px;font-family:${EMAIL_SERIF};font-size:18px;font-weight:400;color:${ORDER_EMAIL_CTA_FG};text-decoration:none;line-height:1.2;letter-spacing:${LETTER_SPACING};">Track Order</a>
            </td>
          </tr>
        </table>
      </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(headline)}</title>
  <style type="text/css">
    :root {
      color-scheme: light only;
      supported-color-schemes: light;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: #bdcaba !important;
    }
    .email-footer {
      width: 100% !important;
      min-width: 100% !important;
    }
    body, td, p, h1, a {
      letter-spacing: 0.02em;
    }
    @font-face {
      font-family: 'Sanchez';
      font-style: normal;
      font-weight: 400;
      src: url('${FONT_SANCHEZ_URL}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      src: url('${FONT_REGULAR_URL}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      src: url('${FONT_BOLD_URL}') format('truetype');
    }
    .oe-body-text {
      font-size: 16px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .shipping-gif-cell {
        padding-right: 36px !important;
      }
      .oe-body-text {
        font-size: 18px !important;
        line-height: 1.45 !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;height:100%;background-color:#bdcaba;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Order ${escapeHtml(orderNumberHeader)}
</div>
<table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" bgcolor="#bdcaba" style="width:100%;min-width:100%;height:100%;min-height:100%;background-color:#bdcaba;">
  <tr>
    <td align="center" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="max-width:600px;background-color:${CARD_BG};font-family:${FONT_BODY};">
        <tr>
          <td bgcolor="#009540" background="${HEADER_PIXEL_URL}" style="background-color:#009540;background-image:url('${HEADER_PIXEL_URL}');padding:16px 20px 32px;">
            <img src="${LOGO_MARK_URL}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="shipping-gif-cell" align="center" bgcolor="#009540" background="${HEADER_PIXEL_URL}" style="padding-top:0;padding-right:24px;font-size:0;line-height:0;background-color:#009540;background-image:url('${HEADER_PIXEL_URL}');">
                  <img src="${SHIPPING_ICON_URL}" width="220" height="106" alt="" style="display:block;width:220px;height:106px;border:0;margin:0 auto;">
                </td>
              </tr>
              <tr>
                <td align="center" bgcolor="#009540" background="${HEADER_PIXEL_URL}" style="padding-top:8px;background-color:#009540;background-image:url('${HEADER_PIXEL_URL}');">
                  <h1 style="margin:0;font-family:${EMAIL_SERIF};font-size:28px;font-weight:400;color:#ffffff;text-align:center;line-height:1.3;letter-spacing:${LETTER_SPACING};">${escapeHtml(headline)}</h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:10px;font-family:${EMAIL_SANS};font-size:14px;color:#bdcaba;letter-spacing:${LETTER_SPACING};">
                  Order number: ${escapeHtml(orderNumberHeader)}
                </td>
              </tr>
              ${ctaHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px 8px;">
            <p style="margin:0 0 12px;font-family:${EMAIL_SANS};font-size:18px;font-weight:bold;color:#1c1b1b;line-height:1.35;letter-spacing:${LETTER_SPACING};">${escapeHtml(greeting)}</p>
            <p class="oe-body-text" style="margin:0 0 32px;font-family:${EMAIL_SANS};font-size:16px;line-height:1.5;color:#1c1b1b;text-align:left;letter-spacing:${LETTER_SPACING};">${escapeHtml(bodyCopy)}</p>
            <p style="margin:0 0 10px;font-family:${EMAIL_SANS};font-size:18px;font-weight:bold;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">Order Summary</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e5e2e1;">
              <tr>
                <td style="padding:24px 24px 4px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${summaryRow('Address:', address)}
                    ${summaryRow('Payment Method:', paymentMethod)}
                    ${shippingLabel ? summaryRow('Shipping:', shippingLabel) : ''}
                    ${summaryRow('Order Total:', orderTotal)}
                    ${summaryRow('Order #:', orderNumberSummary)}
                    ${summaryRow('Order Date:', orderDate)}
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
              <tr>
                <td style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">Item</td>
                <td align="center" width="48" style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">Qty</td>
                <td align="right" width="72" style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">Price</td>
              </tr>
              ${lineItemRowsHtml(items)}
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="vertical-align:middle;font-family:${EMAIL_SANS};font-size:14px;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">Total</td>
                <td align="right" style="font-family:${EMAIL_SANS};font-size:18px;font-weight:bold;color:#ba1a1a;letter-spacing:${LETTER_SPACING};">${escapeHtml(itemsTotal)}</td>
              </tr>
            </table>
            <p style="margin:40px 0 0;font-family:${EMAIL_SANS};font-size:14px;line-height:1.5;color:#6e7a6c;text-align:center;letter-spacing:${LETTER_SPACING};">
              Please do not reply to this email. For assistance, email
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#009540;text-decoration:none;border-bottom:1px solid #009540;letter-spacing:${LETTER_SPACING};">${escapeHtml(SUPPORT_EMAIL)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="email-footer oe-footer" align="center" valign="top" width="100%" height="100%" bgcolor="#bdcaba" style="background-color:#bdcaba;width:100%;min-width:100%;height:100%;vertical-align:top;padding:28px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr>
          <td align="center" style="font-family:${EMAIL_SANS};font-size:14px;line-height:1.4;letter-spacing:${LETTER_SPACING};">
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Contact Us</a>
            &nbsp;&nbsp;&nbsp;
            <a href="mailto:${SUPPORT_EMAIL}?subject=Privacy%20Policy" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Privacy Policy</a>
            &nbsp;&nbsp;&nbsp;
            <a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe" style="color:#1c1b1b;text-decoration:none;border-bottom:1px solid #1c1b1b;letter-spacing:${LETTER_SPACING};">Unsubscribe</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:25px;font-family:${EMAIL_SANS};font-size:14px;line-height:1.4;color:#1c1b1b;letter-spacing:${LETTER_SPACING};">
            Clean Up - Give Back is a 501(c)(3) nonprofit organization
            <span style="display:none;max-height:0;overflow:hidden;"> ${escapeHtml(orderNumberHeader)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
