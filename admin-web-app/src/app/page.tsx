import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { loadLiveSessions, loadLiveOrders, loadLiveMonthlyRevenue, loadLiveFeedback } from "@/lib/live-data";
import { EMOJI_MAP } from "@/lib/mock-data";

// See admin-web-app/src/app/sessions/page.tsx - same static-prerender staleness issue.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [sessionsResult, ordersResult, monthlyResult, feedbackResult] = await Promise.all([
    loadLiveSessions(),
    loadLiveOrders(),
    loadLiveMonthlyRevenue(),
    loadLiveFeedback(),
  ]);

  const feedbackAvg =
    feedbackResult.data.length > 0
      ? feedbackResult.data.reduce((sum, f) => sum + (EMOJI_MAP[f.rating]?.score ?? 0), 0) / feedbackResult.data.length
      : 0;

  const isMock = sessionsResult.useMock && ordersResult.useMock && monthlyResult.useMock;

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <DashboardPage
          sessions={sessionsResult.data}
          orders={ordersResult.data}
          monthly={monthlyResult.data}
          feedback={feedbackResult.data}
          feedbackAvg={feedbackAvg}
          isMock={isMock}
        />
      </SidebarDemo>
    </div>
  );
}
