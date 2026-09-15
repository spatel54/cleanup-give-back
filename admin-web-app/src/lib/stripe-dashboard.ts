/**
 * Stripe Dashboard deep links for admin order/payment surfaces.
 * Infers test vs live mode from Stripe id prefixes.
 */

export function isStripeTestMode(id: string | null | undefined): boolean {
  if (!id) return false;
  return id.includes('_test_');
}

export function stripeDashboardBase(testMode: boolean): string {
  return testMode ? 'https://dashboard.stripe.com/test' : 'https://dashboard.stripe.com';
}

export function stripeCheckoutSessionUrl(sessionId: string | null | undefined): string | null {
  if (!sessionId?.trim()) return null;
  const base = stripeDashboardBase(isStripeTestMode(sessionId));
  return `${base}/checkout/sessions/${sessionId.trim()}`;
}

export function stripePaymentIntentUrl(paymentIntentId: string | null | undefined): string | null {
  if (!paymentIntentId?.trim()) return null;
  const base = stripeDashboardBase(isStripeTestMode(paymentIntentId));
  return `${base}/payments/${paymentIntentId.trim()}`;
}

/** Prefer PaymentIntent link when available; fall back to Checkout Session. */
export function stripePaymentUrl(params: {
  paymentReference?: string | null;
  paymentIntentId?: string | null;
}): string | null {
  return (
    stripePaymentIntentUrl(params.paymentIntentId) ??
    stripeCheckoutSessionUrl(params.paymentReference) ??
    null
  );
}

export function stripeDashboardHomeUrl(testMode = false): string {
  return stripeDashboardBase(testMode);
}

export function paymentStatusLabel(status: string): string {
  if (status === 'pending') return 'Unpaid';
  if (status === 'paid' || status === 'succeeded') return 'Paid';
  if (status === 'failed') return 'Failed';
  if (status === 'refunded') return 'Refunded';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

export function formatPaymentMethodLabel(
  label: string | null | undefined,
  status: string,
): string {
  if (label?.trim()) return label.trim();
  if (status === 'pending') return '-';
  if (status === 'paid' || status === 'succeeded') return 'Paid with Stripe';
  return '-';
}
