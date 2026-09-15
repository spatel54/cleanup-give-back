import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createDataClient, tryCreateServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory } from '@/lib/volunteers';
import { buildCourtRisk } from '@/lib/court-risk';
import { InfoRow } from '@/components/ui/InfoRow';
import { ChevronLeftIcon } from '@/components/ui/Icons';
import { formatEventWhen } from '@/lib/events';
import { EventDetailActions } from './EventDetailActions';
import { NotifyAtRiskVolunteers, type NotifyCandidate } from './NotifyAtRiskVolunteers';
import type { CourtOrder, Event } from '@/types/database';

async function loadAtRiskCandidates(eventId: string): Promise<NotifyCandidate[]> {
  const supabase = await createDataClient();
  const serviceClient = await tryCreateServiceClient();

  const [{ data: courtOrders }, { data: sessions }, { data: notices }, directory] = await Promise.all([
    supabase.from('court_orders').select('*'),
    supabase.from('sessions').select('user_id, status, court_ordered, duration_seconds, adjusted_hours'),
    supabase.from('event_volunteer_notices').select('user_id, notified_at').eq('event_id', eventId),
    serviceClient ? getVolunteerDirectory(serviceClient) : Promise.resolve(new Map()),
  ]);

  const lastByUser = new Map(
    (notices ?? []).map((n: { user_id: string; notified_at: string }) => [n.user_id, n.notified_at]),
  );

  const risk = buildCourtRisk((courtOrders ?? []) as CourtOrder[], sessions ?? [], directory, new Date());
  return risk
    .filter((r) => r.status === 'at_risk')
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: directory.get(r.id)?.email ?? null,
      remainingHours: Math.max(0, r.requiredHours - r.completedHours),
      lastNotifiedAt: lastByUser.get(r.id) ?? null,
    }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createDataClient();

  const [{ data }, atRiskCandidates] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single(),
    loadAtRiskCandidates(id),
  ]);
  if (!data) notFound();

  const event = data as Event;
  const when = formatEventWhen(event.starts_at, event.ends_at);
  const isPast = new Date(event.starts_at).getTime() < Date.now();
  const gallery =
    event.image_urls?.length > 0
      ? event.image_urls
      : event.image_url
        ? [event.image_url]
        : [];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/events"
        className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Events
      </Link>

      <div className="flex items-start justify-between gap-md mb-lg flex-wrap">
        <div className="min-w-0">
          <p className="font-data text-[12px] text-text-tertiary tracking-widest uppercase mb-xs">
            {isPast ? 'Past event' : 'Upcoming event'}
          </p>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">{event.title}</h1>
          <p className="font-body text-base text-text-tertiary mt-xs">{when}</p>
        </div>
        <span
          className={`shrink-0 font-data text-[11px] font-semibold rounded-xs px-sm py-xs border ${
            event.is_published
              ? 'text-primary bg-[#f7fff1] border-primary/30'
              : 'text-[#835400] bg-[#ffddb5] border-[#fcab29]/50'
          }`}
        >
          {event.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        <div className="lg:col-span-3 flex flex-col gap-lg">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Details</h2>
            <dl>
              <InfoRow label="When" value={when} />
              <InfoRow label="Location" value={event.location?.trim() || '—'} />
              <InfoRow label="Address" value={event.address?.trim() || '—'} />
              <InfoRow label="Organizer" value={event.organizer?.trim() || '—'} />
              <InfoRow
                label="Coordinates"
                value={
                  event.lat != null && event.lng != null
                    ? `${event.lat}, ${event.lng}`
                    : '—'
                }
              />
            </dl>
          </section>

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Description</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.description?.trim() || 'No description yet.'}
            </p>
          </section>

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">What to bring</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.what_to_bring?.trim() || '—'}
            </p>
          </section>

          {gallery.length > 0 ? (
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">
                Event photos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {gallery.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt=""
                    className="w-full max-h-72 object-cover rounded-sm border border-border-outline"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-lg">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg sticky top-6">
            <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Actions</h2>
            <EventDetailActions eventId={event.id} isPublished={event.is_published} />
            <p className="font-body text-[12px] text-text-tertiary mt-md">
              {event.is_published
                ? 'This event is visible in the mobile app Upcoming Events feed.'
                : 'Publish this event to show it in the mobile app.'}
            </p>
          </section>

          <NotifyAtRiskVolunteers eventId={event.id} candidates={atRiskCandidates} />
        </div>
      </div>
    </div>
  );
}
