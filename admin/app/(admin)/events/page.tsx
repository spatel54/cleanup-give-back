import Link from 'next/link';
import { createDataClient } from '@/lib/supabase/server';
import { formatEventWhen, withEventTiming, type EventListItem } from '@/lib/events';
import { MapPinIcon, CalendarIcon } from '@/components/ui/Icons';
import type { Event } from '@/types/database';

function PublishChip({ published }: { published: boolean }) {
  return (
    <span
      className={`font-data text-[11px] font-semibold rounded-xs px-sm py-xs border ${
        published
          ? 'text-primary bg-[#f7fff1] border-primary/30'
          : 'text-[#835400] bg-[#ffddb5] border-[#fcab29]/50'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  const when = formatEventWhen(event.starts_at, event.ends_at);
  const isPast = event.timing === 'past';

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block bg-bg-surface border border-border-outline rounded-md p-lg transition-colors hover:border-primary/40 hover:bg-[#f7fff1]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        isPast ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[17px] text-text-primary mb-xs">{event.title}</p>
          {event.description ? (
            <p className="font-body text-[13px] text-text-tertiary mb-sm line-clamp-2">{event.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-md items-center">
            {event.location ? (
              <span className="font-data text-[12px] text-text-tertiary inline-flex items-center gap-xs">
                <MapPinIcon className="w-3.5 h-3.5" />
                {event.location}
              </span>
            ) : null}
            <span className="font-data text-[12px] text-text-tertiary inline-flex items-center gap-xs">
              <CalendarIcon className="w-3.5 h-3.5" />
              {when}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-xs">
          <PublishChip published={event.is_published} />
          {isPast ? (
            <span className="font-data text-[11px] text-text-tertiary">Completed</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default async function EventsPage() {
  const supabase = await createDataClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: true });

  const events: EventListItem[] = ((data ?? []) as Event[]).map((row) => withEventTiming(row));
  const upcoming = events.filter((e) => e.timing === 'upcoming');
  const past = events
    .filter((e) => e.timing === 'past')
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Events</h1>
        <Link
          href="/events/new"
          className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors flex items-center gap-sm"
        >
          + New Event
        </Link>
      </div>

      {error ? (
        <p className="font-body text-[14px] text-[#ba1a1a] mb-lg" role="alert">
          Could not load events: {error.message}. Confirm the admin migration created{' '}
          <code className="font-data text-[12px]">public.events</code>.
        </p>
      ) : null}

      {events.length === 0 && !error ? (
        <div className="bg-bg-surface border border-border-outline rounded-md p-xl text-center mb-xl">
          <p className="font-heading text-[18px] text-text-primary mb-sm">No events yet</p>
          <p className="font-body text-[14px] text-text-tertiary mb-md">
            Create an event and publish it to show it in the volunteer app.
          </p>
          <Link
            href="/events/new"
            className="interactive inline-flex h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors items-center gap-sm"
          >
            + Create event
          </Link>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <>
          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Upcoming ({upcoming.length})
          </h2>
          <div className="grid gap-md mb-xl">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </>
      ) : null}

      {past.length > 0 ? (
        <>
          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">
            Past ({past.length})
          </h2>
          <div className="grid gap-md">
            {past.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
