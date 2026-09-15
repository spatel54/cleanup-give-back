import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from 'expo-web-browser';

import { apiFetch, isApiConfigured } from './api';
import type { FulfillmentMethod } from './shopOrders';

export type ShopCheckoutItem = {
  id: string;
  quantity: number;
};

export type ShopCheckoutRequest = {
  items: ShopCheckoutItem[];
  donationCents?: number | null;
  fulfillmentMethod: FulfillmentMethod;
  shipping?: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
};

export type CheckoutSessionResponse = {
  url: string;
  orderId?: string;
  donationId?: string;
  sessionId: string;
};

/**
 * Opens Stripe Checkout in the system browser (Expo Go compatible).
 * Resolves when the user completes payment and returns to the app.
 */
export async function openStripeCheckout(url: string): Promise<'success' | 'cancel'> {
  const returnUrl = Linking.createURL('purchase-confirmation');
  const result = await openAuthSessionAsync(url, returnUrl);
  if (result.type === 'success') {
    return 'success';
  }
  return 'cancel';
}

export async function createShopCheckout(
  request: ShopCheckoutRequest,
): Promise<CheckoutSessionResponse> {
  if (!isApiConfigured) {
    throw new Error('API URL not configured');
  }

  return apiFetch<CheckoutSessionResponse>('/payments/shop-checkout', {
    method: 'POST',
    body: JSON.stringify({
      ...request,
      successUrl: Linking.createURL('purchase-confirmation'),
      cancelUrl: Linking.createURL('checkout'),
    }),
  });
}

export async function createDonateCheckout(amountCents: number): Promise<CheckoutSessionResponse> {
  if (!isApiConfigured) {
    throw new Error('API URL not configured');
  }

  return apiFetch<CheckoutSessionResponse>('/payments/donate-checkout', {
    method: 'POST',
    body: JSON.stringify({
      amountCents,
      successUrl: Linking.createURL('purchase-confirmation', { queryParams: { mode: 'donation' } }),
      cancelUrl: Linking.createURL('donate'),
    }),
  });
}
