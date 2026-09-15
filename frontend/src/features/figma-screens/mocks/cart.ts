/**
 * Cart / checkout review mocks — Figma `shop_checkout` (`657:1585` / PRD §6.22).
 * Frame name is `shop_checkout` but this is the cart screen (Continue → checkout).
 */

import { CLEANUP_KIT_PRICE } from '@/constants/commerce';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const CART_ASSETS = {
  kitThumb: require('@/assets/figma/shop/cart/cart-kit.png') as number,
};

export type CartDonationAmount = 5 | 10 | 25 | 'custom';

export interface CartLineItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  image: number;
}

export interface CartSummary {
  shippingLabel: string;
  tax: number;
}

export const DEFAULT_CART_ITEMS: CartLineItem[] = [
  {
    id: 'cleanup-kit',
    name: 'Trash Cleanup Kit',
    description: 'Essential gear for safe\npickups',
    unitPrice: CLEANUP_KIT_PRICE,
    quantity: 1,
    image: CART_ASSETS.kitThumb,
  },
];

export const DEFAULT_DONATION: CartDonationAmount = 5;

export const DEFAULT_CART_SUMMARY: CartSummary = {
  shippingLabel: 'FREE',
  tax: 5.65,
};

export const DONATION_PRESETS: Exclude<CartDonationAmount, 'custom'>[] = [5, 10, 25];

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function cartItemCount(items: CartLineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartLineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function donationValue(donation: CartDonationAmount | null): number {
  if (donation === null || donation === 'custom') return 0;
  return donation;
}

export function cartTotal(
  items: CartLineItem[],
  donation: CartDonationAmount | null,
  tax: number,
): number {
  return cartSubtotal(items) + donationValue(donation) + tax;
}
