/**
 * Faithful port of `admin/app/(admin)/events/[id]/page.tsx`.
 *
 * `event` is fetched live from the shared Supabase `events` table by
 * `admin-web-app/src/app/events/[id]/page.tsx`, falling back to a mock fixture
 * lookup when that table is empty. When `liveActions` is set (real row, not a
 * mock fixture), renders `EventDetailActions` (edit/publish/delete) alongside the
 * read-only detail view, same as admin.
 *
 * Location map mirrors mobile `EventLocationMapWebView` (MapLibre + Carto Voyager).
 */
import Link from "next/link";
import { InfoRow } from "@/components/ui/InfoRow";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { formatEventWhen, type DemoEvent } from "@/components/pages/EventsPage";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventLocationMap } from "@/components/events/EventLocationMap";

export type EventDetailLiveActions = {
  eventId: string;
  isPublished: boolean;
};

export function EventDetailPage({
  event,
  liveActions,
}: {
  event: DemoEvent | null;
  liveActions?: EventDetailLiveActions | null;
}) {
  if (!event) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/events"
          className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
          Events
        </Link>
        <p className="font-body text-base text-text-tertiary">Event not found.</p>
      </div>
    );
  }

  const when = formatEventWhen(event.startsAt, event.endsAt);
  const gallery = event.photos ?? [];
  const lat = typeof event.lat === "number" ? event.lat : event.lat != null ? Number(event.lat) : NaN;
  const lng = typeof event.lng === "number" ? event.lng : event.lng != null ? Number(event.lng) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapAddress = event.address?.trim() || event.location?.trim() || "Event location";
  const mapsSearchHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;

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
            {event.timing === "past" ? "Past event" : "Upcoming event"}
          </p>
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">{event.title}</h1>
          <p className="font-body text-base text-text-tertiary mt-xs">{when}</p>
        </div>
        <span
          className={`shrink-0 font-data text-[11px] font-semibold rounded-xs px-sm py-xs border ${
            event.isPublished
              ? "text-primary bg-[#f7fff1] border-primary/30"
              : "text-[#835400] bg-[#ffddb5] border-[#fcab29]/50"
          }`}
        >
          {event.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {gallery.length > 0 ? (
        <section className="mb-lg" aria-label="Event photos">
          <div className="flex gap-sm overflow-x-auto pb-xs snap-x snap-mandatory">
            {gallery.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${index}`}
                src={url}
                alt=""
                className="h-48 sm:h-56 w-[min(100%,20rem)] shrink-0 snap-start object-cover rounded-md border border-border-outline bg-bg-surface-elevated"
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        <div className="lg:col-span-3 flex flex-col gap-lg">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Details</h2>
            <dl>
              <InfoRow label="When" value={when} />
              <InfoRow label="Location" value={event.location?.trim() || "-"} />
              <InfoRow label="Address" value={event.address?.trim() || "-"} />
              <InfoRow label="Organizer" value={event.organizer?.trim() || "-"} />
            </dl>
          </section>

          {hasCoords ? (
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Location map</h2>
              <EventLocationMap
                address={mapAddress}
                coordinate={{ latitude: lat, longitude: lng }}
              />
              <p className="font-data text-[12px] text-text-tertiary mt-sm">
                Tap the map to open in Google Maps · {mapAddress}
              </p>
            </section>
          ) : event.address?.trim() || event.location?.trim() ? (
            <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Location</h2>
              <p className="font-body text-[14px] text-text-primary mb-sm">{mapAddress}</p>
              <a
                href={mapsSearchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-data text-[13px] text-primary hover:underline"
              >
                Open in Google Maps
              </a>
              <p className="font-body text-[12px] text-text-tertiary mt-sm">
                No map pin yet - edit the event and save an address to geocode a pin for any venue.
              </p>
            </section>
          ) : null}

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">Description</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.description?.trim() || "No description yet."}
            </p>
          </section>

          <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <h2 className="font-heading text-[20px] leading-[28px] text-text-primary mb-md">What to bring</h2>
            <p className="font-body text-[14px] text-text-primary whitespace-pre-wrap">
              {event.whatToBring?.trim() || "-"}
            </p>
          </section>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-lg">
          <section className="bg-bg-surface border border-border-outline rounded-md p-lg sticky top-6">
            <h2 className="font-heading text-[18px] leading-[26px] text-text-primary mb-md">Actions</h2>
            {liveActions ? (
              <>
                <EventDetailActions eventId={liveActions.eventId} isPublished={liveActions.isPublished} />
                <p className="font-body text-[12px] text-text-tertiary mt-md">
                  {event.isPublished
                    ? "This event is visible in the mobile app Upcoming Events feed."
                    : "Publish this event to show it in the mobile app."}
                </p>
              </>
            ) : (
              <p className="font-body text-[13px] text-text-tertiary">
                {event.isPublished
                  ? "This event is visible in the mobile app Upcoming Events feed."
                  : "Publish this event from the admin dashboard to show it in the mobile app."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
