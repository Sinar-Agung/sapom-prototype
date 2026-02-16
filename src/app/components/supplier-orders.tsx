import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
import { getImage } from "@/app/utils/image-storage";
import { notifyOrderStatusChanged } from "@/app/utils/notification-helper";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Image mapping for Nama Basic
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
  { value: "atasNama", label: "Atas Nama" },
  { value: "pabrik", label: "Pabrik" },
  { value: "orderNo", label: "Order No" },
];

export function SupplierOrders({
  onSeeDetail,
  initialTab = "new",
}: SupplierOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("updatedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [orderNoFilter, setOrderNoFilter] = useState<string>("");

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
  const filteredNewCount = orderNoFiltered.filter(
    (order: Order) => order.status === "New",
  ).length;
  const filteredViewedCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Viewed",
  ).length;
  const filteredInProductionCount = orderNoFiltered.filter(
    (order: Order) => order.status === "In Production",
  ).length;
  const filteredRequestChangeCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Request Change",
  ).length;
  const filteredStockReadyCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Stock Ready",
  ).length;
  const filteredUnableCount = orderNoFiltered.filter(
    (order: Order) => order.status === "Unable to Fulfill",
  ).length;

  // Filter by active tab
  let filteredOrders = orderNoFiltered.filter((order: Order) => {
    if (activeTab === "new") {
      return order.status === "New";
    } else if (activeTab === "viewed") {
      return order.status === "Viewed";
    } else if (activeTab === "in-production") {
      return order.status === "In Production";
    } else if (activeTab === "request-change") {
      return order.status === "Request Change";
    } else if (activeTab === "stock-ready") {
      return order.status === "Stock Ready";
    } else if (activeTab === "unable") {
      return order.status === "Unable to Fulfill";
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

  // Calculate counts for each tab (also filter by supplier ID)
  const newCount = orders.filter(
    (order) => order.pabrik?.id === supplierId && order.status === "New",
  ).length;
  const viewedCount = orders.filter(
    (order) => order.pabrik?.id === supplierId && order.status === "Viewed",
  ).length;
  const inProductionCount = orders.filter(
    (order) =>
      order.pabrik?.id === supplierId && order.status === "In Production",
  ).length;
  const requestChangeCount = orders.filter(
    (order) =>
      order.pabrik?.id === supplierId && order.status === "Request Change",
  ).length;
  const stockReadyCount = orders.filter(
    (order) =>
      order.pabrik?.id === supplierId && order.status === "Stock Ready",
  ).length;
  const unableCount = orders.filter(
    (order) =>
      order.pabrik?.id === supplierId && order.status === "Unable to Fulfill",
  ).length;

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
    // Check for latest uploaded photo via photoId
    if (order.photoId) {
      const storedImage = getImage(order.photoId);
      if (storedImage) return storedImage;
    }
    // Fallback to predefined Basic images
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return italySanta;
  };

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800";
      case "Viewed":
        return "bg-purple-100 text-purple-800";
      case "Request Change":
        return "bg-orange-100 text-orange-800";
      case "Stock Ready":
        return "bg-green-100 text-green-800";
      case "Unable to Fulfill":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-gray-300 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const getUkuranDisplay = (ukuran: string) => {
    // Check if ukuran is a number (which means it's in cm)
    const numValue = parseFloat(ukuran);
    if (!isNaN(numValue)) {
      return ukuran + " cm";
    }
    // Check if it's a size code (a, n, p, t)
    const ukuranLabels: Record<string, string> = {
      a: "A - Anak",
      n: "N - Normal",
      p: "P - Panjang",
      t: "T - Tanggung",
    };
    return ukuranLabels[ukuran.toLowerCase()] || ukuran;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {/* Filter and Sort Controls */}
      <FilterSortControls
        type="order"
        totalCount={
          newCount +
          viewedCount +
          inProductionCount +
          requestChangeCount +
          stockReadyCount +
          unableCount
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
            value="new"
            className={
              activeTab === "new" ? "text-blue-600 border-blue-600" : ""
            }
          >
            New ({filteredNewCount})
          </TabsTrigger>
          <TabsTrigger
            value="viewed"
            className={
              activeTab === "viewed" ? "text-purple-600 border-purple-600" : ""
            }
          >
            Viewed ({filteredViewedCount})
          </TabsTrigger>
          <TabsTrigger
            value="in-production"
            className={
              activeTab === "in-production"
                ? "text-blue-600 border-blue-600"
                : ""
            }
          >
            In Production ({filteredInProductionCount})
          </TabsTrigger>
          <TabsTrigger
            value="request-change"
            className={
              activeTab === "request-change"
                ? "text-orange-600 border-orange-600"
                : ""
            }
          >
            Request Change ({filteredRequestChangeCount})
          </TabsTrigger>
          <TabsTrigger
            value="stock-ready"
            className={
              activeTab === "stock-ready"
                ? "text-green-600 border-green-600"
                : ""
            }
          >
            Stock Ready ({filteredStockReadyCount})
          </TabsTrigger>
          <TabsTrigger
            value="unable"
            className={
              activeTab === "unable" ? "text-red-600 border-red-600" : ""
            }
          >
            Unable ({filteredUnableCount})
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
                const jenisProdukLabel = getLabelFromValue(
                  JENIS_PRODUK_OPTIONS,
                  order.jenisProduk,
                );
                const productNameLabel =
                  order.kategoriBarang === "basic"
                    ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
                    : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

                return (
                  <Card key={order.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 shrink-0 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={getOrderImage(order)}
                          alt={productNameLabel}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Order Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg">
                              {jenisProdukLabel} {productNameLabel}
                            </h3>
                            <p className="text-sm text-gray-600 font-mono font-semibold text-blue-700">
                              {order.PONumber}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Created:</span>{" "}
                            {formatTimestamp(order.createdDate)}
                          </div>
                          <div>
                            <span className="text-gray-500">ETA:</span>{" "}
                            {formatDate(order.waktuKirim) || "-"}
                          </div>
                          <div>
                            <span className="text-gray-500">Items:</span>{" "}
                            {order.detailItems.length}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleExpand(order.id)}
                          >
                            {expandedOrderId === order.id
                              ? "Hide Items"
                              : "Show Items"}
                          </Button>
                          {onSeeDetail && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Auto-update status to Viewed if order is New
                                if (order.status === "New") {
                                  handleUpdateStatus(order.id, "Viewed");
                                }
                                onSeeDetail(order, activeTab);
                              }}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Items Table */}
                    {expandedOrderId === order.id && (
                      <div className="mt-4 pt-4 border-t space-y-3 bg-white p-3 sm:p-4 rounded-lg border">
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold mb-2">
                            Detail Barang
                          </h4>
                          <div className="max-h-[300px] overflow-auto">
                            <table className="w-full border-collapse border text-xs">
                              <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                  <th className="border p-2 text-left bg-gray-100">
                                    #
                                  </th>
                                  <th className="border p-2 text-left bg-gray-100">
                                    Kadar
                                  </th>
                                  <th className="border p-2 text-left bg-gray-100">
                                    Warna
                                  </th>
                                  <th className="border p-2 text-left bg-gray-100">
                                    Ukuran
                                  </th>
                                  <th className="border p-2 text-left bg-gray-100">
                                    Berat
                                  </th>
                                  <th className="border p-2 text-left bg-gray-100">
                                    Pcs
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.detailItems.map((item, index) => {
                                  return (
                                    <tr
                                      key={item.id || index}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="border p-2 text-center">
                                        {index + 1}
                                      </td>
                                      <td
                                        className={`border p-2 font-medium ${getKadarColor(item.kadar)}`}
                                      >
                                        {item.kadar.toUpperCase()}
                                      </td>
                                      <td
                                        className={`border p-2 ${getWarnaColor(item.warna)}`}
                                      >
                                        {getWarnaLabel(item.warna)}
                                      </td>
                                      <td className="border p-2">
                                        {getUkuranDisplay(item.ukuran)}
                                      </td>
                                      <td className="border p-2">
                                        {item.berat || "-"}
                                      </td>
                                      <td className="border p-2">{item.pcs}</td>
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
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
