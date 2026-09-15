import {
  carrierTrackingUrl,
  RECEIVING_METHOD_LABELS,
  type FulfillmentMethod,
  type ShopOrderRow,
} from '@/lib/shopOrders';
import { formatLivePaymentMethod } from './purchaseConfirmation';
import {
  formatPhotoTimeLabel,
  formatSessionDateLabel,
} from '@/features/session-tracking/utils/sessionFormat';

export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  dateLabel: string;
  timeLabel: string;
  productName: string;
  priceLabel: string;
  statusLabel: string;
  receivingLabel: string;
  paymentMethodLabel?: string | null;
  trackingUrl: string | null;
  muted?: boolean;
};

function formatOrderTimestamp(iso: string): { dateLabel: string; timeLabel: string } {
  const orderedAtMs = new Date(iso).getTime();
  if (Number.isNaN(orderedAtMs)) {
    return { dateLabel: iso, timeLabel: '' };
  }
  return {
    dateLabel: formatSessionDateLabel(orderedAtMs),
    timeLabel: formatPhotoTimeLabel(orderedAtMs),
  };
}

function statusLabel(status: string): string {
  if (status === 'delivered' || status === 'shipped') return 'Shipped';
  if (status === 'fulfilled') return 'Fulfilled';
  if (status === 'paid') return 'Paid';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function productNameFromItems(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return 'Order';
  const first = items[0] as { name?: string } | null;
  const name = first && typeof first === 'object' ? String(first.name ?? 'Item') : 'Item';
  return items.length > 1 ? `${name} + ${items.length - 1} more` : name;
}

export function mapShopOrderToHistoryItem(row: ShopOrderRow): OrderHistoryItem {
  const method: FulfillmentMethod = row.fulfillment_method;
  const canTrack = method === 'usps_ship';
  const { dateLabel, timeLabel } = formatOrderTimestamp(row.created_at);
  return {
    id: row.id,
    orderNumber: `ORDER #${row.id.slice(0, 8).toUpperCase()}`,
    dateLabel,
    timeLabel,
    productName: productNameFromItems(row.items),
    priceLabel: `$${(row.total_cents / 100).toFixed(2)}`,
    statusLabel: statusLabel(row.status),
    receivingLabel: row.includes_kit
      ? RECEIVING_METHOD_LABELS[method]
      : `${RECEIVING_METHOD_LABELS[method]} · no kit`,
    paymentMethodLabel: formatLivePaymentMethod(row.payment_method_label, row.status),
    trackingUrl: canTrack ? carrierTrackingUrl(row.carrier, row.tracking_number) : null,
    muted: row.status === 'cancelled',
  };
}

/** Mock orders for Order History (Figma `order_history`, node `854:116`). */
export const defaultOrderHistory: OrderHistoryItem[] = [
  {
    id: 'ord-49201',
    orderNumber: 'ORDER #49201',
    dateLabel: 'October 12, 2023',
    timeLabel: '2:14 PM',
    productName: 'Trash Clean-up Kit',
    priceLabel: '$29.99',
    statusLabel: 'Shipped',
    receivingLabel: 'USPS ship',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111202550035000000',
  },
  {
    id: 'ord-48892',
    orderNumber: 'ORDER #48892',
    dateLabel: 'September 28, 2023',
    timeLabel: '11:30 AM',
    productName: 'Heavy Duty Gloves (Pair)',
    priceLabel: '$23.99',
    statusLabel: 'Fulfilled',
    receivingLabel: 'Office pickup',
    trackingUrl: null,
  },
  {
    id: 'ord-47105',
    orderNumber: 'ORDER #47105',
    dateLabel: 'July 05, 2023',
    timeLabel: '4:05 PM',
    productName: 'Tote Bags',
    priceLabel: '$3.00',
    statusLabel: 'Cancelled',
    receivingLabel: 'USPS ship',
    trackingUrl: null,
    muted: true,
  },
];
