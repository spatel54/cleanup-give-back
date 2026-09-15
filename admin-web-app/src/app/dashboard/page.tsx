import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { DashboardPage } from "@/components/pages/DashboardPage";
import { loadLiveSessions, loadLiveOrders, loadLiveMonthlyRevenue, loadLiveFeedback } from "@/lib/live-data";
import { EMOJI_MAP } from "@/lib/mock-data";

// See admin-web-app/src/app/sessions/page.tsx - same static-prerender staleness issue.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-6xl mx-auto py-lg">
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Unable to load dashboard</h2>
            <p className="font-body text-[14px]">{error}</p>
            <p className="font-body text-[12px] mt-sm text-[#ba1a1a]/80">
              Please try refreshing the page or check your connection.
            </p>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}

export default async function Dashboard() {
  try {
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
  } catch (error) {
    return <ErrorFallback error={error instanceof Error ? error.message : 'An unexpected error occurred'} />;
  }
}
