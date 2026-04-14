import { useCallback, useEffect, useRef, useState } from "react";
import { Order } from "../types/order";
import { EntityReference, Request } from "../types/request";
import { notifyRequestCancelled } from "../utils/notification-helper";
import { getCurrentUserDetails } from "../utils/user-data";
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

interface MyOrdersProps {
  onEditOrder?: (order: Request) => void;
  onDuplicateOrder?: (order: Request) => void;
  userRole?: "sales" | "stockist" | "jb";
  onViewRequestDetails?: (order: Request, currentTab: string) => void;
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
  justCreatedRequest?: boolean;
  onClearJustCreated?: () => void;
}

type MySortOption =
  | "created"
  | "eta"
  | "sales"
  | "pabrik"
  | "jenis"
  | "atasNama"
  | "updatedDate"
  | "updatedBy";

const REQUEST_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Customer Name" },
  { value: "pabrik", label: "Supplier" },
  { value: "requestNo", label: "PO Number" },
];

export function MyOrders({
  onEditOrder,
  onDuplicateOrder,
  userRole = "sales",
  onViewRequestDetails,
  onSeeDetail,
  initialTab,
  justCreatedRequest,
  onClearJustCreated,
}: MyOrdersProps) {
  const [orders, setOrders] = useState<Request[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    console.log("🟢 MyOrders useState initialization");
    console.log("   justCreatedRequest:", justCreatedRequest);
    console.log("   initialTab:", initialTab);

    if (justCreatedRequest) {
      console.log("   ✅ justCreatedRequest is true, forcing 'open' tab");
      sessionStorage.removeItem("myRequestActiveTab");
      return "open";
    }
    if (initialTab) {
      console.log("   Using initialTab:", initialTab);
      return initialTab;
    }
    const saved = sessionStorage.getItem("myRequestActiveTab");
    console.log(
      "   Restoring from sessionStorage:",
      saved || "(none, defaulting to 'open')",
    );
    return saved || "open";
  });
  const [sortBy, setSortBy] = useState<MySortOption>(() => {
    return (
      (sessionStorage.getItem("myRequestSortBy") as MySortOption) ||
      "updatedDate"
    );
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("myRequestSortDirection") as "asc" | "desc") ||
      "desc"
    );
  });
  const [requestNoFilter, setRequestNoFilter] = useState<string>(() => {
    return sessionStorage.getItem("myRequestFilter") || "";
  });
  const [displayedCount, setDisplayedCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Get Kadar background color
  const getKadarColor = (_kadar: string) => "";

  // Get Pabrik background color
  const getPabrikColor = (pabrikName: string) => {
    const colors: Record<string, string> = {
      Santa: "bg-purple-100 text-purple-800",
      Semar: "bg-blue-100 text-blue-800",
      UBS: "bg-emerald-100 text-emerald-800",
      Phoenix: "bg-orange-100 text-orange-800",
      Rajawali: "bg-red-100 text-red-800",
      King: "bg-amber-100 text-amber-800",
      Lotus: "bg-pink-100 text-pink-800",
      Cemerlang: "bg-teal-100 text-teal-800",
      Antam: "bg-indigo-100 text-indigo-800",
    };

    // Check if pabrik name contains any of the keys
    for (const [key, color] of Object.entries(colors)) {
      if (pabrikName.includes(key)) {
        return color;
      }
    }
    return "bg-gray-100 text-gray-800";
  };

  // Get Warna background color
  const getWarnaColor = (warna: string) => {
    const colors: Record<string, string> = {
      rg: "bg-rose-300 text-gray-800",
      ap: "bg-gray-200 text-gray-800",
      kn: "bg-yellow-400 text-gray-800",
      ks: "bg-yellow-300 text-gray-800",
      "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
      "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
    };
    return colors[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
  };

  // Get Warna display label
  const getWarnaLabel = (warna: string) => {
    const labels: Record<string, string> = {
      rg: "RG",
      ap: "AP",
      kn: "KN",
      ks: "KS",
      "2w-ap-rg": "2W (AP & RG)",
      "2w-ap-kn": "2W (AP & KN)",
    };
    return labels[warna.toLowerCase()] || warna.toUpperCase();
  };

  // Get Ukuran display label
  const getUkuranDisplay = (ukuran: string) => {
    const labels: Record<string, string> = {
      a: "A - Anak",
      n: "N - Normal",
      p: "P - Panjang",
      t: "T - Tanggung",
    };

    // Check if it's a predefined value
    const label = labels[ukuran.toLowerCase()];
    if (label) {
      return { value: label, showUnit: false };
    }

    // Otherwise it's a custom numeric value
    return { value: ukuran, showUnit: true };
  };

  // Clear the justCreatedRequest flag after component mounts
  useEffect(() => {
    if (justCreatedRequest && onClearJustCreated) {
      // Clear it on next tick to ensure the initial render uses the flag
      setTimeout(() => onClearJustCreated(), 0);
    }
  }, [justCreatedRequest, onClearJustCreated]);

  // Persist activeTab to sessionStorage, but not when we just created a request
  useEffect(() => {
    console.log("🟡 activeTab persistence useEffect triggered");
    console.log("   justCreatedRequest:", justCreatedRequest);
    console.log("   activeTab:", activeTab);

    if (!justCreatedRequest) {
      console.log("   💾 Saving to sessionStorage:", activeTab);
      sessionStorage.setItem("myRequestActiveTab", activeTab);
    } else {
      console.log("   ⏭️ Skipping save (justCreatedRequest is true)");
    }
  }, [activeTab, justCreatedRequest]);

  // Update activeTab when initialTab prop changes (e.g., after saving a new request)
  // BUT skip this if we just created a request (the flag takes precedence)
  useEffect(() => {
    console.log("🔴 initialTab useEffect triggered");
    console.log("   justCreatedRequest:", justCreatedRequest);
    console.log("   initialTab:", initialTab);
    console.log("   activeTab:", activeTab);

    if (!justCreatedRequest && initialTab && initialTab !== activeTab) {
      console.log("   ⚠️ Changing activeTab from", activeTab, "to", initialTab);
      setActiveTab(initialTab);
    } else {
      console.log("   No change needed");
    }
  }, [initialTab, justCreatedRequest]);

  // Persist filter/sort state to sessionStorage

  useEffect(() => {
    sessionStorage.setItem("myRequestSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("myRequestSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    sessionStorage.setItem("myRequestFilter", requestNoFilter);
  }, [requestNoFilter]);

  // Handler for tab changes with logging
  const handleTabChange = (newTab: string) => {
    console.log("🟣 Tab changed by user interaction");
    console.log("   Previous tab:", activeTab);
    console.log("   New tab:", newTab);
    setActiveTab(newTab);
  };

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

  const cancelOrder = (orderId: string) => {
    const updatedOrders = orders.map((order: Request) =>
      order.id === orderId ? { ...order, status: "Cancelled" } : order,
    );
    setOrders(updatedOrders);
    localStorage.setItem("requests", JSON.stringify(updatedOrders));

    // Create notification about the cancellation
    const cancelledRequest = updatedOrders.find(
      (order: Request) => order.id === orderId,
    );
    if (cancelledRequest) {
      const currentUser =
        sessionStorage.getItem("username") ||
        localStorage.getItem("username") ||
        "";
      notifyRequestCancelled(cancelledRequest, currentUser);
    }
  };

  // Filter by Request No first
  const requestNoFiltered = orders.filter((order: Request) => {
    const currentUserDetails = getCurrentUserDetails();

    // Branch filtering: Only show requests from the same branch
    // (Suppliers have null branchCode, so they see all requests)
    if (currentUserDetails?.branchCode && order.branchCode) {
      if (currentUserDetails.branchCode !== order.branchCode) {
        return false;
      }
    }

    // For sales role, only show orders created by them
    if (userRole === "sales" && order.createdBy !== currentUser) {
      return false;
    }

    if (requestNoFilter) {
      const searchTerm = requestNoFilter.toLowerCase();
      const requestNo = order.requestNo?.toLowerCase() || "";
      return requestNo.includes(searchTerm);
    }
    return true;
  });

  // Filter orders based on active tab
  const filteredOrders = requestNoFiltered.filter((order: Request) => {
    if (activeTab === "all") {
      // Show all orders (already filtered by requestNo and user visibility)
      return true;
    } else if (activeTab === "open") {
      return order.status === "Open";
    } else if (activeTab === "in-progress") {
      return false;
    } else if (activeTab === "done") {
      return (
        order.status === "Done" ||
        order.status === "Ready Stock Marketing" ||
        order.status === "Stock Unavailable"
      );
    } else if (activeTab === "cancelled") {
      return order.status === "Cancelled";
    } else if (activeTab === "expired") {
      return order.status === "Request Expired";
    } else if (activeTab === "assigned") {
      // Assigned tab - show Requested to JB status for both sales and stockist
      return order.status === "Requested to JB";
    }
    return false;
  });

  // Calculate filtered counts for each tab based on requestNo filter
  const allCount = requestNoFiltered.length;
  const openCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Open";
  }).length;
  const inProgressCount = 0;
  const doneCount = requestNoFiltered.filter((order: Request) => {
    return (
      order.status === "Done" ||
      order.status === "Ready Stock Marketing" ||
      order.status === "Stock Unavailable"
    );
  }).length;
  const cancelledCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Cancelled";
  }).length;
  const expiredCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Request Expired";
  }).length;
  const assignedCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Requested to JB";
  }).length;
  const orderedCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Ordered";
  }).length;

  // Calculate unseen counts (requests not viewed by current user)
  const unseenAllCount = requestNoFiltered.filter(
    (order: Request) => !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenOpenCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Open" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenInProgressCount = 0;
  const unseenDoneCount = requestNoFiltered.filter(
    (order: Request) =>
      (order.status === "Done" ||
        order.status === "Ready Stock Marketing" ||
        order.status === "Stock Unavailable") &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenCancelledCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Cancelled" && !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenExpiredCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Request Expired" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenAssignedCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Requested to JB" &&
      !order.viewedBy?.includes(currentUser),
  ).length;
  const unseenOrderedCount = requestNoFiltered.filter(
    (order: Request) =>
      order.status === "Ordered" && !order.viewedBy?.includes(currentUser),
  ).length;

  // Total requests visible to current user
  const totalVisibleRequests = orders.filter((order: Request) => {
    // For sales role, show only orders created by them
    if (userRole === "sales") {
      return order.createdBy === currentUser;
    }

    // For stockist role, show:
    // - All Open orders
    // - In Progress orders assigned to them
    // - All Done/Cancelled/Assigned orders
    if (userRole === "stockist") {
      if (order.status === "Open") return true;
      if (
        order.status === "Done" ||
        order.status === "Ready Stock Marketing" ||
        order.status === "Stock Unavailable"
      )
        return true;
      if (order.status === "Cancelled") return true;
      if (order.status === "Requested to JB") return true;
      return false;
    }

    return true;
  }).length;

  // Sort orders based on selected option with direction
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "created":
        comparison = (a.timestamp || 0) - (b.timestamp || 0);
        break;
      case "updatedDate":
        comparison =
          (a.updatedDate || a.timestamp || 0) -
          (b.updatedDate || b.timestamp || 0);
        break;
      case "eta":
        comparison =
          new Date(a.waktuKirim || 0).getTime() -
          new Date(b.waktuKirim || 0).getTime();
        break;
      case "productName":
        comparison = (a.namaBarang || "").localeCompare(b.namaBarang || "");
        break;
      case "sales":
        comparison = (a.createdBy || "").localeCompare(b.createdBy || "");
        break;
      case "atasNama":
        comparison = (a.namaPelanggan?.name || "").localeCompare(
          b.namaPelanggan?.name || "",
        );
        break;
      case "pabrik":
        comparison = (a.pabrik?.name || "").localeCompare(b.pabrik?.name || "");
        break;
      case "requestNo":
        comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
        break;
      default:
        return 0;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Get displayed orders for lazy loading
  const displayedOrders = sortedOrders.slice(0, displayedCount);

  // Lazy loading with intersection observer
  const loadMore = useCallback(() => {
    if (displayedCount < sortedOrders.length) {
      setDisplayedCount((prev: number) =>
        Math.min(prev + 20, sortedOrders.length),
      );
    }
  }, [displayedCount, sortedOrders.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore]);

  // Reset displayed count when tab, sort, or filter changes
  useEffect(() => {
    setDisplayedCount(20);
  }, [activeTab, sortBy, requestNoFilter]);

  // Handle tab click to scroll into view
  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("Tab clicked:", e.currentTarget);
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestampWithTime = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}:${seconds}`;
    return `${dateStr} ${timeStr}`;
  };

  const renderOrderCard = (order: Request) => {
    const isExpanded = expandedOrderId === order.id;
    const showSalesName = !!(
      order.createdBy && order.createdBy !== currentUser
    );
    const orderData = requestToOrder(order);

    // Wrap callbacks to mark as viewed
    const handleSeeDetail = onSeeDetail
      ? (_o: Order) => {
          markRequestAsViewed(order.id);
          onSeeDetail(order, activeTab);
        }
      : onViewRequestDetails
        ? (_o: Order) => {
            markRequestAsViewed(order.id);
            onViewRequestDetails(order, activeTab);
          }
        : undefined;

    const handleDuplicateOrder = onDuplicateOrder
      ? (_o: Order) => {
          markRequestAsViewed(order.id);
          onDuplicateOrder(order);
        }
      : undefined;

    return (
      <OrderCard
        key={order.id}
        order={orderData}
        userRole={userRole}
        showSalesName={showSalesName}
        activeTab={activeTab}
        isExpanded={isExpanded}
        onToggleExpand={() => toggleExpand(order.id)}
        onEditOrder={onEditOrder ? (_o) => onEditOrder(order) : undefined}
        onDuplicateOrder={handleDuplicateOrder}
        onCancelOrder={cancelOrder}
        onSeeDetail={handleSeeDetail}
        currentUser={currentUser}
      />
    );
  };

  if (orders.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No requests yet</p>
          <p className="text-sm">Your saved requests will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl font-semibold">
          {userRole === "stockist" ? "Requests" : "My Requests"}
        </h1>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex-shrink-0 mb-4">
        <FilterSortControls
          type="request"
          totalCount={totalVisibleRequests}
          filterValue={requestNoFilter}
          onFilterChange={setRequestNoFilter}
          sortBy={sortBy}
          onSortChange={(value) => setSortBy(value as MySortOption)}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={REQUEST_SORT_OPTIONS}
        />
      </div>

      {/* Tabs and Content */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="all"
            onClick={handleTabClick}
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
            value="open"
            onClick={handleTabClick}
            className={
              activeTab === "open" ? "text-amber-600 border-amber-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Open ({openCount})
              {unseenOpenCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenOpenCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="in-progress"
            onClick={handleTabClick}
            className={
              activeTab === "in-progress" ? "text-blue-600 border-blue-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              In Progress ({inProgressCount})
              {unseenInProgressCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenInProgressCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="assigned"
            onClick={handleTabClick}
            className={
              activeTab === "assigned"
                ? "text-purple-600 border-purple-600"
                : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Assigned ({assignedCount})
              {unseenAssignedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenAssignedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="ordered"
            onClick={handleTabClick}
            className={
              activeTab === "ordered" ? "text-indigo-600 border-indigo-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Ordered ({orderedCount})
              {unseenOrderedCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenOrderedCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="done"
            onClick={handleTabClick}
            className={
              activeTab === "done" ? "text-green-600 border-green-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Done ({doneCount})
              {unseenDoneCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenDoneCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            onClick={handleTabClick}
            className={
              activeTab === "cancelled" ? "text-gray-600 border-gray-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Cancelled ({cancelledCount})
              {unseenCancelledCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenCancelledCount}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="expired"
            onClick={handleTabClick}
            className={
              activeTab === "expired" ? "text-red-600 border-red-600" : ""
            }
          >
            <span className="flex items-center gap-1.5">
              Expired ({expiredCount})
              {unseenExpiredCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unseenExpiredCount}
                </span>
              )}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No requests</p>
                <p className="text-sm">All requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="open" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No open requests</p>
                <p className="text-sm">Open requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No requests in progress</p>
                <p className="text-sm">In-progress requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No completed requests</p>
                <p className="text-sm">Completed requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No assigned requests</p>
                <p className="text-sm">Assigned requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ordered" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No ordered requests</p>
                <p className="text-sm">Ordered requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No cancelled requests</p>
                <p className="text-sm">Cancelled requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No expired requests</p>
                <p className="text-sm">Expired requests will appear here</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
