import {
  CLEANUP_KIT_PRODUCT_ID,
  PRODUCT_SHIPPING_RATE,
  TRACKER_ACCESS_PRODUCT_ID,
} from '@/constants/commerce';
import type { CartLineItem } from '@/features/figma-screens/mocks/cart';
import type { FulfillmentMethod } from '@/lib/shopOrders';

function isFreeCleanupKit(item: CartLineItem): boolean {
  return item.id === CLEANUP_KIT_PRODUCT_ID && item.unitPrice <= 0;
}

/** Paid shop products that count toward USPS shipping. Ignores tracker access
 *  and the free cleanup kit bundled with tracking. */
export function productSubtotalForShipping(items: readonly CartLineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.id === TRACKER_ACCESS_PRODUCT_ID) return sum;
    if (isFreeCleanupKit(item)) return sum;
    if (item.unitPrice <= 0) return sum;
    return sum + item.unitPrice * item.quantity;
  }, 0);
}

/** Computes the numeric shipping charge for a shop-cart checkout.
 *  Tracker-bundle checkout does not use this helper — that path is always free. */
export function computeShippingFee(
  items: readonly CartLineItem[],
  fulfillmentMethod: FulfillmentMethod,
): number {
  if (fulfillmentMethod !== 'usps_ship') return 0;
  const productCents = Math.round(productSubtotalForShipping(items) * 100);
  if (productCents <= 0) return 0;
  return Math.round(productCents * PRODUCT_SHIPPING_RATE) / 100;
}

export function shippingFeeLabel(fee: number): string {
  return fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`;
}
