import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Order } from "../types/order";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBOrderProps {
  onSeeDetail?: (order: Order) => void;
}

export function JBOrder({ onSeeDetail }: JBOrderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("new");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

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
    } else if (activeTab === "in-progress") {
      return ["Viewed by Supplier", "Confirmed", "In Production"].includes(
        order.status,
      );
    } else if (activeTab === "completed") {
      return ["Ready for Pickup", "Completed"].includes(order.status);
    }
    return false;
  });

  // Calculate counts for each tab
  const newCount = orders.filter((order) => order.status === "New").length;
  const inProgressCount = orders.filter((order) =>
    ["Viewed by Supplier", "Confirmed", "In Production"].includes(order.status),
  ).length;
  const completedCount = orders.filter((order) =>
    ["Ready for Pickup", "Completed"].includes(order.status),
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
        <TabsList className="w-full flex-shrink-0">
          <TabsTrigger
            value="new"
            className={
              activeTab === "new" ? "text-blue-600 border-blue-600" : ""
            }
          >
            New ({newCount})
          </TabsTrigger>
          <TabsTrigger
            value="in-progress"
            className={
              activeTab === "in-progress"
                ? "text-yellow-600 border-yellow-600"
                : ""
            }
          >
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className={
              activeTab === "completed" ? "text-green-600 border-green-600" : ""
            }
          >
            Completed ({completedCount})
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
                  {activeTab === "new" && "No new orders yet"}
                  {activeTab === "in-progress" && "No orders in progress"}
                  {activeTab === "completed" && "No completed orders"}
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
                  onSeeDetail={onSeeDetail}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
