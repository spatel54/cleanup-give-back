import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { AttentionInboxPage } from "@/components/pages/AttentionInboxPage";
import { buildAttentionItems } from "@/lib/attention-inbox";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Attention() {
  const items = await buildAttentionItems();

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <AttentionInboxPage items={items} />
      </SidebarDemo>
    </div>
  );
}
