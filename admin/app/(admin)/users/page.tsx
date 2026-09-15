import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, getVolunteerName } from '@/lib/volunteers';
import { buildCourtRisk } from '@/lib/court-risk';
import { computedHours } from '@/lib/format';
import { UsersClientShell, type UserRow } from './UsersClientShell';
import type { CourtOrder } from '@/types/database';

type SessionAgg = {
  sessionCount: number;
  totalApprovedHours: number;
  lastActive: string | null;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const initialFilter = params.filter === 'court' || params.filter === 'voluntary' ? params.filter : 'all';

  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  const [{ data: sessions }, { data: courtOrders }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select('user_id, status, court_ordered, duration_seconds, adjusted_hours, created_at'),
    supabase.from('court_orders').select('*'),
    serviceClient ? getVolunteerDirectory(serviceClient) : Promise.resolve(new Map()),
  ]);

  const aggByUser = new Map<string, SessionAgg>();
  for (const s of sessions ?? []) {
    const existing = aggByUser.get(s.user_id) ?? {
      sessionCount: 0,
      totalApprovedHours: 0,
      lastActive: null,
    };
    existing.sessionCount += 1;
    if (s.status === 'approved') {
      existing.totalApprovedHours += computedHours(s.duration_seconds, s.adjusted_hours);
    }
    if (!existing.lastActive || s.created_at > existing.lastActive) {
      existing.lastActive = s.created_at;
    }
    aggByUser.set(s.user_id, existing);
  }

  const riskByUser = new Map(
    buildCourtRisk((courtOrders ?? []) as CourtOrder[], sessions ?? [], directory, new Date()).map((r) => [
      r.id,
      r,
    ]),
  );

  const userIds =
    directory.size > 0
      ? [...directory.keys()]
      : [...new Set((sessions ?? []).map((s) => s.user_id))];

  const users: UserRow[] = userIds
    .map((id) => {
      const entry = directory.get(id);
      const agg = aggByUser.get(id);
      const risk = riskByUser.get(id);
      return {
        id,
        name: entry?.name ?? getVolunteerName(directory, id),
        email: entry?.email ?? '—',
        sessions: agg?.sessionCount ?? 0,
        totalHours: agg?.totalApprovedHours ?? 0,
        courtOrdered: Boolean(risk),
        lastActive: agg?.lastActive ?? null,
        joinedAt: entry?.createdAt ?? agg?.lastActive ?? null,
        requiredHours: risk?.requiredHours ?? null,
        completedHours: risk?.completedHours ?? null,
        courtStatus: risk?.status ?? null,
      };
    })
    .sort((a, b) => {
      if (a.lastActive && b.lastActive) return b.lastActive.localeCompare(a.lastActive);
      if (a.lastActive) return -1;
      if (b.lastActive) return 1;
      return a.name.localeCompare(b.name);
    });

  const total = users.length;
  const courtOrderedCount = users.filter((u) => u.courtOrdered).length;
  const atRiskCount = users.filter((u) => u.courtStatus === 'at_risk').length;
  const totalHours = users.reduce((sum, u) => sum + u.totalHours, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-md gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Users</h1>
        <a
          href="/api/export/users"
          download
          className="h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors inline-flex items-center gap-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Export CSV
        </a>
      </div>
      {!serviceClient && (
        <p role="status" className="mb-md font-body text-[13px] text-text-tertiary">
          Names limited — add <span className="font-data">SUPABASE_SERVICE_ROLE_KEY</span> to{' '}
          <span className="font-data">admin/.env.local</span> for the full Auth directory.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
        {[
          { label: 'Total Users', value: total },
          { label: 'Court-Ordered', value: courtOrderedCount },
          { label: 'At Risk', value: atRiskCount, color: atRiskCount > 0 ? 'text-[#ba1a1a]' : undefined },
          { label: 'Combined Hours', value: `${totalHours.toFixed(0)}h` },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">{stat.label}</p>
            <p className={`font-data text-[28px] font-semibold ${stat.color ?? 'text-text-primary'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <UsersClientShell users={users} initialFilter={initialFilter} />
    </div>
  );
}
