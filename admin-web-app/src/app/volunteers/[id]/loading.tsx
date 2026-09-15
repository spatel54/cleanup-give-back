import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function VolunteerDetailLoading() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-lg animate-pulse">
            {/* Back link */}
            <div className="h-4 w-20 bg-bg-surface-elevated rounded" />
            
            {/* Profile header */}
            <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
              <div className="flex items-start justify-between gap-md flex-wrap">
                <div>
                  <div className="flex items-center gap-md mb-sm">
                    <div className="w-12 h-12 rounded-full bg-bg-surface-elevated" />
                    <div>
                      <div className="h-8 w-48 bg-bg-surface-elevated rounded" />
                      <div className="h-4 w-24 bg-bg-surface-elevated rounded mt-xs" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs pl-[calc(3rem+16px)]">
                    <div className="h-4 w-56 bg-bg-surface-elevated rounded" />
                    <div className="h-3 w-32 bg-bg-surface-elevated rounded" />
                  </div>
                </div>
                <div className="flex gap-md flex-wrap">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center bg-bg-surface-elevated rounded-md p-md min-w-[80px]">
                      <div className="h-6 w-12 bg-bg-surface-elevated rounded mb-xs mx-auto" />
                      <div className="h-3 w-16 bg-bg-surface-elevated rounded mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Account information */}
            <div>
              <div className="h-6 w-40 bg-bg-surface-elevated rounded mb-md" />
              <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex justify-between py-sm border-b border-border-outline last:border-0">
                    <div className="h-4 w-20 bg-bg-surface-elevated rounded" />
                    <div className="h-4 w-32 bg-bg-surface-elevated rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Court order section */}
            <div>
              <div className="h-6 w-24 bg-bg-surface-elevated rounded mb-md" />
              <div className="bg-bg-surface border border-border-outline rounded-md px-lg py-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between py-sm border-b border-border-outline last:border-0">
                    <div className="h-4 w-24 bg-bg-surface-elevated rounded" />
                    <div className="h-4 w-20 bg-bg-surface-elevated rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Session history */}
            <div>
              <div className="h-6 w-32 bg-bg-surface-elevated rounded mb-md" />
              <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
                <div className="px-lg py-sm border-b border-border-outline">
                  <div className="hidden lg:grid grid-cols-5 gap-md">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-bg-surface-elevated rounded" />
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-border-outline">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-lg py-md">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-md items-center">
                        <div className="h-4 w-32 bg-bg-surface-elevated rounded" />
                        <div className="h-4 w-16 bg-bg-surface-elevated rounded" />
                        <div className="h-4 w-12 bg-bg-surface-elevated rounded" />
                        <div className="h-4 w-12 bg-bg-surface-elevated rounded" />
                        <div className="h-6 w-20 bg-bg-surface-elevated rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}