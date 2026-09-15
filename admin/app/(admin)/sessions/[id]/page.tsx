import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { StatusChip } from '@/components/ui/StatusChip';
import { CourtBadge } from '@/components/ui/CourtBadge';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { formatDate, formatDuration, formatMiles, shortId } from '@/lib/format';
import { resolveVolunteerName } from '@/lib/volunteers';
import { MOCK_SESSIONS } from '@/lib/dashboard-mock';
import { SessionActions } from './SessionActions';
import { MockSessionActions } from './MockSessionActions';
import { PhotoGrid } from './PhotoGrid';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { WalkingPath } from './WalkingPath';
import { SessionDurationRow, SessionHoursProvider } from './SessionHoursContext';
import type { SessionStatus } from '@/types/database';

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createDataClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    const mock = MOCK_SESSIONS.find((m) => m.id === id);
    if (!mock) notFound();

    return (
      <div className="max-w-6xl mx-auto">
        <Link href="/sessions" className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2">
          <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
          Sessions
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
          <div>
            <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
              Session {shortId(mock.id)}
            </p>
            <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
              {mock.activity ?? 'Cleanup Session'}
            </h1>
            <p className="font-body text-base text-primary mt-xs">{mock.volunteer_name}</p>
          </div>
          <div className="flex items-center gap-sm shrink-0">
            {mock.court_ordered && <CourtBadge />}
            <StatusChip status={mock.status as SessionStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
          <div className="lg:col-span-3 flex flex-col gap-lg">
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Session Info</h2>
              <dl className="grid grid-cols-2 gap-x-lg gap-y-md">
                <InfoRow label="Volunteer" value={mock.volunteer_name} />
                <InfoRow label="Activity" value={mock.activity ?? '—'} />
                <InfoRow label="Court Ordered" value={mock.court_ordered ? 'Yes' : 'No'} />
                <InfoRow label="Started" value={formatDate(mock.started_at, 'MMM dd, yyyy HH:mm')} />
                <InfoRow label="Ended" value={formatDate(mock.ended_at, 'MMM dd, yyyy HH:mm')} />
                <InfoRow label="Duration" value={formatDuration(mock.duration_seconds, mock.adjusted_hours)} />
                <InfoRow label="Distance" value={formatMiles(mock.distance_miles)} />
              </dl>
            </section>

            <WalkingPath distanceMiles={mock.distance_miles} pointCount={null} checkpoints={[]} />

            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Photos</h2>
              <PhotoPlaceholder />
            </section>
          </div>

          <div className="lg:col-span-2">
            <MockSessionActions
              volunteerName={mock.volunteer_name}
              initialStatus={mock.status as SessionStatus}
            />
          </div>
        </div>
      </div>
    );
  }

  // Service role is optional here so a real session still renders (with a short-id
  // fallback name and no photos) when SUPABASE_SERVICE_ROLE_KEY isn't configured yet.
  const serviceClient = await tryCreateServiceClient();

  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('*')
    .eq('session_id', id)
    .order('captured_at', { ascending: true });

  let volunteerName = `Volunteer ${shortId(session.user_id)}`;
  if (serviceClient) {
    const { data: userResponse } = await serviceClient.auth.admin.getUserById(session.user_id);
    const volunteer = userResponse?.user;
    if (volunteer) volunteerName = resolveVolunteerName(volunteer);
  }

  // Sign photo URLs (1-hour expiry) — requires service role for the private bucket.
  const signedCheckpoints = serviceClient
    ? await Promise.all(
        (checkpoints ?? []).map(async (cp) => {
          const [selfieUrl, progressUrl] = await Promise.all([
            cp.selfie_path
              ? serviceClient.storage.from('session-photos').createSignedUrl(cp.selfie_path, 3600)
              : null,
            cp.progress_path
              ? serviceClient.storage.from('session-photos').createSignedUrl(cp.progress_path, 3600)
              : null,
          ]);
          if (selfieUrl?.error) {
            console.warn(`[sessions/${id}] selfie signing failed:`, selfieUrl.error.message);
          }
          if (progressUrl?.error) {
            console.warn(`[sessions/${id}] progress signing failed:`, progressUrl.error.message);
          }
          return {
            ...cp,
            selfieSignedUrl: selfieUrl?.data?.signedUrl ?? null,
            progressSignedUrl: progressUrl?.data?.signedUrl ?? null,
          };
        })
      )
    : [];
  const hasSignedPhoto = signedCheckpoints.some((cp) => cp.selfieSignedUrl || cp.progressSignedUrl);

  const routePointCount = Array.isArray(session.route) ? session.route.length : null;

  return (
    <SessionHoursProvider
      durationSeconds={session.duration_seconds}
      initialAdjustedHours={session.adjusted_hours}
    >
    <div className="max-w-6xl mx-auto">
      <Link href="/sessions" className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2">
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Sessions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
        <div>
          <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
            Session {shortId(session.id)}
          </p>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
            {session.activity ?? 'Cleanup Session'}
          </h1>
          <Link
            href={`/volunteers/${session.user_id}`}
            className="font-body text-base text-primary hover:underline mt-xs inline-block"
          >
            {volunteerName}
          </Link>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {session.court_ordered && <CourtBadge />}
          <StatusChip status={session.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        {/* Left column — Info + Photos */}
        <div className="lg:col-span-3 flex flex-col gap-lg">
          {/* Session Info */}
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Session Info</h2>
            <dl className="grid grid-cols-2 gap-x-lg gap-y-md">
              <InfoRow label="Volunteer" value={volunteerName} />
              <InfoRow label="User ID" value={shortId(session.user_id)} />
              <InfoRow label="Activity" value={session.activity ?? '—'} />
              <InfoRow label="Court Ordered" value={session.court_ordered ? 'Yes' : 'No'} />
              <InfoRow label="Started" value={formatDate(session.started_at, 'MMM dd, yyyy HH:mm')} />
              <InfoRow label="Ended" value={formatDate(session.ended_at, 'MMM dd, yyyy HH:mm')} />
              <SessionDurationRow />
              <InfoRow label="Distance" value={formatMiles(session.distance_miles)} />
              <InfoRow label="Checkpoints" value={String(checkpoints?.length ?? 0)} />
              {session.letterhead_generated_at && (
                <InfoRow
                  label="Letterhead"
                  value={`Last generated: ${formatDate(session.letterhead_generated_at)}`}
                />
              )}
              {session.description && (
                <div className="col-span-2">
                  <InfoRow label="Description" value={session.description} />
                </div>
              )}
              {session.decline_reason && (
                <div className="col-span-2">
                  <InfoRow label="Decline Reason" value={session.decline_reason} />
                </div>
              )}
            </dl>
          </section>

          <WalkingPath
            distanceMiles={session.distance_miles}
            pointCount={routePointCount}
            checkpoints={checkpoints ?? []}
          />

          {/* Photos */}
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">
              Photos{checkpoints && checkpoints.length > 0 ? ` (${checkpoints.length} checkpoint${checkpoints.length !== 1 ? 's' : ''})` : ''}
            </h2>
            {hasSignedPhoto ? (
              <PhotoGrid checkpoints={signedCheckpoints} />
            ) : (
              <>
                <PhotoPlaceholder />
                <p className="font-body text-[13px] text-text-tertiary mt-md">
                  {!serviceClient && (checkpoints?.length ?? 0) > 0 ? (
                    <>
                      {checkpoints!.length} checkpoint{checkpoints!.length !== 1 ? 's' : ''} logged — photo previews
                      need <span className="font-data">SUPABASE_SERVICE_ROLE_KEY</span> in{' '}
                      <span className="font-data">admin/.env.local</span>.
                    </>
                  ) : serviceClient && (checkpoints?.length ?? 0) > 0 ? (
                    <>
                      {checkpoints!.length} checkpoint{checkpoints!.length !== 1 ? 's' : ''} logged, but photo
                      signing failed — check the server logs and the{' '}
                      <span className="font-data">session-photos</span> Storage bucket policy.
                    </>
                  ) : (
                    'Placeholder — no photos captured for this session yet.'
                  )}
                </p>
              </>
            )}
          </section>
        </div>

        {/* Right column — Admin Actions */}
        <div className="lg:col-span-2">
          <SessionActions
            session={session}
            volunteerId={session.user_id}
            volunteerName={volunteerName}
          />
        </div>
      </div>
    </div>
    </SessionHoursProvider>
  );
}

function InfoRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase mb-xs">{label}</dt>
      <dd className="font-body text-base text-text-primary">
        {value}
        {note && <span className="ml-sm font-data text-[11px] text-primary">({note})</span>}
      </dd>
    </div>
  );
}
