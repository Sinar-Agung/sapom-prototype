import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AvailablePcsInput } from "./ui/available-pcs-input";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
  KADAR_OPTIONS,
  WARNA_OPTIONS,
  UKURAN_KALUNG_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";

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

// Color mapping for Kadar - Match order-form colors
const KADAR_COLORS: Record<string, string> = {
  "6k": "bg-green-500 text-white",
  "8k": "bg-blue-500 text-white",
  "9k": "bg-blue-700 text-white",
  "16k": "bg-orange-500 text-white",
  "17k": "bg-pink-500 text-white",
  "24k": "bg-red-500 text-white",
};

// Color mapping for Warna - Match order-form colors
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
  verified?: boolean;
}

interface Order {
  id: string;
  timestamp: number;
  createdBy?: string;
  pabrik: string;
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  namaPelanggan: string;
  waktuKirim: string;
  followUpAction: string;
  detailItems: OrderItem[];
  fotoBarangBase64?: string;
  status: string;
}

interface VerifyStockProps {
  order: Order;
  onBack: () => void;
  mode?: "verify" | "review";
}

export function VerifyStock({ order, onBack, mode = "verify" }: VerifyStockProps) {
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [showReadyStockDialog, setShowReadyStockDialog] = useState(false);
  const [showSendToJBDialog, setShowSendToJBDialog] = useState(false);
  const [showStockUnavailableDialog, setShowStockUnavailableDialog] = useState(false);

  useEffect(() => {
    // Sort items on mount using the same logic as order-form
    const sortedItems = [...order.detailItems].sort((a, b) => {
      // First sort by Kadar - extract numeric value
      const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
      const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
      if (kadarA !== kadarB) return kadarA - kadarB;

      // Then by Warna
      if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
      
      // Then by Ukuran
      if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
      
      // Finally by Berat
      return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
    });
    
    setDetailItems(sortedItems);

    // Update order status to "Stockist Processing" when this component mounts
    const savedOrders = sessionStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (orderIndex !== -1 && orders[orderIndex].status === "Open") {
        orders[orderIndex].status = "Stockist Processing";
        sessionStorage.setItem("orders", JSON.stringify(orders));
      }
    }
  }, [order.id, order.detailItems]);

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

  const getOrderImage = () => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    } else if (order.kategoriBarang === "model" && order.fotoBarangBase64) {
      return order.fotoBarangBase64;
    }
    return italySanta;
  };

  const handleAvailablePcsChange = (itemId: string, value: string) => {
    setDetailItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, availablePcs: value } : item
      )
    );

    // Auto-save when user edits available pcs
    const savedOrders = sessionStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].detailItems = orders[orderIndex].detailItems.map((item: OrderItem) =>
          item.id === itemId ? { ...item, availablePcs: value } : item
        );
        sessionStorage.setItem("orders", JSON.stringify(orders));
      }
    }
  };

  const updateOrderStatus = (newStatus: string) => {
    const savedOrders = sessionStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        orders[orderIndex].detailItems = detailItems;
        sessionStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    onBack();
  };

  const handleReadyStock = () => {
    // Fill all available pcs to match requested pcs
    const updatedItems = detailItems.map((item) => ({
      ...item,
      availablePcs: item.pcs,
    }));
    
    setDetailItems(updatedItems);

    // Save to session storage and update status
    const savedOrders = sessionStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Order) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].detailItems = updatedItems;
        orders[orderIndex].status = "Ready Stock Marketing";
        sessionStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    onBack();
  };

  const handleSendToJB = () => {
    updateOrderStatus("Requested to JB");
  };

  const handleStockUnavailable = () => {
    updateOrderStatus("Stock Unavailable");
  };

  // Get labels instead of values
  const jenisProdukLabel = getLabelFromValue(JENIS_PRODUK_OPTIONS, order.jenisProduk);
  const productNameLabel = order.kategoriBarang === "basic"
    ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
    : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const pabrikLabel = typeof order.pabrik === 'string' 
    ? getLabelFromValue(PABRIK_OPTIONS, order.pabrik)
    : order.pabrik?.name || getLabelFromValue(PABRIK_OPTIONS, order.pabrik?.id || "");
  const atasNamaLabel = typeof order.namaPelanggan === 'string'
    ? getLabelFromValue(ATAS_NAMA_OPTIONS, order.namaPelanggan)
    : order.namaPelanggan?.name || getLabelFromValue(ATAS_NAMA_OPTIONS, order.namaPelanggan?.id || "");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-9 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Verify Stock</h1>
      </div>

      {/* Request Header */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Request Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 shrink-0">
                <img
                  src={getOrderImage()}
                  alt={productNameLabel}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-base">
                    {jenisProdukLabel} {productNameLabel}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {order.kategoriBarang === "basic" ? "Basic" : "Model"}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Created: </span>
                    <span className="font-medium">{formatTimestamp(order.timestamp)}</span>
                  </div>
                  {order.createdBy && (
                    <div>
                      <span className="text-gray-500">Sales: </span>
                      <span className="font-medium">{order.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2 text-sm">
            {order.namaPelanggan && (
              <div>
                <span className="text-gray-500">Atas Nama: </span>
                <span className="font-medium">{atasNamaLabel}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Pabrik: </span>
              <span className="font-medium">{pabrikLabel}</span>
            </div>
            <div>
              <span className="text-gray-500">ETA: </span>
              <span className="font-medium">{formatDate(order.waktuKirim) || "-"}</span>
            </div>
            {order.followUpAction && (
              <div>
                <span className="text-gray-500">Follow Up Action: </span>
                <span className="font-medium">{order.followUpAction}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Status: </span>
              <span className={`inline-block text-xs ${getStatusBadgeClasses(order.status)} px-2 py-1 rounded-full font-medium`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Barang - Desktop View (Table) */}
      <Card className="p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Detail Barang</h2>
        
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">#</th>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Kadar</th>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Warna</th>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Ukuran</th>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Berat (gr)</th>
                <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">Requested Pcs</th>
                <th className="px-3 py-2 text-left font-medium bg-gray-50">Available Pcs</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {detailItems.map((item, index) => {
                const kadarColor = KADAR_COLORS[item.kadar.toLowerCase()] || "bg-gray-100 text-gray-900";
                const warnaColor = WARNA_COLORS[item.warna.toLowerCase()] || "bg-gray-100 text-gray-900";
                const ukuranLabel = getLabelFromValue(UKURAN_KALUNG_OPTIONS, item.ukuran);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-r">{index + 1}</td>
                    <td className="px-3 py-2 border-r">
                      <span className={`inline-block px-2 py-1 rounded font-medium ${kadarColor}`}>
                        {item.kadar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-r">
                      <span className={`inline-block px-2 py-1 rounded font-medium ${warnaColor}`}>
                        {item.warna.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-r">{ukuranLabel || "-"}</td>
                    <td className="px-3 py-2 border-r">{item.berat || "-"}</td>
                    <td className="px-3 py-2 border-r font-semibold">{item.pcs}</td>
                    <td className="px-3 py-2">
                      {mode === "review" ? (
                        <span className="font-medium">{item.availablePcs || "-"}</span>
                      ) : (
                        <AvailablePcsInput
                          value={item.availablePcs || ""}
                          onChange={(value) => handleAvailablePcsChange(item.id, value)}
                          requestedPcs={item.pcs}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Barang - Mobile View (List) */}
      <div className="md:hidden space-y-3">
        <h2 className="text-lg font-semibold">Detail Barang</h2>
        
        {detailItems.map((item, index) => {
          const kadarColor = KADAR_COLORS[item.kadar.toLowerCase()] || "bg-gray-100 text-gray-900";
          const warnaColor = WARNA_COLORS[item.warna.toLowerCase()] || "bg-gray-100 text-gray-900";
          const ukuranLabel = getLabelFromValue(UKURAN_KALUNG_OPTIONS, item.ukuran);
          
          return (
            <Card key={item.id} className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Item #{index + 1}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Kadar: </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${kadarColor}`}>
                      {item.kadar.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Warna: </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${warnaColor}`}>
                      {item.warna.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ukuran: </span>
                    <span className="font-medium">{ukuranLabel || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Berat (gr): </span>
                    <span className="font-medium">{item.berat || "-"}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="mb-2">
                    <span className="text-gray-500">Requested Pcs: </span>
                    <span className="font-semibold">{item.pcs}</span>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">Available Pcs:</label>
                    {mode === "review" ? (
                      <span className="font-medium">{item.availablePcs || "-"}</span>
                    ) : (
                      <AvailablePcsInput
                        value={item.availablePcs || ""}
                        onChange={(value) => handleAvailablePcsChange(item.id, value)}
                        requestedPcs={item.pcs}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons - Only show in verify mode */}
      {mode === "verify" && (
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => setShowStockUnavailableDialog(true)}
            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Stock Unavailable
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSendToJBDialog(true)}
            className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to JB
          </Button>
          <Button
            onClick={() => setShowReadyStockDialog(true)}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ready Stock
          </Button>
        </div>
      )}

      {/* Ready Stock Confirmation Dialog */}
      <AlertDialog open={showReadyStockDialog} onOpenChange={setShowReadyStockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Ready Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin semua barang tersedia di stock? Ini akan mengisi semua "Available Pcs" sesuai dengan "Requested Pcs" dan mengubah status menjadi "Ready Stock Marketing".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReadyStock}>
              Ya, Ready Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to JB Confirmation Dialog */}
      <AlertDialog open={showSendToJBDialog} onOpenChange={setShowSendToJBDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Send to JB</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengirim request ini ke JB (Jewelry Buyer)? Status akan berubah menjadi "Requested to JB".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendToJB}>
              Ya, Kirim ke JB
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Unavailable Confirmation Dialog */}
      <AlertDialog open={showStockUnavailableDialog} onOpenChange={setShowStockUnavailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Stock Tidak Tersedia</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin barang ini tidak tersedia di stock? Status akan berubah menjadi "Stock Unavailable" dan sales akan diberitahu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleStockUnavailable} className="bg-red-600 hover:bg-red-700">
              Ya, Stock Tidak Tersedia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}