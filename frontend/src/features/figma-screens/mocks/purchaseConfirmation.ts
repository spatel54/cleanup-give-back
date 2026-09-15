/**
 * Purchase confirmation mocks — Figma `shop_confirmation` (`494:262` / PRD §6.24).
 * Also reused for Contribute donation confirmation (`?mode=donation`).
 */

import { getCartDonation, getCartItems } from '../cartStore';
import { getCheckoutSummary, getTrackerCheckoutSummary, formatUsd, type CheckoutOrderLine } from './checkout';
import type { DonationRow } from '@/lib/donations';
import { RECEIVING_METHOD_LABELS, type FulfillmentMethod, type ShopOrderRow } from '@/lib/shopOrders';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const PURCHASE_CONFIRMATION_ASSETS = {
  kitThumb: require('@/assets/figma/shop/confirmation/kit-thumb.png') as number,
};

export type PurchaseConfirmationMode = 'order' | 'donation' | 'tracker';

export interface PurchaseConfirmationDetail {
  label: string;
  value: string;
}

export interface PurchaseConfirmationData {
  mode: PurchaseConfirmationMode;
  lines: CheckoutOrderLine[];
  donationAmount: number;
  details: PurchaseConfirmationDetail[];
  totalImpact: number;
}

function formatTimestampFromIso(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return getNow();
  }
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();
  let hours = parsed.getHours();
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return {
    date: `${month}/${day}/${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
}

export function formatLivePaymentMethod(
  label: string | null | undefined,
  status: string,
): string {
  if (label?.trim()) return label.trim();
  if (status === 'pending') return 'Processing…';
  if (status === 'paid' || status === 'succeeded') return 'Paid with Stripe';
  return '-';
}

function orderLinesFromItems(items: unknown): CheckoutOrderLine[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((entry) => entry && typeof entry === 'object' && (entry as { id?: string }).id !== 'donation')
    .map((entry) => {
      const raw = entry as Record<string, unknown>;
      const qty = Number(raw.qty ?? raw.quantity ?? 1) || 1;
      const unitCents = Number(raw.unitCents ?? raw.unit_cents ?? 0);
      const unitPrice = unitCents / 100;
      return {
        id: String(raw.id ?? raw.name ?? 'item'),
        name: String(raw.name ?? raw.id ?? 'Item'),
        quantity: qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        image: PURCHASE_CONFIRMATION_ASSETS.kitThumb,
      };
    });
}

function donationCentsFromItems(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    if (raw.id === 'donation') {
      return Number(raw.unitCents ?? raw.unit_cents ?? 0) || 0;
    }
  }
  return 0;
}

export function getPurchaseConfirmationFromOrder(row: ShopOrderRow): PurchaseConfirmationData {
  const { date, time } = formatTimestampFromIso(row.created_at);
  const donationCents = donationCentsFromItems(row.items);
  const method: FulfillmentMethod = row.fulfillment_method;
  return {
    mode: 'order',
    lines: orderLinesFromItems(row.items),
    donationAmount: donationCents / 100,
    details: [
      { label: 'Date', value: date },
      { label: 'Time', value: time },
      { label: 'Payment Method', value: formatLivePaymentMethod(row.payment_method_label, row.status) },
      { label: 'Receiving', value: RECEIVING_METHOD_LABELS[method] },
    ],
    totalImpact: row.total_cents / 100,
  };
}

export function getDonationConfirmationFromRow(row: DonationRow): PurchaseConfirmationData {
  const { date, time } = formatTimestampFromIso(row.created_at);
  return {
    mode: 'donation',
    lines: [],
    donationAmount: row.amount_cents / 100,
    details: [
      { label: 'Date', value: date },
      { label: 'Time', value: time },
      { label: 'Payment Method', value: formatLivePaymentMethod(row.payment_method_label, row.status) },
    ],
    totalImpact: row.amount_cents / 100,
  };
}

function getNow(): { date: string; time: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return {
    date: `${month}/${day}/${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
}

function getSharedPaymentDetails(): PurchaseConfirmationDetail[] {
  const { date, time } = getNow();
  return [
    { label: 'Date', value: date },
    { label: 'Time', value: time },
    { label: 'Payment Method', value: 'Visa Credit Card' },
  ];
}

export function getPurchaseConfirmationFromCart(): PurchaseConfirmationData {
  const items = getCartItems();
  const summary = getCheckoutSummary(items, getCartDonation());
  return {
    mode: 'order',
    lines: summary.lines,
    donationAmount: summary.donation,
    details: [
      ...getSharedPaymentDetails(),
      { label: 'Taxes', value: formatUsd(summary.tax) },
      { label: 'Shipping', value: summary.shippingLabel },
    ],
    totalImpact: summary.total,
  };
}

/** Tracker one-time payment — Continue on `FreeTrialModal` → Checkout `?mode=tracker`. */
export function getTrackerPurchaseConfirmation(): PurchaseConfirmationData {
  const summary = getTrackerCheckoutSummary();
  return {
    mode: 'tracker',
    lines: summary.lines,
    donationAmount: 0,
    details: [
      ...getSharedPaymentDetails(),
      { label: "How you'll receive it", value: 'Chosen at checkout' },
    ],
    totalImpact: summary.total,
  };
}

/** Donate / Contribute flow — donation-only receipt. */
export function getDonationConfirmation(amount: number): PurchaseConfirmationData {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return {
    mode: 'donation',
    lines: [],
    donationAmount: safeAmount,
    details: getSharedPaymentDetails(),
    totalImpact: safeAmount,
  };
}

export function parseDonationAmountParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** @deprecated Prefer `getPurchaseConfirmationFromCart`. */
export function getDefaultPurchaseConfirmation(): PurchaseConfirmationData {
  return getPurchaseConfirmationFromCart();
}

export { formatUsd };
