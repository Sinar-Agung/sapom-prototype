import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { getImage } from "@/app/utils/image-storage";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

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

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
}

export function OrderDetails({ order, onBack }: OrderDetailsProps) {
  const [relatedRequest, setRelatedRequest] = useState<Request | null>(null);
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(
    new Set(),
  );
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const userRole = (sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole") ||
    "sales") as "sales" | "stockist" | "jb" | "supplier";
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

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
        setCurrentOrder(allOrders[orderIndex]);
      }
    }
  };

  useEffect(() => {
    // Load the related request from localStorage
    if (order.requestId) {
      const savedRequests = localStorage.getItem("requests");
      if (savedRequests) {
        const requests: Request[] = JSON.parse(savedRequests);
        const request = requests.find((r) => r.id === order.requestId);
        if (request) {
          setRelatedRequest(request);
        }
      }
    }
  }, [order.requestId]);

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
    return `${dateStr}, ${timeStr}`;
  };

  const getOrderImage = () => {
    // First, check if there's a photoId and retrieve image from storage
    if (currentOrder.photoId) {
      const storedImage = getImage(currentOrder.photoId);
      if (storedImage) {
        return storedImage;
      }
    }
    // Otherwise, use predefined Basic images
    if (currentOrder.kategoriBarang === "basic" && currentOrder.namaBasic) {
      return NAMA_BASIC_IMAGES[currentOrder.namaBasic] || italySanta;
    }
    return italySanta;
  };

  const getStatusColor = (status: string): string => {
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

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

  const pabrikLabel = order.pabrik?.name || "Unknown Pabrik";

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
    <div className="min-h-screen pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600 font-mono font-semibold">
            {order.PONumber}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(currentOrder.status)}`}
        >
          {currentOrder.status}
        </span>
      </div>

      {/* Order Information Card */}
      <Card className="p-4 mb-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-32 h-32 shrink-0 border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={getOrderImage()}
              alt={productNameLabel}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Order Info */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2">
              {jenisProdukLabel} {productNameLabel}
            </h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">PO Number:</span>{" "}
                <span className="font-mono font-semibold text-blue-700">
                  {order.PONumber}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Category:</span>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    order.kategoriBarang === "basic"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {order.kategoriBarang === "basic" ? "Basic" : "Model"}
                </span>
              </p>
              {userRole !== "supplier" && (
                <p>
                  <span className="text-gray-600">Request No:</span>{" "}
                  <span className="font-mono">{order.requestNo || "-"}</span>
                </p>
              )}
              <p>
                <span className="text-gray-600">Created:</span>{" "}
                {formatTimestamp(order.createdDate)}
              </p>
              <p>
                <span className="text-gray-600">Created By:</span>{" "}
                {getFullNameFromUsername(order.jbId)}
              </p>
              <p>
                <span className="text-gray-600">Pabrik:</span>{" "}
                <span className="font-medium">{pabrikLabel}</span>
              </p>
              <p>
                <span className="text-gray-600">ETA:</span>{" "}
                {formatDate(order.waktuKirim)}
              </p>
              <p>
                <span className="text-gray-600">Status:</span>{" "}
                <span
                  className={`inline-block text-xs ${getStatusColor(currentOrder.status)} px-2 py-1 rounded-full font-medium`}
                >
                  {currentOrder.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Items Card */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Order Items</h3>
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full border-collapse border text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2 text-left bg-gray-100">#</th>
                <th className="border p-2 text-left bg-gray-100">Kadar</th>
                <th className="border p-2 text-left bg-gray-100">Warna</th>
                <th className="border p-2 text-left bg-gray-100">Ukuran</th>
                <th className="border p-2 text-left bg-gray-100">Berat</th>
                <th className="border p-2 text-left bg-gray-100">Pcs</th>
              </tr>
            </thead>
            <tbody>
              {order.detailItems.map((item, index) => {
                return (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td
                      className={`border p-2 font-medium ${getKadarColor(item.kadar)}`}
                    >
                      {item.kadar.toUpperCase()}
                    </td>
                    <td className={`border p-2 ${getWarnaColor(item.warna)}`}>
                      {getWarnaLabel(item.warna)}
                    </td>
                    <td className="border p-2">
                      {getUkuranDisplay(item.ukuran)}
                    </td>
                    <td className="border p-2">{item.berat || "-"}</td>
                    <td className="border p-2">{item.pcs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplier Action Buttons */}
      {userRole === "supplier" &&
        (currentOrder.status === "New" || currentOrder.status === "Viewed") && (
          <div className="flex gap-2 flex-wrap justify-end mt-6">
            <Button
              onClick={() =>
                handleUpdateStatus(currentOrder.id, "In Production")
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Start Production
            </Button>
            <Button
              onClick={() => handleUpdateStatus(currentOrder.id, "Stock Ready")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Mark Stock Ready
            </Button>
            <Button
              onClick={() =>
                handleUpdateStatus(currentOrder.id, "Request Change")
              }
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Request Change
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleUpdateStatus(currentOrder.id, "Unable to Fulfill")
              }
            >
              Unable to Fulfill
            </Button>
          </div>
        )}

      {/* Supplier Action Buttons - In Production */}
      {userRole === "supplier" && currentOrder.status === "In Production" && (
        <div className="flex gap-2 flex-wrap justify-end mt-6">
          <Button
            onClick={() => handleUpdateStatus(currentOrder.id, "Stock Ready")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Mark Stock Ready
          </Button>
          <Button
            onClick={() =>
              handleUpdateStatus(currentOrder.id, "Request Change")
            }
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Request Change
          </Button>
        </div>
      )}

      {/* Related Request Details - Collapsible Panel */}
      {relatedRequest && userRole !== "supplier" && (
        <Card className="p-4">
          <button
            onClick={() => setIsRequestDetailsOpen(!isRequestDetailsOpen)}
            className="w-full flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
          >
            <h3 className="font-semibold text-gray-900">
              Related Request Details
            </h3>
            {isRequestDetailsOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {isRequestDetailsOpen && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Request Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  {relatedRequest.requestNo && (
                    <div>
                      <span className="text-gray-500">Request No: </span>
                      <span className="font-medium font-mono">
                        {relatedRequest.requestNo}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Created: </span>
                    <span className="font-medium">
                      {formatTimestamp(relatedRequest.timestamp)}
                    </span>
                  </div>
                  {relatedRequest.createdBy && (
                    <div>
                      <span className="text-gray-500">Sales: </span>
                      <span className="font-medium">
                        {typeof relatedRequest.createdBy === "string"
                          ? getFullNameFromUsername(relatedRequest.createdBy)
                          : relatedRequest.createdBy.username}
                      </span>
                    </div>
                  )}
                  {relatedRequest.stockistId && (
                    <div>
                      <span className="text-gray-500">Stockist: </span>
                      <span className="font-medium">
                        {getFullNameFromUsername(relatedRequest.stockistId)}
                      </span>
                    </div>
                  )}
                  {relatedRequest.namaPelanggan && (
                    <div>
                      <span className="text-gray-500">Atas Nama: </span>
                      <span className="font-medium">
                        {relatedRequest.namaPelanggan.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {relatedRequest.customerExpectation && (
                    <div>
                      <span className="text-gray-500">
                        Customer Expectation:{" "}
                      </span>
                      <span className="font-medium">
                        {getLabelFromValue(
                          CUSTOMER_EXPECTATION_OPTIONS,
                          relatedRequest.customerExpectation,
                        )}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span
                      className={`inline-block text-xs ${getStatusBadgeClasses(relatedRequest.status)} px-2 py-1 rounded-full font-medium`}
                    >
                      {relatedRequest.status}
                    </span>
                  </div>
                  {relatedRequest.updatedDate && (
                    <div>
                      <span className="text-gray-500">Updated: </span>
                      <span className="font-medium">
                        {formatTimestampWithTime(relatedRequest.updatedDate)}
                      </span>
                    </div>
                  )}
                  {relatedRequest.updatedBy && (
                    <div>
                      <span className="text-gray-500">Updated By: </span>
                      <span className="font-medium">
                        {getFullNameFromUsername(relatedRequest.updatedBy)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Items Table */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Request Items (Original)
                </h4>
                <div className="max-h-[250px] overflow-auto">
                  <table className="w-full border-collapse border text-xs">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="border p-2 text-left bg-gray-100">#</th>
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
                        {relatedRequest.detailItems.some(
                          (item) => item.availablePcs,
                        ) && (
                          <th className="border p-2 text-left bg-gray-100">
                            Available
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {relatedRequest.detailItems.map((item, index) => {
                        const ukuranDisplay = getUkuranDisplay(item.ukuran);
                        return (
                          <tr
                            key={item.id || index}
                            className="hover:bg-gray-50"
                          >
                            <td className="border p-2 text-center">
                              {index + 1}
                            </td>
                            <td
                              className={`border p-2 font-medium ${getKadarColor(
                                item.kadar,
                              )}`}
                            >
                              {item.kadar.toUpperCase()}
                            </td>
                            <td
                              className={`border p-2 ${getWarnaColor(
                                item.warna,
                              )}`}
                            >
                              {getWarnaLabel(item.warna)}
                            </td>
                            <td className="border p-2">
                              {ukuranDisplay.showUnit
                                ? `${ukuranDisplay.value} cm`
                                : ukuranDisplay.value}
                            </td>
                            <td className="border p-2">{item.berat || "-"}</td>
                            <td className="border p-2">{item.pcs}</td>
                            {relatedRequest.detailItems.some(
                              (i) => i.availablePcs,
                            ) && (
                              <td className="border p-2">
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
      )}

      {/* Revision History - Collapsible Panel (for non-supplier users) */}
      {userRole !== "supplier" &&
        currentOrder.revisionHistory &&
        currentOrder.revisionHistory.length > 0 && (
          <Card className="p-4">
            <button
              onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
              className="w-full flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-gray-900">
                Order Revisions ({currentOrder.revisionHistory.length}{" "}
                {currentOrder.revisionHistory.length === 1
                  ? "version"
                  : "versions"}
                )
              </h3>
              {isRevisionHistoryOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {isRevisionHistoryOpen && (
              <div className="mt-4 space-y-3">
                {/* Initial Version - Show original order state */}
                {(() => {
                  const isExpanded = expandedRevisions.has(-1);
                  const firstRevision = currentOrder.revisionHistory[0];

                  return (
                    <div className="border rounded-lg overflow-hidden bg-blue-50">
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedRevisions);
                          if (isExpanded) {
                            newExpanded.delete(-1);
                          } else {
                            newExpanded.add(-1);
                          }
                          setExpandedRevisions(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-blue-100 transition-colors text-left"
                      >
                        <div>
                          <h4 className="font-medium text-sm">
                            {new Date(
                              currentOrder.createdDate,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Initial version · Created by{" "}
                            {getFullNameFromUsername(currentOrder.createdBy)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-white p-4 text-sm">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Left side: Fields */}
                            <div className="flex-1 space-y-3">
                              {/* Kategori Barang */}
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Kategori Barang
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    [
                                      { value: "basic", label: "Basic" },
                                      { value: "model", label: "Model" },
                                    ],
                                    firstRevision?.previousValues
                                      .kategoriBarang ||
                                      currentOrder.kategoriBarang,
                                  )}
                                </p>
                              </div>

                              {/* Jenis Produk */}
                              <div>
                                <p className="font-medium text-gray-700 text-xs mb-1">
                                  Jenis Produk
                                </p>
                                <p className="text-gray-900">
                                  {getLabelFromValue(
                                    JENIS_PRODUK_OPTIONS,
                                    firstRevision?.previousValues.jenisProduk ||
                                      currentOrder.jenisProduk,
                                  )}
                                </p>
                              </div>

                              {/* Nama Basic */}
                              {(firstRevision?.previousValues.namaBasic ||
                                currentOrder.namaBasic) && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Nama Basic
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      NAMA_BASIC_OPTIONS,
                                      firstRevision?.previousValues.namaBasic ||
                                        currentOrder.namaBasic,
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Nama Produk */}
                              {(firstRevision?.previousValues.namaProduk ||
                                currentOrder.namaProduk) && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Nama Produk
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      NAMA_PRODUK_OPTIONS,
                                      firstRevision?.previousValues
                                        .namaProduk || currentOrder.namaProduk,
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Right side: Photo */}
                            {(firstRevision?.previousValues.photoId ||
                              currentOrder.photoId) && (
                              <div className="md:w-48">
                                <p className="font-medium text-gray-700 text-xs mb-2">
                                  Foto Barang
                                </p>
                                <img
                                  src={
                                    getImage(
                                      firstRevision?.previousValues.photoId ||
                                        currentOrder.photoId ||
                                        "",
                                    ) || ""
                                  }
                                  alt="Product"
                                  className="w-full h-48 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>

                          {/* Detail Items */}
                          {(() => {
                            const detailItems =
                              firstRevision?.previousValues.detailItems ||
                              currentOrder.detailItems;
                            return (
                              detailItems &&
                              detailItems.length > 0 && (
                                <div className="mt-4">
                                  <p className="font-medium text-gray-700 text-xs mb-2">
                                    Detail Barang ({detailItems.length} items)
                                  </p>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse border">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th className="border px-2 py-1 text-left">
                                            Kadar
                                          </th>
                                          <th className="border px-2 py-1 text-left">
                                            Warna
                                          </th>
                                          <th className="border px-2 py-1 text-left">
                                            Ukuran
                                          </th>
                                          <th className="border px-2 py-1 text-right">
                                            Berat
                                          </th>
                                          <th className="border px-2 py-1 text-right">
                                            Pcs
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detailItems.map((item, idx) => (
                                          <tr key={idx}>
                                            <td
                                              className={`border px-2 py-1 font-medium ${getKadarColor(item.kadar)}`}
                                            >
                                              {item.kadar}
                                            </td>
                                            <td
                                              className={`border px-2 py-1 ${getWarnaColor(item.warna)}`}
                                            >
                                              {getWarnaLabel(item.warna)}
                                            </td>
                                            <td className="border px-2 py-1">
                                              {getUkuranDisplay(item.ukuran)}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {item.berat}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {item.pcs}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Revision History */}
                {currentOrder.revisionHistory.map((revision, index) => {
                  const isExpanded = expandedRevisions.has(index);

                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedRevisions);
                          if (isExpanded) {
                            newExpanded.delete(index);
                          } else {
                            newExpanded.add(index);
                          }
                          setExpandedRevisions(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div>
                          <h4 className="font-medium text-sm">
                            {new Date(revision.timestamp).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Updated by{" "}
                            {getFullNameFromUsername(revision.updatedBy)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4 text-sm">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Left side: Fields */}
                            <div className="flex-1 space-y-3">
                              {/* Kategori Barang */}
                              {revision.changes.kategoriBarang && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Kategori Barang
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      [
                                        { value: "basic", label: "Basic" },
                                        { value: "model", label: "Model" },
                                      ],
                                      revision.changes.kategoriBarang,
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Jenis Produk */}
                              {revision.changes.jenisProduk && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Jenis Produk
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      JENIS_PRODUK_OPTIONS,
                                      revision.changes.jenisProduk,
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Nama Basic */}
                              {revision.changes.namaBasic && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Nama Basic
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      NAMA_BASIC_OPTIONS,
                                      revision.changes.namaBasic,
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Nama Produk */}
                              {revision.changes.namaProduk && (
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Nama Produk
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      NAMA_PRODUK_OPTIONS,
                                      revision.changes.namaProduk,
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Right side: Photo */}
                            {revision.changes.photoId && (
                              <div className="md:w-48">
                                <p className="font-medium text-gray-700 text-xs mb-2">
                                  Foto Barang
                                </p>
                                <img
                                  src={getImage(revision.changes.photoId) || ""}
                                  alt="Product"
                                  className="w-full h-48 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>

                          {/* Detail Items */}
                          {revision.changes.detailItems &&
                            revision.changes.detailItems.length > 0 && (
                              <div className="mt-4">
                                <p className="font-medium text-gray-700 text-xs mb-2">
                                  Detail Barang (
                                  {revision.changes.detailItems.length} items)
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs border-collapse border">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="border px-2 py-1 text-left">
                                          Kadar
                                        </th>
                                        <th className="border px-2 py-1 text-left">
                                          Warna
                                        </th>
                                        <th className="border px-2 py-1 text-left">
                                          Ukuran
                                        </th>
                                        <th className="border px-2 py-1 text-right">
                                          Berat
                                        </th>
                                        <th className="border px-2 py-1 text-right">
                                          Pcs
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {revision.changes.detailItems.map(
                                        (item, idx) => (
                                          <tr key={idx}>
                                            <td
                                              className={`border px-2 py-1 font-medium ${getKadarColor(item.kadar)}`}
                                            >
                                              {item.kadar}
                                            </td>
                                            <td
                                              className={`border px-2 py-1 ${getWarnaColor(item.warna)}`}
                                            >
                                              {getWarnaLabel(item.warna)}
                                            </td>
                                            <td className="border px-2 py-1">
                                              {getUkuranDisplay(item.ukuran)}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {item.berat}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {item.pcs}
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
    </div>
  );
}
