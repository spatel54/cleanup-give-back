import { formatPhotoTimeLabel, formatSessionDateLabel } from '@/features/session-tracking/utils/sessionFormat';
import type { DonationRow } from '@/lib/donations';
import { formatLivePaymentMethod } from './purchaseConfirmation';

export type DonationHistoryItem = {
  id: string;
  /** Local calendar day, e.g. `June 3, 2026`. */
  dateLabel: string;
  /** Local time of donation, e.g. `10:15 AM`. */
  timeLabel: string;
  amountLabel: string;
  statusLabel: string;
  paymentMethodLabel: string;
  /** When true, show the email receipt chip (mock fixtures only). */
  showEmailChip?: boolean;
  /** Optional source timestamp for live/API rows. */
  donatedAtMs?: number;
};

export function mapDonationToHistoryItem(row: DonationRow): DonationHistoryItem {
  const donatedAtMs = new Date(row.created_at).getTime();
  return {
    id: row.id,
    donatedAtMs,
    dateLabel: formatSessionDateLabel(donatedAtMs),
    timeLabel: formatPhotoTimeLabel(donatedAtMs),
    amountLabel: `$${(row.amount_cents / 100).toFixed(2)}`,
    statusLabel: row.status === 'succeeded' ? 'Completed' : row.status === 'pending' ? 'Pending' : row.status,
    paymentMethodLabel: formatLivePaymentMethod(row.payment_method_label, row.status),
    showEmailChip: false,
  };
}

/** Mock donations for Donation History (Figma `donation_history`, node `854:205`). */
export const defaultDonationHistory: DonationHistoryItem[] = [
  {
    id: 'don-2026-06-03',
    donatedAtMs: new Date('2026-06-03T10:15:00').getTime(),
    dateLabel: 'June 3, 2026',
    timeLabel: '10:15 AM',
    amountLabel: '$25.00',
    statusLabel: 'Completed',
    paymentMethodLabel: 'Visa •••• 4242',
    showEmailChip: true,
  },
  {
    id: 'don-2026-04-15',
    donatedAtMs: new Date('2026-04-15T18:42:00').getTime(),
    dateLabel: 'April 15, 2026',
    timeLabel: '6:42 PM',
    amountLabel: '$10.00',
    statusLabel: 'Completed',
    paymentMethodLabel: 'Visa •••• 4242',
    showEmailChip: true,
  },
];
