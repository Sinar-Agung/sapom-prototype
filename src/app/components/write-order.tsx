import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
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
import { ArrowLeft, Check, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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

// Color mapping for Kadar
const KADAR_COLORS: Record<string, string> = {
  "6k": "bg-green-500 text-white",
  "8k": "bg-blue-500 text-white",
  "9k": "bg-blue-700 text-white",
  "16k": "bg-orange-500 text-white",
  "17k": "bg-pink-500 text-white",
  "24k": "bg-red-500 text-white",
};

// Color mapping for Warna
const WARNA_COLORS: Record<string, string> = {
  rg: "bg-rose-300 text-gray-800",
  ap: "bg-gray-200 text-gray-800",
  kn: "bg-yellow-400 text-gray-800",
  ks: "bg-yellow-300 text-gray-800",
  "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
  "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
};

interface OrderItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
  orderPcs?: string;
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
  namaPelanggan: {
    id: string;
    name: string;
  };
  waktuKirim: string;
  customerExpectation: string;
  detailItems: OrderItem[];
  fotoBarangBase64?: string;
  status: string;
}

interface WriteOrderProps {
  order: Order;
  onBack: () => void;
}

export function WriteOrder({ order, onBack }: WriteOrderProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [hasCreatedOrder, setHasCreatedOrder] = useState(false);
  const [eta, setEta] = useState(order.waktuKirim);

  useEffect(() => {
    // Initialize order items with default order pcs (requested - available)
    const initializeditems = order.detailItems.map((item) => {
      const requestedPcs = parseInt(item.pcs) || 0;
      const availablePcs = parseInt(item.availablePcs || "0") || 0;
      const defaultOrderPcs = Math.max(0, requestedPcs - availablePcs);

      return {
        ...item,
        orderPcs: defaultOrderPcs.toString(),
      };
    });
    setOrderItems(initializeditems);
  }, [order]);

  const handleOrderPcsChange = (itemId: string, value: string) => {
    setOrderItems((prevItems: OrderItem[]) =>
      prevItems.map((item: OrderItem) =>
        item.id === itemId ? { ...item, orderPcs: value } : item,
      ),
    );
  };

  const getOrderImage = (order: Order) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return order.fotoBarangBase64 || italySanta;
  };

  const getKadarColor = (kadar: string) => {
    return KADAR_COLORS[kadar.toLowerCase()] || "bg-gray-500 text-white";
  };

  const getWarnaColor = (warna: string) => {
    return WARNA_COLORS[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
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
    const numValue = parseFloat(ukuran);
    if (!isNaN(numValue)) {
      return `${ukuran} cm`;
    }
    return ukuran;
  };

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

    for (const [key, color] of Object.entries(colors)) {
      if (pabrikName.includes(key)) {
        return color;
      }
    }
    return "bg-gray-100 text-gray-800";
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

  const handleCreateOrder = async () => {
    // Filter items with order pcs > 0
    const itemsToOrder = orderItems.filter(
      (item: OrderItem) => parseInt(item.orderPcs || "0") > 0,
    );

    if (itemsToOrder.length === 0) {
      toast.error("Please enter order quantities");
      return;
    }

    // Get product details
    const jenisProdukLabel = getLabelFromValue(
      JENIS_PRODUK_OPTIONS,
      order.jenisProduk,
    );
    const productNameLabel =
      order.kategoriBarang === "basic"
        ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
        : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

    const pabrikLabel =
      typeof order.pabrik === "string"
        ? order.pabrik
        : order.pabrik?.name || "Unknown Pabrik";

    // Build order message
    let message = `*ORDER TO SUPPLIER*\n\n`;
    message += `Request No: ${order.requestNo || "-"}\n`;
    message += `Product: ${jenisProdukLabel} ${productNameLabel}\n`;
    message += `Pabrik: ${pabrikLabel}\n`;
    message += `ETA: ${formatDate(order.waktuKirim) || "-"}\n\n`;
    message += `*DETAIL ITEMS:*\n`;

    itemsToOrder.forEach((item: OrderItem, index: number) => {
      message += `\n${index + 1}. `;
      message += `Kadar: ${item.kadar.toUpperCase()}, `;
      message += `Warna: ${getWarnaLabel(item.warna)}, `;
      message += `Ukuran: ${getUkuranDisplay(item.ukuran)}, `;
      message += `Berat: ${item.berat || "-"}, `;
      message += `Order Qty: ${item.orderPcs} pcs`;
    });

    message += `\n\n_Sent via SAPOM Order System_`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order to Supplier",
          text: message,
        });
        setHasCreatedOrder(true);
        toast.success("Order shared successfully");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback to WhatsApp
          openWhatsApp(encodedMessage);
        }
      }
    } else {
      // Fallback to WhatsApp
      openWhatsApp(encodedMessage);
      setHasCreatedOrder(true);
    }
  };

  const openWhatsApp = (encodedMessage: string) => {
    // Open WhatsApp with the message
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const handleMarkAsSent = () => {
    if (!hasCreatedOrder) {
      toast.error("Please create the order first before marking as sent");
      return;
    }

    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].status = "Waiting for Supplier";
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        orders[orderIndex].waktuKirim = eta;
        // Save the current order pcs values
        orders[orderIndex].detailItems = orderItems;
        localStorage.setItem("orders", JSON.stringify(orders));
        toast.success("Order marked as sent to supplier");
        setTimeout(() => {
          onBack();
        }, 500);
      }
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

  const pabrikLabel =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Pabrik";

  const atasNamaLabel =
    typeof order.namaPelanggan === "string"
      ? order.namaPelanggan
      : order.namaPelanggan?.name || "";

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
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Write Order</h1>
          <p className="text-sm text-gray-600">
            Enter order quantities for supplier
          </p>
        </div>
      </div>

      {/* Order Card */}
      <Card className="p-4 mb-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-32 h-32 shrink-0 border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={getOrderImage(order)}
              alt={productNameLabel}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-base">
                {jenisProdukLabel} {productNameLabel}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  order.kategoriBarang === "basic"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {order.kategoriBarang === "basic" ? "Basic" : "Model"}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClasses(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            {order.requestNo && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Request No: </span>
                <span className="font-mono">{order.requestNo}</span>
              </p>
            )}
            <p className="text-sm text-gray-700 mb-1">
              <span className="text-gray-500">Created: </span>
              {formatTimestamp(order.timestamp) || "-"}
            </p>
            {order.createdBy && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Sales: </span>
                {getFullNameFromUsername(order.createdBy)}
              </p>
            )}
            {atasNamaLabel && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Atas Nama: </span>
                {atasNamaLabel}
              </p>
            )}
            <div className="mb-1">
              <span className="text-sm text-gray-500">Pabrik: </span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded ${getPabrikColor(pabrikLabel)}`}
              >
                {pabrikLabel}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              <span className="text-gray-500">ETA: </span>
              {formatDate(order.waktuKirim) || "-"}
            </p>
            {order.customerExpectation && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="text-gray-500">Customer Expectation: </span>
                {getLabelFromValue(
                  CUSTOMER_EXPECTATION_OPTIONS,
                  order.customerExpectation,
                )}
              </p>
            )}
            <div className="mt-3">
              <label className="text-sm text-gray-500 block mb-1">
                ETA (Editable):
              </label>
              <Input
                type="date"
                value={eta ? new Date(eta).toISOString().split("T")[0] : ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEta(new Date(e.target.value).toISOString())
                }
                className="w-full"
              />
            </div>{" "}
          </div>
        </div>
      </Card>

      {/* Order Items Table */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">Kadar</th>
                <th className="border p-2 text-left">Warna</th>
                <th className="border p-2 text-left">Ukuran</th>
                <th className="border p-2 text-left">Berat</th>
                <th className="border p-2 text-left">Requested</th>
                <th className="border p-2 text-left">Available</th>
                <th className="border p-2 text-left bg-amber-50">Order Pcs</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item: OrderItem, index: number) => (
                <tr key={item.id} className="hover:bg-gray-50">
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
                  <td className="border p-2">{item.availablePcs || "0"}</td>
                  <td className="border p-2 bg-amber-50">
                    <Input
                      type="number"
                      min="0"
                      value={item.orderPcs || "0"}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleOrderPcsChange(item.id, e.target.value)
                      }
                      className="w-20 h-8 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={handleMarkAsSent}
            variant="outline"
            disabled={!hasCreatedOrder}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Sent
          </Button>
          <Button
            onClick={handleCreateOrder}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </Card>
    </div>
  );
}
