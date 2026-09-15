import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function VolunteersLoading() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-lg animate-pulse">
            {/* Header */}
            <div className="h-11 w-full bg-bg-surface-elevated rounded-sm" />
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
              <div className="h-24 bg-bg-surface-elevated rounded-md" />
            </div>
            
            {/* Search and filters */}
            <div className="flex flex-col gap-sm lg:flex-row lg:items-center">
              <div className="h-11 w-64 bg-bg-surface-elevated rounded-sm" />
              <div className="flex gap-xs">
                <div className="h-11 w-12 bg-bg-surface-elevated rounded-full" />
                <div className="h-11 w-24 bg-bg-surface-elevated rounded-full" />
                <div className="h-11 w-20 bg-bg-surface-elevated rounded-full" />
              </div>
            </div>
            
            {/* Volunteers table */}
            <div className="bg-bg-surface border border-border-outline rounded-md">
              <div className="px-lg py-sm border-b border-border-outline">
                <div className="hidden lg:grid grid-cols-6 gap-md">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-bg-surface-elevated rounded" />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border-outline">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="px-lg py-md">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-md items-center">
                      <div className="flex flex-col gap-xs">
                        <div className="h-4 bg-bg-surface-elevated rounded w-28" />
                        <div className="h-3 bg-bg-surface-elevated rounded w-40" />
                      </div>
                      <div className="h-4 bg-bg-surface-elevated rounded w-16" />
                      <div className="h-4 bg-bg-surface-elevated rounded w-12" />
                      <div className="h-4 bg-bg-surface-elevated rounded w-10" />
                      <div className="flex items-center gap-sm">
                        <div className="h-6 bg-bg-surface-elevated rounded w-16" />
                        <div className="h-2 bg-bg-surface-elevated rounded w-16" />
                      </div>
                      <div className="h-4 bg-bg-surface-elevated rounded w-14" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}