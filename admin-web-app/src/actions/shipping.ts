'use server';

import { revalidatePath } from 'next/cache';
import { getAdminApiKey, getSessionsApiUrl } from '@/lib/sessionsApiConfig';
import { writeAuditLog } from '@/lib/audit';
import { createServiceClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ShippoRateOption = {
  id: string;
  amount: string;
  currency: string;
  service: string;
  estimatedDays: number | null;
};

export type ShippoRatesResult = {
  testMode: boolean;
  parcel: { kind: string; length: string; width: string; height: string; weight: string };
  rates: ShippoRateOption[];
};

export type ShippoBuyResult = {
  testMode: boolean;
  trackingNumber: string | null;
  carrier: string;
  labelUrl: string | null;
  transactionId: string;
  trackingStatus: string;
};

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin' };
  }
  return { id: 'web-app-admin' };
}

async function sessionsAdminPost<T>(path: string, body: unknown): Promise<T> {
  const apiUrl = getSessionsApiUrl();
  const adminKey = getAdminApiKey();
  if (!apiUrl || !adminKey) {
    throw new Error(
      'Sessions API is not configured. Set SESSIONS_API_URL and ADMIN_API_KEY (same as letterhead).',
    );
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { error: text };
  }

  if (!response.ok) {
    const record = json && typeof json === 'object' ? (json as { error?: unknown }) : null;
    const message =
      record && typeof record.error === 'string' ? record.error : `Shipping request failed (${response.status})`;
    throw new Error(message);
  }

  return json as T;
}

export async function fetchShippingRates(orderId: string): Promise<ShippoRatesResult> {
  if (!UUID_RE.test(orderId)) {
    throw new Error('Live shop orders are required to fetch Shippo rates.');
  }
  return sessionsAdminPost<ShippoRatesResult>('/shipping/rates', { orderId });
}

export async function refreshShippingLabel(orderId: string): Promise<{ labelUrl: string }> {
  if (!UUID_RE.test(orderId)) {
    throw new Error('Live shop orders are required to refresh the label link.');
  }
  const result = await sessionsAdminPost<{ labelUrl: string }>('/shipping/refresh-label', { orderId });
  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return result;
}

export async function buyShippingLabel(orderId: string, rateId: string): Promise<ShippoBuyResult> {
  if (!UUID_RE.test(orderId) || !rateId.trim()) {
    throw new Error('Order and rate are required to buy a label.');
  }

  const result = await sessionsAdminPost<ShippoBuyResult>('/shipping/buy-label', {
    orderId,
    rateId: rateId.trim(),
  });

  try {
    const user = await getAdminUser();
    const supabase = await createServiceClient();
    await writeAuditLog(supabase, {
      adminUserId: user.id,
      action: 'bought shipping label',
      targetTable: 'shop_orders',
      targetId: orderId,
      afterValue: {
        trackingNumber: result.trackingNumber,
        carrier: result.carrier,
        transactionId: result.transactionId,
      },
    });
  } catch (err) {
    console.error('[shipping] label purchased but audit log failed', err);
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return result;
}
