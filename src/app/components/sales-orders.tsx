import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Order } from "../types/order";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { OrderCard } from "./order-card";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

interface SalesOrdersProps {
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
  { value: "atasNama", label: "Customer Name" },
  { value: "requestNo", label: "Request No" },
];

export function SalesOrders({
  onSeeDetail,
  onReviewRevision,
  initialTab = "all",
}: SalesOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem("salesOrderActiveTab");
    return saved || initialTab;
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem("salesOrderSortBy") || "updatedDate";
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("salesOrderSortDirection") as "asc" | "desc") ||
      "desc"
    );
  });
  const [orderNoFilter, setOrderNoFilter] = useState<string>(() => {
    return sessionStorage.getItem("salesOrderFilter") || "";
  });

  // Confirm/Reject dialog state
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "reject" | null>(
    null,
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionReason, setActionReason] = useState("");

  // Get current user
  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "sales-tony-wijaya";

  // Persist filter/sort state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("salesOrderActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("salesOrderSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("salesOrderSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    sessionStorage.setItem("salesOrderFilter", orderNoFilter);
  }, [orderNoFilter]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      // Filter to only show orders from this sales person's requests
      const filteredOrders = allOrders.filter(
        (order) => order.sales === currentUser,
      );
      setOrders(filteredOrders);
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

  // Calculate filtered counts for consolidated tabs based on orderNo filter
  const allCount = orderNoFiltered.length;
  
  // Incoming: New + Viewed
  const filteredIncomingCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "New" || order.status === "Viewed",
  ).length;
  
  // In Review: Change Requested + Revised - Internal Review + Order Revised
  const filteredInReviewCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Change Requested" ||
      order.status === "Revised - Internal Review" ||
      order.status === "Order Revised",
  ).length;
  
  // Production: In Production + Stock Ready + Partially Delivered
  const filteredProductionCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Stock Ready" ||
      order.status === "In Production" ||
      order.status === "Partially Delivered",
  ).length;
  
  // Rejected: Unable to Fulfill + Cancelled + Rejected
  const filteredRejectedCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Unable to Fulfill" ||
      order.status === "Rejected" ||
      order.status === "Cancelled",
  ).length;
  
  // Delivered: Fully Delivered + Completed + Confirmed by JB
  const filteredDeliveredCount = orderNoFiltered.filter(
    (order: Order) => 
      order.status === "Fully Delivered" ||
      order.status === "Completed" ||
      order.status === "Confirmed by JB",
  ).length;

  // Calculate unseen counts for consolidated tabs (orders not viewed by current user)
  const unseenAllCount = orderNoFiltered.filter(
    (order) => !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Incoming unseen count (New + Viewed)
  const unseenIncomingCount = orderNoFiltered.filter(
    (order) =>
      (order.status === "New" || order.status === "Viewed") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // In Review unseen count (Change Requested + Revised - Internal Review + Order Revised)
  const unseenInReviewCount = orderNoFiltered.filter(
    (order) =>
      (order.status === "Change Requested" ||
       order.status === "Revised - Internal Review" ||
       order.status === "Order Revised") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Production unseen count (In Production + Stock Ready + Partially Delivered)
  const unseenProductionCount = orderNoFiltered.filter(
    (order) =>
      (order.status === "Stock Ready" ||
       order.status === "In Production" ||
       order.status === "Partially Delivered") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Rejected unseen count (Unable to Fulfill + Cancelled + Rejected)
  const unseenRejectedCount = orderNoFiltered.filter(
    (order) =>
      (order.status === "Unable to Fulfill" ||
       order.status === "Cancelled" ||
       order.status === "Rejected") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  
  // Delivered unseen count (Fully Delivered + Completed + Confirmed by JB)
  const unseenDeliveredCount = orderNoFiltered.filter(
    (order) =>
      (order.status === "Fully Delivered" ||
       order.status === "Completed" ||
       order.status === "Confirmed by JB") &&
      !order.viewedBy?.includes(currentUser),
  ).length;

  // Filter orders based on active tab with consolidated tabs
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
        order.status === "In Production" ||
        order.status === "Partially Delivered"
      );
    } else if (activeTab === "rejected") {
      return (
        order.status === "Rejected" ||
        order.status === "Unable to Fulfill" ||
        order.status === "Cancelled"
      );
    } else if (activeTab === "delivered") {
      return (
        order.status === "Fully Delivered" ||
        order.status === "Completed" ||
        order.status === "Confirmed by JB"
      );
    }
    return true;
  });

  // Sort orders based on sortBy and sortDirection
  filteredOrders = filteredOrders.sort((a: Order, b: Order) => {
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
        comparison = (a.waktuKirim || "").localeCompare(b.waktuKirim || "");
        break;
      case "productName":
        const aProduct = `${a.jenisProduk} ${a.namaProduk || a.namaBasic}`;
        const bProduct = `${b.jenisProduk} ${b.namaProduk || b.namaBasic}`;
        comparison = aProduct.localeCompare(bProduct);
        break;
      case "pabrik":
        const aPabrik =
          typeof a.pabrik === "string" ? a.pabrik : a.pabrik?.name || "";
        const bPabrik =
          typeof b.pabrik === "string" ? b.pabrik : b.pabrik?.name || "";
        comparison = aPabrik.localeCompare(bPabrik);
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

  const handleActionSubmit = () => {
    if (!selectedOrder || !actionType) return;

    if (actionType === "reject" && !actionReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o) => o.id === selectedOrder.id);

      if (orderIndex !== -1) {
        const newStatus =
          actionType === "confirm" ? "Order Revised" : "Rejected";

        allOrders[orderIndex] = {
          ...allOrders[orderIndex],
          status: newStatus,
          updatedDate: Date.now(),
        };

        localStorage.setItem("orders", JSON.stringify(allOrders));
        loadOrders();

        toast.success(
          actionType === "confirm"
            ? "Order revision approved"
            : "Order rejected",
        );
      }
    }

    setShowActionDialog(false);
    setSelectedOrder(null);
    setActionType(null);
    setActionReason("");
  };

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Orders created from your requests
        </p>
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
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={() => toggleExpand(order.id)}
                isExpanded={expandedOrderId === order.id}
                currentUser={currentUser}
                onSeeDetail={onSeeDetail}
                onReviewRevision={
                  order.status === "Revised - Internal Review"
                    ? (order) => onReviewRevision?.(order, activeTab)
                    : undefined
                }
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-gray-100 p-4">
                  <Package className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm/Reject Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "confirm"
                ? "Approve Order Revision"
                : "Cancel Order"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "confirm"
                ? "Are you sure you want to approve this order revision?"
                : "Please provide a reason for cancelling this order."}
            </DialogDescription>
          </DialogHeader>
          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter the reason for cancelling this order..."
                className="min-h-[100px]"
              />
            </div>
          )}
          {actionType === "confirm" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-reason">Reason (Optional)</Label>
              <Textarea
                id="confirm-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Add any notes or comments..."
                className="min-h-[100px]"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              className={
                actionType === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {actionType === "confirm" ? "Approve" : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
