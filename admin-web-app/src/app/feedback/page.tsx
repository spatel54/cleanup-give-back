import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { FeedbackPage } from "@/components/pages/FeedbackPage";
import { loadLiveFeedback } from "@/lib/live-data";

export default async function Feedback() {
  const { data: feedback, useMock } = await loadLiveFeedback();

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <FeedbackPage feedback={feedback} isMock={useMock} />
      </SidebarDemo>
    </div>
  );
}
