import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EmailsPage } from "@/components/pages/EmailsPage";
import { listAllTemplates } from "@/lib/email-templates";
import { listScheduledEmails } from "@/lib/scheduled-emails";
import { loadLatestOrderTrackingByVolunteer } from "@/lib/live-data";
import { getVolunteerDirectory } from "@/lib/volunteers";
import { getFromAddress } from "@/lib/resend";

export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: string;
  to?: string;
}

function resolveInitialTab(tab: string | undefined): "compose" | "scheduled" | "templates" {
  if (tab === "templates") return "templates";
  if (tab === "scheduled") return "scheduled";
  return "compose";
}

export default async function Emails({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tab, to } = await searchParams;
  const [templates, directory, scheduledEmails, trackingByVolunteer] = await Promise.all([
    listAllTemplates(),
    getVolunteerDirectory(),
    listScheduledEmails(),
    loadLatestOrderTrackingByVolunteer(),
  ]);
  const volunteers = Array.from(directory.values()).map((entry) => {
    const tracking = trackingByVolunteer.get(entry.id);
    return {
      id: entry.id,
      name: entry.name,
      email: entry.email as string,
      isMockEmail: entry.isMockEmail,
      trackingNumber: tracking?.trackingNumber ?? null,
      carrier: tracking?.carrier ?? null,
    };
  });

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EmailsPage
          templates={templates}
          volunteers={volunteers}
          scheduledEmails={scheduledEmails}
          fromAddress={getFromAddress()}
          initialTab={resolveInitialTab(tab)}
          initialRecipientId={to}
        />
      </SidebarDemo>
    </div>
  );
}
