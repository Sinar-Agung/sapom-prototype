import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Order } from "../types/order";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBOrderProps {
  onSeeDetail?: (order: Order, currentTab?: string) => void;
  onUpdateOrder?: (order: Order, currentTab?: string) => void;
  initialTab?: string;
}

const ORDER_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "pabrik", label: "Pabrik" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Atas Nama" },
  { value: "requestNo", label: "Request No" },
];

export function JBOrder({
  onSeeDetail,
  onUpdateOrder,
  initialTab = "all",
}: JBOrderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem("jbOrderActiveTab");
    return saved || initialTab;
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem("jbOrderSortBy") || "updatedDate";
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("jbOrderSortDirection") as "asc" | "desc") ||
      "desc"
    );
  });
  const [orderNoFilter, setOrderNoFilter] = useState<string>(() => {
    return sessionStorage.getItem("jbOrderFilter") || "";
  });

  // Persist filter/sort state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("jbOrderActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("jbOrderSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("jbOrderSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    sessionStorage.setItem("jbOrderFilter", orderNoFilter);
  }, [orderNoFilter]);

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

  // Filter by Order No first (before tab filtering)
  const orderNoFiltered = orders.filter((order: Order) => {
    if (orderNoFilter) {
      const searchTerm = orderNoFilter.toLowerCase();
      const poNumber = order.PONumber?.toLowerCase() || "";
      return poNumber.includes(searchTerm);
    }
    return true;
  });

  // Calculate filtered counts for each tab based on orderNo filter
  const allCount = orderNoFiltered.length;
  const newCount = orderNoFiltered.filter(
    (order) => order.status === "New",
  ).length;
  const viewedCount = orderNoFiltered.filter(
    (order) => order.status === "Viewed",
  ).length;
  const changeRequestedCount = orderNoFiltered.filter(
    (order) => order.status === "Change Requested",
  ).length;
  const revisedInternalReviewCount = orderNoFiltered.filter(
    (order) => order.status === "Revised - Internal Review",
  ).length;
  const orderRevisedCount = orderNoFiltered.filter(
    (order) => order.status === "Order Revised",
  ).length;
  const stockReadyCount = orderNoFiltered.filter(
    (order) => order.status === "Stock Ready",
  ).length;
  const inProductionCount = orderNoFiltered.filter(
    (order) => order.status === "In Production",
  ).length;
  const unableCount = orderNoFiltered.filter(
    (order) => order.status === "Unable to Fulfill",
  ).length;
  const cancelledCount = orderNoFiltered.filter(
    (order) => order.status === "Cancelled",
  ).length;
  const confirmedByJBCount = orderNoFiltered.filter(
    (order) => order.status === "Confirmed by JB",
  ).length;

  // Filter orders based on active tab from orderNoFiltered
  let filteredOrders = orderNoFiltered.filter((order: Order) => {
    if (activeTab === "all") {
      return true;
    } else if (activeTab === "new") {
      return order.status === "New";
    } else if (activeTab === "viewed") {
      return order.status === "Viewed";
    } else if (activeTab === "change-requested") {
      return order.status === "Change Requested";
    } else if (activeTab === "revised-internal-review") {
      return order.status === "Revised - Internal Review";
    } else if (activeTab === "order-revised") {
      return order.status === "Order Revised";
    } else if (activeTab === "stock-ready") {
      return order.status === "Stock Ready";
    } else if (activeTab === "in-production") {
      return order.status === "In Production";
    } else if (activeTab === "unable") {
      return order.status === "Unable to Fulfill";
    } else if (activeTab === "cancelled") {
      return order.status === "Cancelled";
    } else if (activeTab === "confirmed") {
      return order.status === "Confirmed by JB";
    }
    return false;
  });

  // Sort orders
  filteredOrders = filteredOrders.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        comparison =
          (b.updatedDate || b.createdDate) - (a.updatedDate || a.createdDate);
        break;
      case "created":
        comparison = b.createdDate - a.createdDate;
        break;
      case "eta":
        comparison =
          new Date(a.waktuKirim).getTime() - new Date(b.waktuKirim).getTime();
        break;
      case "productName":
        comparison = (a.namaBarang || "").localeCompare(b.namaBarang || "");
        break;
      case "pabrik":
        const aPabrikName =
          typeof a.pabrik === "string" ? a.pabrik : a.pabrik?.name || "";
        const bPabrikName =
          typeof b.pabrik === "string" ? b.pabrik : b.pabrik?.name || "";
        comparison = aPabrikName.localeCompare(bPabrikName);
        break;
      case "sales":
        comparison = (a.sales || "").localeCompare(b.sales || "");
        break;
      case "atasNama":
        comparison = (a.atasNama || "").localeCompare(b.atasNama || "");
        break;
      case "requestNo":
        comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
        break;
      default:
        return 0;
    }
    return sortDirection === "desc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filter and Sort Controls */}
      <FilterSortControls
        type="order"
        totalCount={allCount}
        filterValue={orderNoFilter}
        onFilterChange={setOrderNoFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        sortOptions={ORDER_SORT_OPTIONS}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="all"
            className={
              activeTab === "all" ? "text-gray-900 border-gray-900" : ""
            }
          >
            All ({allCount})
          </TabsTrigger>
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
            value="change-requested"
            className={
              activeTab === "change-requested"
                ? "text-orange-600 border-orange-600"
                : ""
            }
          >
            Change Requested ({changeRequestedCount})
          </TabsTrigger>
          <TabsTrigger
            value="revised-internal-review"
            className={
              activeTab === "revised-internal-review"
                ? "text-amber-600 border-amber-600"
                : ""
            }
          >
            Revised - Internal Review ({revisedInternalReviewCount})
          </TabsTrigger>
          <TabsTrigger
            value="order-revised"
            className={
              activeTab === "order-revised"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            Order Revised ({orderRevisedCount})
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
            value="in-production"
            className={
              activeTab === "in-production"
                ? "text-blue-600 border-blue-600"
                : ""
            }
          >
            In Production ({inProductionCount})
          </TabsTrigger>
          <TabsTrigger
            value="unable"
            className={
              activeTab === "unable" ? "text-red-600 border-red-600" : ""
            }
          >
            Unable to Fulfill ({unableCount})
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className={
              activeTab === "cancelled" ? "text-gray-600 border-gray-600" : ""
            }
          >
            Cancelled ({cancelledCount})
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
                      : activeTab === "in-production"
                        ? "No orders in production"
                        : activeTab === "request-change"
                          ? "No orders requesting changes"
                          : activeTab === "stock-ready"
                            ? "No orders marked as stock ready"
                            : activeTab === "unable"
                              ? "No orders marked as unable to fulfill"
                              : activeTab === "confirmed"
                                ? "No orders confirmed by JB"
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
