import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Order } from "../types/order";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBOrderProps {
  onSeeDetail?: (order: Order, currentTab?: string) => void;
  onUpdateOrder?: (order: Order, currentTab?: string) => void;
  initialTab?: string;
}

export function JBOrder({
  onSeeDetail,
  onUpdateOrder,
  initialTab = "new",
}: JBOrderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    // Reload orders when window regains focus
    const handleFocus = () => {
      loadOrders();
    };
    window.addEventListener("focus", handleFocus);

    // Also reload when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update activeTab when initialTab changes (e.g., returning from order details)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Reload data when tab changes
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order: Order) => {
    if (activeTab === "new") {
      return order.status === "New";
    } else if (activeTab === "viewed") {
      return order.status === "Viewed";
    } else if (activeTab === "request-change") {
      return order.status === "Request Change";
    } else if (activeTab === "stock-ready") {
      return order.status === "Stock Ready";
    } else if (activeTab === "unable") {
      return order.status === "Unable to Fulfill";
    }
    return false;
  });

  // Calculate counts for each tab
  const newCount = orders.filter((order) => order.status === "New").length;
  const viewedCount = orders.filter(
    (order) => order.status === "Viewed",
  ).length;
  const requestChangeCount = orders.filter(
    (order) => order.status === "Request Change",
  ).length;
  const stockReadyCount = orders.filter(
    (order) => order.status === "Stock Ready",
  ).length;
  const unableCount = orders.filter(
    (order) => order.status === "Unable to Fulfill",
  ).length;

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-600 text-sm">Total: {orders.length} orders</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-shrink-0 grid grid-cols-5">
          <TabsTrigger
            value="new"
            className={
              activeTab === "new" ? "text-blue-600 border-blue-600" : ""
            }
          >
            New ({newCount})
          </TabsTrigger>
          <TabsTrigger
            value="viewed"
            className={
              activeTab === "viewed" ? "text-purple-600 border-purple-600" : ""
            }
          >
            Viewed ({viewedCount})
          </TabsTrigger>
          <TabsTrigger
            value="request-change"
            className={
              activeTab === "request-change"
                ? "text-orange-600 border-orange-600"
                : ""
            }
          >
            Request Change ({requestChangeCount})
          </TabsTrigger>
          <TabsTrigger
            value="stock-ready"
            className={
              activeTab === "stock-ready"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            Stock Ready ({stockReadyCount})
          </TabsTrigger>
          <TabsTrigger
            value="unable"
            className={
              activeTab === "unable" ? "text-red-600 border-red-600" : ""
            }
          >
            Unable to Fulfill ({unableCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No orders found</p>
                <p className="text-sm">
                  {activeTab === "new"
                    ? "No new orders yet"
                    : activeTab === "viewed"
                      ? "No viewed orders"
                      : activeTab === "request-change"
                        ? "No orders requesting changes"
                        : activeTab === "stock-ready"
                          ? "No orders marked as stock ready"
                          : activeTab === "unable"
                            ? "No orders marked as unable to fulfill"
                            : "No orders found"}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedOrderId === order.id}
                  onToggleExpand={() => toggleExpand(order.id)}
                  onSeeDetail={(order) => onSeeDetail?.(order, activeTab)}
                  onUpdateOrder={
                    activeTab === "request-change"
                      ? (order) => onUpdateOrder?.(order, activeTab)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
