import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { NewEventPage } from "@/components/pages/NewEventPage";

export default function NewEvent() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <NewEventPage />
      </SidebarDemo>
    </div>
  );
}
