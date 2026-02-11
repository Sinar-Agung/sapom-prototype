import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
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
  onSeeDetail?: (order: Order) => void;
}

export function SupplierOrders({ onSeeDetail }: SupplierOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("new");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
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
  }, []);

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
        allOrders[orderIndex].status = newStatus as any;
        allOrders[orderIndex].updatedDate = Date.now();
        allOrders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));
        loadOrders();
      }
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order: Order) => {
    if (activeTab === "new") {
      return order.status === "New";
    } else if (activeTab === "in-progress") {
      return ["Viewed by Supplier", "Confirmed", "In Production"].includes(
        order.status,
      );
    } else if (activeTab === "completed") {
      return ["Ready for Pickup", "Completed"].includes(order.status);
    }
    return false;
  });

  // Calculate counts for each tab
  const newCount = orders.filter((order) => order.status === "New").length;
  const inProgressCount = orders.filter((order) =>
    ["Viewed by Supplier", "Confirmed", "In Production"].includes(order.status),
  ).length;
  const completedCount = orders.filter((order) =>
    ["Ready for Pickup", "Completed"].includes(order.status),
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
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return italySanta;
  };

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800";
      case "Viewed by Supplier":
        return "bg-purple-100 text-purple-800";
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "In Production":
        return "bg-yellow-100 text-yellow-800";
      case "Ready for Pickup":
        return "bg-orange-100 text-orange-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-600 text-sm">Total: {orders.length} orders</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-shrink-0">
          <TabsTrigger
            value="new"
            className={
              activeTab === "new" ? "text-blue-600 border-blue-600" : ""
            }
          >
            New ({newCount})
          </TabsTrigger>
          <TabsTrigger
            value="in-progress"
            className={
              activeTab === "in-progress"
                ? "text-yellow-600 border-yellow-600"
                : ""
            }
          >
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className={
              activeTab === "completed" ? "text-green-600 border-green-600" : ""
            }
          >
            Completed ({completedCount})
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
                    : activeTab === "in-progress"
                      ? "No orders in progress."
                      : "No completed orders."}
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
                          {order.requestNo && (
                            <div>
                              <span className="text-gray-500">Request No:</span>{" "}
                              <span className="font-mono">
                                {order.requestNo}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Items:</span>{" "}
                            {order.detailItems.length}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {order.status === "New" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(
                                    order.id,
                                    "Viewed by Supplier",
                                  )
                                }
                              >
                                Mark as Viewed
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateStatus(order.id, "Confirmed")
                                }
                              >
                                Confirm Order
                              </Button>
                            </>
                          )}
                          {order.status === "Viewed by Supplier" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(order.id, "Confirmed")
                              }
                            >
                              Confirm Order
                            </Button>
                          )}
                          {order.status === "Confirmed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(order.id, "In Production")
                              }
                            >
                              Start Production
                            </Button>
                          )}
                          {order.status === "In Production" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(order.id, "Ready for Pickup")
                              }
                            >
                              Mark as Ready
                            </Button>
                          )}
                          {order.status === "Ready for Pickup" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(order.id, "Completed")
                              }
                            >
                              Mark as Completed
                            </Button>
                          )}
                          {onSeeDetail && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSeeDetail(order)}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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
