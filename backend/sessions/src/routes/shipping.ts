import type { FastifyInstance } from 'fastify';

import { verifyAdminKey } from '../auth.js';
import { pickParcel } from '../lib/parcels.js';
import { prisma } from '../prisma.js';
import { getShipFromAddress } from '../lib/ship-from.js';
import {
  ShippoError,
  buyTransaction,
  createShipment,
  getTransaction,
  isShippoTestMode,
  labelUrlFromTransaction,
  transactionMessage,
  uspsRates,
  type ShippoAddress,
} from '../lib/shippo.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RatesBody = { orderId?: string };
type BuyBody = { orderId?: string; rateId?: string };

type ShopOrderShippingRow = {
  id: string;
  status: string;
  fulfillment_method: string;
  includes_kit: boolean;
  items: unknown;
  shipping_address: unknown;
  tracking_number: string | null;
  carrier: string | null;
  shippo_transaction_id: string | null;
  shippo_rate_id: string | null;
  label_url: string | null;
  tracking_status: string | null;
};

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return '';
}

function toAddress(shippingAddress: unknown): ShippoAddress | null {
  const record = asRecord(shippingAddress);
  if (!record) return null;
  const name = stringField(record, 'name', 'fullName', 'full_name');
  const street1 = stringField(record, 'line1', 'street', 'address');
  const city = stringField(record, 'city');
  const state = stringField(record, 'state');
  const zip = stringField(record, 'postalCode', 'postal_code', 'zip');
  if (!name || !street1 || !city || !state || !zip) return null;
  const street2 = stringField(record, 'line2', 'street2');
  const phone = stringField(record, 'phone');
  return {
    name,
    street1,
    ...(street2 ? { street2 } : {}),
    city,
    state,
    zip,
    country: stringField(record, 'country') || 'US',
    ...(phone ? { phone } : {}),
  };
}

async function loadOrder(orderId: string): Promise<ShopOrderShippingRow | null> {
  const rows = await prisma.$queryRaw<ShopOrderShippingRow[]>`
    SELECT
      id::text,
      status,
      fulfillment_method,
      includes_kit,
      items,
      shipping_address,
      tracking_number,
      carrier,
      shippo_transaction_id,
      shippo_rate_id,
      label_url,
      tracking_status
    FROM public.shop_orders
    WHERE id = ${orderId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function requireShipFromPhone(): ReturnType<typeof getShipFromAddress> {
  const from = getShipFromAddress();
  if (!from.phone) {
    throw new ShippoError(
      'Set SHIP_FROM_PHONE on Fly (carrier labels require a from-address phone).',
      503,
    );
  }
  return from;
}

function assertShippable(order: ShopOrderShippingRow): ShippoAddress {
  if (order.fulfillment_method !== 'usps_ship') {
    throw new ShippoError('Shippo labels are only for USPS ship orders.', 400);
  }
  const addressTo = toAddress(order.shipping_address);
  if (!addressTo) {
    throw new ShippoError('This order is missing a complete ship-to address.', 400);
  }
  return addressTo;
}

function webhookToken(query: unknown, headerValue: unknown): string | null {
  const record = asRecord(query);
  const fromQuery = record && typeof record.token === 'string' ? record.token.trim() : '';
  const fromHeader = typeof headerValue === 'string' ? headerValue.trim() : '';
  return fromQuery || fromHeader || null;
}

function trackingStatusFromPayload(data: Record<string, unknown>): string | null {
  const nested = asRecord(data.tracking_status);
  if (nested && typeof nested.status === 'string') return nested.status.toUpperCase();
  if (typeof data.tracking_status === 'string') return data.tracking_status.toUpperCase();
  if (typeof data.status === 'string') return data.status.toUpperCase();
  return null;
}

export async function registerShippingRoutes(app: FastifyInstance) {
  app.post<{ Body: RatesBody }>(
    '/shipping/rates',
    { preHandler: verifyAdminKey },
    async (request, reply) => {
      try {
        const orderId = request.body?.orderId?.trim() ?? '';
        if (!isUuid(orderId)) {
          return reply.code(400).send({ error: 'Valid orderId is required' });
        }

        const order = await loadOrder(orderId);
        if (!order) {
          return reply.code(404).send({ error: 'Order not found' });
        }
        if (order.status !== 'paid' && order.status !== 'shipped') {
          return reply.code(400).send({ error: 'Buy a label only after Stripe marks the order paid.' });
        }

        const addressTo = assertShippable(order);
        const from = requireShipFromPhone();
        const { kind, parcel } = pickParcel(order.includes_kit, order.items);
        const shipment = await createShipment({
          addressFrom: {
            name: from.name,
            street1: from.street1,
            city: from.city,
            state: from.state,
            zip: from.zip,
            country: from.country,
            phone: from.phone,
            email: from.email,
          },
          addressTo,
          parcel,
        });
        const rates = uspsRates(shipment.rates).map((rate) => ({
          id: rate.object_id,
          amount: rate.amount,
          currency: rate.currency || 'USD',
          service: rate.servicelevel?.name || rate.servicelevel?.token || 'USPS',
          estimatedDays: rate.estimated_days ?? null,
        }));
        if (rates.length === 0) {
          return reply.code(422).send({
            error: 'Shippo returned no USPS rates for this address and box.',
            messages: shipment.messages ?? null,
          });
        }
        return reply.send({
          testMode: isShippoTestMode(),
          parcel: { kind, ...parcel },
          rates,
        });
      } catch (error) {
        if (error instanceof ShippoError) {
          return reply.code(error.statusCode).send({ error: error.message, details: error.details });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch shipping rates' });
      }
    },
  );

  app.post<{ Body: BuyBody }>(
    '/shipping/buy-label',
    { preHandler: verifyAdminKey },
    async (request, reply) => {
      try {
        const orderId = request.body?.orderId?.trim() ?? '';
        const rateId = request.body?.rateId?.trim() ?? '';
        if (!isUuid(orderId) || !rateId) {
          return reply.code(400).send({ error: 'orderId and rateId are required' });
        }

        const order = await loadOrder(orderId);
        if (!order) {
          return reply.code(404).send({ error: 'Order not found' });
        }
        if (order.status !== 'paid') {
          return reply.code(400).send({
            error: 'Buy a label only while the order is paid (before marking shipped).',
          });
        }
        assertShippable(order);
        if (order.shippo_transaction_id) {
          return reply.code(409).send({
            error: 'A Shippo label already exists for this order.',
            labelUrl: order.label_url,
            trackingNumber: order.tracking_number,
            transactionId: order.shippo_transaction_id,
          });
        }

        requireShipFromPhone();
        let transaction = await buyTransaction(rateId);
        if (transaction.status && transaction.status !== 'SUCCESS' && transaction.status !== 'QUEUED') {
          return reply.code(502).send({
            error: `Shippo did not purchase the label (${transaction.status}).`,
            messages: transaction.messages ?? null,
          });
        }

        let labelUrl = labelUrlFromTransaction(transaction);
        if (!labelUrl && transaction.object_id) {
          transaction = await getTransaction(transaction.object_id);
          labelUrl = labelUrlFromTransaction(transaction);
        }

        const trackingNumber = transaction.tracking_number?.trim() || null;
        const transactionId = transaction.object_id;
        const rawTrackingStatus = transaction.tracking_status?.toString().trim() || '';
        const trackingStatus =
          !rawTrackingStatus || rawTrackingStatus.toUpperCase() === 'UNKNOWN'
            ? 'PENDING'
            : rawTrackingStatus.toUpperCase();

        await prisma.$executeRaw`
          UPDATE public.shop_orders
          SET
            tracking_number = ${trackingNumber},
            carrier = 'USPS',
            shippo_transaction_id = ${transactionId},
            shippo_rate_id = ${rateId},
            label_url = ${labelUrl},
            tracking_status = ${trackingStatus},
            updated_at = now()
          WHERE id = ${orderId}::uuid
        `;

        return reply.send({
          testMode: isShippoTestMode(),
          trackingNumber,
          carrier: 'USPS',
          labelUrl,
          transactionId,
          trackingStatus,
        });
      } catch (error) {
        if (error instanceof ShippoError) {
          return reply.code(error.statusCode).send({ error: error.message, details: error.details });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to buy shipping label' });
      }
    },
  );

  app.post<{ Body: RatesBody }>(
    '/shipping/refresh-label',
    { preHandler: verifyAdminKey },
    async (request, reply) => {
      try {
        const orderId = request.body?.orderId?.trim() ?? '';
        if (!isUuid(orderId)) {
          return reply.code(400).send({ error: 'Valid orderId is required' });
        }

        const order = await loadOrder(orderId);
        if (!order) {
          return reply.code(404).send({ error: 'Order not found' });
        }
        if (!order.shippo_transaction_id) {
          return reply.code(400).send({ error: 'No Shippo label on this order yet.' });
        }

        const transaction = await getTransaction(order.shippo_transaction_id);
        const labelUrl = labelUrlFromTransaction(transaction);
        if (!labelUrl) {
          const shippoMessage = transactionMessage(transaction);
          return reply.code(422).send({
            error:
              shippoMessage ||
              'Shippo has not published a label PDF for this transaction yet.',
            transactionStatus: transaction.status ?? null,
          });
        }

        await prisma.$executeRaw`
          UPDATE public.shop_orders
          SET label_url = ${labelUrl}, updated_at = now()
          WHERE id = ${orderId}::uuid
        `;

        return reply.send({ labelUrl, transactionId: order.shippo_transaction_id });
      } catch (error) {
        if (error instanceof ShippoError) {
          return reply.code(error.statusCode).send({ error: error.message, details: error.details });
        }
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to refresh label URL' });
      }
    },
  );

  app.post('/webhooks/shippo', async (request, reply) => {
    const secret = process.env.SHIPPO_WEBHOOK_SECRET?.trim();
    if (!secret) {
      return reply.code(503).send({ error: 'SHIPPO_WEBHOOK_SECRET is not set' });
    }
    const provided = webhookToken(request.query, request.headers['x-shippo-token']);
    if (!provided || provided !== secret) {
      return reply.code(401).send({ error: 'Invalid webhook token' });
    }

    const body = asRecord(request.body) ?? {};
    const event = typeof body.event === 'string' ? body.event : '';
    const data = asRecord(body.data) ?? body;
    const trackingNumber =
      stringField(data, 'tracking_number') ||
      stringField(asRecord(data.tracking) ?? {}, 'tracking_number') ||
      null;
    const transactionId =
      stringField(data, 'object_id', 'transaction') ||
      stringField(asRecord(data.transaction) ?? {}, 'object_id') ||
      null;
    const trackingStatus = trackingStatusFromPayload(data);

    if (event && event !== 'track_updated' && event !== 'transaction_created') {
      return reply.send({ received: true, ignored: event });
    }

    if (!trackingNumber && !transactionId) {
      return reply.send({ received: true, ignored: 'no tracking' });
    }

    const delivered = trackingStatus === 'DELIVERED';
    await prisma.$executeRaw`
      UPDATE public.shop_orders
      SET
        tracking_status = COALESCE(${trackingStatus}, tracking_status),
        status = CASE
          WHEN ${delivered} AND status = 'shipped' THEN 'delivered'
          ELSE status
        END,
        updated_at = now()
      WHERE
        (${trackingNumber}::text IS NOT NULL AND tracking_number = ${trackingNumber})
        OR (${transactionId}::text IS NOT NULL AND shippo_transaction_id = ${transactionId})
    `;

    return reply.send({ received: true });
  });
}
