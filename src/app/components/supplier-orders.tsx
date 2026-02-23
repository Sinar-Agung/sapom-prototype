import { Order } from "@/app/types/order";
import { notifyOrderStatusChanged } from "@/app/utils/notification-helper";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SupplierOrdersProps {
  onSeeDetail?: (order: Order, currentTab?: string) => void;
  initialTab?: string;
}

const ORDER_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Customer Name" },
  { value: "pabrik", label: "Supplier" },
  { value: "orderNo", label: "Order No" },
];

export function SupplierOrders({
  onSeeDetail,
  initialTab = "all",
}: SupplierOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem("supplierOrderActiveTab");
    return saved || initialTab;
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem("supplierOrderSortBy") || "updatedDate";
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("supplierOrderSortDirection") as
        | "asc"
        | "desc") || "desc"
    );
  });
  const [orderNoFilter, setOrderNoFilter] = useState<string>(() => {
    return sessionStorage.getItem("supplierOrderFilter") || "";
  });

  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Get supplier ID from user data
  const getSupplierId = () => {
    // First try to get from stored user profile
    const userProfile =
      sessionStorage.getItem("userProfile") ||
      localStorage.getItem("userProfile");

    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        if (user.accountType === "supplier" && user.supplierId) {
          return user.supplierId;
        }
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }

    // Fallback to searching in userDatabase
    const userDataString = sessionStorage.getItem("userDatabase");
    if (userDataString) {
      const users = JSON.parse(userDataString);
      const user = users.find((u: any) => u.username === currentUser);
      return user?.supplierId || "";
    }
    return "";
  };

  // Persist filter/sort state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("supplierOrderActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("supplierOrderSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("supplierOrderSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    sessionStorage.setItem("supplierOrderFilter", orderNoFilter);
  }, [orderNoFilter]);

  useEffect(() => {
    loadOrders();

    // Reload orders when window regains focus (e.g., returning from detail view)
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
    const supplierId = getSupplierId();

    console.log("🔍 Supplier Orders Debug:");
    console.log("  Current User:", currentUser);
    console.log("  Supplier ID:", supplierId);
    console.log("  Saved Orders:", savedOrders ? "Found" : "Not found");

    if (savedOrders && supplierId) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      console.log("  Total Orders in Storage:", allOrders.length);

      // Filter orders for this supplier
      const myOrders = allOrders.filter(
        (order) => order.pabrik?.id === supplierId,
      );

      console.log("  Filtered Orders for", supplierId + ":", myOrders.length);
      console.log("  Orders:", myOrders);

      setOrders(myOrders);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o) => o.id === orderId);
      if (orderIndex !== -1) {
        const oldStatus = allOrders[orderIndex].status;
        allOrders[orderIndex].status = newStatus as any;
        allOrders[orderIndex].updatedDate = Date.now();
        allOrders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));

        // Create notification for order status change
        notifyOrderStatusChanged(
          allOrders[orderIndex],
          oldStatus,
          newStatus,
          currentUser,
          "supplier",
        );

        loadOrders();
      }
    }
  };

  // Filter by Order No first (before tab filtering)
  const supplierId = getSupplierId();
  const orderNoFiltered = orders.filter((order: Order) => {
    // Ensure this order belongs to the current supplier
    if (order.pabrik?.id !== supplierId) {
      return false;
    }
    // Filter by Order No
    if (orderNoFilter) {
      const searchTerm = orderNoFilter.toLowerCase();
      const poNumber = order.PONumber?.toLowerCase() || "";
      return poNumber.includes(searchTerm);
    }
    return true;
  });

  // Calculate filtered counts for each tab based on orderNo filter
  const allCount = orderNoFiltered.length;
  const filteredNewCount = orderNoFiltered.filter(
    (order: Order) => order.status === "New",
  ).length;
  const filteredViewedCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Viewed",
  ).length;
  const filteredChangeRequestedCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Change Requested",
  ).length;
  const filteredRevisedInternalReviewCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Revised - Internal Review",
  ).length;
  const filteredOrderRevisedCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Order Revised",
  ).length;
  const filteredStockReadyCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Stock Ready",
  ).length;
  const filteredInProductionCount = orderNoFiltered.filter(
    (order: Order) => order.status === "In Production",
  ).length;
  const filteredUnableCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Unable to Fulfill",
  ).length;
  const filteredCancelledCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Cancelled",
  ).length;

  // Calculate unseen counts (orders not viewed by current user)
  const unseenAllCount = orderNoFiltered.filter(
    (order: Order) => !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenNewCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "New" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenViewedCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Viewed" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenChangeRequestedCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Change Requested" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenRevisedInternalReviewCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Revised - Internal Review" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenOrderRevisedCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Order Revised" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenStockReadyCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Stock Ready" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenInProductionCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "In Production" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenUnableCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Unable to Fulfill" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenCancelledCount = orderNoFiltered.filter(
    (order: Order) =>
      order.status === "Cancelled" && !order.viewedBy?.includes(currentUser),
  ).length;

  // Filter by active tab
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
    }
    return false;
  });

  // Sort orders
  filteredOrders = filteredOrders.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        comparison =
          new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
        break;
      case "created":
        comparison =
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        break;
      case "eta":
        comparison =
          new Date(a.waktuKirim).getTime() - new Date(b.waktuKirim).getTime();
        break;
      case "productName":
        comparison = (a.namaBarang || "").localeCompare(b.namaBarang || "");
        break;
      case "sales":
        comparison = (a.sales || "").localeCompare(b.sales || "");
        break;
      case "atasNama":
        comparison = (a.atasNama || "").localeCompare(b.atasNama || "");
        break;
      case "pabrik":
        comparison = (a.pabrik?.nama || "").localeCompare(b.pabrik?.nama || "");
        break;
      case "orderNo":
        comparison = (a.orderNo || "").localeCompare(b.orderNo || "");
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
        <h1 className="text-2xl font-bold">My Orders</h1>
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
            value="new"
            className={
              activeTab === "new" ? "text-blue-600 border-blue-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              New ({filteredNewCount})
              {unseenNewCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenNewCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="viewed"
            className={
              activeTab === "viewed" ? "text-purple-600 border-purple-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Viewed ({filteredViewedCount})
              {unseenViewedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenViewedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="change-requested"
            className={
              activeTab === "change-requested"
                ? "text-orange-600 border-orange-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Change Requested ({filteredChangeRequestedCount})
              {unseenChangeRequestedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenChangeRequestedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="revised-internal-review"
            className={
              activeTab === "revised-internal-review"
                ? "text-amber-600 border-amber-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Revised - Internal Review ({filteredRevisedInternalReviewCount})
              {unseenRevisedInternalReviewCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenRevisedInternalReviewCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="order-revised"
            className={
              activeTab === "order-revised"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Order Revised ({filteredOrderRevisedCount})
              {unseenOrderRevisedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenOrderRevisedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="stock-ready"
            className={
              activeTab === "stock-ready"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Stock Ready ({filteredStockReadyCount})
              {unseenStockReadyCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenStockReadyCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="in-production"
            className={
              activeTab === "in-production"
                ? "text-blue-600 border-blue-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              In Production ({filteredInProductionCount})
              {unseenInProductionCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenInProductionCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="unable"
            className={
              activeTab === "unable" ? "text-red-600 border-red-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Unable to Fulfill ({filteredUnableCount})
              {unseenUnableCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenUnableCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className={
              activeTab === "cancelled" ? "text-gray-600 border-gray-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Cancelled ({filteredCancelledCount})
              {unseenCancelledCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenCancelledCount}
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
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No orders found</p>
                <p className="text-sm">
                  {activeTab === "new"
                    ? "You don't have any new orders yet."
                    : activeTab === "viewed"
                      ? "No viewed orders."
                      : activeTab === "in-production"
                        ? "No orders in production."
                        : activeTab === "request-change"
                          ? "No orders requesting changes."
                          : activeTab === "stock-ready"
                            ? "No orders marked as stock ready."
                            : activeTab === "unable"
                              ? "No orders marked as unable to fulfill."
                              : "No orders found."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isExpanded={expandedOrderId === order.id}
                    onToggleExpand={() => toggleExpand(order.id)}
                    onSeeDetail={(order) => {
                      // Auto-update status to Viewed if order is New
                      if (order.status === "New") {
                        handleUpdateStatus(order.id, "Viewed");
                      }
                      onSeeDetail?.(order, activeTab);
                    }}
                    currentUser={currentUser}
                    userRole="supplier"
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
