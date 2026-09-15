import { redirect } from "next/navigation";
import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EventForm } from "@/components/events/EventForm";
import { loadLiveEvent } from "@/lib/live-data";

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadLiveEvent(id);

  // Mock fixtures aren't real rows - nothing to edit, so bounce back to the read-only detail view.
  if (!event) redirect(`/events/${id}`);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary mb-lg">Edit event</h1>
          <EventForm mode="edit" event={event} />
        </div>
      </SidebarDemo>
    </div>
  );
}
