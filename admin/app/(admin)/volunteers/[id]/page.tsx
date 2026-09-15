import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { StatusChip } from '@/components/ui/StatusChip';
import { InfoRow } from '@/components/ui/InfoRow';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { computedHours, formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { resolveVolunteerName } from '@/lib/volunteers';
import { MOCK_COURT_HOURS } from '@/lib/dashboard-mock';
import type { SessionStatus } from '@/types/database';
import { CourtOrderForm } from './CourtOrderForm';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function displayOrDash(value: string | null | undefined) {
  if (value == null) return '—';
  const trimmed = value.trim();
  return trimmed || '—';
}

function BackLink({ href = '/users' }: { href?: string }) {
  return (
    <Link href={href} className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2">
      <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
      Volunteers
    </Link>
  );
}

type ProfileViewProps = {
  name: string;
  email: string;
  phone: string;
  userId: string;
  joinedAt: string | null;
  lastSignInAt: string | null;
  courtOrdered: boolean;
  requiredHours: number | null;
  courtCompletedHours: number;
  courtDueDate: string | null;
  caseReference: string | null;
  orderRecordedAt: string | null;
  sessionCount: number;
  approvedHours: number;
  sessions: Array<{
    id: string;
    activity: string | null;
    started_at: string | null;
    duration_seconds: number | null;
    adjusted_hours: number | null;
    distance_miles: number | null;
    status: string;
  }>;
  backHref?: string;
};

function VolunteerProfileView({
  name,
  email,
  phone,
  userId,
  joinedAt,
  lastSignInAt,
  courtOrdered,
  requiredHours,
  courtCompletedHours,
  courtDueDate,
  caseReference,
  orderRecordedAt,
  sessionCount,
  approvedHours,
  sessions,
  backHref = '/users',
}: ProfileViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <BackLink href={backHref} />

      <div className="bg-bg-surface border border-border-outline rounded-md p-xl mb-xl">
        <div className="flex items-start justify-between gap-md flex-wrap">
          <div>
            <div className="flex items-center gap-md mb-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="font-heading text-[20px] text-primary">{name[0]?.toUpperCase() ?? '?'}</span>
              </div>
              <div>
                <h1 className="font-heading text-[24px] leading-[32px] text-text-primary">{name}</h1>
                {courtOrdered && (
                  <span className="inline-block font-data text-[11px] font-semibold text-[#835400] bg-[#ffddb5] rounded-xs px-sm py-xs mt-xs">
                    Court-ordered
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-xs pl-[calc(3rem+16px)]">
              <p className="font-body text-[14px] text-text-tertiary">{email}</p>
              <p className="font-data text-[12px] text-text-tertiary">
                Joined {joinedAt ? formatDate(joinedAt) : '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-md flex-wrap">
            {[
              { label: 'Sessions', value: sessionCount },
              { label: 'Approved Hours', value: `${approvedHours.toFixed(1)}h` },
              ...(courtOrdered && requiredHours != null
                ? [{ label: 'Court Progress', value: `${courtCompletedHours.toFixed(1)} / ${requiredHours}h` }]
                : []),
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-bg-surface-elevated rounded-md p-md min-w-[80px]">
                <p className="font-data text-[22px] font-semibold text-text-primary">{stat.value}</p>
                <p className="font-data text-[10px] uppercase text-text-tertiary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Account Information</h2>
      <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-xl">
        <dl>
          <InfoRow label="Display name" value={name} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="User ID" value={userId} note={isUuid(userId) ? `Short ref: ${shortId(userId)}` : undefined} />
          <InfoRow label="Account created" value={joinedAt ? formatDate(joinedAt, 'MMM dd, yyyy HH:mm') : '—'} />
          <InfoRow
            label="Last sign-in"
            value={lastSignInAt ? formatDate(lastSignInAt, 'MMM dd, yyyy HH:mm') : '—'}
          />
          <InfoRow label="Volunteer type" value={courtOrdered ? 'Court-ordered' : 'Voluntary'} />
        </dl>
      </div>

      {courtOrdered && (
        <>
          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Court Order</h2>
          <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-xl">
            <dl>
              <InfoRow label="Required hours" value={requiredHours != null ? `${requiredHours}h` : '—'} />
              <InfoRow label="Completed hours" value={`${courtCompletedHours.toFixed(1)}h`} />
              <InfoRow label="Due date" value={courtDueDate ? formatDate(courtDueDate) : '—'} />
              <InfoRow label="Case reference" value={displayOrDash(caseReference)} />
              <InfoRow label="Order recorded" value={orderRecordedAt ? formatDate(orderRecordedAt) : '—'} />
            </dl>
          </div>
          <CourtOrderForm
            userId={userId}
            requiredHours={requiredHours}
            dueDate={courtDueDate}
            caseReference={caseReference}
          />
        </>
      )}

      <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Session History</h2>
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {['Activity', 'Date', 'Duration', 'Distance', 'Status'].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">{col}</span>
          ))}
        </div>
        {sessions.length === 0 ? (
          <div className="p-xl text-center">
            <p className="font-body text-[14px] text-text-tertiary">No sessions yet.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border-outline">
            {sessions.map((s) => (
              <li key={s.id} className="lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center px-lg py-md table-row-hover transition-colors">
                <div className="lg:contents flex flex-col gap-xs">
                  {isUuid(s.id) ? (
                    <Link
                      href={`/sessions/${s.id}`}
                      className="font-body text-[14px] font-medium text-text-primary hover:text-primary hover:underline"
                    >
                      {s.activity ?? 'Cleanup session'}
                    </Link>
                  ) : (
                    <span className="font-body text-[14px] font-medium text-text-primary">
                      {s.activity ?? 'Cleanup session'}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-md lg:contents">
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatDate(s.started_at)}</span>
                    <span className="font-data text-[13px] font-medium text-text-primary whitespace-nowrap">
                      {formatDuration(s.duration_seconds, s.adjusted_hours)}
                    </span>
                    <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatMiles(s.distance_miles)}</span>
                    <StatusChip status={s.status as SessionStatus} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default async function VolunteerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fixture court-hour cards use short ids (c1, c5, …) — render from mock data.
  if (!isUuid(id)) {
    const fixture = MOCK_COURT_HOURS.find((v) => v.id === id);
    if (!fixture) notFound();

    return (
      <VolunteerProfileView
        name={fixture.name}
        email={fixture.email}
        phone="—"
        userId={fixture.id}
        joinedAt={null}
        lastSignInAt={null}
        courtOrdered
        requiredHours={fixture.requiredHours}
        courtCompletedHours={fixture.completedHours}
        courtDueDate={fixture.dueDate}
        caseReference={null}
        orderRecordedAt={null}
        sessionCount={fixture.sessions}
        approvedHours={fixture.completedHours}
        sessions={[]}
        backHref="/users?filter=court"
      />
    );
  }

  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  if (!serviceClient) {
    return (
      <div className="max-w-4xl mx-auto">
        <BackLink />
        <div className="bg-bg-surface border border-border-outline rounded-md p-xl text-center">
          <p className="font-body text-[14px] text-text-tertiary">
            Volunteer profiles need <span className="font-data">SUPABASE_SERVICE_ROLE_KEY</span> in{' '}
            <span className="font-data">admin/.env.local</span> to look up Auth users.
          </p>
        </div>
      </div>
    );
  }

  const { data: userResponse, error: userError } = await serviceClient.auth.admin.getUserById(id);
  if (userError || !userResponse?.user) notFound();

  const user = userResponse.user;
  const meta = user.user_metadata ?? {};
  const name = resolveVolunteerName(user);
  const email = displayOrDash(user.email);
  const phone = displayOrDash(user.phone ?? (typeof meta.phone === 'string' ? meta.phone : null));

  const [{ data: sessions }, { data: courtOrders }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, activity, started_at, duration_seconds, adjusted_hours, distance_miles, status, court_ordered')
      .eq('user_id', id)
      .order('started_at', { ascending: false }),
    supabase
      .from('court_orders')
      .select('required_hours, due_date, case_reference, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const sessionRows = sessions ?? [];
  const approvedHours = sessionRows
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);

  const courtOrderList = courtOrders ?? [];
  const courtOrder = courtOrderList[0] ?? null;
  const courtOrdered = courtOrderList.length > 0;
  const requiredHours = courtOrder?.required_hours ?? null;
  const courtCompletedHours = sessionRows
    .filter((s) => s.status === 'approved' && s.court_ordered)
    .reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);

  return (
    <VolunteerProfileView
      name={name}
      email={email}
      phone={phone}
      userId={user.id}
      joinedAt={user.created_at}
      lastSignInAt={user.last_sign_in_at ?? null}
      courtOrdered={courtOrdered}
      requiredHours={requiredHours}
      courtCompletedHours={courtCompletedHours}
      courtDueDate={courtOrder?.due_date ?? null}
      caseReference={courtOrder?.case_reference ?? null}
      orderRecordedAt={courtOrder?.created_at ?? null}
      sessionCount={sessionRows.length}
      approvedHours={approvedHours}
      sessions={sessionRows}
    />
  );
}
