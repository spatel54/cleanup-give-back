/**
 * Faithful port of `admin/app/(admin)/events/page.tsx`.
 *
 * `events` is fetched live from the shared Supabase `events` table by
 * `admin-web-app/src/app/events/page.tsx` (see `@/lib/events` + `EventListItem`) -
 * the same table the mobile app reads for its Upcoming Events feed, and the
 * same table `admin/actions/events.ts` writes to. Falls back to illustrative
 * fixtures when that table is empty.
 */
import Link from "next/link";
import { MapPinIcon, CalendarIcon } from "@/components/ui/Icons";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { EventsExportMenu } from "@/components/events/EventsExportMenu";
import { formatEventWhen, type EventListItem } from "@/lib/events";

export type DemoEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  address?: string | null;
  /** WGS84 pin - same fields as Supabase `events.lat` / `events.lng` and mobile EventDetail.coordinate. */
  lat?: number | null;
  lng?: number | null;
  organizer?: string | null;
  whatToBring?: string | null;
  photos?: string[];
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
  timing: "upcoming" | "past";
};

/**
 * Single sample fixture when the Supabase `events` table is empty.
 * Sample event pin + Unsplash photo stand-ins.
 */
export const EVENTS: DemoEvent[] = [
  {
    id: "e1",
    title: "Downtown Riverfront Clean-up",
    description:
      "Join us for a community clean-up at the downtown riverfront! Let's come together to beautify our local waterways and enjoy a day of teamwork and fun. Bring your friends and family, and help us make a difference!",
    location: "Clean Up - Give Back",
    address: "100 Sample St, Example City, IL, 00000",
    lat: 42.0417,
    lng: -87.887,
    organizer: "D214 Life Program",
    whatToBring:
      "Wear weather-appropriate clothing\nCleanUp Give Back provides snacks, supplies, water, and music.",
    // Same Unsplash stand-ins the mobile app uses via `eventImageForLocation` for this venue.
    photos: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    ],
    startsAt: "2026-08-15T17:00:00Z",
    endsAt: "2026-08-15T19:00:00Z",
    isPublished: true,
    timing: "upcoming",
  },
];

export { formatEventWhen };

function PublishChip({ published }: { published: boolean }) {
  return (
    <span
      className={`font-data text-[11px] font-semibold rounded-sm px-sm py-xs border ${
        published
          ? "text-primary bg-[#f7fff1] border-primary/30"
          : "text-[#835400] bg-[#ffddb5] border-[#fcab29]/50"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function EventCard({ event }: { event: DemoEvent }) {
  const when = formatEventWhen(event.startsAt, event.endsAt);
  const isPast = event.timing === "past";
  const thumb = event.photos?.[0];

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block bg-bg-surface border border-border-outline rounded-md overflow-hidden transition-colors hover:border-primary/40 hover:bg-[#f7fff1]/40 ${
        isPast ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-stretch gap-0">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="hidden sm:block w-36 shrink-0 object-cover self-stretch min-h-[7.5rem] bg-bg-surface-elevated"
          />
        ) : null}
        <div className="flex-1 min-w-0 p-lg flex items-start justify-between gap-md">
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
            <PublishChip published={event.isPublished} />
            {isPast ? <span className="font-data text-[11px] text-text-tertiary">Completed</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Maps a live Supabase `events` row (see `@/lib/events`) into this page's display shape. */
export function eventListItemToDemoEvent(e: EventListItem): DemoEvent {
  const gallery =
    e.image_urls?.filter((u) => typeof u === "string" && u.trim()) ??
    [];
  const photos =
    gallery.length > 0
      ? gallery
      : e.image_url?.trim()
        ? [e.image_url.trim()]
        : undefined;

  const latNum = e.lat == null ? null : Number(e.lat);
  const lngNum = e.lng == null ? null : Number(e.lng);

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    address: e.address,
    lat: latNum != null && Number.isFinite(latNum) ? latNum : null,
    lng: lngNum != null && Number.isFinite(lngNum) ? lngNum : null,
    organizer: e.organizer,
    whatToBring: e.what_to_bring,
    // Prefer image_urls; fall back to legacy image_url (same as mobile eventsApi).
    photos,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    isPublished: e.is_published,
    timing: e.timing,
  };
}

export function EventsPage({ events = EVENTS, isMock = false }: { events?: DemoEvent[]; isMock?: boolean }) {
  const upcoming = events.filter((e) => e.timing === "upcoming");
  const past = events
    .filter((e) => e.timing === "past")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const exportColumns = [
    { key: "title", label: "title" },
    { key: "timing", label: "timing" },
    { key: "startsAt", label: "starts_at" },
    { key: "location", label: "location" },
    { key: "published", label: "published" },
  ];
  const exportRows = events.map((e) => ({
    title: e.title,
    timing: e.timing,
    startsAt: e.startsAt,
    location: e.location ?? e.address ?? "",
    published: e.isPublished ? "yes" : "no",
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg gap-md flex-wrap">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Events</h1>
        <div className="flex items-center gap-sm flex-wrap">
          <EventsExportMenu columns={exportColumns} rows={exportRows} />
          <Link
            href="/events/new"
            className="h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-primary-hover transition-colors flex items-center gap-sm"
          >
            + New Event
          </Link>
        </div>
      </div>

      {isMock && <SampleDataBanner />}

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
          <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Past ({past.length})</h2>
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
