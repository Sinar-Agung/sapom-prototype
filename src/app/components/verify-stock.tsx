import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  UKURAN_KALUNG_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { DetailBarangItem, Request } from "@/app/types/request";
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
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { AvailablePcsInput } from "./ui/available-pcs-input";
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

interface VerifyStockProps {
  order: Request;
  onBack: () => void;
  mode?: "verify" | "review" | "detail";
  isJBWaiting?: boolean;
}

export function VerifyStock({
  order,
  onBack,
  mode = "verify",
  isJBWaiting = false,
}: VerifyStockProps) {
  const [detailItems, setDetailItems] = useState<DetailBarangItem[]>([]);
  const [showReadyStockDialog, setShowReadyStockDialog] = useState(false);
  const [showSendToJBDialog, setShowSendToJBDialog] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Request>(order);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs for debounce management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save function to be reused
  const saveChanges = () => {
    const hasChanges = detailItems.some(
      (item) => item.availablePcs !== undefined,
    );

    if (hasChanges) {
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const orderIndex = orders.findIndex((o: Request) => o.id === order.id);
        if (orderIndex !== -1) {
          orders[orderIndex].detailItems = detailItems;
          const currentUser =
            sessionStorage.getItem("username") ||
            localStorage.getItem("username") ||
            "";
          orders[orderIndex].updatedDate = Date.now();
          orders[orderIndex].updatedBy = currentUser;
          localStorage.setItem("orders", JSON.stringify(orders));
          setWasUpdated(true);
          setHasUnsavedChanges(false);
          return true;
        }
      }
    }
    return false;
  };

  // Debounced save function with animation
  const debouncedSave = (immediate = false) => {
    // Clear any existing timeouts
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (savingAnimationTimeoutRef.current) {
      clearTimeout(savingAnimationTimeoutRef.current);
      savingAnimationTimeoutRef.current = null;
    }

    if (immediate) {
      // Execute save immediately without animation for critical actions
      const saved = saveChanges();
      if (saved) {
        setIsSaving(false);
      }
      return saved;
    }

    // Debounced save with animation
    saveTimeoutRef.current = setTimeout(() => {
      const hasChanges = detailItems.some(
        (item) => item.availablePcs !== undefined,
      );

      if (hasChanges && hasUnsavedChanges) {
        setIsSaving(true);

        savingAnimationTimeoutRef.current = setTimeout(() => {
          const saved = saveChanges();
          if (saved) {
            setIsSaving(false);
            toast.success("Request updated");
          }
        }, 500);
      }
    }, 1200);
  };

  // Trigger debounced save when detailItems change
  useEffect(() => {
    if (hasUnsavedChanges) {
      debouncedSave(false);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savingAnimationTimeoutRef.current) {
        clearTimeout(savingAnimationTimeoutRef.current);
      }
    };
  }, [detailItems, hasUnsavedChanges]);

  // Save on unmount effect
  useEffect(() => {
    return () => {
      // Save immediately when component unmounts if there are unsaved changes
      if (hasUnsavedChanges) {
        // Clear any pending saves
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        if (savingAnimationTimeoutRef.current) {
          clearTimeout(savingAnimationTimeoutRef.current);
        }

        // Save without showing toast (will be shown by back button handler or final action)
        saveChanges();
      }
    };
  }, [hasUnsavedChanges, detailItems, order.id]);

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
    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Request) => o.id === order.id);
      if (orderIndex !== -1 && orders[orderIndex].status === "Open") {
        orders[orderIndex].status = "Stockist Processing";
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        orders[orderIndex].stockistId = currentUser; // Assign stockist ownership
        localStorage.setItem("orders", JSON.stringify(orders));

        // Update local state to reflect changes immediately
        setCurrentOrder({
          ...order,
          status: "Stockist Processing",
          updatedDate: Date.now(),
          updatedBy: currentUser,
          stockistId: currentUser,
        });
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
        item.id === itemId ? { ...item, availablePcs: value } : item,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const updateOrderStatus = (newStatus: string) => {
    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Request) => o.id === order.id);
      if (orderIndex !== -1) {
        // If sending to JB, calculate orderPcs as requested - available
        let updatedDetailItems = detailItems;
        if (newStatus === "Requested to JB") {
          updatedDetailItems = detailItems.map((item) => ({
            ...item,
            orderPcs: Math.max(
              0,
              parseInt(item.pcs) - parseInt(item.availablePcs || "0"),
            ).toString(),
          }));
        }

        orders[orderIndex].status = newStatus;
        orders[orderIndex].detailItems = updatedDetailItems;
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    setWasUpdated(true);
    setTimeout(() => {
      console.log("Request updated to status:", newStatus);
      toast.success("Request updated");
      onBack();
    }, 100);
  };

  const handleReadyStock = () => {
    // Save any pending changes first (immediate, no debounce)
    debouncedSave(true);

    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";

    // Fill all available pcs to match requested pcs
    const updatedItems = detailItems.map((item) => ({
      ...item,
      availablePcs: item.pcs,
    }));

    setDetailItems(updatedItems);

    // Save to local storage and update status
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Request) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].detailItems = updatedItems;
        orders[orderIndex].status = "Ready Stock Marketing";
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(orders));
      }
    }
    setWasUpdated(true);
    setTimeout(() => {
      toast.success("Request updated");
      onBack();
    }, 100);
  };

  const handleSendToJB = () => {
    // Save any pending changes first (immediate, no debounce)
    debouncedSave(true);

    // Check if all available pcs match requested pcs
    const allMatch = detailItems.every(
      (item) => item.availablePcs === item.pcs,
    );

    // Check if any available pcs don't match
    const someDoNotMatch = detailItems.some(
      (item) => !item.availablePcs || item.availablePcs !== item.pcs,
    );

    let newStatus: string;

    if (allMatch) {
      // All available pcs match requested pcs
      newStatus = "Ready Stock Marketing";
    } else if (
      order.customerExpectation === "ready-marketing" &&
      someDoNotMatch
    ) {
      // Customer expects ready marketing but pcs don't match
      newStatus = "Stock Unavailable";
    } else {
      // Otherwise, send to JB
      newStatus = "Requested to JB";
    }

    updateOrderStatus(newStatus);
  };

  // Get labels instead of values
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
      ? getLabelFromValue(PABRIK_OPTIONS, order.pabrik)
      : order.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, order.pabrik?.id || "");
  const atasNamaLabel =
    typeof order.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, order.namaPelanggan)
      : order.namaPelanggan?.name ||
        getLabelFromValue(ATAS_NAMA_OPTIONS, order.namaPelanggan?.id || "");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Clear any pending save animations
            if (savingAnimationTimeoutRef.current) {
              clearTimeout(savingAnimationTimeoutRef.current);
              setIsSaving(false);
            }
            if (wasUpdated) {
              toast.success("Request updated");
            }
            onBack();
          }}
          className="h-9 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">
          {mode === "review"
            ? "Review Request"
            : mode === "detail"
              ? isJBWaiting
                ? "Order Detail"
                : "Request Detail"
              : "Verify Stock"}
        </h1>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 animate-pulse">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <span className="text-sm text-blue-700 font-medium">
            Saving changes...
          </span>
        </div>
      )}

      {/* Request Header */}
      <Card className="p-4">
        {/* Product Title and Badge - Full Width */}
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">
            {jenisProdukLabel} {productNameLabel}
          </h3>
          <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {order.kategoriBarang === "basic" ? "Basic" : "Model"}
          </span>
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-2 text-sm">
            {currentOrder.requestNo && (
              <div>
                <span className="text-gray-500">Request No: </span>
                <span className="font-medium font-mono">
                  {currentOrder.requestNo}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Created: </span>
              <span className="font-medium">
                {formatTimestamp(currentOrder.timestamp)}
              </span>
            </div>
            {currentOrder.createdBy && (
              <div>
                <span className="text-gray-500">Sales: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentOrder.createdBy)}
                </span>
              </div>
            )}
            {currentOrder.stockistId && (
              <div>
                <span className="text-gray-500">Stockist: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentOrder.stockistId)}
                </span>
              </div>
            )}
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
            {order.customerExpectation && (
              <div>
                <span className="text-gray-500">Customer Expectation: </span>
                <span className="font-medium">
                  {getLabelFromValue(
                    CUSTOMER_EXPECTATION_OPTIONS,
                    order.customerExpectation,
                  )}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">ETA: </span>
              <span className="font-medium">
                {formatDate(order.waktuKirim) || "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status: </span>
              <span
                className={`inline-block text-xs ${getStatusBadgeClasses(currentOrder.status)} px-2 py-1 rounded-full font-medium`}
              >
                {currentOrder.status}
              </span>
            </div>
            {currentOrder.updatedDate && (
              <div>
                <span className="text-gray-500">Updated: </span>
                <span className="font-medium">
                  {formatTimestampWithTime(currentOrder.updatedDate)}
                </span>
              </div>
            )}
            {currentOrder.updatedBy && (
              <div>
                <span className="text-gray-500">Updated By: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentOrder.updatedBy)}
                </span>
              </div>
            )}
          </div>

          {/* Right Column - Product Image */}
          <div className="flex justify-center md:justify-end">
            <div className="w-48 h-48 md:w-56 md:h-56 border rounded-lg overflow-hidden bg-gray-50">
              <img
                src={getOrderImage()}
                alt={productNameLabel}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Barang - Desktop View (Table) */}
      <Card className="p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">Detail Barang</h2>

        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-sm border-collapse border">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  #
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Kadar
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Warna
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Ukuran
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Berat (gr)
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Requested Pcs
                </th>
                {isJBWaiting && (
                  <th className="px-3 py-2 text-left font-medium border bg-amber-50">
                    Ordered Pcs
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Available Pcs
                </th>
              </tr>
            </thead>
            <tbody>
              {detailItems.map((item, index) => {
                const kadarColor =
                  KADAR_COLORS[item.kadar.toLowerCase()] ||
                  "bg-gray-100 text-gray-900";
                const warnaColor =
                  WARNA_COLORS[item.warna.toLowerCase()] ||
                  "bg-gray-100 text-gray-900";
                const ukuranLabel = getLabelFromValue(
                  UKURAN_KALUNG_OPTIONS,
                  item.ukuran,
                );

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 border">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${kadarColor}`}
                      >
                        {item.kadar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 border">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${warnaColor}`}
                      >
                        {item.warna.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 border">{ukuranLabel || "-"}</td>
                    <td className="px-3 py-2 border">{item.berat || "-"}</td>
                    <td className="px-3 py-2 border font-semibold text-center">
                      {item.pcs}
                    </td>
                    {isJBWaiting && (
                      <td className="px-3 py-2 border font-semibold text-amber-700 text-center bg-amber-50">
                        {item.orderPcs || "-"}
                      </td>
                    )}
                    <td className="px-3 py-2 border">
                      {mode === "review" || mode === "detail" ? (
                        <span className="font-medium">
                          {item.availablePcs || "-"}
                        </span>
                      ) : (
                        <div className="w-24">
                          <AvailablePcsInput
                            value={item.availablePcs || ""}
                            onChange={(value) =>
                              handleAvailablePcsChange(item.id, value)
                            }
                            requestedPcs={item.pcs}
                          />
                        </div>
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
          const kadarColor =
            KADAR_COLORS[item.kadar.toLowerCase()] ||
            "bg-gray-100 text-gray-900";
          const warnaColor =
            WARNA_COLORS[item.warna.toLowerCase()] ||
            "bg-gray-100 text-gray-900";
          const ukuranLabel = getLabelFromValue(
            UKURAN_KALUNG_OPTIONS,
            item.ukuran,
          );

          return (
            <Card key={item.id} className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Item #{index + 1}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Kadar: </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${kadarColor}`}
                    >
                      {item.kadar.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Warna: </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${warnaColor}`}
                    >
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
                  </div>{" "}
                  {isJBWaiting && item.orderPcs && (
                    <div className="mb-2">
                      <span className="text-gray-500">Ordered Pcs: </span>
                      <span className="font-semibold text-amber-700">
                        {item.orderPcs}
                      </span>
                    </div>
                  )}{" "}
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">
                      Available Pcs:
                    </label>
                    {mode === "review" || mode === "detail" ? (
                      <span className="font-medium">
                        {item.availablePcs || "-"}
                      </span>
                    ) : (
                      <AvailablePcsInput
                        value={item.availablePcs || ""}
                        onChange={(value) =>
                          handleAvailablePcsChange(item.id, value)
                        }
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
            onClick={() => setShowSendToJBDialog(true)}
            className="flex-1 sm:flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit
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
      <AlertDialog
        open={showReadyStockDialog}
        onOpenChange={setShowReadyStockDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Ready Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin semua barang tersedia di stock? Ini akan mengisi
              semua "Available Pcs" sesuai dengan "Requested Pcs" dan mengubah
              status menjadi "Ready Stock Marketing".
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

      {/* Submit Confirmation Dialog */}
      <AlertDialog
        open={showSendToJBDialog}
        onOpenChange={setShowSendToJBDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Submit</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengirim request ini ke JB (Jewelry
              Buyer)? Status akan berubah menjadi "Requested to JB".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendToJB}>
              Ya, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
