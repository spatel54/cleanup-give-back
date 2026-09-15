import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { MOCK_COURT_AT_RISK, MOCK_SESSIONS, type MockSession } from '@/lib/dashboard-mock';
import {
  inInterval,
  parsePeriodSelection,
  periodInterval,
  periodLabel,
  previousPeriodInterval,
  type PeriodSelection,
} from '@/lib/dashboard-period';
import { buildCourtRisk } from '@/lib/court-risk';
import { getVolunteerDirectory, getVolunteerName, type VolunteerDirectory } from '@/lib/volunteers';
import type { CourtRiskItem } from '@/components/dashboard/types';
import type { CourtOrder } from '@/types/database';

function filterByEndedAt<T extends { ended_at?: string | null; started_at?: string | null }>(
  rows: T[],
  interval: { start: Date; end: Date } | null,
): T[] {
  return rows.filter((r) => inInterval(r.ended_at ?? r.started_at, interval));
}

export type ScopedDashboardData = {
  useMock: boolean;
  selection: PeriodSelection;
  period: PeriodSelection['period'];
  periodLabelText: string;
  now: Date;
  interval: { start: Date; end: Date } | null;
  prevInterval: { start: Date; end: Date } | null;
  sessions: MockSession[];
  scoped: MockSession[];
  prevScoped: MockSession[];
  underReviewAll: MockSession[];
  courtAtRisk: CourtRiskItem[];
};

/**
 * Single source of truth for "sessions scoped to a period, with real volunteer
 * names and real court risk" — shared by Today, Sessions-derived KPIs, and the
 * Insights page so the mock/live fallback logic never drifts between them.
 */
export async function loadScopedDashboardData(params: {
  period?: string;
  from?: string;
  to?: string;
}): Promise<ScopedDashboardData> {
  const selection = parsePeriodSelection(params);
  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();
  const now = new Date();
  const interval = periodInterval(selection, now);
  const prevInterval = previousPeriodInterval(selection, now);

  const [{ data: allSessions }, { data: courtOrders }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        'id, user_id, activity, started_at, ended_at, created_at, status, duration_seconds, adjusted_hours, court_ordered, distance_miles',
      )
      .order('created_at', { ascending: false }),
    supabase.from('court_orders').select('*'),
    serviceClient
      ? getVolunteerDirectory(serviceClient)
      : Promise.resolve(new Map() as VolunteerDirectory),
  ]);

  const useMock = !allSessions || allSessions.length === 0;
  const sessions: MockSession[] = useMock
    ? MOCK_SESSIONS
    : (allSessions as Omit<MockSession, 'volunteer_name' | 'neighborhood_id' | 'state_fips' | 'county_fips'>[]).map((s) => ({
        ...s,
        volunteer_name: getVolunteerName(directory, s.user_id),
        started_at: s.started_at ?? s.created_at,
        ended_at: s.ended_at ?? s.started_at ?? s.created_at,
        created_at: s.created_at ?? s.started_at ?? now.toISOString(),
        // Until session GPS → FIPS geocoding ships, attribute live rows to Cook County, IL.
        neighborhood_id: 'midtown',
        state_fips: '17',
        county_fips: '17031',
      }));

  const scoped = filterByEndedAt(sessions, interval);
  const prevScoped = prevInterval ? filterByEndedAt(sessions, prevInterval) : [];

  const underReviewAll = sessions
    .filter((s) => s.status === 'under_review')
    .sort((a, b) => {
      if (a.court_ordered !== b.court_ordered) return a.court_ordered ? -1 : 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const courtAtRisk = useMock
    ? MOCK_COURT_AT_RISK
    : buildCourtRisk((courtOrders as CourtOrder[]) ?? [], sessions, directory, now);

  return {
    useMock,
    selection,
    period: selection.period,
    periodLabelText: periodLabel(selection, now),
    now,
    interval,
    prevInterval,
    sessions,
    scoped,
    prevScoped,
    underReviewAll,
    courtAtRisk,
  };
}
