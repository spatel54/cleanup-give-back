import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { VolunteersPage } from "@/components/pages/VolunteersPage";
import { loadLiveUsers } from "@/lib/live-data";

export default async function Volunteers() {
  const { data: users, useMock } = await loadLiveUsers();

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <VolunteersPage users={users} isMock={useMock} />
      </SidebarDemo>
    </div>
  );
}
