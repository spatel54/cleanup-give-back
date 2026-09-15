import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { InfoRow } from '@/components/ui/InfoRow';
import {
  RECEIVING_METHOD_LABELS,
  ORDER_STATUS_CONFIG,
  formatOrderCents,
  formatOrderDate,
  formatShippingAddress,
  normalizeOrderStatus,
  trackingUrl,
} from '@/lib/mock-data';
import { loadLiveOrderById } from '@/lib/live-data';
import {
  formatPaymentMethodLabel,
  paymentStatusLabel,
  stripePaymentUrl,
} from '@/lib/stripe-dashboard';
import { OrderFulfillmentForm } from './OrderFulfillmentForm';
import { OrderShippoLabelForm } from './OrderShippoLabelForm';
import { CopyAddressButton } from './CopyAddressButton';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { formatTrackingStatusLabel } from '@/lib/tracking-status';

function ErrorFallback({ error, id }: { error: string; id: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto py-lg">
          <Link
            href="/orders"
            className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
            Orders
          </Link>
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Unable to load order</h2>
            <p className="font-body text-[14px]">{error}</p>
            <p className="font-body text-[12px] mt-sm text-[#ba1a1a]/80">
              Order ID: {id}
            </p>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    const { data: order, useMock } = await loadLiveOrderById(id);
    if (!order) notFound();

  const cfg = ORDER_STATUS_CONFIG[normalizeOrderStatus(order.status)];
  const trackHref = trackingUrl(order.carrier, order.tracking);
  const shippingText = formatShippingAddress(order.shipping);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const stripeUrl = stripePaymentUrl({
    paymentReference: order.paymentReference,
    paymentIntentId: order.paymentIntentId,
  });
  const paymentMethod = formatPaymentMethodLabel(order.paymentMethodLabel, normalizedStatus);
  const paymentStatus = paymentStatusLabel(normalizedStatus === 'pending' ? 'pending' : 'paid');

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto">
          <Link
            href="/orders"
            className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
            Orders
          </Link>

          <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
            <div>
              <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
                Order {order.id.toUpperCase()}
              </p>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
                {order.volunteer}
              </h1>
              <p className="font-body text-[14px] text-text-tertiary mt-xs">{order.email}</p>
              <p className="font-data text-[13px] text-text-tertiary mt-xs">
                Placed {formatOrderDate(order.createdAt)}
              </p>
            </div>
            <span
              className={`inline-flex font-data text-[12px] font-semibold px-md py-sm rounded-sm border whitespace-nowrap ${cfg.className}`}
            >
              {cfg.label}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
            <div className="lg:col-span-3 flex flex-col gap-lg">
              {!useMock && (
                <OrderFulfillmentForm
                  orderId={order.id}
                  fulfillmentMethod={order.fulfillmentMethod}
                  currentStatus={normalizeOrderStatus(order.status)}
                  currentTracking={order.tracking}
                  currentCarrier={order.carrier}
                />
              )}
              {!useMock && order.fulfillmentMethod === 'usps_ship' ? (
                <OrderShippoLabelForm
                  orderId={order.id}
                  currentStatus={normalizedStatus}
                  labelUrl={order.labelUrl ?? null}
                  trackingStatus={order.trackingStatus ?? null}
                  hasShippoTransaction={Boolean(order.shippoTransactionId)}
                />
              ) : null}
              
              <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
                <div className="flex items-center justify-between mb-md">
                  <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">
                    {order.fulfillmentMethod === 'usps_ship'
                      ? 'Shipping'
                      : order.fulfillmentMethod === 'local_dropoff'
                        ? 'Drop-off'
                        : 'Pickup'}
                  </h2>
                  {order.fulfillmentMethod === 'usps_ship' || order.fulfillmentMethod === 'local_dropoff' ? (
                    <CopyAddressButton address={shippingText} />
                  ) : null}
                </div>
                <dl>
                  <InfoRow label="Method" value={RECEIVING_METHOD_LABELS[order.fulfillmentMethod]} />
                  <InfoRow label="Kit requested" value={order.includesKit ? 'Yes' : 'No'} />
                  {order.fulfillmentMethod === 'usps_ship' ? (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-xs sm:gap-md py-sm border-b border-border-outline">
                      <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0 pt-0.5">
                        Ship to
                      </dt>
                      <dd className="font-body text-[14px] text-text-primary min-w-0 whitespace-pre-line">
                        {shippingText}
                      </dd>
                    </div>
                  ) : order.fulfillmentMethod === 'local_dropoff' ? (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-xs sm:gap-md py-sm border-b border-border-outline">
                      <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0 pt-0.5">
                        Drop-off at
                      </dt>
                      <dd className="font-body text-[14px] text-text-primary min-w-0 whitespace-pre-line">
                        {shippingText || '-'}
                      </dd>
                    </div>
                  ) : (
                    <InfoRow
                      label="Handoff"
                      value="Volunteer picks up at the office"
                    />
                  )}
                  {order.fulfillmentMethod === 'usps_ship' && order.shipping.phone ? (
                    <InfoRow label="Phone" value={order.shipping.phone} />
                  ) : null}
                  <InfoRow label="Status" value={cfg.label} />
                  {order.fulfillmentMethod === 'usps_ship' ? (
                    <>
                      <InfoRow label="Carrier" value={order.carrier?.trim() || '-'} />
                      {order.trackingStatus ? (
                        <InfoRow label="Package" value={formatTrackingStatusLabel(order.trackingStatus)} />
                      ) : null}
                      {order.labelUrl ? (
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-xs sm:gap-md py-sm border-b border-border-outline last:border-0">
                          <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0">
                            Label
                          </dt>
                          <dd className="font-body text-[14px] text-text-primary min-w-0">
                            <a
                              href={order.labelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-data text-[13px] break-all"
                            >
                              Download PDF
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-xs sm:gap-md py-sm border-b border-border-outline last:border-0">
                        <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0">
                          Tracking
                        </dt>
                        <dd className="font-body text-[14px] text-text-primary min-w-0">
                          {order.tracking ? (
                            trackHref ? (
                              <a
                                href={trackHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-data text-[13px] break-all"
                              >
                                {order.tracking}
                              </a>
                            ) : (
                              <span className="font-data text-[13px] break-all">{order.tracking}</span>
                            )
                          ) : (
                            'Not added yet'
                          )}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </section>

              <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
                <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Payment</h2>
                <dl>
                  <InfoRow label="Status" value={paymentStatus} />
                  <InfoRow label="Method" value={paymentMethod} />
                  {stripeUrl ? (
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-xs sm:gap-md py-sm border-b border-border-outline last:border-0">
                      <dt className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary sm:w-40 shrink-0">
                        Stripe
                      </dt>
                      <dd className="font-body text-[14px] text-text-primary min-w-0">
                        <a
                          href={stripeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-data text-[13px] break-all"
                        >
                          View in Stripe Dashboard
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
                <div className="px-lg py-md border-b border-border-outline">
                  <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Items</h2>
                </div>
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
                  {['Product', 'Qty', 'Unit', 'Total'].map((col) => (
                    <span
                      key={col}
                      className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <ul role="list" className="divide-y divide-border-outline">
                  {order.lineItems.map((item) => (
                    <li
                      key={`${item.name}-${item.qty}`}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-xs sm:gap-md items-center px-lg py-md"
                    >
                      <span className="font-body text-[14px] font-medium text-text-primary">{item.name}</span>
                      <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                        × {item.qty}
                      </span>
                      <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">
                        {formatOrderCents(item.unitCents)}
                      </span>
                      <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap">
                        {formatOrderCents(item.unitCents * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-lg py-md border-t border-border-outline flex justify-between items-center bg-bg-surface-elevated">
                  <span className="font-data text-[12px] uppercase tracking-[0.5px] text-text-tertiary">
                    Order total
                  </span>
                  <span className="font-data text-[18px] font-semibold text-text-primary">
                    {formatOrderCents(order.totalCents)}
                  </span>
                </div>
              </section>
            </div>

            <div className="lg:col-span-2">
              <section className="bg-bg-surface border border-border-outline rounded-md p-lg sticky top-6">
                <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
                  Customer
                </h2>
                <dl className="flex flex-col gap-md">
                  <div>
                    <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                      Name
                    </p>
                    <p className="font-body text-[14px] font-medium text-text-primary">{order.volunteer}</p>
                  </div>
                  <div>
                    <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                      Email
                    </p>
                    <a
                      href={`mailto:${order.email}`}
                      className="font-body text-[14px] text-primary hover:underline break-all"
                    >
                      {order.email}
                    </a>
                  </div>
                  {order.shipping.phone ? (
                    <div>
                      <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                        Phone
                      </p>
                      <a
                        href={`tel:${order.shipping.phone.replace(/[^\d+]/g, '')}`}
                        className="font-body text-[14px] text-primary hover:underline"
                      >
                        {order.shipping.phone}
                      </a>
                    </div>
                  ) : null}
                </dl>
                <p className="font-body text-[12px] text-text-tertiary mt-lg">
                  Status updates and tracking edits save to live shop orders.
                </p>
              </section>
            </div>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
  } catch (error) {
    return (
      <ErrorFallback 
        error={error instanceof Error ? error.message : 'Failed to load order data'} 
        id={id}
      />
    );
  }
}