'use client';

import Link from 'next/link';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { PeriodToggle } from '@/components/ui/PeriodToggle';
import { Sparkline } from '@/components/ui/Sparkline';
import { MiniDonut } from '@/components/ui/MiniDonut';
import { FeedbackEmojiStrip } from '@/components/ui/FeedbackEmojiStrip';
import { TrendAreaChart } from '@/components/ui/TrendAreaChart';
import { HorizontalBarChart } from '@/components/ui/HorizontalBarChart';
import { ChevronRightIcon, CloseIcon } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { KPICard } from '@/components/ui/KPICard';
import { AdminSearchBar } from '@/components/ui/AdminSearchBar';
import { PaymentsPreviewCard } from '@/components/ui/PaymentsPreviewCard';
import { OrdersPreviewCard } from '@/components/ui/OrdersPreviewCard';
import { useToast } from '@/components/ui/ToastProvider';
import { ReviewDrawer } from '@/components/dashboard/ReviewDrawer';
import { UsHeatmap } from '@/components/dashboard/UsHeatmap';
import { SampleDataBanner } from '@/components/ui/SampleDataBanner';
import type {
  DashboardKpi,
  MetricDonut,
  MetricVisuals,
  ReviewableSession,
  FeedbackEmojiCount,
  GeoActivityBundle,
} from '@/components/dashboard/types';
import type { DashboardSnapshot } from '@/lib/dashboard-insights';
import type { NamedBar, TrendPoint } from '@/lib/dashboard-charts';
import { approveSession, declineSession } from '@/actions/sessions';
import type { PeriodSelection } from '@/lib/dashboard-period';
import type { MonthlyRevenuePoint } from '@/lib/payments-mock';
import type { OrderRow } from '@/lib/orders-data';

const COACH_TIP_KEY = 'cugb-review-coach-tip-dismissed';

type CommercePreview = {
  paymentsThisMonthCents: number;
  paymentsMonthLabel: string;
  paymentsMonthly: MonthlyRevenuePoint[];
  openOrders: number;
  ordersRevenueCents: number;
  openOrdersPreview: OrderRow[];
};

type Props = {
  selection: PeriodSelection;
  periodLabelText: string;
  isMock: boolean;
  kpis: DashboardKpi[];
  hoursKpi: DashboardKpi;
  queue: ReviewableSession[];
  recent: ReviewableSession[];
  snapshot: DashboardSnapshot;
  metricVisuals: MetricVisuals;
  hoursTrend: TrendPoint[];
  /** Under-review sessions bucketed by how long they've waited. */
  queueAge: NamedBar[];
  geoActivity: GeoActivityBundle;
  commerce: CommercePreview;
};

function formatDurationShort(seconds: number | null, adjusted: number | null): string {
  if (adjusted != null) return `${adjusted.toFixed(1)}h`;
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Bento({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-md border border-border-outline bg-bg-surface overflow-hidden ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Bento Today — sparse grid: one job per tile.
 * Primary: Review. Secondary: metrics. Location + hours trend below.
 */
export function DashboardWorkbench(props: Props) {
  const { pushToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queue, setQueue] = useState(props.queue);
  const [recent, setRecent] = useState(props.recent);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [courtOnlyFilter, setCourtOnlyFilter] = useState(false);
  const [coachTipDismissed, setCoachTipDismissed] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQueue(props.queue);
    setRecent(props.recent);
  }, [props.queue, props.recent]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COACH_TIP_KEY);
      setCoachTipDismissed(stored === '1');
    } catch {
      // ignore
    }
  }, []);

  function dismissCoachTip() {
    setCoachTipDismissed(true);
    try {
      window.localStorage.setItem(COACH_TIP_KEY, '1');
    } catch {
      // ignore
    }
  }

  const drawerSession = useMemo(
    () => queue.find((s) => s.id === drawerId) ?? null,
    [queue, drawerId],
  );

  const filteredQueue = useMemo(() => {
    const needle = queueSearch.trim().toLowerCase();
    return queue.filter((item) => {
      if (courtOnlyFilter && !item.court_ordered) return false;
      if (!needle) return true;
      return (
        item.volunteer_name.toLowerCase().includes(needle) ||
        (item.activity ?? '').toLowerCase().includes(needle)
      );
    });
  }, [queue, queueSearch, courtOnlyFilter]);

  const underReviewKpi = props.kpis.find((k) => k.label === 'Under Review');
  const approvedKpi = props.kpis.find((k) => k.label === 'Approved');
  const feedbackKpi = props.kpis.find((k) => k.label === 'Avg feedback');

  const removeFromQueue = useCallback((id: string, nextStatus: string) => {
    setQueue((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      setDrawerId((current) => {
        if (current !== id) return current;
        return remaining[0]?.id ?? null;
      });
      return remaining;
    });
    setRecent((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)),
    );
  }, []);

  const restoreSession = useCallback((session: ReviewableSession) => {
    setQueue((prev) => {
      if (prev.some((s) => s.id === session.id)) return prev;
      return [...prev, { ...session, status: 'under_review' }].sort((a, b) => {
        if (a.court_ordered !== b.court_ordered) return a.court_ordered ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    setRecent((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: 'under_review' } : s)),
    );
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      const session = queue.find((s) => s.id === id) ?? recent.find((s) => s.id === id);
      if (!session) return;
      setBusyId(id);
      try {
        if (props.isMock) {
          removeFromQueue(id, 'approved');
          pushToast({
            kind: 'success',
            message: `Demo: approved ${session.volunteer_name}`,
            action: { label: 'Undo', onClick: () => restoreSession(session) },
          });
        } else {
          await approveSession(id);
          removeFromQueue(id, 'approved');
          pushToast({
            kind: 'success',
            message: `Approved ${session.volunteer_name}`,
          });
          startTransition(() => router.refresh());
        }
      } catch (err) {
        pushToast({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Approve failed',
        });
      } finally {
        setBusyId(null);
      }
    },
    [queue, recent, props.isMock, removeFromQueue, pushToast, restoreSession, router],
  );

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const idsToApprove = Array.from(selectedIds);
    setBusyId('bulk');
    try {
      if (props.isMock) {
        idsToApprove.forEach((id) => removeFromQueue(id, 'approved'));
        pushToast({
          kind: 'success',
          message: `Demo: approved ${idsToApprove.length} session${idsToApprove.length !== 1 ? 's' : ''}`,
        });
      } else {
        await Promise.all(idsToApprove.map((id) => approveSession(id)));
        idsToApprove.forEach((id) => removeFromQueue(id, 'approved'));
        pushToast({
          kind: 'success',
          message: `Approved ${idsToApprove.length} session${idsToApprove.length !== 1 ? 's' : ''}`,
        });
        startTransition(() => router.refresh());
      }
      setSelectedIds(new Set());
    } catch (err) {
      pushToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Bulk approve failed',
      });
    } finally {
      setBusyId(null);
    }
  }, [selectedIds, props.isMock, removeFromQueue, pushToast, router]);

  const openOldest = useCallback(() => {
    if (filteredQueue[0]) setDrawerId(filteredQueue[0].id);
  }, [filteredQueue]);

  const submitDecline = useCallback(async () => {
    if (!declineId) return;
    const session = queue.find((s) => s.id === declineId) ?? recent.find((s) => s.id === declineId);
    if (!session) return;
    setBusyId(declineId);
    try {
      if (props.isMock) {
        removeFromQueue(declineId, 'not_approved');
        pushToast({
          kind: 'info',
          message: `Demo: declined ${session.volunteer_name}`,
          action: { label: 'Undo', onClick: () => restoreSession(session) },
        });
      } else {
        await declineSession(declineId, declineReason.trim() || undefined);
        removeFromQueue(declineId, 'not_approved');
        pushToast({
          kind: 'success',
          message: `Declined ${session.volunteer_name}`,
        });
        startTransition(() => router.refresh());
      }
      setDeclineId(null);
      setDeclineReason('');
    } catch (err) {
      pushToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Decline failed',
      });
    } finally {
      setBusyId(null);
    }
  }, [
    declineId,
    declineReason,
    queue,
    recent,
    props.isMock,
    removeFromQueue,
    pushToast,
    restoreSession,
    router,
  ]);

  const visibleQueue = filteredQueue.slice(0, 5);
  const hasMoreQueue = filteredQueue.length > 5;
  const isFiltered = queueSearch.trim() !== '' || courtOnlyFilter;

  return (
    <div className={`max-w-6xl mx-auto ${isPending ? 'opacity-70' : ''}`}>
      {props.isMock && <SampleDataBanner />}
      <header className="flex flex-col gap-md mb-lg" aria-busy={isPending}>
        {queue.length > 0 ? (
          <>
            <h1 className="font-heading text-[32px] leading-[40px] text-text-primary">
              {queue.length} waiting for review
            </h1>
            <p className="font-body text-[16px] text-text-tertiary -mt-sm">Welcome back Admin</p>
          </>
        ) : (
          <h1 className="font-heading text-[32px] leading-[40px] text-text-primary">Welcome back Admin!</h1>
        )}
        <Suspense fallback={<div className="h-11 w-full bg-bg-surface-elevated rounded-md animate-pulse" />}>
          <PeriodToggle selection={props.selection} pending={isPending} />
        </Suspense>
      </header>

      {/* Bento grid — sibling columns share height so bottoms align */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
        {/* Hero — Review */}
        <Bento
          as="section"
          aria-labelledby="bento-review-heading"
          className="flex h-full flex-col"
        >
          <div className="px-lg pt-lg pb-md flex items-start justify-between gap-md">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
                Needs you
              </p>
              <h2
                id="bento-review-heading"
                className="font-heading text-[24px] leading-[30px] text-text-primary"
              >
                {queue.length === 0
                  ? 'All clear'
                  : isFiltered
                    ? `${filteredQueue.length} of ${queue.length}`
                    : `${queue.length} to review`}
              </h2>
            </div>
            {filteredQueue.length > 0 && (
              <Button type="button" className="min-h-11 shrink-0" onClick={openOldest}>
                Start
              </Button>
            )}
          </div>

          {queue.length > 0 && (
            <div className="px-lg pb-md flex flex-wrap gap-sm">
              <AdminSearchBar
                value={queueSearch}
                onChange={setQueueSearch}
                placeholder="Search the queue…"
                className="w-full sm:w-56"
              />
              <button
                type="button"
                aria-pressed={courtOnlyFilter}
                onClick={() => setCourtOnlyFilter((v) => !v)}
                className={`h-11 shrink-0 inline-flex items-center px-md rounded-full border font-data text-[12px] font-semibold whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  courtOnlyFilter
                    ? 'bg-primary text-white border-primary'
                    : 'bg-bg-surface text-text-tertiary border-border-outline hover:border-primary hover:text-primary'
                }`}
              >
                Court-ordered only
              </button>
              {selectedIds.size > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={busyId === 'bulk'}
                  className="min-h-11 ml-auto"
                >
                  Approve selected ({selectedIds.size})
                </Button>
              )}
            </div>
          )}

          {!coachTipDismissed && queue.length > 0 && (
            <div className="px-lg pb-md">
              <div className="px-md py-sm rounded-sm bg-[#f7fff1] border border-primary text-[12px] font-body text-text-tertiary flex items-start gap-sm">
                <span className="flex-1">
                  <strong className="text-primary font-semibold">Tip:</strong> Select multiple sessions with
                  checkboxes to approve in bulk. Click any row to review details.
                </span>
                <button
                  type="button"
                  onClick={dismissCoachTip}
                  className="shrink-0 text-primary hover:text-text-primary transition-colors"
                  aria-label="Dismiss tip"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="px-lg pb-lg flex-1 flex items-center">
              <p className="font-body text-[14px] text-text-tertiary max-w-xs">
                Nothing waiting. New submissions will show up here.
              </p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="px-lg pb-lg flex-1 flex items-center">
              <p className="font-body text-[14px] text-text-tertiary max-w-xs">
                No queued sessions match this search.
              </p>
            </div>
          ) : (
            <ul role="list" className="flex-1 divide-y divide-border-outline border-t border-border-outline">
              {visibleQueue.map((item) => (
                <li
                  key={item.id}
                  className="px-lg py-md flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md"
                >
                  <label className="flex items-center gap-sm shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) {
                            next.add(item.id);
                          } else {
                            next.delete(item.id);
                          }
                          return next;
                        });
                      }}
                      className="w-4 h-4 accent-primary"
                      aria-label={`Select ${item.volunteer_name}`}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-xs">
                      <Link
                        href={`/volunteers/${item.user_id}`}
                        className="font-body text-[14px] font-semibold text-text-primary truncate hover:text-primary hover:underline inline-block max-w-full"
                      >
                        {item.volunteer_name}
                      </Link>
                      {item.court_ordered && <CourtBadge className="shrink-0" />}
                    </div>
                    <Link
                      href={`/sessions/${item.id}`}
                      className="font-body text-[12px] text-text-tertiary hover:text-primary hover:underline truncate block"
                    >
                      {item.activity ?? 'Cleanup'} ·{' '}
                      {formatDurationShort(item.duration_seconds, item.adjusted_hours)} ·{' '}
                      {item.ageLabel}
                    </Link>
                  </div>
                  <div className="flex gap-xs shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11"
                      aria-label={`Review ${item.volunteer_name}`}
                      onClick={() => setDrawerId(item.id)}
                    >
                      Review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMoreQueue && (
            <div className="px-lg py-md border-t border-border-outline mt-auto">
              <Link
                href="/sessions?status=under_review"
                className="font-data text-[12px] font-semibold text-primary hover:underline inline-flex items-center gap-2"
              >
                View all {filteredQueue.length} in Sessions
                <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
              </Link>
            </div>
          )}
        </Bento>

        {/* Metric tiles — fill Review column height, equal cells */}
        <div className="grid grid-cols-2 grid-rows-2 gap-md h-full min-h-0">
          <MetricTile
            label="Waiting"
            value={underReviewKpi?.value ?? queue.length}
            hint={queue.length > 0 ? 'Open queue' : 'Caught up'}
            href="/sessions?status=under_review"
            accent={queue.length > 0}
            donut={props.metricVisuals.waiting}
          />
          <MetricTile
            label="Approved"
            value={approvedKpi?.value ?? '—'}
            hint={props.periodLabelText}
            href="/sessions?status=approved"
            donut={props.metricVisuals.approved}
          />
          <MetricTile
            label="Hours"
            value={props.hoursKpi.value}
            hint={props.hoursKpi.delta ?? props.hoursKpi.subtext}
            href="/sessions?status=approved"
            donut={props.metricVisuals.hours}
          />
          <MetricTile
            label="Feedback"
            value={feedbackKpi?.value ?? '—'}
            hint="Average rating"
            href="/feedback"
            emojiStrip={props.metricVisuals.feedback}
          />
        </div>
      </div>

      {/* Backlog age + hours trend — how stale is the queue, then period activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
        <HorizontalBarChart
          title="How long sessions wait"
          subtitle="Under review, by age"
          data={props.queueAge}
          emptyLabel="No sessions waiting for review"
          index={0}
        />
        <TrendAreaChart
          title="Hours & submissions"
          subtitle={props.periodLabelText}
          data={props.hoursTrend}
          index={1}
        />
      </div>
      <div className="grid grid-cols-1 gap-md mt-md">
        <UsHeatmap
          activity={props.geoActivity}
          periodLabel={props.periodLabelText}
          isMock={props.isMock}
        />
      </div>

      {/* Commerce preview — payments + orders at a glance, deeper detail on their own tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-md">
        <PaymentsPreviewCard
          totalCents={props.commerce.paymentsThisMonthCents}
          monthLabel={props.commerce.paymentsMonthLabel}
          monthly={props.commerce.paymentsMonthly}
        />
        <OrdersPreviewCard
          openCount={props.commerce.openOrders}
          revenueCents={props.commerce.ordersRevenueCents}
          preview={props.commerce.openOrdersPreview}
        />
      </div>

      {/* Snapshot — glanceable composition; deeper breakdowns on /insights */}
      <Bento as="section" aria-labelledby="bento-snapshot-heading" className="mt-md">
        <div className="px-lg py-lg flex flex-col sm:flex-row sm:items-center gap-lg">
          <div className="flex-1 min-w-0">
            <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
              This period
            </p>
            <h2 id="bento-snapshot-heading" className="font-heading text-[20px] leading-[26px] text-text-primary">
              Snapshot
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-lg">
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary">Approval rate</p>
              <p className="font-data text-[22px] font-semibold text-text-primary">
                {props.snapshot.approvalRatePct != null ? `${props.snapshot.approvalRatePct}%` : '—'}
              </p>
            </div>
            <div>
              <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary">Top activity</p>
              <p className="font-body text-[16px] font-medium text-text-primary truncate max-w-[10rem]">
                {props.snapshot.topActivityLabel ?? '—'}
              </p>
            </div>
            {props.snapshot.hoursSparkline.length > 1 && (
              <div>
                <p className="font-data text-[11px] uppercase tracking-[0.5px] text-text-tertiary mb-xs">
                  Approved hours
                </p>
                <Sparkline data={props.snapshot.hoursSparkline} />
              </div>
            )}
          </div>

          <Link
            href="/insights"
            className="font-data text-[12px] font-semibold text-primary hover:underline min-h-11 inline-flex items-center gap-2 shrink-0"
          >
            More charts
            <ChevronRightIcon className="w-3.5 h-3.5" color="currentColor" />
          </Link>
        </div>
      </Bento>

      <ReviewDrawer
        open={drawerId != null}
        session={drawerSession}
        queue={queue}
        isMock={props.isMock}
        busyId={busyId}
        onClose={() => setDrawerId(null)}
        onSelect={setDrawerId}
        onApprove={handleApprove}
        onDeclineRequest={setDeclineId}
      />

      {declineId && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-lg"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
            aria-label="Cancel decline"
            onClick={() => {
              setDeclineId(null);
              setDeclineReason('');
            }}
          />
          <div className="relative w-full max-w-md rounded-md bg-bg-surface border border-border-outline p-lg shadow-bar-top">
            <h3 className="font-heading text-[20px] text-text-primary mb-sm">Decline session</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="w-full rounded-sm border border-border-outline bg-bg-app px-md py-sm font-body text-[14px] mb-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              placeholder="Reason (optional)"
            />
            <div className="flex gap-sm justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeclineId(null);
                  setDeclineReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={busyId === declineId}
                onClick={submitDecline}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky review bar */}
      {queue.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 z-20 bg-bg-surface border-t border-border-outline shadow-nav-bottom p-sm">
          <Button
            type="button"
            className="w-full min-h-11"
            onClick={openOldest}
          >
            Review next ({queue.length})
          </Button>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  href,
  accent,
  donut,
  emojiStrip,
}: {
  label: string;
  value: string | number;
  hint?: string | null;
  href: string;
  accent?: boolean;
  donut?: MetricDonut;
  emojiStrip?: FeedbackEmojiCount[];
}) {
  return (
    <Bento as="article" className="h-full min-h-0">
      <Link
        href={href}
        className="flex h-full flex-col justify-center p-md no-underline text-inherit hover:bg-bg-app/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`${label}: ${value}`}
      >
        <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-xs">
          {label}
        </p>
        <div className="flex items-end justify-between gap-sm">
          <p
            className={`font-data text-[28px] leading-[34px] font-semibold ${
              accent ? 'text-[#835400]' : 'text-text-primary'
            }`}
          >
            {value}
          </p>
          {donut ? (
            <MiniDonut slices={donut.slices} size={48} thickness={6} className="mb-0.5" />
          ) : emojiStrip ? (
            <FeedbackEmojiStrip counts={emojiStrip} className="mb-0.5" />
          ) : null}
        </div>
        {hint ? (
          <p className="mt-xs font-body text-[12px] text-text-tertiary line-clamp-2">{hint}</p>
        ) : null}
      </Link>
    </Bento>
  );
}
