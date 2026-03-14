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
  onReviewRevision?: (order: Order, currentTab?: string) => void;
  initialTab?: string;
}

const ORDER_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "pabrik", label: "Supplier" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Customer Name" },
  { value: "requestNo", label: "Request No" },
];

export function JBOrder({
  onSeeDetail,
  onUpdateOrder,
  onReviewRevision,
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
  
  // Consolidated tab counts
  const filteredIncomingCount = orderNoFiltered.filter(
    (order) => ["New", "Viewed"].includes(order.status),
  ).length;
  const filteredInReviewCount = orderNoFiltered.filter(
    (order) => ["Change Requested", "Revised - Internal Review", "Order Revised"].includes(order.status),
  ).length;
  const filteredProductionCount = orderNoFiltered.filter(
    (order) => ["Stock Ready", "In Production", "Partially Delivered"].includes(order.status),
  ).length;
  const filteredRejectedCount = orderNoFiltered.filter(
    (order) => ["Unable to Fulfill", "Cancelled", "Rejected"].includes(order.status),
  ).length;
  const filteredDeliveredCount = orderNoFiltered.filter(
    (order) => ["Fully Delivered", "Completed", "Confirmed by JB"].includes(order.status),
  ).length;

  // Get current user
  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "jb-irene-tjandra";

  // Calculate unseen counts (orders not viewed by current user)
  const unseenAllCount = orderNoFiltered.filter(
    (order: Order) => !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Consolidated unseen counts
  const unseenIncomingCount = orderNoFiltered.filter(
    (order: Order) =>
      ["New", "Viewed"].includes(order.status) &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenInReviewCount = orderNoFiltered.filter(
    (order: Order) =>
      ["Change Requested", "Revised - Internal Review", "Order Revised"].includes(order.status) &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenProductionCount = orderNoFiltered.filter(
    (order: Order) =>
      ["Stock Ready", "In Production", "Partially Delivered"].includes(order.status) &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenRejectedCount = orderNoFiltered.filter(
    (order: Order) =>
      ["Unable to Fulfill", "Cancelled", "Rejected"].includes(order.status) &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenDeliveredCount = orderNoFiltered.filter(
    (order: Order) =>
      ["Fully Delivered", "Completed", "Confirmed by JB"].includes(order.status) &&
      !order.viewedBy?.includes(currentUser),
  ).length;

  // Filter orders based on active tab from orderNoFiltered
  let filteredOrders = orderNoFiltered.filter((order: Order) => {
    if (activeTab === "all") {
      return true;
    } else if (activeTab === "incoming") {
      return ["New", "Viewed"].includes(order.status);
    } else if (activeTab === "in-review") {
      return ["Change Requested", "Revised - Internal Review", "Order Revised"].includes(order.status);
    } else if (activeTab === "production") {
      return ["Stock Ready", "In Production", "Partially Delivered"].includes(order.status);
    } else if (activeTab === "rejected") {
      return ["Unable to Fulfill", "Cancelled", "Rejected"].includes(order.status);
    } else if (activeTab === "delivered") {
      return ["Fully Delivered", "Completed", "Confirmed by JB"].includes(order.status);
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
            <span className="flex items-center gap-1.5">
              All ({allCount})
              {unseenAllCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenAllCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="incoming"
            className={
              activeTab === "incoming" ? "text-blue-600 border-blue-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Incoming ({filteredIncomingCount})
              {unseenIncomingCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenIncomingCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="in-review"
            className={
              activeTab === "in-review"
                ? "text-orange-600 border-orange-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              In Review ({filteredInReviewCount})
              {unseenInReviewCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenInReviewCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="production"
            className={
              activeTab === "production"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Production ({filteredProductionCount})
              {unseenProductionCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenProductionCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className={
              activeTab === "rejected" ? "text-red-600 border-red-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Rejected ({filteredRejectedCount})
              {unseenRejectedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenRejectedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="delivered"
            className={
              activeTab === "delivered"
                ? "text-emerald-600 border-emerald-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Delivered ({filteredDeliveredCount})
              {unseenDeliveredCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenDeliveredCount}
                </span>
              )}
            </span>
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
                  onReviewRevision={
                    order.status === "Revised - Internal Review"
                      ? (order) => onReviewRevision?.(order, activeTab)
                      : undefined
                  }
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
