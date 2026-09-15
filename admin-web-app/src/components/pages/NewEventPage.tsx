/**
 * Faithful port of `admin/app/(admin)/events/new/page.tsx` - Create Event
 * screen shown when the user clicks "+ New Event" on the events list.
 */
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { EventForm } from "@/components/events/EventForm";

export function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/events"
        className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
        Events
      </Link>
      <h1 className="font-heading text-[28px] leading-[36px] text-text-primary mb-lg">Create Event</h1>
      <EventForm mode="create" />
    </div>
  );
}
