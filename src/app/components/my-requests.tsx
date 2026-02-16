import { useCallback, useEffect, useRef, useState } from "react";
import { Request } from "../types/request";
import { notifyRequestCancelled } from "../utils/notification-helper";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { RequestCard } from "./request-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface MyOrdersProps {
  onEditOrder?: (order: Request) => void;
  onDuplicateOrder?: (order: Request) => void;
  userRole?: "sales" | "stockist" | "jb";
  onVerifyStock?: (order: Request, currentTab: string) => void;
  onReviewRequest?: (order: Request, currentTab: string) => void;
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
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
  { value: "updatedBy", label: "Updated By" },
  { value: "eta", label: "ETA" },
  { value: "sales", label: "Sales" },
  { value: "pabrik", label: "Pabrik" },
  { value: "jenis", label: "Jenis Barang" },
  { value: "atasNama", label: "Atas Nama" },
];

export function MyOrders({
  onEditOrder,
  onDuplicateOrder,
  userRole = "sales",
  onVerifyStock,
  onReviewRequest,
  onSeeDetail,
  initialTab,
}: MyOrdersProps) {
  const [orders, setOrders] = useState<Request[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab || "open");
  const [sortBy, setSortBy] = useState<MySortOption>("updatedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [requestNoFilter, setRequestNoFilter] = useState<string>("");
  const [displayedCount, setDisplayedCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Get Kadar background color
  const getKadarColor = (kadar: string) => {
    const colors: Record<string, string> = {
      "6k": "bg-green-500 text-white",
      "8k": "bg-blue-500 text-white",
      "9k": "bg-blue-700 text-white",
      "16k": "bg-orange-500 text-white",
      "17k": "bg-pink-500 text-white",
      "24k": "bg-red-500 text-white",
    };
    return colors[kadar.toLowerCase()] || "bg-gray-500 text-white";
  };

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
    if (activeTab === "open") {
      return order.status === "Open";
    } else if (activeTab === "in-progress") {
      // For stockist role, only show requests assigned to them
      if (userRole === "stockist") {
        return (
          order.status === "Stockist Processing" &&
          order.stockistId === currentUser
        );
      }
      return order.status === "Stockist Processing";
    } else if (activeTab === "done") {
      return (
        order.status === "Done" ||
        order.status === "Ready Stock Marketing" ||
        order.status === "Stock Unavailable"
      );
    } else if (activeTab === "cancelled") {
      return order.status === "Cancelled";
    } else if (activeTab === "assigned") {
      // Assigned tab - show Requested to JB status for both sales and stockist
      return order.status === "Requested to JB";
    }
    return false;
  });

  // Calculate filtered counts for each tab based on requestNo filter
  const openCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Open";
  }).length;
  const inProgressCount = requestNoFiltered.filter((order: Request) => {
    if (userRole === "stockist") {
      return (
        order.status === "Stockist Processing" &&
        order.stockistId === currentUser
      );
    }
    return order.status === "Stockist Processing";
  }).length;
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
  const assignedCount = requestNoFiltered.filter((order: Request) => {
    return order.status === "Requested to JB";
  }).length;

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
        order.status === "Stockist Processing" &&
        order.stockistId === currentUser
      )
        return true;
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
        comparison = (b.timestamp || 0) - (a.timestamp || 0);
        break;
      case "updatedDate":
        comparison =
          (b.updatedDate || b.timestamp || 0) -
          (a.updatedDate || a.timestamp || 0);
        break;
      case "eta":
        comparison =
          new Date(a.waktuKirim || 0).getTime() -
          new Date(b.waktuKirim || 0).getTime();
        break;
      case "sales":
        comparison = (a.createdBy || "").localeCompare(b.createdBy || "");
        break;
      case "updatedBy":
        comparison = (a.updatedBy || "").localeCompare(b.updatedBy || "");
        break;
      case "pabrik":
        comparison = (a.pabrik?.name || "").localeCompare(b.pabrik?.name || "");
        break;
      case "jenis":
        comparison = a.jenisProduk.localeCompare(b.jenisProduk);
        break;
      case "atasNama":
        comparison = (a.namaPelanggan?.name || "").localeCompare(
          b.namaPelanggan?.name || "",
        );
        break;
      default:
        return 0;
    }
    return sortDirection === "desc" ? comparison : -comparison;
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

  const getOrderImage = (order: Request) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    } else if (order.kategoriBarang === "model" && order.fotoBarangBase64) {
      return order.fotoBarangBase64;
    }
    return italySanta; // Default fallback
  };

  const renderOrderCard = (order: Request) => {
    const isExpanded = expandedOrderId === order.id;

    // Check if we should show sales name (show if order is NOT created by current user)
    const showSalesName = order.createdBy && order.createdBy !== currentUser;

    return (
      <RequestCard
        key={order.id}
        order={order}
        userRole={userRole}
        showSalesName={showSalesName}
        activeTab={activeTab}
        isExpanded={isExpanded}
        onToggleExpand={() => toggleExpand(order.id)}
        onEditOrder={onEditOrder}
        onDuplicateOrder={onDuplicateOrder}
        onCancelOrder={cancelOrder}
        onReviewRequest={onReviewRequest}
        onVerifyStock={onVerifyStock}
        onSeeDetail={onSeeDetail}
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
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="open"
            onClick={handleTabClick}
            className={
              activeTab === "open" ? "text-amber-600 border-amber-600" : ""
            }
          >
            Open ({openCount})
          </TabsTrigger>
          <TabsTrigger
            value="in-progress"
            onClick={handleTabClick}
            className={
              activeTab === "in-progress" ? "text-blue-600 border-blue-600" : ""
            }
          >
            In Progress ({inProgressCount})
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
            Assigned ({assignedCount})
          </TabsTrigger>
          <TabsTrigger
            value="done"
            onClick={handleTabClick}
            className={
              activeTab === "done" ? "text-green-600 border-green-600" : ""
            }
          >
            Done ({doneCount})
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            onClick={handleTabClick}
            className={
              activeTab === "cancelled" ? "text-gray-600 border-gray-600" : ""
            }
          >
            Cancelled ({cancelledCount})
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
