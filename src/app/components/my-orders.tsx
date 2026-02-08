import { useCallback, useEffect, useRef, useState } from "react";
import { RequestCard } from "./request-card";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface DetailBarangItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
}

interface Order {
  id: string;
  timestamp: number;
  createdBy?: string;
  requestNo?: string;
  updatedDate?: number;
  updatedBy?: string;
  stockistId?: string;
  pabrik: {
    id: string;
    name: string;
  };
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  fotoBarangBase64?: string;
  namaPelanggan: {
    id: string;
    name: string;
  };
  waktuKirim: string;
  customerExpectation: string;
  detailItems: DetailBarangItem[];
  status: string;
}

interface MyOrdersProps {
  onEditOrder?: (order: Order) => void;
  onDuplicateOrder?: (order: Order) => void;
  userRole?: "sales" | "stockist" | "jb";
  onVerifyStock?: (order: Order, currentTab: string) => void;
  onReviewRequest?: (order: Order, currentTab: string) => void;
  onSeeDetail?: (order: Order, currentTab: string) => void;
  initialTab?: string;
}

type SortOption =
  | "created"
  | "eta"
  | "sales"
  | "pabrik"
  | "jenis"
  | "atasNama"
  | "updatedDate"
  | "updatedBy";

export function MyOrders({
  onEditOrder,
  onDuplicateOrder,
  userRole = "sales",
  onVerifyStock,
  onReviewRequest,
  onSeeDetail,
  initialTab,
}: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab || "open");
  const [sortBy, setSortBy] = useState<SortOption>("updatedDate");
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
  }, []);

  const loadOrders = () => {
    const savedOrders = sessionStorage.getItem("orders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const cancelOrder = (orderId: string) => {
    const updatedOrders = orders.map((order: Order) =>
      order.id === orderId ? { ...order, status: "Cancelled" } : order,
    );
    setOrders(updatedOrders);
    sessionStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order: Order) => {
    // For sales role, only show orders created by them
    if (userRole === "sales" && order.createdBy !== currentUser) {
      return false;
    }

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

  // Calculate counts for each tab
  const openCount = orders.filter((order: Order) => {
    if (userRole === "sales" && order.createdBy !== currentUser) return false;
    return order.status === "Open";
  }).length;
  const inProgressCount = orders.filter((order: Order) => {
    if (userRole === "sales" && order.createdBy !== currentUser) return false;
    if (userRole === "stockist") {
      return (
        order.status === "Stockist Processing" &&
        order.stockistId === currentUser
      );
    }
    return order.status === "Stockist Processing";
  }).length;
  const doneCount = orders.filter((order: Order) => {
    if (userRole === "sales" && order.createdBy !== currentUser) return false;
    return (
      order.status === "Done" ||
      order.status === "Ready Stock Marketing" ||
      order.status === "Stock Unavailable"
    );
  }).length;
  const cancelledCount = orders.filter((order: Order) => {
    if (userRole === "sales" && order.createdBy !== currentUser) return false;
    return order.status === "Cancelled";
  }).length;
  const assignedCount = orders.filter((order: Order) => {
    if (userRole === "sales" && order.createdBy !== currentUser) return false;
    return order.status === "Requested to JB";
  }).length;

  // Total requests visible to current user
  const totalVisibleRequests = orders.filter((order: Order) => {
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

  // Sort orders based on selected option
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "created":
        return (b.timestamp || 0) - (a.timestamp || 0);
      case "updatedDate":
        return (
          (b.updatedDate || b.timestamp || 0) -
          (a.updatedDate || a.timestamp || 0)
        );
      case "eta":
        return (
          new Date(b.waktuKirim || 0).getTime() -
          new Date(a.waktuKirim || 0).getTime()
        );
      case "sales":
        return (a.createdBy || "").localeCompare(b.createdBy || "");
      case "updatedBy":
        return (a.updatedBy || "").localeCompare(b.updatedBy || "");
      case "pabrik":
        return (a.pabrik?.name || "").localeCompare(b.pabrik?.name || "");
      case "jenis":
        return a.jenisProduk.localeCompare(b.jenisProduk);
      case "atasNama":
        return (a.namaPelanggan?.name || "").localeCompare(
          b.namaPelanggan?.name || "",
        );
      default:
        return 0;
    }
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

  // Reset displayed count when tab or sort changes
  useEffect(() => {
    setDisplayedCount(20);
  }, [activeTab, sortBy]);

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
    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${dateStr} ${timeStr}`;
  };

  const getOrderImage = (order: Order) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    } else if (order.kategoriBarang === "model" && order.fotoBarangBase64) {
      return order.fotoBarangBase64;
    }
    return italySanta; // Default fallback
  };

  const renderOrderCard = (order: Order) => {
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
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">
          {userRole === "stockist" ? "Requests" : "My Requests"}
        </h1>
        <p className="text-sm text-gray-500">
          {totalVisibleRequests} request(s)
        </p>
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

        {/* Sort Dropdown */}
        <div className="flex justify-end mt-3 mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedDate">Updated Date</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="updatedBy">Updated By</SelectItem>
                <SelectItem value="eta">ETA</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="pabrik">Pabrik</SelectItem>
                <SelectItem value="jenis">Jenis Barang</SelectItem>
                <SelectItem value="atasNama">Atas Nama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
