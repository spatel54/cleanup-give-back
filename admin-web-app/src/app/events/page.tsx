import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EventsPage, eventListItemToDemoEvent } from "@/components/pages/EventsPage";
import { loadLiveEvents } from "@/lib/live-data";

export default async function Events() {
  const { data: liveEvents } = await loadLiveEvents();
  const events = liveEvents.map(eventListItemToDemoEvent);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EventsPage events={events} isMock={false} />
      </SidebarDemo>
    </div>
  );
}
