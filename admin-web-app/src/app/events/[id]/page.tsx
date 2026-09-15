import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EventDetailPage, type EventDetailLiveActions } from "@/components/pages/EventDetailPage";
import { EVENTS, eventListItemToDemoEvent } from "@/components/pages/EventsPage";
import { loadLiveEvent } from "@/lib/live-data";

function loadLiveActions(eventId: string, isPublished: boolean): EventDetailLiveActions {
  return { eventId, isPublished };
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const liveEvent = await loadLiveEvent(id);
  const event = liveEvent ? eventListItemToDemoEvent(liveEvent) : (EVENTS.find((e) => e.id === id) ?? null);
  const liveActions = liveEvent ? loadLiveActions(liveEvent.id, liveEvent.is_published) : null;

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EventDetailPage event={event} liveActions={liveActions} />
      </SidebarDemo>
    </div>
  );
}
