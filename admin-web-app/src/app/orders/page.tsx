import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { OrdersPage } from "@/components/pages/OrdersPage";
import { loadLiveOrders } from "@/lib/live-data";

function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-6xl mx-auto py-lg">
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Unable to load orders</h2>
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

export default async function Orders() {
  try {
    const { data: orders, useMock } = await loadLiveOrders();

    return (
      <div className="w-full h-dvh">
        <SidebarDemo>
          <OrdersPage orders={orders} isMock={useMock} />
        </SidebarDemo>
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error instanceof Error ? error.message : 'Failed to load orders data'} />;
  }
}
