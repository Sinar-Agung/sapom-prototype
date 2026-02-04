import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Eye, Edit, Copy, ClipboardCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import italySanta from "@/assets/images/italy-santa.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import milano from "@/assets/images/milano.png";
import tambang from "@/assets/images/tambang.png";
import casteli from "@/assets/images/casteli.png";
import {
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  ATAS_NAMA_OPTIONS,
  FOLLOW_UP_ACTION_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";

// Image mapping for Nama Basic (same as order-form)
const NAMA_BASIC_IMAGES: Record<string, string> = {
  "italy-santa": italySanta,
  "italy-kaca": italyKaca,
  "italy-bambu": italyBambu,
  "kalung-flexi": kalungFlexi,
  "sunny-vanessa": sunnyVanessa,
  "hollow-fancy-nori": hollowFancyNori,
  milano: milano,
  tambang: tambang,
  casteli: casteli,
};

interface OrderItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
}

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
  followUpAction: string;
  detailItems: DetailBarangItem[];
  status: string;
}

interface MyOrdersProps {
  onEditOrder?: (order: Order) => void;
  onDuplicateOrder?: (order: Order) => void;
  userRole?: "sales" | "stockist" | "jb";
  onVerifyStock?: (order: Order) => void;
  onReviewRequest?: (order: Order) => void;
  initialTab?: string;
}

type SortOption = "created" | "eta" | "sales" | "pabrik" | "jenis" | "atasNama";

export function MyOrders({ onEditOrder, onDuplicateOrder, userRole = "sales", onVerifyStock, onReviewRequest, initialTab }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab || "open");
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [displayedCount, setDisplayedCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentUser = sessionStorage.getItem("username") || localStorage.getItem("username") || "";

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
      "Santa": "bg-purple-100 text-purple-800",
      "Semar": "bg-blue-100 text-blue-800",
      "UBS": "bg-emerald-100 text-emerald-800",
      "Phoenix": "bg-orange-100 text-orange-800",
      "Rajawali": "bg-red-100 text-red-800",
      "King": "bg-amber-100 text-amber-800",
      "Lotus": "bg-pink-100 text-pink-800",
      "Cemerlang": "bg-teal-100 text-teal-800",
      "Antam": "bg-indigo-100 text-indigo-800",
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
    return colors[warna.toLowerCase()] || "bg-gray-100 text-gray-800";
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
    const updatedOrders = orders.map((order) => 
      order.id === orderId ? { ...order, status: "Cancelled" } : order
    );
    setOrders(updatedOrders);
    sessionStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const markAsViewed = (orderId: string) => {
    setViewedOrderIds(prev => new Set([...prev, orderId]));
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "open") {
      return order.status === "Open";
    } else if (activeTab === "in-progress") {
      // For stockist, show "Stockist Processing", for sales show "In Progress"
      if (userRole === "stockist") {
        return order.status === "Stockist Processing" || order.status === "In Progress" || order.status === "Requested to JB";
      }
      return order.status === "In Progress" || order.status === "Stockist Processing" || order.status === "Requested to JB";
    } else if (activeTab === "done") {
      return order.status === "Done";
    } else if (activeTab === "cancelled") {
      return order.status === "Cancelled";
    } else if (activeTab === "assigned" && userRole === "stockist") {
      // Assigned tab for stockist - show all requests that have passed Stockist Processing
      const completedStatuses = [
        "Ready Stock Marketing",
        "Requested to JB",
        "Stock Unavailable",
        "Done"
      ];
      return completedStatuses.includes(order.status);
    }
    return false;
  });

  // Calculate counts for each tab
  const openCount = orders.filter(order => order.status === "Open").length;
  const inProgressCount = orders.filter(order => {
    if (userRole === "stockist") {
      return order.status === "Stockist Processing" || order.status === "In Progress" || order.status === "Requested to JB";
    }
    return order.status === "In Progress" || order.status === "Stockist Processing" || order.status === "Requested to JB";
  }).length;
  const doneCount = orders.filter(order => order.status === "Done").length;
  const cancelledCount = orders.filter(order => order.status === "Cancelled").length;
  const assignedCount = orders.filter(order => {
    const completedStatuses = [
      "Ready Stock Marketing",
      "Requested to JB",
      "Stock Unavailable",
      "Done"
    ];
    return completedStatuses.includes(order.status);
  }).length;

  // Total visible requests (exclude Cancelled)
  const totalVisibleRequests = openCount + inProgressCount + doneCount;

  // Sort orders based on selected option
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "created":
        return (b.timestamp || 0) - (a.timestamp || 0);
      case "eta":
        return new Date(b.waktuKirim || 0).getTime() - new Date(a.waktuKirim || 0).getTime();
      case "sales":
        return (a.createdBy || "").localeCompare(b.createdBy || "");
      case "pabrik":
        return (a.pabrik?.name || "").localeCompare(b.pabrik?.name || "");
      case "jenis":
        return a.jenisProduk.localeCompare(b.jenisProduk);
      case "atasNama":
        return (a.namaPelanggan?.name || "").localeCompare(b.namaPelanggan?.name || "");
      default:
        return 0;
    }
  });

  // Get displayed orders for lazy loading
  const displayedOrders = sortedOrders.slice(0, displayedCount);

  // Lazy loading with intersection observer
  const loadMore = useCallback(() => {
    if (displayedCount < sortedOrders.length) {
      setDisplayedCount((prev) => Math.min(prev + 20, sortedOrders.length));
    }
  }, [displayedCount, sortedOrders.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
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
    
    // Get labels instead of values
    const jenisProdukLabel = getLabelFromValue(JENIS_PRODUK_OPTIONS, order.jenisProduk);
    const productNameLabel = order.kategoriBarang === "basic" 
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
    // Display pabrik name directly from object with safety check
    const pabrikLabel = order.pabrik?.name || order.pabrik || "Unknown Pabrik";
    // Display atas nama directly from object with safety check
    const atasNamaLabel = order.namaPelanggan?.name || order.namaPelanggan || "";
    
    // Check if we should show sales name (show if order is NOT created by current user)
    const showSalesName = order.createdBy && order.createdBy !== currentUser;

    return (
      <Card key={order.id} className="p-3 sm:p-4 relative">
        {/* Top Right - Status (Desktop only) */}
        <div className="hidden sm:block absolute top-4 right-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}>
            {order.status || "Open"}
          </span>
        </div>

        <div className="flex gap-2 sm:gap-4">
          {/* Left Side - Created Date and Image */}
          <div className="flex flex-col w-20 sm:w-36 md:w-44 lg:w-48 shrink-0">
            {/* Created Date at top */}
            <div className="mb-1 sm:mb-2">
              <div className="text-[9px] sm:text-xs text-gray-500 mb-0.5">Created</div>
              <div className="text-[11px] sm:text-sm font-semibold">
                {formatTimestamp(order.timestamp) || "-"}
              </div>
            </div>

            {/* Product Image */}
            <div className="w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 border rounded-lg overflow-hidden bg-gray-50">
              <img
                src={getOrderImage(order)}
                alt={productNameLabel}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Side - Order Details */}
          <div className="flex-1 min-w-0">
            {/* Jenis Barang + Nama with Category Badge + New Badge + Status (Mobile) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-xs sm:text-base leading-tight">
                  {jenisProdukLabel} {productNameLabel}
                </h3>
                <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded shrink-0 ${
                  order.kategoriBarang === "basic" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-teal-100 text-teal-700"
                }`}>
                  {order.kategoriBarang === "basic" ? "Basic" : "Model"}
                </span>
                {/* New badge for unviewed orders */}
                {!viewedOrderIds.has(order.id) && (
                  <span className="text-[9px] sm:text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-amber-900 px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0 border border-amber-500/30">
                    New
                  </span>
                )}
                {/* Status pill - Mobile only */}
                <span className={`sm:hidden text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}>
                  {order.status || "Open"}
                </span>
              </div>
            </div>

            {/* Sales Name (show for stockist role) */}
            {userRole === "stockist" && order.createdBy && (
              <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
                <span className="text-gray-500 hidden sm:inline">Sales: </span>
                {order.createdBy}
              </p>
            )}

            {/* Sales Name (only show for sales if not created by current user) */}
            {userRole === "sales" && showSalesName && (
              <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
                <span className="text-gray-500 hidden sm:inline">Sales: </span>
                {order.createdBy}
              </p>
            )}

            {/* Atas Nama */}
            {order.namaPelanggan && order.namaPelanggan.name && (
              <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
                <span className="text-gray-500 hidden sm:inline">Atas Nama: </span>
                {atasNamaLabel}
              </p>
            )}

            {/* Pabrik with color badge */}
            <div className="mb-0.5 sm:mb-1">
              <span className="text-[11px] sm:text-sm text-gray-500 hidden sm:inline">Pabrik: </span>
              <span className={`text-[11px] sm:text-sm font-medium px-2 py-0.5 rounded ${getPabrikColor(pabrikLabel)}`}>
                {pabrikLabel}
              </span>
            </div>

            {/* ETA beneath Pabrik - smaller text */}
            <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
              <span className="text-gray-500 hidden sm:inline">ETA: </span>
              {formatDate(order.waktuKirim) || "-"}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { toggleExpand(order.id); markAsViewed(order.id); }}
                className="h-7 sm:h-8 text-xs px-2 sm:px-3"
              >
                {isExpanded ? (
                  <>
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Hide Items</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Show Items</span>
                  </>
                )}
              </Button>
              
              {/* Sales actions */}
              {userRole === "sales" && (
                <>
                  {/* Only show Cancel and Edit buttons in Open tab */}
                  {activeTab === "open" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { cancelOrder(order.id); markAsViewed(order.id); }}
                        className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                      {onEditOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { onEditOrder(order); markAsViewed(order.id); }}
                          className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                        >
                          <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      )}
                    </>
                  )}
                  {/* Duplicate button visible except in Cancelled tab */}
                  {activeTab !== "cancelled" && onDuplicateOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { onDuplicateOrder(order); markAsViewed(order.id); }}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Duplicate</span>
                    </Button>
                  )}
                  {/* Review Request button only in Cancelled tab */}
                  {activeTab === "cancelled" && onReviewRequest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { onReviewRequest(order); markAsViewed(order.id); }}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Review Request</span>
                    </Button>
                  )}
                </>
              )}
              
              {/* Stockist actions */}
              {userRole === "stockist" && onVerifyStock && (order.status === "Open" || order.status === "Stockist Processing" || order.status === "In Progress") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { onVerifyStock(order); markAsViewed(order.id); }}
                  className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Verify Stock</span>
                </Button>
              )}
              
              {/* Review Request action - only show in assigned tab */}
              {userRole === "stockist" && onReviewRequest && activeTab === "assigned" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { onReviewRequest(order); markAsViewed(order.id); }}
                  className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Review Request</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {order.followUpAction && (
                <div>
                  <span className="text-gray-500">Follow Up Action:</span>
                  <p className="font-medium">{getLabelFromValue(FOLLOW_UP_ACTION_OPTIONS, order.followUpAction)}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Total Items:</span>
                <p className="font-medium">{order.detailItems.length} item(s)</p>
              </div>
            </div>

            {/* Detail Items Table */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold mb-2">Detail Barang</h4>
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-xs border">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">#</th>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Kadar</th>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Warna</th>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Ukuran</th>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Berat (gr)</th>
                      <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Pcs</th>
                      {userRole === "stockist" && (
                        <th className="px-3 py-2 text-left font-medium bg-gray-50">Available Pcs</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.detailItems.map((item, index) => {
                      const ukuranDisplay = getUkuranDisplay(item.ukuran);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border-r">{index + 1}</td>
                          <td className={`px-3 py-2 border-r font-medium ${getKadarColor(item.kadar)}`}>
                            {item.kadar.toUpperCase()}
                          </td>
                          <td className={`px-3 py-2 border-r ${getWarnaColor(item.warna)}`}>
                            {getWarnaLabel(item.warna)}
                          </td>
                          <td className="px-3 py-2 border-r">
                            {ukuranDisplay.showUnit
                              ? `${ukuranDisplay.value} cm`
                              : ukuranDisplay.value}
                          </td>
                          <td className="px-3 py-2 border-r">{item.berat || "-"}</td>
                          <td className="px-3 py-2 border-r">{item.pcs}</td>
                          {userRole === "stockist" && (
                            <td className="px-3 py-2">
                              {item.availablePcs || "-"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{userRole === "stockist" ? "Requests" : "My Requests"}</h1>
        <p className="text-sm text-gray-500">{totalVisibleRequests} request(s)</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger 
            value="open" 
            className={activeTab === "open" ? "text-amber-600 border-amber-600" : ""}
          >
            Open ({openCount})
          </TabsTrigger>
          <TabsTrigger 
            value="in-progress" 
            className={activeTab === "in-progress" ? "text-blue-600 border-blue-600" : ""}
          >
            In Progress ({inProgressCount})
          </TabsTrigger>
          {userRole === "stockist" && (
            <TabsTrigger 
              value="assigned" 
              className={activeTab === "assigned" ? "text-purple-600 border-purple-600" : ""}
            >
              Assigned ({assignedCount})
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="done" 
            className={activeTab === "done" ? "text-green-600 border-green-600" : ""}
          >
            Done ({doneCount})
          </TabsTrigger>
          {userRole === "sales" && (
            <TabsTrigger 
              value="cancelled" 
              className={activeTab === "cancelled" ? "text-gray-600 border-gray-600" : ""}
            >
              Cancelled ({cancelledCount})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Sort Dropdown */}
        <div className="flex justify-end mt-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="eta">ETA</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="pabrik">Pabrik</SelectItem>
                <SelectItem value="jenis">Jenis Barang</SelectItem>
                <SelectItem value="atasNama">Atas Nama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="open">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No open requests</p>
                <p className="text-sm">Open requests will appear here</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="in-progress">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No requests in progress</p>
                <p className="text-sm">In-progress requests will appear here</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="done">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No completed requests</p>
                <p className="text-sm">Completed requests will appear here</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="assigned">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No assigned requests</p>
                <p className="text-sm">Assigned requests will appear here</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No cancelled requests</p>
                <p className="text-sm">Cancelled requests will appear here</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {displayedOrders.map((order) => renderOrderCard(order))}
              </div>
              {displayedCount < sortedOrders.length && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <div className="text-sm text-gray-500">Loading more...</div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}