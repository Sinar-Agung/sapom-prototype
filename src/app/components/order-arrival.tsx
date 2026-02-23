import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order, OrderArrival } from "@/app/types/order";
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
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

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

interface OrderArrivalProps {
  order: Order;
  arrivals: OrderArrival[];
  onBack: () => void;
  onSubmitArrival: (
    orderId: string,
    arrivals: {
      karat: string;
      warna: string;
      size: string;
      berat: string;
      pcs: number;
    }[],
  ) => void;
  onCloseOrder?: (orderId: string) => void;
  isFullyDelivered: boolean;
}

export function OrderArrivalComponent({
  order,
  arrivals,
  onBack,
  onSubmitArrival,
  onCloseOrder,
  isFullyDelivered,
}: OrderArrivalProps) {
  const [isArrivalHistoryOpen, setIsArrivalHistoryOpen] = useState(false);
  const [expandedArrivals, setExpandedArrivals] = useState<Set<string>>(
    new Set(),
  );
  const [newArrivals, setNewArrivals] = useState<Record<string, number>>({});
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // Calculate total delivered for each item
  const getDeliveredCount = (
    kadar: string,
    warna: string,
    ukuran: string,
    berat: string,
  ): number => {
    return arrivals.reduce((total, arrival) => {
      const item = arrival.items.find(
        (i) =>
          i.karat === kadar &&
          i.warna === warna &&
          i.size === ukuran &&
          i.berat === berat,
      );
      return total + (item?.pcs || 0);
    }, 0);
  };

  const toggleArrivalExpansion = (arrivalId: string) => {
    const newExpanded = new Set(expandedArrivals);
    if (newExpanded.has(arrivalId)) {
      newExpanded.delete(arrivalId);
    } else {
      newExpanded.add(arrivalId);
    }
    setExpandedArrivals(newExpanded);
  };

  const handleNewArrivalChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setNewArrivals((prev) => ({
      ...prev,
      [itemId]: Math.max(0, numValue),
    }));
  };

  const handleSubmit = () => {
    const arrivalItems = order.detailItems
      .map((item) => {
        const pcs = newArrivals[item.id] || 0;
        if (pcs > 0) {
          return {
            karat: item.kadar,
            warna: item.warna,
            size: item.ukuran,
            berat: item.berat,
            pcs,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    if (arrivalItems.length > 0) {
      onSubmitArrival(order.id, arrivalItems);
      setNewArrivals({});
    }
  };

  const handleCancel = () => {
    setNewArrivals({});
    onBack();
  };

  const hasNewArrivals = Object.values(newArrivals).some((val) => val > 0);

  // Get product image
  const productImage = order.photoId
    ? getImage(order.photoId)
    : NAMA_BASIC_IMAGES[order.namaBasic] || null;

  // Helper functions for styling (same as order-details.tsx)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Order Arrival</h1>
          <p className="text-sm text-gray-600">PO Number: {order.PONumber}</p>
        </div>
      </div>

      {/* Order Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">Status</span>
              <div className="mt-1">
                <span
                  className={`${getStatusBadgeClasses(order.status)} px-3 py-1 rounded-full text-sm font-medium`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-600">Supplier</span>
              <p className="font-medium">{order.pabrik.name}</p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Product Category</span>
              <p className="font-medium">
                {order.kategoriBarang === "basic" ? "Basic" : "Model"}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Product Type</span>
              <p className="font-medium">
                {getLabelFromValue(JENIS_PRODUK_OPTIONS, order.jenisProduk)}
              </p>
            </div>

            {order.kategoriBarang === "model" && (
              <div>
                <span className="text-sm text-gray-600">Nama Produk</span>
                <p className="font-medium">
                  {getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk)}
                </p>
              </div>
            )}

            {order.kategoriBarang === "basic" && (
              <div>
                <span className="text-sm text-gray-600">Basic Name</span>
                <p className="font-medium">
                  {getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)}
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">Delivery Time</span>
              <p className="font-medium">
                {new Date(order.waktuKirim).toLocaleString()}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600">
                Customer Expectation
              </span>
              <p className="font-medium">
                {getLabelFromValue(
                  CUSTOMER_EXPECTATION_OPTIONS,
                  order.customerExpectation,
                )}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Created Date</span>
              <p className="font-medium">
                {new Date(order.createdDate).toLocaleString()}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600">Created By</span>
              <p className="font-medium">
                {getFullNameFromUsername(order.createdBy)}
              </p>
            </div>

            {productImage && (
              <div>
                <span className="text-sm text-gray-600">Product Image</span>
                <div className="mt-2">
                  <img
                    src={productImage}
                    alt={order.namaBasic}
                    className="w-32 h-32 object-contain rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsImageDialogOpen(true)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Order Items with Delivery Tracking */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left bg-gray-100">#</th>
                <th className="border p-2 text-left bg-gray-100">Kadar</th>
                <th className="border p-2 text-left bg-gray-100">Warna</th>
                <th className="border p-2 text-left bg-gray-100">Ukuran</th>
                <th className="border p-2 text-left bg-gray-100">Berat</th>
                <th className="border p-2 text-left bg-gray-100">Ordered</th>
                <th className="border p-2 text-left bg-gray-100">Delivered</th>
                <th className="border p-2 text-left bg-gray-100">
                  New Arrival
                </th>
              </tr>
            </thead>
            <tbody>
              {order.detailItems.map((item, index) => {
                const delivered = getDeliveredCount(
                  item.kadar,
                  item.warna,
                  item.ukuran,
                  item.berat,
                );
                const newArrival = newArrivals[item.id] || 0;

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
                    <td className="border p-2">{delivered}</td>
                    <td className="border p-2">
                      <Input
                        type="number"
                        min="0"
                        value={newArrival || ""}
                        onChange={(e) =>
                          handleNewArrivalChange(item.id, e.target.value)
                        }
                        className="w-20 text-right"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasNewArrivals}>
            Submit Arrival
          </Button>
        </div>
      </Card>

      {/* Arrival History */}
      {arrivals.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => setIsArrivalHistoryOpen(!isArrivalHistoryOpen)}
            className="w-full flex items-center justify-between text-lg font-semibold mb-2"
          >
            <span>Arrival History ({arrivals.length})</span>
            {isArrivalHistoryOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {isArrivalHistoryOpen && (
            <div className="space-y-4 mt-4">
              {arrivals
                .sort((a, b) => b.createdDate - a.createdDate)
                .map((arrival) => (
                  <div
                    key={arrival.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {new Date(arrival.createdDate).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            },
                          )}
                        </span>
                        <span className="text-sm text-gray-600">
                          by {getFullNameFromUsername(arrival.createdBy)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleArrivalExpansion(arrival.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {expandedArrivals.has(arrival.id) ? (
                          <>
                            Hide Details <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Show Details <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {expandedArrivals.has(arrival.id) && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm border-collapse border">
                          <thead className="bg-gray-100">
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
                            {arrival.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="border p-2 text-center">
                                  {idx + 1}
                                </td>
                                <td
                                  className={`border p-2 font-medium ${getKadarColor(item.karat)}`}
                                >
                                  {item.karat.toUpperCase()}
                                </td>
                                <td
                                  className={`border p-2 ${getWarnaColor(item.warna)}`}
                                >
                                  {getWarnaLabel(item.warna)}
                                </td>
                                <td className="border p-2">
                                  {getUkuranDisplay(item.size)}
                                </td>
                                <td className="border p-2">
                                  {item.berat || "-"}
                                </td>
                                <td className="border p-2">{item.pcs}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Close Order Button for Fully Delivered Orders */}
      {isFullyDelivered && onCloseOrder && (
        <div className="flex justify-end">
          <Button
            onClick={() => onCloseOrder(order.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Close Order
          </Button>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Image</DialogTitle>
          </DialogHeader>
          {productImage && (
            <div className="flex justify-center">
              <img
                src={productImage}
                alt={order.namaBasic}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
