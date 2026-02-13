import { Order, OrderArrival } from "@/app/types/order";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import { useEffect, useState } from "react";
import { OrderArrivalComponent } from "./order-arrival";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function JBInbound() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [arrivals, setArrivals] = useState<OrderArrival[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<
    "waiting" | "partial" | "delivered"
  >("waiting");

  // Load orders from localStorage
  useEffect(() => {
    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }

    const storedArrivals = localStorage.getItem("orderArrivals");
    if (storedArrivals) {
      setArrivals(JSON.parse(storedArrivals));
    }
  }, []);

  // Calculate delivery status for an order
  const getDeliveryStatus = (order: Order) => {
    const orderArrivals = arrivals.filter((a) => a.orderId === order.id);
    if (orderArrivals.length === 0) {
      return "waiting";
    }

    // Calculate total delivered for each item
    const deliveredCounts = new Map<string, number>();
    orderArrivals.forEach((arrival) => {
      arrival.items.forEach((item) => {
        const key = `${item.karat}-${item.warna}-${item.size}-${item.berat}`;
        deliveredCounts.set(key, (deliveredCounts.get(key) || 0) + item.pcs);
      });
    });

    // Check if all items are fully delivered
    const allFullyDelivered = order.detailItems.every((item) => {
      const key = `${item.kadar}-${item.warna}-${item.ukuran}-${item.berat}`;
      const delivered = deliveredCounts.get(key) || 0;
      return delivered >= parseInt(item.pcs);
    });

    if (allFullyDelivered) {
      return "delivered";
    }

    return "partial";
  };

  // Filter orders by tab
  const getFilteredOrders = () => {
    return orders.filter((order) => {
      // Show Stock Ready, In Production, and legacy delivery status orders
      // Note: "Partially Delivered" and "Fully Delivered" are legacy statuses
      // that should be migrated to "Stock Ready" or "In Production"
      const isValidStatus =
        order.status === "Stock Ready" ||
        order.status === "In Production" ||
        order.status === "Partially Delivered" ||
        order.status === "Fully Delivered";

      if (!isValidStatus) {
        return false;
      }

      // Don't show Confirmed by JB orders
      if (order.status === "Confirmed by JB") {
        return false;
      }

      const deliveryStatus = getDeliveryStatus(order);
      return deliveryStatus === activeTab;
    });
  };

  const handleSubmitArrival = (
    orderId: string,
    arrivalItems: {
      karat: string;
      warna: string;
      size: string;
      berat: string;
      pcs: number;
    }[],
  ) => {
    const newArrival: OrderArrival = {
      id: `ARR${Date.now()}`,
      orderId,
      orderPONumber: orders.find((o) => o.id === orderId)?.PONumber || "",
      createdDate: Date.now(),
      createdBy: localStorage.getItem("currentUser") || "jbuser1",
      items: arrivalItems,
    };

    const updatedArrivals = [...arrivals, newArrival];
    setArrivals(updatedArrivals);
    localStorage.setItem("orderArrivals", JSON.stringify(updatedArrivals));

    // Refresh selected order to show updated arrivals
    // Note: Order status remains unchanged until JB explicitly closes the order
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrder({ ...order });
    }
  };

  const handleCloseOrder = (orderId: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: "Confirmed by JB" as const,
          updatedDate: Date.now(),
          updatedBy: localStorage.getItem("currentUser") || "jbuser1",
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setSelectedOrder(null);
  };

  const filteredOrders = getFilteredOrders();
  const waitingCount = orders.filter(
    (o) =>
      (o.status === "Stock Ready" ||
        o.status === "In Production" ||
        o.status === "Partially Delivered" ||
        o.status === "Fully Delivered") &&
      getDeliveryStatus(o) === "waiting",
  ).length;
  const partialCount = orders.filter(
    (o) =>
      (o.status === "Stock Ready" ||
        o.status === "In Production" ||
        o.status === "Partially Delivered" ||
        o.status === "Fully Delivered") &&
      getDeliveryStatus(o) === "partial",
  ).length;
  const deliveredCount = orders.filter(
    (o) =>
      (o.status === "Stock Ready" ||
        o.status === "In Production" ||
        o.status === "Partially Delivered" ||
        o.status === "Fully Delivered") &&
      getDeliveryStatus(o) === "delivered",
  ).length;

  // If an order is selected, show the arrival component
  if (selectedOrder) {
    const orderArrivals = arrivals.filter(
      (a) => a.orderId === selectedOrder.id,
    );
    const deliveryStatus = getDeliveryStatus(selectedOrder);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <OrderArrivalComponent
          order={selectedOrder}
          arrivals={orderArrivals}
          onBack={() => setSelectedOrder(null)}
          onSubmitArrival={handleSubmitArrival}
          onCloseOrder={handleCloseOrder}
          isFullyDelivered={deliveryStatus === "delivered"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      <h1 className="text-xl font-semibold flex-shrink-0">Inbound</h1>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "waiting" | "partial" | "delivered")
        }
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger value="waiting">
            Waiting for Delivery
            {waitingCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {waitingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="partial">
            Partially Delivered
            {partialCount > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                {partialCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Fully Delivered
            {deliveredCount > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {deliveredCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="waiting"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center text-gray-500">
                    <p>No orders waiting for delivery</p>
                  </div>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{order.PONumber}</h3>
                          <span
                            className={`${getStatusBadgeClasses(
                              order.status,
                            )} px-2 py-1 rounded-full text-xs`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Supplier: {order.pabrik.name}</p>
                          <p>
                            Created:{" "}
                            {new Date(order.createdDate).toLocaleDateString()}
                          </p>
                          <p>
                            Created By:{" "}
                            {getFullNameFromUsername(order.createdBy)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="partial"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center text-gray-500">
                    <p>No partially delivered orders</p>
                  </div>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{order.PONumber}</h3>
                          <span
                            className={`${getStatusBadgeClasses(
                              order.status,
                            )} px-2 py-1 rounded-full text-xs`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Supplier: {order.pabrik.name}</p>
                          <p>
                            Created:{" "}
                            {new Date(order.createdDate).toLocaleDateString()}
                          </p>
                          <p>
                            Created By:{" "}
                            {getFullNameFromUsername(order.createdBy)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="delivered"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center text-gray-500">
                    <p>No fully delivered orders</p>
                  </div>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{order.PONumber}</h3>
                          <span
                            className={`${getStatusBadgeClasses(
                              order.status,
                            )} px-2 py-1 rounded-full text-xs`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Supplier: {order.pabrik.name}</p>
                          <p>
                            Created:{" "}
                            {new Date(order.createdDate).toLocaleDateString()}
                          </p>
                          <p>
                            Created By:{" "}
                            {getFullNameFromUsername(order.createdBy)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
