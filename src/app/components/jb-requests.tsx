import { getCurrentUserDetails } from "@/app/utils/user-data";
import { useEffect, useState } from "react";
import { Order } from "../types/order";
import { EntityReference, Request } from "../types/request";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { OrderCard } from "./order-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Convert a Request to an Order-compatible structure for rendering with OrderCard
function requestToOrder(request: Request): Order {
  const pabrik: EntityReference =
    typeof request.pabrik === "string"
      ? { id: "", name: request.pabrik }
      : (request.pabrik as EntityReference) || { id: "", name: "Unknown" };

  return {
    id: request.id,
    PONumber: "",
    requestNo: request.requestNo,
    requestId: request.id,
    sales: request.createdBy,
    atasNama:
      typeof request.namaPelanggan === "string"
        ? request.namaPelanggan
        : (request.namaPelanggan as EntityReference)?.name || "",
    createdDate: request.timestamp,
    createdBy: request.createdBy || "",
    updatedDate: request.updatedDate,
    jbId: "",
    branchCode: request.branchCode,
    pabrik,
    kategoriBarang: request.kategoriBarang,
    jenisProduk: request.jenisProduk,
    namaProduk: request.namaProduk || "",
    namaBasic: request.namaBasic || "",
    waktuKirim: request.waktuKirim || "",
    customerExpectation: request.customerExpectation || "",
    detailItems: request.detailItems || [],
    status: request.status as any,
    photoId: request.photoId,
    viewedBy: request.viewedBy || [],
    rejectionReason: request.rejectionReason,
  };
}

interface JBRequestsProps {
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
}

const REQUEST_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Customer Name" },
  { value: "pabrik", label: "Supplier" },
  { value: "requestNo", label: "Request No" },
];

export function JBRequests({ onSeeDetail, initialTab }: JBRequestsProps) {
  const [orders, setOrders] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem("jbRequestActiveTab");
    return saved || initialTab || "assigned";
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem("jbRequestSortBy") || "updatedDate";
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("jbRequestSortDirection") as "asc" | "desc") ||
      "desc"
    );
  });
  const [requestNoFilter, setRequestNoFilter] = useState<string>(() => {
    return sessionStorage.getItem("jbRequestFilter") || "";
  });

  // Persist filter/sort state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("jbRequestActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("jbRequestSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("jbRequestSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    sessionStorage.setItem("jbRequestFilter", requestNoFilter);
  }, [requestNoFilter]);

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

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Reload data when tab changes
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("requests");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    
    // Mark request as viewed when showing items
    if (expandedOrderId !== orderId) {
      markRequestAsViewed(orderId);
    }
  };

  const markRequestAsViewed = (requestId: string) => {
    const savedRequests = localStorage.getItem("requests");
    if (!savedRequests) return;

    const allRequests: Request[] = JSON.parse(savedRequests);
    const updatedRequests = allRequests.map((req) => {
      if (req.id === requestId) {
        const viewedBy = req.viewedBy || [];
        if (!viewedBy.includes(currentUser)) {
          return { ...req, viewedBy: [...viewedBy, currentUser] };
        }
      }
      return req;
    });

    localStorage.setItem("requests", JSON.stringify(updatedRequests));
    setOrders(updatedRequests);
  };

  // Filter by Request No first (before tab filtering)
  const requestNoFiltered = orders.filter((order: Request) => {
    const currentUserDetails = getCurrentUserDetails();

    // Branch filtering: Only show requests from the same branch
    if (currentUserDetails?.branchCode && order.branchCode) {
      if (currentUserDetails.branchCode !== order.branchCode) {
        return false;
      }
    }

    // Request number filter
    if (requestNoFilter) {
      const searchTerm = requestNoFilter.toLowerCase();
      const requestNo = order.requestNo?.toLowerCase() || "";
      return requestNo.includes(searchTerm);
    }
    return true;
  });

  // Calculate filtered counts for each tab based on requestNo filter
  const filteredAssignedCount = requestNoFiltered.filter(
    (order: Request) => order.status === "Requested to JB",
  ).length;
  const filteredWaitingCount = requestNoFiltered.filter(
    (order: Request) => order.status === "Ordered",
  ).length;
  const filteredExpiredCount = requestNoFiltered.filter(
    (order: Request) => order.status === "Request Expired",
  ).length;

  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Calculate unseen counts (requests not viewed by current user)
  const unseenAssignedCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Requested to JB" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenWaitingCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Ordered" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenExpiredCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Request Expired" &&
      !order.viewedBy?.includes(currentUser),
  ).length;

  // Filter by active tab
  let filteredOrders = requestNoFiltered.filter((order: Request) => {
    if (activeTab === "assigned") {
      return order.status === "Requested to JB";
    } else if (activeTab === "waiting") {
      return order.status === "Ordered";
    } else if (activeTab === "expired") {
      return order.status === "Request Expired";
    }
    return false;
  });

  // Sort orders
  filteredOrders = filteredOrders.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        comparison =
          new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime();
        break;
      case "created":
        comparison =
          new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
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
      case "requestNo":
        comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
        break;
      default:
        return 0;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Calculate counts for each tab (total, not filtered)
  const assignedCount = orders.filter(
    (order: Request) => order.status === "Requested to JB",
  ).length;
  const waitingCount = orders.filter(
    (order: Request) => order.status === "Ordered",
  ).length;
  const expiredCount = orders.filter(
    (order: Request) => order.status === "Request Expired",
  ).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl font-semibold">Requests</h1>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex-shrink-0 mb-4">
        <FilterSortControls
          type="request"
          totalCount={assignedCount + waitingCount + expiredCount}
          filterValue={requestNoFilter}
          onFilterChange={setRequestNoFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={REQUEST_SORT_OPTIONS}
        />
      </div>

      {/* Tabs and Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="assigned"
            className={
              activeTab === "assigned"
                ? "text-purple-600 border-purple-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Assigned to JB ({filteredAssignedCount})
              {unseenAssignedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenAssignedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="waiting"
            className={
              activeTab === "waiting" ? "text-blue-600 border-blue-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Ordered ({filteredWaitingCount})
              {unseenWaitingCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenWaitingCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="expired"
            className={
              activeTab === "expired" ? "text-red-600 border-red-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Expired ({filteredExpiredCount})
              {unseenExpiredCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenExpiredCount}
                </span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p>No requests in this tab</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const orderData = requestToOrder(order);
                  
                  // Wrap onSeeDetail to mark as viewed
                  const handleSeeDetail = onSeeDetail
                    ? (_o: Order) => {
                        markRequestAsViewed(order.id);
                        onSeeDetail(order, activeTab);
                      }
                    : undefined;
                  
                  return (
                    <OrderCard
                      key={order.id}
                      order={orderData}
                      userRole="jb"
                      activeTab={activeTab}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(order.id)}
                      onSeeDetail={handleSeeDetail}
                      currentUser={currentUser}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
