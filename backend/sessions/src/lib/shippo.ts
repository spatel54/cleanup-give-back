const SHIPPO_API = 'https://api.goshippo.com';
const SHIPPO_API_VERSION = '2018-02-08';

export class ShippoError extends Error {
  readonly statusCode: number;
  readonly details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ShippoError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isShippoTestMode(): boolean {
  const token = process.env.SHIPPO_API_TOKEN ?? '';
  return token.startsWith('shippo_test_');
}

function getToken(): string {
  const token = process.env.SHIPPO_API_TOKEN?.trim();
  if (!token) {
    throw new ShippoError('SHIPPO_API_TOKEN is not set', 503);
  }
  return token;
}

async function shippoFetch<T>(path: string, init: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${SHIPPO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `ShippoToken ${token}`,
      'Content-Type': 'application/json',
      'Shippo-API-Version': SHIPPO_API_VERSION,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    const message = shippoMessage(json) || `Shippo request failed (${response.status})`;
    throw new ShippoError(message, response.status >= 500 ? 502 : 400, json);
  }

  return json as T;
}

function shippoMessage(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const record = json as { detail?: unknown; messages?: unknown };
  if (typeof record.detail === 'string' && record.detail.trim()) return record.detail;
  if (Array.isArray(record.messages)) {
    const parts = record.messages
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object' && 'text' in entry) {
          return String((entry as { text: unknown }).text);
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  return null;
}

export type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

export type ShippoParcel = {
  length: string;
  width: string;
  height: string;
  distance_unit: 'in';
  weight: string;
  mass_unit: 'lb';
};

export type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  estimated_days?: number | null;
  servicelevel?: { name?: string; token?: string };
};

export type ShippoShipment = {
  object_id: string;
  status?: string;
  rates?: ShippoRate[];
  messages?: unknown;
};

export type ShippoTransaction = {
  object_id: string;
  status?: string;
  tracking_number?: string | null;
  tracking_url_provider?: string | null;
  label_url?: string | null;
  /** Some Shippo responses nest the printable file here. */
  label_file?: string | null;
  tracking_status?: string | null;
  rate?: string | { object_id?: string };
  messages?: unknown;
};

export function labelUrlFromTransaction(transaction: ShippoTransaction): string | null {
  const direct = transaction.label_url?.trim();
  if (direct) return direct;
  const file = transaction.label_file?.trim();
  if (file) return file;
  return null;
}

export function transactionMessage(transaction: ShippoTransaction): string | null {
  if (!Array.isArray(transaction.messages)) return null;
  const parts = transaction.messages
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object' && 'text' in entry) {
        return String((entry as { text: unknown }).text);
      }
      return '';
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export async function getTransaction(transactionId: string): Promise<ShippoTransaction> {
  return shippoFetch<ShippoTransaction>(`/transactions/${encodeURIComponent(transactionId)}/`, {
    method: 'GET',
  });
}

export async function createShipment(params: {
  addressFrom: ShippoAddress;
  addressTo: ShippoAddress;
  parcel: ShippoParcel;
}): Promise<ShippoShipment> {
  return shippoFetch<ShippoShipment>('/shipments/', {
    method: 'POST',
    body: JSON.stringify({
      address_from: params.addressFrom,
      address_to: params.addressTo,
      parcels: [params.parcel],
      async: false,
    }),
  });
}

export async function buyTransaction(rateId: string): Promise<ShippoTransaction> {
  return shippoFetch<ShippoTransaction>('/transactions/', {
    method: 'POST',
    body: JSON.stringify({
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    }),
  });
}

export function uspsRates(rates: ShippoRate[] | undefined): ShippoRate[] {
  return (rates ?? [])
    .filter((rate) => rate.provider?.toUpperCase() === 'USPS' && Boolean(rate.object_id))
    .sort((a, b) => Number.parseFloat(a.amount) - Number.parseFloat(b.amount));
}
