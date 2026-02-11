import { useEffect, useState } from "react";
import { Request } from "../types/request";
import { RequestCard } from "./request-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBRequestsProps {
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
}

export function JBRequests({ onSeeDetail, initialTab }: JBRequestsProps) {
  const [orders, setOrders] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab || "assigned");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  const filteredOrders = orders.filter((order: Request) => {
    if (activeTab === "assigned") {
      return order.status === "Requested to JB";
    } else if (activeTab === "waiting") {
      // Ordered - could be orders JB has placed with suppliers
      // For now, we can use "In Progress" or create a new status
      return order.status === "Ordered";
    }
    return false;
  });

  // Calculate counts for each tab
  const assignedCount = orders.filter(
    (order: Request) => order.status === "Requested to JB",
  ).length;
  const waitingCount = orders.filter(
    (order: Request) => order.status === "Ordered",
  ).length;

  const handleTabClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const value = target.getAttribute("data-value");
    if (value) {
      setActiveTab(value);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-gray-600 text-sm">
            Total: {assignedCount + waitingCount} requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-shrink-0">
          <TabsTrigger
            value="assigned"
            onClick={handleTabClick}
            className={
              activeTab === "assigned"
                ? "text-purple-600 border-purple-600"
                : ""
            }
          >
            Assigned to JB ({assignedCount})
          </TabsTrigger>
          <TabsTrigger
            value="waiting"
            onClick={handleTabClick}
            className={
              activeTab === "waiting" ? "text-blue-600 border-blue-600" : ""
            }
          >
            Ordered ({waitingCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p>No requests in this tab</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <RequestCard
                    key={order.id}
                    order={order}
                    userRole="jb"
                    activeTab={activeTab}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(order.id)}
                    onSeeDetail={onSeeDetail}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
