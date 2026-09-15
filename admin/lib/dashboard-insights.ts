import type { DashboardPeriod, PeriodSelection } from '@/lib/dashboard-period';
import { computedHours } from '@/lib/format';
import {
  COUNTY_NEIGHBORHOODS,
  STATE_FIPS_NAME,
  type GeoActivityBundle,
  type GeoUnitStats,
  type NeighborhoodStats,
} from '@/lib/us-heatmap';
import {
  buildCourtProgressBars,
  buildDecisionBars,
  buildQueueAgeBars,
  buildTrendSeries,
} from '@/lib/dashboard-charts';
import type { ChartExtras, CourtRiskItem, DonutPayload } from '@/components/dashboard/types';

const ACTIVITY_COLORS = ['#007536', '#5a8f3a', '#835400', '#3d8f5c', '#6e7a6c'];

/** Known county display names for mock / common drill targets (Census names load on the map). */
const COUNTY_NAMES: Record<string, string> = {
  '17031': 'Cook County',
  '17043': 'DuPage County',
  '17097': 'Lake County',
  '18089': 'Lake County',
  '55079': 'Milwaukee County',
  '26163': 'Wayne County',
};

type SessionLike = {
  status: string;
  activity: string | null;
  court_ordered: boolean;
  created_at: string;
  ended_at?: string | null;
  started_at?: string | null;
  duration_seconds: number | null;
  adjusted_hours: number | null;
  neighborhood_id?: string | null;
  state_fips?: string | null;
  county_fips?: string | null;
};

export type DashboardSnapshot = {
  approvalRatePct: number | null;
  topActivityLabel: string | null;
  hoursSparkline: number[];
};

export type DashboardInsights = {
  donuts: DonutPayload[];
  chartExtras: ChartExtras;
  /** @deprecated Prefer geoActivity — kept for transitional imports. */
  neighborhoodStats: NeighborhoodStats[];
  geoActivity: GeoActivityBundle;
  snapshot: DashboardSnapshot;
};

function rollupUnits(
  scoped: SessionLike[],
  keyOf: (s: SessionLike) => string | null | undefined,
  nameOf: (id: string) => string,
): GeoUnitStats[] {
  const map = new Map<string, GeoUnitStats>();
  for (const s of scoped) {
    const id = keyOf(s)?.trim();
    if (!id) continue;
    const cur = map.get(id) ?? {
      id,
      name: nameOf(id),
      sessionCount: 0,
      hours: 0,
      underReview: 0,
    };
    cur.sessionCount += 1;
    cur.hours += computedHours(s.duration_seconds, s.adjusted_hours);
    if (s.status === 'under_review') cur.underReview += 1;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.sessionCount - a.sessionCount);
}

/**
 * Composition + trend computation shared by the Today snapshot tile and the
 * full Insights page — kept in one place so the two views never drift.
 */
export function computeDashboardInsights(params: {
  scoped: SessionLike[];
  underReviewAll: { created_at: string }[];
  courtAtRisk: CourtRiskItem[];
  period: DashboardPeriod | PeriodSelection;
  now: Date;
  interval: { start: Date; end: Date } | null;
}): DashboardInsights {
  const { scoped, underReviewAll, courtAtRisk, period, now, interval } = params;

  const statusCounts = {
    under_review: scoped.filter((s) => s.status === 'under_review').length,
    approved: scoped.filter((s) => s.status === 'approved').length,
    not_approved: scoped.filter((s) => s.status === 'not_approved' || s.status === 'invalid').length,
    active: scoped.filter((s) => s.status === 'active').length,
  };
  const totalSessions = scoped.length;

  const statusSlices = [
    { name: 'Approved', value: statusCounts.approved, color: '#007536' },
    { name: 'Under Review', value: statusCounts.under_review, color: '#fcab29' },
    { name: 'Declined', value: statusCounts.not_approved, color: '#ba1a1a' },
    { name: 'Active', value: statusCounts.active, color: '#5a8f3a' },
  ].filter((s) => s.value > 0);

  const activityMap: Record<string, number> = {};
  scoped.forEach((s) => {
    const key = s.activity?.trim() || 'Other';
    activityMap[key] = (activityMap[key] ?? 0) + 1;
  });
  const sortedActivities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]);
  const topActivities = sortedActivities.slice(0, 4);
  const otherCount = sortedActivities.slice(4).reduce((sum, [, v]) => sum + v, 0);
  const activitySlices = [
    ...topActivities.map(([name, value], i) => ({
      name,
      value,
      color: ACTIVITY_COLORS[i] ?? '#6e7a6c',
    })),
    ...(otherCount > 0 ? [{ name: 'Other', value: otherCount, color: '#6e7a6c' }] : []),
  ];

  const approvedScoped = scoped.filter((s) => s.status === 'approved');
  const courtOrdered = approvedScoped.filter((r) => r.court_ordered).length;
  const voluntary = approvedScoped.filter((r) => !r.court_ordered).length;
  const courtSlices = [
    { name: 'Voluntary', value: voluntary, color: '#007536' },
    { name: 'Court-ordered', value: courtOrdered, color: '#835400' },
  ].filter((s) => s.value > 0);

  const chartExtras: ChartExtras = {
    trend: buildTrendSeries(scoped, period, now, interval),
    queueAge: buildQueueAgeBars(underReviewAll, now),
    decisions: buildDecisionBars(scoped),
    courtProgress: buildCourtProgressBars(courtAtRisk),
  };

  const byState = rollupUnits(
    scoped,
    (s) => s.state_fips,
    (id) => STATE_FIPS_NAME[id] ?? `State ${id}`,
  );

  const byCounty = rollupUnits(
    scoped,
    (s) => s.county_fips,
    (id) => COUNTY_NAMES[id] ?? `County ${id}`,
  );

  const neighName = new Map(COUNTY_NEIGHBORHOODS.map((n) => [n.id, n.name]));
  const byNeighborhood = rollupUnits(
    scoped.filter((s) => Boolean(s.neighborhood_id)),
    (s) => s.neighborhood_id,
    (id) => neighName.get(id) ?? id,
  );

  // Ensure every schematic neighborhood appears in the county drill list.
  const neighborhoodStats: NeighborhoodStats[] = COUNTY_NEIGHBORHOODS.map((n) => {
    const hit = byNeighborhood.find((r) => r.id === n.id);
    return (
      hit ?? {
        id: n.id,
        name: n.name,
        sessionCount: 0,
        hours: 0,
        underReview: 0,
      }
    );
  });

  const geoActivity: GeoActivityBundle = {
    byState,
    byCounty,
    byNeighborhood: neighborhoodStats,
  };

  const approvalRatePct =
    totalSessions > 0 ? Math.round((statusCounts.approved / totalSessions) * 100) : null;
  const topActivityLabel = sortedActivities[0]?.[0] ?? null;
  const hoursSparkline = chartExtras.trend.map((p) => p.approvedHours);

  return {
    donuts: [
      { title: 'Session Status', data: statusSlices, total: totalSessions },
      { title: 'Activity Types', data: activitySlices, total: totalSessions },
      { title: 'Approved — Session Type', data: courtSlices, total: courtOrdered + voluntary },
    ],
    chartExtras,
    neighborhoodStats,
    geoActivity,
    snapshot: { approvalRatePct, topActivityLabel, hoursSparkline },
  };
}
