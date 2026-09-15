/** Ported from `admin/lib/events.ts` - shape of the shared `public.events` table. */

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  starts_at: string;
  ends_at: string | null;
  what_to_bring: string | null;
  organizer: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EventListItem = EventRow & {
  /** Derived from starts_at vs now. */
  timing: 'upcoming' | 'past';
};

export function eventTiming(startsAt: string, now = new Date()): 'upcoming' | 'past' {
  return new Date(startsAt).getTime() >= now.getTime() ? 'upcoming' : 'past';
}

export function withEventTiming(event: EventRow, now = new Date()): EventListItem {
  return { ...event, timing: eventTiming(event.starts_at, now) };
}

export function formatEventWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!endsAt) return `${datePart} · ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${startTime} – ${endTime}`;
}

/** Local datetime-local value (`YYYY-MM-DDTHH:mm`) from an ISO timestamp. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse datetime-local form value to ISO for Postgres timestamptz. */
export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
