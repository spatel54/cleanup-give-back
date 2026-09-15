import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { AnalyticsPage } from "@/components/pages/AnalyticsPage";
import { loadLiveSessions } from "@/lib/live-data";

export default async function Insights() {
  const { data: liveSessions } = await loadLiveSessions();

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <AnalyticsPage sessions={liveSessions} realSessions={liveSessions} isMock={false} />
      </SidebarDemo>
    </div>
  );
}
