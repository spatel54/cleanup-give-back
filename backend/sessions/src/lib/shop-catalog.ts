/**
 * Server-side shop catalog — prices must match admin-web-app/src/lib/shop-catalog.ts
 * and mobile shop screens.
 */

export type CatalogItemId =
  | 'cleanup-kit'
  | 'tote-bags'
  | 'trash-grabber'
  | 'adult-safety-vest'
  | 'child-safety-vest';

export type CatalogItem = {
  id: CatalogItemId;
  label: string;
  unitCents: number;
};

/** Canonical catalog by slug. */
export const SHOP_CATALOG: readonly CatalogItem[] = [
  { id: 'cleanup-kit', label: 'Trash Cleanup Kit', unitCents: 4999 },
  { id: 'tote-bags', label: 'Tote Bags', unitCents: 300 },
  { id: 'trash-grabber', label: 'Trash Grabber', unitCents: 2399 },
  { id: 'adult-safety-vest', label: 'Adult Safety Vest', unitCents: 1299 },
  { id: 'child-safety-vest', label: 'Child Safety Vest', unitCents: 999 },
] as const;

/** Shop home grid ids → catalog slugs (ProductDetail uses slugs). */
const GRID_ID_ALIASES: Record<string, CatalogItemId> = {
  '1': 'tote-bags',
  '2': 'trash-grabber',
  '3': 'child-safety-vest',
  '4': 'adult-safety-vest',
};

const CATALOG_BY_ID = new Map(SHOP_CATALOG.map((item) => [item.id, item]));

export function resolveCatalogItemId(rawId: string): CatalogItemId | null {
  const trimmed = rawId.trim();
  if (GRID_ID_ALIASES[trimmed]) {
    return GRID_ID_ALIASES[trimmed];
  }
  if (CATALOG_BY_ID.has(trimmed as CatalogItemId)) {
    return trimmed as CatalogItemId;
  }
  return null;
}

export function getCatalogItem(id: CatalogItemId): CatalogItem {
  const item = CATALOG_BY_ID.get(id);
  if (!item) {
    throw new Error(`Unknown catalog item: ${id}`);
  }
  return item;
}

/** Mock tax in cents — matches DEFAULT_CART_SUMMARY.tax ($5.65) when cart has products. */
export const SHOP_TAX_CENTS = 565;

/** USPS shipping = 25% of paid product subtotal (excludes free kit at $0). */
export const PRODUCT_SHIPPING_RATE = 0.25;

export type FulfillmentMethod = 'usps_ship' | 'office_pickup' | 'local_dropoff';

export type PricedLineItem = {
  id: CatalogItemId;
  name: string;
  quantity: number;
  unitCents: number;
};

export function computeProductSubtotalCents(items: PricedLineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);
}

export function computeShippingCents(
  items: PricedLineItem[],
  fulfillmentMethod: FulfillmentMethod,
): number {
  if (fulfillmentMethod !== 'usps_ship') return 0;
  const productCents = computeProductSubtotalCents(items);
  if (productCents <= 0) return 0;
  return Math.round(productCents * PRODUCT_SHIPPING_RATE);
}

export function computeShopTotalCents(params: {
  items: PricedLineItem[];
  donationCents: number;
  fulfillmentMethod: FulfillmentMethod;
}): { subtotalCents: number; taxCents: number; shippingCents: number; totalCents: number } {
  const subtotalCents = computeProductSubtotalCents(params.items);
  const taxCents = params.items.length > 0 ? SHOP_TAX_CENTS : 0;
  const shippingCents = computeShippingCents(params.items, params.fulfillmentMethod);
  const totalCents = subtotalCents + params.donationCents + taxCents + shippingCents;
  return { subtotalCents, taxCents, shippingCents, totalCents };
}
