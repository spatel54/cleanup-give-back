import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { SettingsPage } from "@/components/pages/SettingsPage";

export default function Settings() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <SettingsPage />
      </SidebarDemo>
    </div>
  );
}
