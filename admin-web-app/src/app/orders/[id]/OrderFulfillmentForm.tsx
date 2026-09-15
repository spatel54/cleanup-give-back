'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { updateOrderFulfillment } from '@/actions/orders';
import {
  normalizeOrderStatus,
  type FulfillmentMethod,
  type OrderStatus,
} from '@/lib/mock-data';

type OrderFulfillmentFormProps = {
  orderId: string;
  fulfillmentMethod: FulfillmentMethod;
  currentStatus: OrderStatus;
  currentTracking: string | null;
  currentCarrier: string | null;
};

const SHIP_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PICKUP_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrderFulfillmentForm({
  orderId,
  fulfillmentMethod,
  currentStatus,
  currentTracking,
  currentCarrier,
}: OrderFulfillmentFormProps) {
  const isShip = fulfillmentMethod === 'usps_ship';
  const statusOptions = isShip ? SHIP_STATUS_OPTIONS : PICKUP_STATUS_OPTIONS;
  const [status, setStatus] = useState<OrderStatus>(normalizeOrderStatus(currentStatus));
  const [tracking, setTracking] = useState(currentTracking ?? '');
  const [carrier, setCarrier] = useState(currentCarrier ?? (isShip ? 'USPS' : ''));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isShip && status === 'shipped' && !tracking.trim()) {
      setError('Add a USPS tracking number before marking this order shipped.');
      return;
    }

    startTransition(async () => {
      try {
        await updateOrderFulfillment({
          orderId,
          status,
          trackingNumber: isShip ? tracking.trim() || undefined : undefined,
          carrier: isShip ? (carrier.trim() || 'USPS') : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order');
      }
    });
  };

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-xl">
      <h3 className="font-heading text-[16px] leading-[24px] text-text-primary mb-md">
        Update order status
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div>
          <label htmlFor="status" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
            Status *
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            required
            className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {isShip ? (
          <>
            <div>
              <label htmlFor="carrier" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                Carrier
              </label>
              <select
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="USPS">USPS</option>
              </select>
            </div>
            <div>
              <label htmlFor="tracking" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                Tracking Number
              </label>
              <input
                id="tracking"
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="9400111202550035000000"
                className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </>
        ) : (
          <p className="font-body text-[13px] text-text-tertiary">
            Pickup and local drop-off do not need a carrier or tracking number. Mark
            Fulfilled when Admin has handed the order off.
          </p>
        )}
        {error && (
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-md py-sm rounded-sm font-body text-[13px]">
            {error}
          </div>
        )}
        <div>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
