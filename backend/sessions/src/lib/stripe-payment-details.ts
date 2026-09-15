import type Stripe from 'stripe';

const BRAND_LABELS: Record<string, string> = {
  amex: 'Amex',
  diners: 'Diners Club',
  discover: 'Discover',
  jcb: 'JCB',
  mastercard: 'Mastercard',
  unionpay: 'UnionPay',
  visa: 'Visa',
};

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatCardLabel(brand: string | null | undefined, last4: string | null | undefined): string {
  const normalizedBrand = brand?.trim().toLowerCase() ?? '';
  const brandLabel = BRAND_LABELS[normalizedBrand] ?? (normalizedBrand ? titleCase(normalizedBrand) : 'Card');
  if (last4?.trim()) {
    return `${brandLabel} •••• ${last4.trim()}`;
  }
  return brandLabel;
}

function formatWalletLabel(walletType: string | null | undefined): string | null {
  if (!walletType) return null;
  const normalized = walletType.trim().toLowerCase();
  if (normalized === 'apple_pay') return 'Apple Pay';
  if (normalized === 'google_pay') return 'Google Pay';
  if (normalized === 'link') return 'Link';
  return titleCase(normalized.replace(/_/g, ' '));
}

export type StripePaymentDetails = {
  paymentMethodLabel: string;
  paymentIntentId: string | null;
};

export function extractPaymentDetailsFromSession(
  session: Stripe.Checkout.Session,
): StripePaymentDetails {
  const paymentIntent = session.payment_intent;
  let paymentIntentId: string | null = null;
  let paymentMethod: Stripe.PaymentMethod | null = null;

  if (typeof paymentIntent === 'string') {
    paymentIntentId = paymentIntent;
  } else if (paymentIntent && typeof paymentIntent === 'object') {
    paymentIntentId = paymentIntent.id ?? null;
    const pm = paymentIntent.payment_method;
    if (pm && typeof pm === 'object') {
      paymentMethod = pm;
    }
  }

  if (paymentMethod?.type === 'card' && paymentMethod.card) {
    return {
      paymentMethodLabel: formatCardLabel(paymentMethod.card.brand, paymentMethod.card.last4),
      paymentIntentId,
    };
  }

  const walletLabel = formatWalletLabel(paymentMethod?.card?.wallet?.type ?? null);
  if (walletLabel) {
    return { paymentMethodLabel: walletLabel, paymentIntentId };
  }

  const methodTypes = session.payment_method_types ?? [];
  if (methodTypes.includes('link')) {
    return { paymentMethodLabel: 'Link', paymentIntentId };
  }

  return { paymentMethodLabel: 'Card (Stripe Checkout)', paymentIntentId };
}

export async function fetchPaymentDetails(
  stripe: Stripe,
  sessionId: string,
): Promise<StripePaymentDetails> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.payment_method'],
    });
    return extractPaymentDetailsFromSession(session);
  } catch (err) {
    console.warn('[stripe-payment-details] failed to retrieve session', sessionId, err);
    return { paymentMethodLabel: 'Card (Stripe Checkout)', paymentIntentId: null };
  }
}
