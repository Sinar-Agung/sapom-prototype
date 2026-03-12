import { Order } from "@/app/types/order";
import { notifyOrderStatusChanged } from "@/app/utils/notification-helper";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface SupplierOrdersProps {
  onSeeDetail?: (order: Order, currentTab?: string) => void;
  onUpdateOrder?: (order: Order, currentTab?: string) => void;
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
  onUpdateOrder,
  initialTab = "all",
}: SupplierOrdersProps) {
  const { t } = useTranslation();
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
  }, [activeTab]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("orders");
    const supplierId = getSupplierId();

    console.log("🔍 Supplier Orders Debug:");
    console.log("  Current User:", currentUser);
    console.log("  Supplier ID:", supplierId);
    console.log("  Active Tab:", activeTab);
    console.log("  Saved Orders:", savedOrders ? "Found" : "Not found");

    if (savedOrders && supplierId) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      console.log("  Total Orders in Storage:", allOrders.length);

      // Filter orders for this supplier
      const myOrders = allOrders.filter(
        (order) => order.pabrik?.id === supplierId,
      );

      console.log("  Filtered Orders for", supplierId + ":", myOrders.length);
      console.log("  Orders:", myOrders.map(o => ({
        id: o.id,
        PONumber: o.PONumber,
        status: o.status,
        pabrikId: o.pabrik?.id,
        pabrikName: o.pabrik?.name
      })));

      setOrders(myOrders);
    } else {
      console.log("  ⚠️ No orders or supplierId missing");
      setOrders([]);
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
  // Note: orders state already filtered by supplierId in loadOrders()
  const orderNoFiltered = orders.filter((order: Order) => {
    // Filter by Order No
    if (orderNoFilter) {
      const searchTerm = orderNoFilter.toLowerCase();
      const poNumber = order.PONumber?.toLowerCase() || "";
      return poNumber.includes(searchTerm);
    }
    return true;
  });

  // Calculate filtered counts for each consolidated tab based on orderNo filter
  const allCount = orderNoFiltered.length;
  
  // Incoming: New + Viewed
  const filteredIncomingCount = orderNoFiltered.filter(
    (order: Order) => order.status === "New" || order.status === "Viewed",
  ).length;
  
  // In Review: Change Requested + Revised - Internal Review + Order Revised
  const filteredInReviewCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Change Requested" ||
      order.status === "Revised - Internal Review" ||
      order.status === "Order Revised",
  ).length;
  
  // Production: Stock Ready + In Production
  const filteredProductionCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Stock Ready" ||
      order.status === "In Production",
  ).length;
  
  // Rejected: Unable to Fulfill + Cancelled
  const filteredRejectedCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Unable to Fulfill" ||
      order.status === "Cancelled",
  ).length;
  
  // Delivered: Partially Delivered + Fully Delivered
  const filteredDeliveredCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Partially Delivered" ||
      order.status === "Fully Delivered",
  ).length;

  // Calculate unseen counts for consolidated tabs (orders not viewed by current user)
  const unseenAllCount = orderNoFiltered.filter(
    (order: Order) => !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Incoming unseen count
  const unseenIncomingCount = orderNoFiltered.filter(
    (order: Order) =>
      (order.status === "New" || order.status === "Viewed") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // In Review unseen count
  const unseenInReviewCount = orderNoFiltered.filter(
    (order: Order) =>
      (order.status === "Change Requested" ||
       order.status === "Revised - Internal Review" ||
       order.status === "Order Revised") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Production unseen count
  const unseenProductionCount = orderNoFiltered.filter(
    (order: Order) =>
      (order.status === "Stock Ready" ||
       order.status === "In Production") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Rejected unseen count
  const unseenRejectedCount = orderNoFiltered.filter(
    (order: Order) =>
      (order.status === "Unable to Fulfill" ||
       order.status === "Cancelled") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Delivered unseen count
  const unseenDeliveredCount = orderNoFiltered.filter(
    (order: Order) =>
      (order.status === "Partially Delivered" ||
       order.status === "Fully Delivered") &&
      !order.viewedBy?.includes(currentUser),
  ).length;

  // Filter by active tab with consolidated tabs
  let filteredOrders = orderNoFiltered.filter((order: Order) => {
    if (activeTab === "all") {
      return true;
    } else if (activeTab === "incoming") {
      return order.status === "New" || order.status === "Viewed";
    } else if (activeTab === "in-review") {
      return (
        order.status === "Change Requested" ||
        order.status === "Revised - Internal Review" ||
        order.status === "Order Revised"
      );
    } else if (activeTab === "production") {
      return (
        order.status === "Stock Ready" ||
        order.status === "In Production"
      );
    } else if (activeTab === "rejected") {
      return (
        order.status === "Unable to Fulfill" ||
        order.status === "Cancelled"
      );
    } else if (activeTab === "delivered") {
      return (
        order.status === "Partially Delivered" ||
        order.status === "Fully Delivered"
      );
    }
    return false;
  });

  // Debug log filtered results
  console.log("📊 Filtering Results:");
  console.log("  Active Tab:", activeTab);
  console.log("  Orders in state:", orders.length);
  console.log("  After PONumber filter:", orderNoFiltered.length);
  console.log("  After tab filter:", filteredOrders.length);
  console.log("  Sort By:", sortBy);
  console.log("  Sort Direction:", sortDirection);
  if (filteredOrders.length > 0) {
    console.log("  Sample Orders (before sort):", filteredOrders.slice(0, 3).map(o => ({
      PONumber: o.PONumber,
      status: o.status,
      createdDate: o.createdDate,
      updatedDate: o.updatedDate,
      pabrik: o.pabrik?.name
    })));
  }

  // Sort orders
  filteredOrders = filteredOrders.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        // Use updatedDate if available, otherwise use createdDate
        const aUpdated = a.updatedDate || a.createdDate || 0;
        const bUpdated = b.updatedDate || b.createdDate || 0;
        comparison = bUpdated - aUpdated;
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

  // Debug log after sorting
  if (filteredOrders.length > 0) {
    console.log("  ✅ After Sort (Top 3):", filteredOrders.slice(0, 3).map(o => ({
      PONumber: o.PONumber,
      status: o.status,
      createdDate: new Date(o.createdDate).toLocaleString(),
      updatedDate: o.updatedDate ? new Date(o.updatedDate).toLocaleString() : 'N/A',
    })));
  }

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
              {t("orderTabs.all")} ({allCount})
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
              {t("orderTabs.incoming")} ({filteredIncomingCount})
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
              {t("orderTabs.inReview")} ({filteredInReviewCount})
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
              {t("orderTabs.production")} ({filteredProductionCount})
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
              {t("orderTabs.rejected")} ({filteredRejectedCount})
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
              {t("orderTabs.delivered")} ({filteredDeliveredCount})
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
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No orders found</p>
                <p className="text-sm">
                  {activeTab === "incoming"
                    ? "You don't have any incoming orders yet."
                    : activeTab === "in-review"
                      ? "No orders under review."
                      : activeTab === "production"
                        ? "No orders in production."
                        : activeTab === "rejected"
                          ? "No rejected or cancelled orders."
                          : activeTab === "delivered"
                            ? "No delivered orders."
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
                    onUpdateOrder={
                      order.status === "Change Requested"
                        ? (order) => onUpdateOrder?.(order, activeTab)
                        : undefined
                    }
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
