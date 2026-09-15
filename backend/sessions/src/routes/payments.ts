import type { FastifyInstance, FastifyRequest } from 'fastify';
import Stripe from 'stripe';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { sendOrderPlacedEmailForOrder } from '../lib/send-order-placed-email.js';
import { fetchPaymentDetails } from '../lib/stripe-payment-details.js';
import {
  computeShopTotalCents,
  getCatalogItem,
  resolveCatalogItemId,
  type FulfillmentMethod,
  type PricedLineItem,
} from '../lib/shop-catalog.js';
import { prisma } from '../prisma.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_RETURN_URL =
  /^(exp:\/\/|nonprofitmobileapp:\/\/|https:\/\/)[^\s]+$/i;

type ShopCheckoutBody = {
  items?: { id?: string; quantity?: number }[];
  donationCents?: number | null;
  fulfillmentMethod?: string;
  shipping?: {
    fullName?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  successUrl?: string;
  cancelUrl?: string;
};

type DonateCheckoutBody = {
  amountCents?: number;
  successUrl?: string;
  cancelUrl?: string;
};

type RawBodyRequest = FastifyRequest & { rawBody?: Buffer };

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function isAllowedReturnUrl(url: string): boolean {
  return ALLOWED_RETURN_URL.test(url.trim());
}

function appendQueryParam(baseUrl: string, key: string, value: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function normalizeFulfillmentMethod(value: string | undefined): FulfillmentMethod {
  if (value === 'office_pickup' || value === 'local_dropoff' || value === 'usps_ship') {
    return value;
  }
  return 'usps_ship';
}

function buildStripeLineItems(params: {
  items: PricedLineItem[];
  donationCents: number;
  taxCents: number;
  shippingCents: number;
}): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((item) => ({
    price_data: {
      currency: 'usd',
      unit_amount: item.unitCents,
      product_data: { name: item.name },
    },
    quantity: item.quantity,
  }));

  if (params.donationCents > 0) {
    lines.push({
      price_data: {
        currency: 'usd',
        unit_amount: params.donationCents,
        product_data: { name: 'Donation' },
      },
      quantity: 1,
    });
  }

  if (params.taxCents > 0) {
    lines.push({
      price_data: {
        currency: 'usd',
        unit_amount: params.taxCents,
        product_data: { name: 'Taxes' },
      },
      quantity: 1,
    });
  }

  if (params.shippingCents > 0) {
    lines.push({
      price_data: {
        currency: 'usd',
        unit_amount: params.shippingCents,
        product_data: { name: 'USPS Shipping' },
      },
      quantity: 1,
    });
  }

  return lines;
}

function orderItemsJson(
  items: PricedLineItem[],
  donationCents: number,
): unknown {
  const json: {
    id: string;
    name: string;
    description: string;
    qty: number;
    quantity: number;
    unitCents: number;
    unit_cents: number;
  }[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.name,
    qty: item.quantity,
    quantity: item.quantity,
    unitCents: item.unitCents,
    unit_cents: item.unitCents,
  }));

  if (donationCents > 0) {
    json.push({
      id: 'donation',
      name: 'Donation',
      description: 'Support our cleanup efforts',
      qty: 1,
      quantity: 1,
      unitCents: donationCents,
      unit_cents: donationCents,
    });
  }

  return json;
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const kind = session.metadata?.kind;
  const referenceId = session.metadata?.referenceId;
  const userId = session.metadata?.userId;
  const paymentReference = session.id;
  const { paymentMethodLabel, paymentIntentId } = await fetchPaymentDetails(stripe, session.id);

  if (!kind || !referenceId || !userId || !UUID_RE.test(referenceId)) {
    console.warn('[stripe-webhook] missing metadata on completed session', session.id);
    return;
  }

  if (kind === 'shop') {
    const updated = await prisma.$executeRaw`
      UPDATE public.shop_orders
      SET status = 'paid',
          payment_reference = ${paymentReference},
          payment_method_label = ${paymentMethodLabel},
          stripe_payment_intent_id = ${paymentIntentId},
          updated_at = now()
      WHERE id = ${referenceId}::uuid
        AND user_id = ${userId}::uuid
        AND status = 'pending'
    `;
    if (updated === 0) {
      console.warn('[stripe-webhook] shop order not updated (already paid or missing)', referenceId);
      return;
    }
    await sendOrderPlacedEmailForOrder(referenceId, userId);
    return;
  }

  if (kind === 'donation') {
    await prisma.$executeRaw`
      UPDATE public.donations
      SET status = 'succeeded',
          payment_reference = ${paymentReference},
          payment_method_label = ${paymentMethodLabel},
          stripe_payment_intent_id = ${paymentIntentId}
      WHERE id = ${referenceId}::uuid
        AND user_id = ${userId}::uuid
        AND status = 'pending'
    `;
  }
}

export async function registerPaymentRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/payments/shop-checkout',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const stripe = getStripe();
      if (!stripe) {
        return reply.code(503).send({ error: 'Payments not configured' });
      }

      const body = (request.body ?? {}) as ShopCheckoutBody;
      const auth = request as AuthenticatedRequest;

      const successUrl = typeof body.successUrl === 'string' ? body.successUrl.trim() : '';
      const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl.trim() : '';
      if (!isAllowedReturnUrl(successUrl) || !isAllowedReturnUrl(cancelUrl)) {
        return reply.code(400).send({ error: 'Invalid successUrl or cancelUrl' });
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0) {
        return reply.code(400).send({ error: 'At least one item is required' });
      }

      const pricedItems: PricedLineItem[] = [];
      for (const raw of rawItems) {
        const rawId = typeof raw.id === 'string' ? raw.id : '';
        const catalogId = resolveCatalogItemId(rawId);
        if (!catalogId) {
          return reply.code(400).send({ error: `Unknown product id: ${rawId}` });
        }
        const qty = typeof raw.quantity === 'number' ? Math.floor(raw.quantity) : 1;
        if (qty < 1 || qty > 99) {
          return reply.code(400).send({ error: 'Invalid quantity' });
        }
        const catalog = getCatalogItem(catalogId);
        pricedItems.push({
          id: catalogId,
          name: catalog.label,
          quantity: qty,
          unitCents: catalog.unitCents,
        });
      }

      const fulfillmentMethod = normalizeFulfillmentMethod(body.fulfillmentMethod);
      let donationCents = typeof body.donationCents === 'number' ? Math.round(body.donationCents) : 0;
      if (donationCents < 0) donationCents = 0;

      if (fulfillmentMethod === 'usps_ship') {
        const shipping = body.shipping;
        if (
          !shipping?.fullName?.trim() ||
          !shipping?.street?.trim() ||
          !shipping?.city?.trim() ||
          !shipping?.state?.trim() ||
          !shipping?.zip?.trim()
        ) {
          return reply.code(400).send({ error: 'Shipping address is required for USPS ship' });
        }
      }

      const { taxCents, shippingCents, totalCents } = computeShopTotalCents({
        items: pricedItems,
        donationCents,
        fulfillmentMethod,
      });

      const includesKit = pricedItems.some((item) => item.id === 'cleanup-kit');

      const shippingPayload =
        fulfillmentMethod === 'usps_ship' && body.shipping
          ? {
              name: body.shipping.fullName!.trim(),
              line1: body.shipping.street!.trim(),
              line2: null,
              city: body.shipping.city!.trim(),
              state: body.shipping.state!.trim(),
              postalCode: body.shipping.zip!.trim(),
              postal_code: body.shipping.zip!.trim(),
              zip: body.shipping.zip!.trim(),
              country: 'US',
              phone: null,
            }
          : null;

      const itemsJson = orderItemsJson(pricedItems, donationCents);

      const inserted = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO public.shop_orders (
          user_id, items, total_cents, status, fulfillment_method, includes_kit, shipping_address
        )
        VALUES (
          ${auth.userId}::uuid,
          ${JSON.stringify(itemsJson)}::jsonb,
          ${totalCents},
          'pending',
          ${fulfillmentMethod},
          ${includesKit},
          ${shippingPayload ? JSON.stringify(shippingPayload) : null}::jsonb
        )
        RETURNING id
      `;
      const orderId = inserted[0]?.id;
      if (!orderId) {
        return reply.code(500).send({ error: 'Failed to create order' });
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: buildStripeLineItems({
          items: pricedItems,
          donationCents,
          taxCents,
          shippingCents,
        }),
        success_url: appendQueryParam(successUrl, 'orderId', orderId),
        cancel_url: cancelUrl,
        client_reference_id: orderId,
        metadata: {
          kind: 'shop',
          referenceId: orderId,
          userId: auth.userId,
        },
      });

      if (!session.url) {
        return reply.code(502).send({ error: 'Stripe did not return a checkout URL' });
      }

      return reply.send({
        url: session.url,
        orderId,
        sessionId: session.id,
      });
    },
  );

  app.post(
    '/payments/donate-checkout',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const stripe = getStripe();
      if (!stripe) {
        return reply.code(503).send({ error: 'Payments not configured' });
      }

      const body = (request.body ?? {}) as DonateCheckoutBody;
      const auth = request as AuthenticatedRequest;

      const successUrl = typeof body.successUrl === 'string' ? body.successUrl.trim() : '';
      const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl.trim() : '';
      if (!isAllowedReturnUrl(successUrl) || !isAllowedReturnUrl(cancelUrl)) {
        return reply.code(400).send({ error: 'Invalid successUrl or cancelUrl' });
      }

      const amountCents = typeof body.amountCents === 'number' ? Math.round(body.amountCents) : 0;
      if (amountCents < 100 || amountCents > 1_000_000) {
        return reply.code(400).send({ error: 'amountCents must be between 100 and 1000000' });
      }

      const donorEmail = auth.email?.trim() || null;

      const inserted = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO public.donations (user_id, amount_cents, donor_email, status)
        VALUES (
          ${auth.userId}::uuid,
          ${amountCents},
          ${donorEmail},
          'pending'
        )
        RETURNING id
      `;
      const donationId = inserted[0]?.id;
      if (!donationId) {
        return reply.code(500).send({ error: 'Failed to create donation' });
      }

      const amountLabel = (amountCents / 100).toFixed(2);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: { name: 'Donation to Clean Up Give Back' },
            },
            quantity: 1,
          },
        ],
        success_url: appendQueryParam(
          appendQueryParam(
            appendQueryParam(successUrl, 'mode', 'donation'),
            'amount',
            amountLabel,
          ),
          'donationId',
          donationId,
        ),
        cancel_url: cancelUrl,
        client_reference_id: donationId,
        metadata: {
          kind: 'donation',
          referenceId: donationId,
          userId: auth.userId,
        },
      });

      if (!session.url) {
        return reply.code(502).send({ error: 'Stripe did not return a checkout URL' });
      }

      return reply.send({
        url: session.url,
        donationId,
        sessionId: session.id,
      });
    },
  );

  app.post('/webhooks/stripe', async (request, reply) => {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) {
      return reply.code(503).send({ error: 'Webhook not configured' });
    }

    const signature = request.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      return reply.code(400).send({ error: 'Missing Stripe-Signature header' });
    }

    const rawBody = (request as RawBodyRequest).rawBody;
    if (!rawBody) {
      return reply.code(400).send({ error: 'Missing raw body' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      request.log.warn({ err }, 'Stripe webhook signature verification failed');
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await handleCheckoutCompleted(stripe, session);
      }
    }

    return reply.send({ received: true });
  });
}
