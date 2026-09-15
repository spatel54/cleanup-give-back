import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function Loading() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-lg animate-pulse">
            <div className="h-11 w-full bg-bg-surface-elevated rounded-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
            </div>
            <div className="h-64 bg-bg-surface-elevated rounded-md" />
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}