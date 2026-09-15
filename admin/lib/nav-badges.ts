import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createServiceRoleClient, createDataClient } from '@/lib/supabase/server';
import { MOCK_COURT_HOURS, MOCK_OPEN_ORDERS, MOCK_SESSIONS } from '@/lib/dashboard-mock';
import { buildCourtRisk } from '@/lib/court-risk';
import type { VolunteerDirectory } from '@/lib/volunteers';
import type { CourtOrder } from '@/types/database';

export type NavBadges = {
  sessionsUnderReview: number;
  courtAtRisk: number;
  openOrders: number;
};

export const NAV_BADGES_TAG = 'nav-badges';

/** Empty directory — badge counts only need status, not volunteer names. */
const EMPTY_DIRECTORY: VolunteerDirectory = new Map();

type BadgeSource = {
  liveSessionCount: number | null;
  underReviewCount: number | null;
  openOrdersCount: number | null;
  courtOrders: Pick<CourtOrder, 'user_id' | 'required_hours' | 'due_date'>[] | null;
  approvedCourtSessions: {
    user_id: string;
    status: string;
    court_ordered: boolean;
    duration_seconds: number | null;
    adjusted_hours: number | null;
  }[] | null;
};

async function loadBadgeSource(): Promise<BadgeSource> {
  // Prefer cookie-free service role so this can run inside unstable_cache.
  const supabase = createServiceRoleClient() ?? (await createDataClient());

  const [
    { count: liveSessionCount },
    { count: underReviewCount },
    { count: openOrdersCount },
    { data: courtOrders },
    { data: approvedCourtSessions },
  ] = await Promise.all([
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'under_review'),
    supabase
      .from('shop_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'paid', 'shipped']),
    supabase.from('court_orders').select('user_id, required_hours, due_date'),
    supabase
      .from('sessions')
      .select('user_id, status, court_ordered, duration_seconds, adjusted_hours')
      .eq('status', 'approved')
      .eq('court_ordered', true),
  ]);

  return {
    liveSessionCount: liveSessionCount ?? null,
    underReviewCount: underReviewCount ?? null,
    openOrdersCount: openOrdersCount ?? null,
    courtOrders: (courtOrders as BadgeSource['courtOrders']) ?? null,
    approvedCourtSessions: (approvedCourtSessions as BadgeSource['approvedCourtSessions']) ?? null,
  };
}

function computeNavBadges(source: BadgeSource): NavBadges {
  const useMockSessions = !source.liveSessionCount;

  const sessionsUnderReview = useMockSessions
    ? MOCK_SESSIONS.filter((s) => s.status === 'under_review').length
    : (source.underReviewCount ?? 0);

  const courtOrders = source.courtOrders ?? [];
  const useMockCourt = courtOrders.length === 0;
  const courtAtRisk = useMockCourt
    ? MOCK_COURT_HOURS.filter((v) => v.status === 'at_risk').length
    : buildCourtRisk(
        courtOrders as CourtOrder[],
        source.approvedCourtSessions ?? [],
        EMPTY_DIRECTORY,
        new Date(),
      ).filter((v) => v.status === 'at_risk').length;

  const openOrders = useMockSessions ? MOCK_OPEN_ORDERS : (source.openOrdersCount ?? 0);

  return {
    sessionsUnderReview,
    courtAtRisk,
    openOrders,
  };
}

/**
 * Cross-request cache (30s). Uses cookie-free service role when available so
 * `unstable_cache` stays valid. Falls back to uncached path without service key.
 */
const getNavBadgesCached = unstable_cache(
  async (): Promise<NavBadges> => {
    const source = await loadBadgeSource();
    return computeNavBadges(source);
  },
  ['nav-badges-v1'],
  { revalidate: 30, tags: [NAV_BADGES_TAG] },
);

/**
 * Sidebar badge counts. Per-request `cache()` + 30s `unstable_cache` so tab
 * navigations do not re-run full session scans / listUsers for the shell.
 */
export const getNavBadges = cache(async (): Promise<NavBadges> => {
  if (!createServiceRoleClient()) {
    // Without service role, loadBadgeSource may touch cookies via createDataClient —
    // cannot use unstable_cache. Still slim queries + per-request memo.
    return computeNavBadges(await loadBadgeSource());
  }
  return getNavBadgesCached();
});
