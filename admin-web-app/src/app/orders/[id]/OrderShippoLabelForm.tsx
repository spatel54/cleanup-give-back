'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  buyShippingLabel,
  fetchShippingRates,
  refreshShippingLabel,
  type ShippoRateOption,
} from '@/actions/shipping';
import type { OrderStatus } from '@/lib/mock-data';
import { formatTrackingStatusLabel } from '@/lib/tracking-status';

const SHIPPO_SITE_URL = 'https://apps.goshippo.com';

const linkButtonBase =
  'inline-flex items-center justify-center gap-sm rounded-sm border min-h-11 min-w-11 h-9 px-md text-sm font-data font-semibold transition-all duration-[160ms] active:scale-[0.97]';

function TrackingStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm border font-data text-[11px] font-semibold leading-[16px] tracking-[0.4px] whitespace-nowrap bg-bg-surface-elevated text-text-tertiary border-border-outline">
      {formatTrackingStatusLabel(status)}
    </span>
  );
}

function ShippoSiteLink() {
  return (
    <a
      href={SHIPPO_SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${linkButtonBase} bg-transparent text-text-tertiary border-transparent hover:bg-bg-surface-elevated`}
    >
      Go to Shippo
    </a>
  );
}

type OrderShippoLabelFormProps = {
  orderId: string;
  currentStatus: OrderStatus;
  labelUrl: string | null;
  trackingStatus: string | null;
  hasShippoTransaction: boolean;
};

function formatRate(rate: ShippoRateOption): string {
  const amount = Number.parseFloat(rate.amount);
  const price = Number.isFinite(amount)
    ? amount.toLocaleString('en-US', { style: 'currency', currency: rate.currency || 'USD' })
    : `${rate.currency} ${rate.amount}`;
  const days =
    rate.estimatedDays != null ? ` · ${rate.estimatedDays} day${rate.estimatedDays === 1 ? '' : 's'}` : '';
  return `${rate.service} - ${price}${days}`;
}

export function OrderShippoLabelForm({
  orderId,
  currentStatus,
  labelUrl,
  trackingStatus,
  hasShippoTransaction,
}: OrderShippoLabelFormProps) {
  const router = useRouter();
  const [rates, setRates] = useState<ShippoRateOption[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canBuy = currentStatus === 'paid' && !hasShippoTransaction;

  const handleRates = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fetchShippingRates(orderId);
        setRates(result.rates);
        setTestMode(result.testMode);
        setSelectedRateId(result.rates[0]?.id ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rates');
      }
    });
  };

  const handleBuy = () => {
    if (!selectedRateId) {
      setError('Pick a USPS rate first.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await buyShippingLabel(orderId, selectedRateId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to buy label');
      }
    });
  };

  const handleRefreshLabel = () => {
    setError(null);
    startTransition(async () => {
      try {
        await refreshShippingLabel(orderId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch label PDF');
      }
    });
  };

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
      <div className="flex flex-wrap items-center gap-sm mb-xs">
        <h3 className="font-heading text-[16px] leading-[24px] text-text-primary">
          Buy USPS label
        </h3>
        {trackingStatus ? <TrackingStatusBadge status={trackingStatus} /> : null}
      </div>
      <p className="font-body text-[13px] text-text-tertiary mb-md">
        Purchases postage in Shippo and saves tracking here. Mark Shipped after you print and drop off -
        that still sends the volunteer email. Paste tracking below if you bought the label in the Shippo website.
      </p>
      {testMode ? (
        <p className="font-body text-[12px] text-text-tertiary mb-md">
          Test keys print SAMPLE labels. Do not mail them.
        </p>
      ) : null}
      {labelUrl ? (
        <div className="flex flex-wrap items-center gap-sm mb-md">
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkButtonBase} bg-primary text-white border-primary hover:bg-primary-hover`}
          >
            Download label PDF
          </a>
          <ShippoSiteLink />
        </div>
      ) : null}
      {currentStatus === 'pending' ? (
        <p className="font-body text-[13px] text-text-tertiary">
          Wait until Stripe marks this order paid before buying a label.
        </p>
      ) : null}
      {hasShippoTransaction && !labelUrl ? (
        <div className="flex flex-col gap-sm mb-md">
          <p className="font-body text-[13px] text-text-tertiary">
            Label purchased - tracking is saved. Fetch the PDF from Shippo if the link is missing.
          </p>
          {error ? (
            <div
              role="alert"
              className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-md py-sm rounded-sm font-body text-[13px]"
            >
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-sm">
            <Button type="button" size="sm" disabled={isPending} onClick={handleRefreshLabel}>
              {isPending ? 'Fetching…' : 'Get label PDF'}
            </Button>
            <ShippoSiteLink />
          </div>
        </div>
      ) : null}
      {canBuy ? (
        <div className="flex flex-col gap-md">
          {rates.length > 0 ? (
            <div>
              <label htmlFor="shippo-rate" className="block font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                USPS rate
              </label>
              <select
                id="shippo-rate"
                value={selectedRateId}
                onChange={(e) => setSelectedRateId(e.target.value)}
                className="w-full h-11 px-md rounded-sm border border-border-outline bg-bg-surface text-text-primary font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {rates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {formatRate(rate)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {error ? (
            <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-md py-sm rounded-sm font-body text-[13px]">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-sm">
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleRates}>
              {isPending && rates.length === 0 ? 'Getting rates…' : 'Get rates'}
            </Button>
            {rates.length > 0 ? (
              <Button type="button" size="sm" disabled={isPending || !selectedRateId} onClick={handleBuy}>
                {isPending ? 'Buying…' : 'Buy label'}
              </Button>
            ) : null}
            <ShippoSiteLink />
          </div>
        </div>
      ) : null}
    </div>
  );
}
