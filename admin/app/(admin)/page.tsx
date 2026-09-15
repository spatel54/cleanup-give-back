import { createDataClient } from '@/lib/supabase/server';
import { DashboardWorkbench } from '@/components/dashboard/DashboardWorkbench';
import type { MetricVisuals } from '@/components/dashboard/types';
import { FEEDBACK_EMOJI_ORDER } from '@/components/ui/FeedbackEmojiStrip';
import { loadScopedDashboardData } from '@/lib/dashboard-data';
import { computeDashboardInsights } from '@/lib/dashboard-insights';
import { MOCK_FEEDBACK_AVG, MOCK_OPEN_ORDERS, type MockSession } from '@/lib/dashboard-mock';
import { inInterval } from '@/lib/dashboard-period';
import { computedHours } from '@/lib/format';
import { loadPaymentsSummary } from '@/lib/payments-data';
import { loadOrdersSummary, loadOpenOrdersPreview } from '@/lib/orders-data';
import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

const RATING_SCORES: Record<string, number> = {
  excited: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  very_sad: 1,
};

/** Matches admin/app/(admin)/feedback/page.tsx mock distribution. */
const MOCK_FEEDBACK_RATING_COUNTS: Record<string, number> = {
  excited: 4,
  happy: 4,
  neutral: 2,
  sad: 1,
  very_sad: 1,
};

const COLOR = {
  waiting: '#835400',
  cleared: '#c9c4b8',
  approved: '#007536',
  declined: '#ba1a1a',
  reviewing: '#e0b87a',
  court: '#243447',
  free: '#4a9e6e',
} as const;

function ageLabel(iso: string | null | undefined, now: Date): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    const hours = differenceInHours(now, d);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = differenceInDays(now, d);
    if (days === 1) return '1d ago';
    if (days < 14) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function sessionHours(s: { adjusted_hours: number | null; duration_seconds: number | null }): number {
  return computedHours(s.duration_seconds, s.adjusted_hours);
}

function buildFeedbackEmojiCounts(ratings: (string | null | undefined)[]) {
  const tally: Record<string, number> = {};
  for (const r of ratings) {
    if (!r) continue;
    tally[r] = (tally[r] ?? 0) + 1;
  }
  return FEEDBACK_EMOJI_ORDER.map((row) => ({
    ...row,
    count: tally[row.key] ?? 0,
  }));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createDataClient();

  const data = await loadScopedDashboardData(params);
  const {
    useMock,
    selection,
    periodLabelText,
    now,
    interval,
    prevInterval,
    scoped,
    prevScoped,
    underReviewAll,
    courtAtRisk,
  } = data;

  const [{ data: feedbackRows }, { count: openOrdersCount }, paymentsSummary] = await Promise.all([
    supabase.from('volunteer_feedback').select('rating, submitted_at'),
    supabase
      .from('shop_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'paid', 'shipped']),
    loadPaymentsSummary(),
  ]);
  const ordersSummary = loadOrdersSummary();
  const openOrdersPreview = loadOpenOrdersPreview(4);
  const commerce = {
    paymentsThisMonthCents: paymentsSummary.totalThisMonthCents,
    paymentsMonthLabel: paymentsSummary.monthLabel,
    paymentsMonthly: paymentsSummary.monthly,
    // Orders page still uses fixtures — keep the Today card count aligned with the preview table.
    openOrders: ordersSummary.open,
    ordersRevenueCents: ordersSummary.totalRevenueCents,
    openOrdersPreview,
  };

  const approvedScoped = scoped.filter((s) => s.status === 'approved');
  const courtOrdered = approvedScoped.filter((r) => r.court_ordered).length;

  const approvedThisPeriod = approvedScoped.length;
  const declinedThisPeriod = scoped.filter((s) => s.status === 'not_approved').length;
  const reviewingThisPeriod = scoped.filter((s) => s.status === 'under_review').length;
  const clearedThisPeriod = approvedThisPeriod + declinedThisPeriod;

  const courtHours = approvedScoped
    .filter((s) => s.court_ordered)
    .reduce((sum, s) => sum + sessionHours(s), 0);
  const totalApprovedHours = approvedScoped.reduce((sum, s) => sum + sessionHours(s), 0);
  const freeHours = Math.max(0, totalApprovedHours - courtHours);
  const prevApprovedHours = prevScoped
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + sessionHours(s), 0);

  const hoursDelta =
    prevInterval && prevApprovedHours > 0
      ? `${totalApprovedHours >= prevApprovedHours ? '+' : ''}${Math.round(
          ((totalApprovedHours - prevApprovedHours) / prevApprovedHours) * 100,
        )}% vs prior`
      : prevInterval
        ? 'No prior period'
        : null;

  const hoursSparkline = [
    prevApprovedHours,
    Math.max(prevApprovedHours * 0.85, 0),
    Math.max(prevApprovedHours * 0.95, 0),
    totalApprovedHours,
  ];

  let ratingDisplay = '—';
  let feedbackEmoji = buildFeedbackEmojiCounts([]);
  if (useMock) {
    ratingDisplay = MOCK_FEEDBACK_AVG.toFixed(1);
    feedbackEmoji = FEEDBACK_EMOJI_ORDER.map((row) => ({
      ...row,
      count: MOCK_FEEDBACK_RATING_COUNTS[row.key] ?? 0,
    }));
  } else if (feedbackRows && feedbackRows.length > 0) {
    const inPeriod = (feedbackRows as { rating: string | null; submitted_at: string }[]).filter((f) =>
      inInterval(f.submitted_at, interval),
    );
    if (inPeriod.length > 0) {
      const avg =
        inPeriod.reduce((sum, f) => sum + (f.rating ? (RATING_SCORES[f.rating] ?? 0) : 0), 0) /
        inPeriod.length;
      ratingDisplay = avg.toFixed(1);
    }
    feedbackEmoji = buildFeedbackEmojiCounts(inPeriod.map((f) => f.rating));
  }

  const insights = computeDashboardInsights({
    scoped,
    underReviewAll,
    courtAtRisk,
    period: selection,
    now,
    interval,
  });
  const approvedSparkline = insights.chartExtras.trend.map((p) => p.approved);

  const metricVisuals: MetricVisuals = {
    waiting: {
      slices: [
        { value: underReviewAll.length, color: COLOR.waiting, label: 'Waiting' },
        {
          value: clearedThisPeriod || (underReviewAll.length === 0 ? 1 : 0),
          color: COLOR.cleared,
          label: 'Cleared',
        },
      ],
    },
    approved: {
      slices: [
        { value: approvedThisPeriod, color: COLOR.approved, label: 'Approved' },
        { value: declinedThisPeriod, color: COLOR.declined, label: 'Declined' },
        { value: reviewingThisPeriod, color: COLOR.reviewing, label: 'Still reviewing' },
      ],
    },
    hours: {
      slices: [
        { value: Number(courtHours.toFixed(2)), color: COLOR.court, label: 'Court-ordered' },
        { value: Number(freeHours.toFixed(2)), color: COLOR.free, label: 'Voluntary' },
      ],
    },
    feedback: feedbackEmoji,
  };

  const kpis = [
    {
      label: 'Under Review',
      value: underReviewAll.length,
      accent: underReviewAll.length > 0,
      subtext: underReviewAll.length > 0 ? 'Needs attention' : 'All clear',
      href: '/sessions?status=under_review',
    },
    {
      label: 'Approved',
      value: approvedThisPeriod,
      subtext: `${declinedThisPeriod} declined · ${periodLabelText}`,
      href: '/sessions?status=approved',
      sparkline: approvedSparkline.length > 1 ? approvedSparkline : undefined,
    },
    {
      label: 'Court hours at risk',
      value: courtAtRisk.filter((v) => v.status === 'at_risk').length,
      accent: courtAtRisk.some((v) => v.status === 'at_risk'),
      subtext: `${courtAtRisk.length} due soon or behind`,
      href: '/users?filter=court',
    },
    {
      label: 'Avg feedback',
      value: ratingDisplay,
      subtext: `Open orders: ${useMock ? MOCK_OPEN_ORDERS : (openOrdersCount ?? 0)}`,
      href: '/feedback',
    },
  ];

  const hoursKpi = {
    label: 'Approved hours',
    value: totalApprovedHours.toFixed(1),
    subtext: `${courtOrdered} court-ordered in period`,
    delta: hoursDelta,
    sparkline: prevInterval ? hoursSparkline : undefined,
    href: '/sessions?status=approved',
  };

  const toReviewable = (s: MockSession) => ({
    id: s.id,
    volunteer_name: s.volunteer_name,
    activity: s.activity,
    court_ordered: s.court_ordered,
    created_at: s.created_at,
    ageLabel: ageLabel(s.created_at, now),
    status: s.status,
    duration_seconds: s.duration_seconds,
    adjusted_hours: s.adjusted_hours,
    distance_miles: s.distance_miles,
    started_at: s.started_at,
    user_id: s.user_id,
  });

  const queue = underReviewAll.map(toReviewable);

  const recentSorted = [...scoped].sort((a, b) => {
    const aReview = a.status === 'under_review' ? 0 : 1;
    const bReview = b.status === 'under_review' ? 0 : 1;
    if (aReview !== bReview) return aReview - bReview;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const recent = recentSorted.slice(0, 10).map(toReviewable);

  return (
    <DashboardWorkbench
      selection={selection}
      periodLabelText={periodLabelText}
      isMock={useMock}
      kpis={kpis}
      hoursKpi={hoursKpi}
      queue={queue}
      recent={recent}
      snapshot={insights.snapshot}
      metricVisuals={metricVisuals}
      hoursTrend={insights.chartExtras.trend}
      queueAge={insights.chartExtras.queueAge}
      geoActivity={insights.geoActivity}
      commerce={commerce}
    />
  );
}
