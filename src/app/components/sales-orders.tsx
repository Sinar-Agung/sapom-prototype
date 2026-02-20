import { AlertCircle, Check, Package, X } from "lucide-react";
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
  initialTab?: string;
}

const ORDER_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "pabrik", label: "Pabrik" },
  { value: "atasNama", label: "Atas Nama" },
  { value: "requestNo", label: "Request No" },
];

export function SalesOrders({
  onSeeDetail,
  initialTab = "revised-internal-review",
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
    localStorage.getItem("currentUser") || "sales-tony-wijaya";

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

  // Calculate filtered counts for each tab based on orderNo filter
  const revisedInternalReviewCount = orderNoFiltered.filter(
    (order) => order.status === "Revised - Internal Review",
  ).length;
  const revisionConfirmedCount = orderNoFiltered.filter(
    (order) => order.status === "Revision Confirmed",
  ).length;
  const rejectedCount = orderNoFiltered.filter(
    (order) => order.status === "Rejected",
  ).length;
  const newCount = orderNoFiltered.filter(
    (order) => order.status === "New",
  ).length;
  const viewedCount = orderNoFiltered.filter(
    (order) => order.status === "Viewed",
  ).length;
  const inProductionCount = orderNoFiltered.filter(
    (order) => order.status === "In Production",
  ).length;
  const stockReadyCount = orderNoFiltered.filter(
    (order) => order.status === "Stock Ready",
  ).length;
  const confirmedByJBCount = orderNoFiltered.filter(
    (order) => order.status === "Confirmed by JB",
  ).length;

  // Filter orders based on active tab from orderNoFiltered
  let filteredOrders = orderNoFiltered.filter((order: Order) => {
    if (activeTab === "revised-internal-review") {
      return order.status === "Revised - Internal Review";
    } else if (activeTab === "revision-confirmed") {
      return order.status === "Revision Confirmed";
    } else if (activeTab === "rejected") {
      return order.status === "Rejected";
    } else if (activeTab === "new") {
      return order.status === "New";
    } else if (activeTab === "viewed") {
      return order.status === "Viewed";
    } else if (activeTab === "in-production") {
      return order.status === "In Production";
    } else if (activeTab === "stock-ready") {
      return order.status === "Stock Ready";
    } else if (activeTab === "confirmed") {
      return order.status === "Confirmed by JB";
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

  const handleConfirmClick = (order: Order) => {
    setSelectedOrder(order);
    setActionType("confirm");
    setActionReason("");
    setShowActionDialog(true);
  };

  const handleRejectClick = (order: Order) => {
    setSelectedOrder(order);
    setActionType("reject");
    setActionReason("");
    setShowActionDialog(true);
  };

  const handleActionSubmit = () => {
    if (!selectedOrder || !actionType) return;

    if (actionType === "reject" && !actionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o) => o.id === selectedOrder.id);

      if (orderIndex !== -1) {
        const newStatus =
          actionType === "confirm" ? "Revision Confirmed" : "Rejected";

        allOrders[orderIndex] = {
          ...allOrders[orderIndex],
          status: newStatus,
          updatedDate: Date.now(),
          rejectionReason: actionType === "reject" ? actionReason : undefined,
        };

        localStorage.setItem("orders", JSON.stringify(allOrders));
        loadOrders();

        toast.success(
          actionType === "confirm"
            ? "Order revision confirmed"
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
        totalCount={
          revisedInternalReviewCount +
          revisionConfirmedCount +
          rejectedCount +
          newCount +
          viewedCount +
          inProductionCount +
          stockReadyCount +
          confirmedByJBCount
        }
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
            value="revision-confirmed"
            className={
              activeTab === "revision-confirmed"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            Revision Confirmed ({revisionConfirmedCount})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className={
              activeTab === "rejected" ? "text-red-600 border-red-600" : ""
            }
          >
            Rejected ({rejectedCount})
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
            value="confirmed"
            className={
              activeTab === "confirmed" ? "text-green-600 border-green-600" : ""
            }
          >
            Confirmed ({confirmedByJBCount})
          </TabsTrigger>
        </TabsList>

        {/* Revised - Internal Review Tab */}
        <TabsContent value="revised-internal-review" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <OrderCard
                  order={order}
                  onToggleExpand={toggleExpand}
                  isExpanded={expandedOrderId === order.id}
                  onSeeDetail={onSeeDetail}
                />
                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleRejectClick(order)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleConfirmClick(order)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-amber-100 p-4">
                  <Package className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Orders Awaiting Review
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders revised by JB awaiting your review will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Revision Confirmed Tab */}
        <TabsContent value="revision-confirmed" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-green-100 p-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Confirmed Revisions
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders you've confirmed will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-red-100 p-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Rejected Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders you've rejected will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="new" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-blue-100 p-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No New Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    New orders from your requests will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="viewed" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-purple-100 p-4">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Viewed Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders viewed by suppliers will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in-production" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-blue-100 p-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Orders In Production
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders currently in production will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stock-ready" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-green-100 p-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Stock Ready Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders ready for pickup will appear here
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleExpand={toggleExpand}
                isExpanded={expandedOrderId === order.id}
                onSeeDetail={onSeeDetail}
              />
            ))
          ) : (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-green-100 p-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Confirmed Orders
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders confirmed by JB will appear here
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
                ? "Confirm Order Revision"
                : "Reject Order Revision"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "confirm"
                ? "Are you sure you want to confirm this order revision?"
                : "Please provide a reason for rejecting this order revision."}
            </DialogDescription>
          </DialogHeader>
          {actionType === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection *</Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="min-h-[100px]"
              />
            </div>
          )}
          {actionType === "confirm" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-reason">
                Reason (Optional)
              </Label>
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
              {actionType === "confirm" ? "Confirm" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
