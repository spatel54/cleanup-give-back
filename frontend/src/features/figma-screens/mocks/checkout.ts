/**
 * Checkout mocks — Figma `shop_checkout_final` (`657:1809` / PRD §6.23).
 * Builds order summary from live cart items (+ cart donation).
 */

import {
  CART_ASSETS,
  DEFAULT_CART_ITEMS,
  DEFAULT_CART_SUMMARY,
  DEFAULT_DONATION,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  donationValue,
  formatUsd,
  type CartDonationAmount,
  type CartLineItem,
} from './cart';
import { TRACKER_ACCESS_PRICE } from '@/constants/commerce';
import { computeShippingFee, shippingFeeLabel } from '@/lib/shipping';
import type { FulfillmentMethod } from '@/lib/shopOrders';

export interface CheckoutOrderLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: number;
}

export interface CheckoutSummary {
  lines: CheckoutOrderLine[];
  itemCount: number;
  subtotal: number;
  donation: number;
  shippingLabel: string;
  tax: number;
  total: number;
}

export function getCheckoutSummary(
  items: CartLineItem[],
  donation: CartDonationAmount | null = DEFAULT_DONATION,
  fulfillmentMethod: FulfillmentMethod = 'usps_ship',
): CheckoutSummary {
  const donationAmount = donationValue(donation);
  const tax = items.length > 0 ? DEFAULT_CART_SUMMARY.tax : 0;
  const shippingFee = computeShippingFee(items, fulfillmentMethod);
  return {
    lines: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
      image: item.image,
    })),
    itemCount: cartItemCount(items),
    subtotal: cartSubtotal(items),
    donation: donationAmount,
    shippingLabel: shippingFeeLabel(shippingFee),
    tax,
    total: cartTotal(items, donation, tax) + shippingFee,
  };
}

/** Fallback summary from default mock cart (tests / legacy). */
export function getDefaultCheckoutSummary(): CheckoutSummary {
  return getCheckoutSummary(DEFAULT_CART_ITEMS);
}

/** Fixed one-time tracker payment shown after the free hour expires.
 *  Always FREE shipping — do not apply the 25% product shipping rate to $59.99. */
export function getTrackerCheckoutSummary(includeKit = true): CheckoutSummary {
  const lines: CheckoutOrderLine[] = [
    {
      id: 'tracker-access',
      name: 'Tracking access (one-time)',
      quantity: 1,
      unitPrice: TRACKER_ACCESS_PRICE,
      lineTotal: TRACKER_ACCESS_PRICE,
      image: 0,
    },
  ];

  if (includeKit) {
    lines.push({
      id: 'cleanup-kit',
      name: 'Trash Cleanup Kit',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      image: CART_ASSETS.kitThumb,
    });
  }

  return {
    lines,
    itemCount: lines.length,
    subtotal: TRACKER_ACCESS_PRICE,
    donation: 0,
    shippingLabel: includeKit ? 'FREE' : 'Not applicable',
    tax: 0,
    total: TRACKER_ACCESS_PRICE,
  };
}

export { formatUsd };
