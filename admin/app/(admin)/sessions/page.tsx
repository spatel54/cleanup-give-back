import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, getVolunteerName } from '@/lib/volunteers';
import { MOCK_SESSIONS } from '@/lib/dashboard-mock';
import { SessionsClientShell } from './SessionsClientShell';
import type { Session, SessionStatus } from '@/types/database';

const PAGE_SIZE = 25;

interface SearchParams {
  status?: string;
  page?: string;
  q?: string;
  court?: string;
  sort?: string;
  from?: string;
  to?: string;
}

type SessionRow = Session & { volunteer_name: string };

function mockToSessionRow(m: (typeof MOCK_SESSIONS)[number]): SessionRow {
  return {
    id: m.id,
    user_id: m.user_id,
    activity: m.activity,
    court_ordered: m.court_ordered,
    description: null,
    started_at: m.started_at,
    ended_at: m.ended_at,
    duration_seconds: m.duration_seconds,
    distance_miles: m.distance_miles,
    route: null,
    status: m.status as SessionStatus,
    created_at: m.created_at,
    adjusted_hours: m.adjusted_hours,
    admin_notes: null,
    decline_reason: null,
    letterhead_generated_at: null,
    volunteer_name: m.volunteer_name,
  };
}

function filterMockSessions(params: {
  statusFilter: SessionStatus | 'all' | undefined;
  courtOnly: boolean;
  q: string;
  sort: string;
  page: number;
  from: string;
  to: string;
}): { rows: SessionRow[]; totalCount: number; totalPages: number } {
  let rows = MOCK_SESSIONS.map(mockToSessionRow);

  if (params.statusFilter && params.statusFilter !== 'all') {
    rows = rows.filter((s) => s.status === params.statusFilter);
  }
  if (params.courtOnly) {
    rows = rows.filter((s) => s.court_ordered);
  }
  if (params.q.trim()) {
    const needle = params.q.trim().toLowerCase();
    rows = rows.filter(
      (s) =>
        s.volunteer_name.toLowerCase().includes(needle) ||
        (s.activity ?? '').toLowerCase().includes(needle) ||
        s.id.toLowerCase().includes(needle),
    );
  }
  if (params.from) {
    const fromDate = new Date(params.from);
    rows = rows.filter((s) => new Date(s.started_at ?? s.created_at) >= fromDate);
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    rows = rows.filter((s) => new Date(s.started_at ?? s.created_at) <= toDate);
  }

  rows.sort((a, b) => {
    const aTime = new Date(a.started_at ?? a.created_at).getTime();
    const bTime = new Date(b.started_at ?? b.created_at).getTime();
    return params.sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = (params.page - 1) * PAGE_SIZE;
  return {
    rows: rows.slice(from, from + PAGE_SIZE),
    totalCount,
    totalPages,
  };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const statusFilter = params.status as SessionStatus | 'all' | undefined;
  const q = params.q ?? '';
  const courtOnly = params.court === '1';
  const sort = params.sort ?? 'newest';
  const fromDate = params.from ?? '';
  const toDate = params.to ?? '';

  const supabase = await createDataClient();

  // Probe for any live rows so filters that return empty don't flip into mock mode.
  const { count: liveTotal } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });
  const useMock = !liveTotal;

  if (useMock) {
    const { rows, totalCount, totalPages } = filterMockSessions({
      statusFilter,
      courtOnly,
      q,
      sort,
      page,
      from: fromDate,
      to: toDate,
    });

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-md gap-md flex-wrap">
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Sessions</h1>
          <a
            href="/api/export/sessions"
            download
            className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Export CSV
          </a>
        </div>

        <SessionsClientShell
          sessions={rows}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={page}
          currentStatus={statusFilter ?? 'all'}
          currentQ={q}
          courtOnly={courtOnly}
          sort={sort}
          from={fromDate}
          to={toDate}
          isMock
        />
      </div>
    );
  }

  const serviceClient = await tryCreateServiceClient();
  const directory = serviceClient ? await getVolunteerDirectory(serviceClient) : new Map();

  let query = supabase
    .from('sessions')
    .select(
      'id, user_id, activity, started_at, ended_at, duration_seconds, adjusted_hours, distance_miles, status, court_ordered, created_at',
      { count: 'exact' },
    );

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (courtOnly) {
    query = query.eq('court_ordered', true);
  }
  if (q.trim()) {
    const needle = q.trim().replace(/[%,()]/g, '');
    const matchingUserIds = [...directory.entries()]
      .filter(([, v]) => v.name.toLowerCase().includes(q.trim().toLowerCase()))
      .map(([id]) => id);
    const orClauses = [`activity.ilike.%${needle}%`, `id.ilike.%${needle}%`];
    if (matchingUserIds.length > 0) {
      orClauses.push(`user_id.in.(${matchingUserIds.join(',')})`);
    }
    query = query.or(orClauses.join(','));
  }
  if (fromDate) {
    query = query.gte('started_at', fromDate);
  }
  if (toDate) {
    const toDateObj = new Date(toDate);
    toDateObj.setHours(23, 59, 59, 999);
    query = query.lte('started_at', toDateObj.toISOString());
  }

  switch (sort) {
    case 'oldest':
      query = query.order('started_at', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('started_at', { ascending: false });
      break;
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data: sessions, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const sessionRows: SessionRow[] = (sessions ?? []).map((s) => ({
    ...s,
    description: null,
    route: null,
    admin_notes: null,
    decline_reason: null,
    letterhead_generated_at: null,
    volunteer_name: getVolunteerName(directory, s.user_id),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-md gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Sessions</h1>
        <a
          href="/api/export/sessions"
          download
          className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Export CSV
        </a>
      </div>

      <SessionsClientShell
        sessions={sessionRows}
        totalCount={count ?? 0}
        totalPages={totalPages}
        currentPage={page}
        currentStatus={statusFilter ?? 'all'}
        currentQ={q}
        courtOnly={courtOnly}
        sort={sort}
        from={fromDate}
        to={toDate}
        isMock={false}
      />
    </div>
  );
}
