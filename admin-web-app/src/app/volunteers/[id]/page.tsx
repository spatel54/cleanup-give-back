import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { InfoRow } from '@/components/ui/InfoRow';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { CourtOrderForm } from '@/components/ui/CourtOrderForm';
import { VolunteerTimeline } from '@/components/ui/VolunteerTimeline';
import { VolunteerCommunicationLog } from '@/components/ui/VolunteerCommunicationLog';
import { VolunteerSessionHistory } from '@/components/ui/VolunteerSessionHistory';
import { formatDate, formatDateTime } from '@/lib/mock-data';
import {
  loadLiveVolunteerById,
  loadVolunteerTimeline,
  loadVolunteerEmailLog,
  loadVolunteerContactNotes,
} from '@/lib/live-data';
import { SidebarDemo } from '@/components/ui/sidebar-demo';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function displayOrDash(value: string | null | undefined) {
  if (value == null) return '-';
  const trimmed = value.trim();
  return trimmed || '-';
}

function shortId(uuid: string): string {
  return uuid.substring(0, 8);
}

function formatMiles(miles: number | null): string {
  if (miles == null) return '-';
  return `${miles.toFixed(1)} mi`;
}

function computedHours(durationSeconds: number | null, adjustedHours: number | null): number {
  if (adjustedHours != null) return adjustedHours;
  if (durationSeconds == null) return 0;
  return durationSeconds / 3600;
}

function ErrorFallback({ error, id }: { error: string; id: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto py-lg">
          <Link
            href="/volunteers"
            className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
            Volunteers
          </Link>
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Unable to load volunteer profile</h2>
            <p className="font-body text-[14px]">{error}</p>
            <p className="font-body text-[12px] mt-sm text-[#ba1a1a]/80">
              Volunteer ID: {id}
            </p>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}

export default async function VolunteerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  try {
    const { data: volunteer, useMock } = await loadLiveVolunteerById(id);

    if (!volunteer) notFound();

  const [timelineEvents, emailLog, contactNotes] = await Promise.all([
    loadVolunteerTimeline(
      volunteer.id,
      volunteer.sessions.map((s) => s.id),
    ),
    loadVolunteerEmailLog(volunteer.id),
    loadVolunteerContactNotes(volunteer.id),
  ]);

  const approvedSessions = volunteer.sessions.filter((s) => s.status === 'approved');

  const approvedHours = approvedSessions.reduce(
    (sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours),
    0,
  );

  const totalMilesWalked = approvedSessions.reduce(
    (sum, s) => sum + (s.distance_miles ?? 0),
    0,
  );

  // Only counts sessions since the last reset - hours reset to zero every time a
  // service letter is generated (auto) or Admin resets manually.
  const courtCompletedHours = volunteer.sessions
    .filter(
      (s) =>
        s.status === 'approved' &&
        s.court_ordered &&
        (!volunteer.hoursResetAt || (s.started_at != null && s.started_at > volunteer.hoursResetAt)),
    )
    .reduce((sum, s) => sum + computedHours(s.duration_seconds, s.adjusted_hours), 0);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto">
          <Link
            href="/volunteers"
            className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
            Volunteers
          </Link>

          <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-lg">
            <div className="flex items-start justify-between gap-md flex-wrap">
              <div>
                <div className="flex items-center gap-md mb-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-heading text-[20px] text-primary">
                      {volunteer.name[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div>
                    <h1 className="font-heading text-[24px] leading-[32px] text-text-primary">
                      {volunteer.name}
                    </h1>
                    {volunteer.courtOrdered && (
                      <div className="mt-xs">
                        <CourtBadge />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-xs pl-[calc(3rem+16px)]">
                  <p className="font-body text-[14px] text-text-tertiary">{volunteer.email}</p>
                  <p className="font-data text-[12px] text-text-tertiary">
                    Joined {volunteer.joinedAt ? formatDate(volunteer.joinedAt) : '-'}
                  </p>
                </div>
              </div>

              <div className="flex gap-md flex-wrap">
                {[
                  { label: 'Sessions', value: volunteer.sessions.length },
                  { label: 'Approved Hours', value: `${approvedHours.toFixed(1)}h` },
                  { label: 'Miles Walked', value: formatMiles(totalMilesWalked) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center bg-bg-surface-elevated rounded-md p-md min-w-[80px]"
                  >
                    <p className="font-data text-[22px] font-semibold text-text-primary">{stat.value}</p>
                    <p className="font-data text-[10px] uppercase text-text-tertiary">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Account Information
          </h2>
          <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg">
            <dl>
              <InfoRow label="Display name" value={volunteer.name} />
              <InfoRow label="Email" value={volunteer.email} />
              <InfoRow label="Phone" value={displayOrDash(volunteer.phone)} />
              <InfoRow
                label="User ID"
                value={volunteer.id}
                note={isUuid(volunteer.id) ? `Short ref: ${shortId(volunteer.id)}` : undefined}
              />
              <InfoRow
                label="Account created"
                value={volunteer.joinedAt ? formatDateTime(volunteer.joinedAt) : '-'}
              />
              <InfoRow
                label="Last active"
                value={volunteer.lastActive ? formatDateTime(volunteer.lastActive) : '-'}
              />
              <InfoRow label="Volunteer type" value={volunteer.courtOrdered ? 'Court-ordered' : 'Voluntary'} />
            </dl>
          </div>

          {volunteer.courtOrdered && (
            <>
              <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
                Court Order
              </h2>
              <CourtOrderForm
                userId={volunteer.id}
                requiredHours={volunteer.requiredHours}
                dueDate={volunteer.courtDueDate}
                caseReference={volunteer.caseReference}
                completedHours={courtCompletedHours}
              />
            </>
          )}

          {volunteer.sessions.length > 0 && (
            <>
              <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
                Activity Pattern
              </h2>
              <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md mb-lg">
                <dl>
                  <InfoRow
                    label="Recent frequency"
                    value={`${volunteer.activityPattern.sessionsLast7Days} session${volunteer.activityPattern.sessionsLast7Days === 1 ? '' : 's'} in the last 7 days`}
                    note={`avg ${volunteer.activityPattern.priorWeeklyAverage.toFixed(1)}/week over the prior month`}
                  />
                  <InfoRow
                    label="Missed checkpoints"
                    value={`${volunteer.activityPattern.invalidSessionsLast30Days} in the last 30 days`}
                    note="Auto-invalidated for missing a required selfie/progress checkpoint"
                  />
                  <InfoRow
                    label="Deleted & resubmitted"
                    value={`${volunteer.activityPattern.deleteCount} session${volunteer.activityPattern.deleteCount === 1 ? '' : 's'} deleted (all-time)`}
                  />
                  {volunteer.courtOrdered && (
                    <InfoRow
                      label="Near-deadline volume"
                      value={
                        volunteer.activityPattern.nearDeadlineVolumeSpike
                          ? 'Multiple sessions clustered near the court due date'
                          : 'No unusual clustering near the due date'
                      }
                    />
                  )}
                </dl>
                <p className="font-body text-[12px] text-text-tertiary mt-sm">
                  Trends only - not a score or a verdict. Cross-reference with the walking path and photos before declining.
                </p>
              </div>
            </>
          )}

          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Communication
          </h2>
          <VolunteerCommunicationLog volunteerId={volunteer.id} emails={emailLog} notes={contactNotes} />

          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Timeline
          </h2>
          <VolunteerTimeline events={timelineEvents} />

          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Session History
          </h2>
          <VolunteerSessionHistory
            volunteerId={volunteer.id}
            volunteerName={volunteer.name}
            sessions={volunteer.sessions}
          />
        </div>
      </SidebarDemo>
    </div>
  );
  } catch (error) {
    return (
      <ErrorFallback 
        error={error instanceof Error ? error.message : 'Failed to load volunteer data'} 
        id={id}
      />
    );
  }
}