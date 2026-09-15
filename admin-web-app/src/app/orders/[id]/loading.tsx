import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function OrderDetailLoading() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-lg animate-pulse">
            {/* Back link */}
            <div className="h-4 w-16 bg-bg-surface-elevated rounded" />
            
            {/* Header */}
            <div className="flex items-start justify-between gap-md flex-wrap">
              <div className="flex flex-col gap-sm">
                <div className="h-3 w-24 bg-bg-surface-elevated rounded" />
                <div className="h-8 w-48 bg-bg-surface-elevated rounded" />
                <div className="h-4 w-40 bg-bg-surface-elevated rounded" />
                <div className="h-4 w-32 bg-bg-surface-elevated rounded" />
              </div>
              <div className="h-8 w-20 bg-bg-surface-elevated rounded-sm" />
            </div>
            
            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
              <div className="lg:col-span-3 flex flex-col gap-lg">
                {/* Fulfillment form */}
                <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
                  <div className="h-6 w-32 bg-bg-surface-elevated rounded mb-md" />
                  <div className="flex flex-col gap-md">
                    <div>
                      <div className="h-3 w-16 bg-bg-surface-elevated rounded mb-xs" />
                      <div className="h-11 w-full bg-bg-surface-elevated rounded-sm" />
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-bg-surface-elevated rounded mb-xs" />
                      <div className="h-11 w-full bg-bg-surface-elevated rounded-sm" />
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-bg-surface-elevated rounded mb-xs" />
                      <div className="h-11 w-full bg-bg-surface-elevated rounded-sm" />
                    </div>
                    <div className="h-9 w-24 bg-bg-surface-elevated rounded-sm" />
                  </div>
                </div>
                
                {/* Shipping section */}
                <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
                  <div className="h-6 w-20 bg-bg-surface-elevated rounded mb-md" />
                  <div className="flex flex-col gap-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between py-sm border-b border-border-outline last:border-0">
                        <div className="h-4 w-16 bg-bg-surface-elevated rounded" />
                        <div className="h-4 w-32 bg-bg-surface-elevated rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Items section */}
                <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
                  <div className="px-lg py-md border-b border-border-outline">
                    <div className="h-6 w-12 bg-bg-surface-elevated rounded" />
                  </div>
                  <div className="divide-y divide-border-outline">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="px-lg py-md">
                        <div className="grid grid-cols-4 gap-md items-center">
                          <div className="h-4 w-20 bg-bg-surface-elevated rounded" />
                          <div className="h-4 w-8 bg-bg-surface-elevated rounded" />
                          <div className="h-4 w-12 bg-bg-surface-elevated rounded" />
                          <div className="h-4 w-12 bg-bg-surface-elevated rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
                  <div className="h-6 w-20 bg-bg-surface-elevated rounded mb-md" />
                  <div className="flex flex-col gap-md">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-3 w-16 bg-bg-surface-elevated rounded mb-xs" />
                        <div className="h-4 w-32 bg-bg-surface-elevated rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}