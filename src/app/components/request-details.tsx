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
import { getImage } from "@/app/utils/image-storage";
import {
  notifyRequestStatusChanged,
  removeETAReminderForStockist,
} from "@/app/utils/notification-helper";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import { getBranchName, getFullNameFromUsername } from "@/app/utils/user-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
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
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { DetailItemsTable } from "./ui/detail-items-table";

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

interface RequestDetailsProps {
  request: Request;
  onBack: () => void;
  mode?: "verify" | "detail";
  isJBWaiting?: boolean;
  onEditRequest?: () => void;
  onDuplicateRequest?: () => void;
  onWriteOrder?: () => void;
  onReject?: (reason: string) => void;
}

export function RequestDetails({
  request,
  onBack,
  mode = "verify",
  isJBWaiting = false,
  onEditRequest,
  onDuplicateRequest,
  onWriteOrder,
  onReject,
}: RequestDetailsProps) {
  const [detailItems, setDetailItems] = useState<DetailBarangItem[]>([]);
  const [showReadyStockDialog, setShowReadyStockDialog] = useState(false);
  const [showSendToJBDialog, setShowSendToJBDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [wasUpdated, setWasUpdated] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request>(request);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(
    new Set(),
  );

  // Refs for debounce management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingToastRef = useRef<string | number | null>(null);

  // Save function to be reused
  const saveChanges = () => {
    const hasChanges = detailItems.some(
      (item) => item.availablePcs !== undefined,
    );

    if (hasChanges) {
      const savedOrders = localStorage.getItem("requests");
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const orderIndex = orders.findIndex(
          (o: Request) => o.id === request.id,
        );
        if (orderIndex !== -1) {
          orders[orderIndex].detailItems = detailItems;
          const currentUser =
            sessionStorage.getItem("username") ||
            localStorage.getItem("username") ||
            "";
          orders[orderIndex].updatedDate = Date.now();
          orders[orderIndex].updatedBy = currentUser;
          localStorage.setItem("requests", JSON.stringify(orders));
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

    // Debounced save with toast
    saveTimeoutRef.current = setTimeout(() => {
      const hasChanges = detailItems.some(
        (item) => item.availablePcs !== undefined,
      );

      if (hasChanges && hasUnsavedChanges) {
        setIsSaving(true);
        savingToastRef.current = toast.loading("Saving changes...");

        savingAnimationTimeoutRef.current = setTimeout(() => {
          const saved = saveChanges();
          if (saved) {
            setIsSaving(false);
            if (savingToastRef.current !== null) {
              toast.dismiss(savingToastRef.current);
              savingToastRef.current = null;
            }
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
  }, [hasUnsavedChanges, detailItems, request.id]);

  useEffect(() => {
    // Sort items on mount using the same logic as order-form
    const sortedItems = [...request.detailItems].sort((a, b) => {
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
  }, [request.id, request.detailItems]);

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

  const getOrderImage = () => {
    if (request.photoId) {
      const storedImage = getImage(request.photoId);
      if (storedImage) return storedImage;
    }
    if (request.kategoriBarang === "basic" && request.namaBasic) {
      return NAMA_BASIC_IMAGES[request.namaBasic] || italySanta;
    }
    return italySanta;
  };

  const getRevWarnaColor = (warna: string): string => {
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

  const getRevWarnaLabel = (warna: string): string => {
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

  const getRevUkuranDisplay = (
    ukuran: string,
  ): { value: string; showUnit: boolean } => {
    const labels: Record<string, string> = {
      a: "Anak",
      n: "Normal",
      p: "Panjang",
      t: "Tanggung",
    };
    const label = labels[ukuran?.toLowerCase()];
    if (label) return { value: label, showUnit: false };
    const num = parseFloat(ukuran);
    if (!isNaN(num)) return { value: ukuran, showUnit: true };
    return { value: ukuran || "-", showUnit: false };
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

    const savedOrders = localStorage.getItem("requests");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Request) => o.id === request.id);
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

        const oldStatus = orders[orderIndex].status;
        orders[orderIndex].status = newStatus;
        orders[orderIndex].detailItems = updatedDetailItems;
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("requests", JSON.stringify(orders));

        // Remove ETA reminder for this request and stockist
        removeETAReminderForStockist(request.id, currentUser);

        // Create notification for status change
        notifyRequestStatusChanged(
          orders[orderIndex],
          oldStatus,
          newStatus,
          currentUser,
          "stockist",
        );
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
    const savedOrders = localStorage.getItem("requests");
    if (savedOrders) {
      const orders = JSON.parse(savedOrders);
      const orderIndex = orders.findIndex((o: Request) => o.id === request.id);
      if (orderIndex !== -1) {
        const oldStatus = orders[orderIndex].status;
        orders[orderIndex].detailItems = updatedItems;
        orders[orderIndex].status = "Ready Stock Marketing";
        orders[orderIndex].updatedDate = Date.now();
        orders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("requests", JSON.stringify(orders));

        // Create notification for status change
        notifyRequestStatusChanged(
          orders[orderIndex],
          oldStatus,
          "Ready Stock Marketing",
          currentUser,
          "stockist",
        );
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
      (item: DetailBarangItem) =>
        !item.availablePcs || item.availablePcs !== item.pcs,
    );

    let newStatus: string;

    if (allMatch) {
      // All available pcs match requested pcs
      newStatus = "Ready Stock Marketing";
    } else if (
      request.customerExpectation === "ready-marketing" &&
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
    request.jenisProduk,
  );
  const productNameLabel =
    request.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, request.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, request.namaProduk);
  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");
  const atasNamaLabel =
    typeof request.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan)
      : request.namaPelanggan?.name ||
        getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan?.id || "");

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
          {mode === "detail"
            ? isJBWaiting
              ? "Order Detail"
              : "Request Detail"
            : "Verify Stock"}
        </h1>
      </div>

      {/* Request Header */}
      <Card className="p-4">
        {/* Product Title and Badge - Full Width */}
        <div className="mb-4">
          <h3 className="font-bold text-lg mb-2">
            {jenisProdukLabel} {productNameLabel}
          </h3>
          <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {request.kategoriBarang === "basic" ? "Basic" : "Model"}
          </span>
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-2 text-sm">
            {currentRequest.requestNo && (
              <div>
                <span className="text-gray-500">Request No: </span>
                <span className="font-medium font-mono">
                  {currentRequest.requestNo}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Created: </span>
              <span className="font-medium">
                {formatTimestamp(currentRequest.timestamp)}
              </span>
            </div>
            {currentRequest.createdBy && (
              <div>
                <span className="text-gray-500">Sales: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentRequest.createdBy)}
                </span>
              </div>
            )}
            {currentRequest.branchCode && (
              <div>
                <span className="text-gray-500">Branch: </span>
                <span className="font-medium">
                  {getBranchName(currentRequest.branchCode)}
                </span>
              </div>
            )}
            {currentRequest.stockistId && (
              <div>
                <span className="text-gray-500">Stockist: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentRequest.stockistId)}
                </span>
              </div>
            )}
            {request.namaPelanggan && (
              <div>
                <span className="text-gray-500">Customer Name: </span>
                <span className="font-medium">{atasNamaLabel}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Supplier: </span>
              <span className="font-medium">{pabrikLabel}</span>
            </div>
            {request.customerExpectation && (
              <div>
                <span className="text-gray-500">Customer Expectation: </span>
                <span className="font-medium">
                  {getLabelFromValue(
                    CUSTOMER_EXPECTATION_OPTIONS,
                    request.customerExpectation,
                  )}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">ETA: </span>
              <span className="font-medium">
                {formatDate(request.waktuKirim) || "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status: </span>
              <span
                className={`inline-block text-xs ${getStatusBadgeClasses(currentRequest.status)} px-2 py-1 rounded-full font-medium`}
              >
                {currentRequest.status}
              </span>
            </div>
            {currentRequest.updatedDate && (
              <div>
                <span className="text-gray-500">Updated: </span>
                <span className="font-medium">
                  {formatTimestampWithTime(currentRequest.updatedDate)}
                </span>
              </div>
            )}
            {currentRequest.updatedBy && (
              <div>
                <span className="text-gray-500">Updated By: </span>
                <span className="font-medium">
                  {getFullNameFromUsername(currentRequest.updatedBy)}
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

      <DetailItemsTable
        items={detailItems}
        mode={mode === "detail" ? "readonly" : "with-available-pcs"}
        isJBWaiting={isJBWaiting}
        onAvailablePcsChange={
          mode === "verify" ? handleAvailablePcsChange : undefined
        }
        getKadarColor={(kadar) =>
          KADAR_COLORS[kadar.toLowerCase()] || "bg-gray-100 text-gray-900"
        }
        getWarnaColor={(warna) =>
          WARNA_COLORS[warna.toLowerCase()] || "bg-gray-100 text-gray-900"
        }
        getUkuranLabel={(ukuran) =>
          getLabelFromValue(UKURAN_KALUNG_OPTIONS, ukuran)
        }
        title="Detail Barang"
      />

      {/* Action Buttons */}
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

      {/* Sales Action Buttons - Only show in detail mode */}
      {mode === "detail" && (onEditRequest || onDuplicateRequest) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          {onEditRequest && currentRequest.status === "Open" && (
            <Button
              variant="outline"
              onClick={onEditRequest}
              className="flex-1 sm:flex-none"
            >
              Edit Request
            </Button>
          )}
          {onDuplicateRequest && (
            <Button
              onClick={onDuplicateRequest}
              className="flex-1 sm:flex-none"
            >
              Duplicate
            </Button>
          )}
        </div>
      )}

      {/* JB Action Buttons - Reject and Write Order */}
      {mode === "detail" && (onReject || onWriteOrder) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 sm:flex-none"
          >
            Back
          </Button>
          {onReject && (
            <Button
              variant="outline"
              onClick={() => {
                setRejectReason("");
                setShowRejectDialog(true);
              }}
              className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              Reject
            </Button>
          )}
          {onWriteOrder && (
            <Button onClick={onWriteOrder} className="flex-1 sm:flex-none">
              Write Order
            </Button>
          )}
        </div>
      )}

      {/* Revision History - visible to all non-supplier users */}
      {currentRequest.revisionHistory &&
        currentRequest.revisionHistory.length > 0 && (
          <Card className="p-4 mb-4">
            <button
              onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
              className="w-full flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Revision History</h3>
              {isRevisionHistoryOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {isRevisionHistoryOpen && (
              <div className="mt-6 relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gray-200" />

                <div className="space-y-0">
                  {/* Initial Version */}
                  {(() => {
                    const isExpanded = expandedRevisions.has(-1);
                    const firstRevision = currentRequest.revisionHistory![0];

                    const initialPabrik =
                      firstRevision?.previousValues.pabrik ??
                      currentRequest.pabrik;
                    const initialPabrikLabel =
                      typeof initialPabrik === "string"
                        ? getLabelFromValue(PABRIK_OPTIONS, initialPabrik)
                        : initialPabrik?.name || "";

                    const initialPelanggan =
                      firstRevision?.previousValues.namaPelanggan ??
                      currentRequest.namaPelanggan;
                    const initialPelangganLabel =
                      typeof initialPelanggan === "string"
                        ? getLabelFromValue(ATAS_NAMA_OPTIONS, initialPelanggan)
                        : initialPelanggan?.name || "";

                    const initialDetailItems =
                      firstRevision?.previousValues.detailItems ??
                      currentRequest.detailItems;

                    return (
                      <div className="flex gap-4 pb-6">
                        <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                          <div className="font-medium text-gray-700">
                            {new Date(
                              currentRequest.timestamp,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            {new Date(
                              currentRequest.timestamp,
                            ).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <div className="relative flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-400 mt-2 z-10" />
                        </div>

                        <div className="flex-1 pb-2">
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
                            className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -ml-2 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                Initial version
                              </p>
                              <p className="text-xs text-gray-500">
                                Created by{" "}
                                {getFullNameFromUsername(
                                  currentRequest.createdBy || "",
                                )}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 border rounded-lg bg-white p-4 text-sm space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Supplier
                                  </p>
                                  <p className="text-gray-900">
                                    {initialPabrikLabel}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Customer
                                  </p>
                                  <p className="text-gray-900">
                                    {initialPelangganLabel}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Product Category
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      [
                                        { value: "basic", label: "Basic" },
                                        { value: "model", label: "Model" },
                                      ],
                                      firstRevision?.previousValues
                                        .kategoriBarang ??
                                        currentRequest.kategoriBarang,
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Product Type
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      JENIS_PRODUK_OPTIONS,
                                      firstRevision?.previousValues
                                        .jenisProduk ??
                                        currentRequest.jenisProduk,
                                    )}
                                  </p>
                                </div>
                                {(firstRevision?.previousValues.namaBasic ??
                                  currentRequest.namaBasic) && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Basic Name
                                    </p>
                                    <p className="text-gray-900">
                                      {getLabelFromValue(
                                        NAMA_BASIC_OPTIONS,
                                        firstRevision?.previousValues
                                          .namaBasic ??
                                          currentRequest.namaBasic,
                                      )}
                                    </p>
                                  </div>
                                )}
                                {(firstRevision?.previousValues.namaProduk ??
                                  currentRequest.namaProduk) && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Nama Produk
                                    </p>
                                    <p className="text-gray-900">
                                      {getLabelFromValue(
                                        NAMA_PRODUK_OPTIONS,
                                        firstRevision?.previousValues
                                          .namaProduk ??
                                          currentRequest.namaProduk,
                                      )}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    ETA
                                  </p>
                                  <p className="text-gray-900">
                                    {(firstRevision?.previousValues
                                      .waktuKirim ?? currentRequest.waktuKirim)
                                      ? new Date(
                                          firstRevision?.previousValues
                                            .waktuKirim ??
                                            currentRequest.waktuKirim,
                                        ).toLocaleDateString("id-ID")
                                      : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 text-xs mb-1">
                                    Customer Expectation
                                  </p>
                                  <p className="text-gray-900">
                                    {getLabelFromValue(
                                      CUSTOMER_EXPECTATION_OPTIONS,
                                      firstRevision?.previousValues
                                        .customerExpectation ??
                                        currentRequest.customerExpectation,
                                    )}
                                  </p>
                                </div>
                              </div>
                              {initialDetailItems &&
                                initialDetailItems.length > 0 && (
                                  <div className="mt-2">
                                    <p className="font-medium text-gray-700 text-xs mb-2">
                                      Detail Barang ({initialDetailItems.length}{" "}
                                      items)
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
                                          {initialDetailItems.map(
                                            (item, idx) => (
                                              <tr key={idx}>
                                                <td className="border px-2 py-1 font-medium">
                                                  {item.kadar}
                                                </td>
                                                <td
                                                  className={`border px-2 py-1 ${getRevWarnaColor(item.warna)}`}
                                                >
                                                  {getRevWarnaLabel(item.warna)}
                                                </td>
                                                <td className="border px-2 py-1">
                                                  {(() => {
                                                    const ud =
                                                      getRevUkuranDisplay(
                                                        item.ukuran,
                                                      );
                                                    return ud.showUnit
                                                      ? `${ud.value} cm`
                                                      : ud.value;
                                                  })()}
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
                              {(() => {
                                const initialPhotoId =
                                  firstRevision?.previousValues.photoId ??
                                  currentRequest.photoId;
                                const initialPhoto = initialPhotoId
                                  ? getImage(initialPhotoId)
                                  : null;
                                if (!initialPhoto) return null;
                                return (
                                  <div className="mt-3">
                                    <p className="font-medium text-gray-700 text-xs mb-2">
                                      Photo
                                    </p>
                                    <img
                                      src={initialPhoto}
                                      alt="Initial version"
                                      className="w-32 h-32 object-cover rounded border"
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Revision entries */}
                  {currentRequest.revisionHistory!.map((revision, index) => {
                    const isExpanded = expandedRevisions.has(index);

                    const revPabrikLabel =
                      typeof revision.changes.pabrik === "string"
                        ? getLabelFromValue(
                            PABRIK_OPTIONS,
                            revision.changes.pabrik,
                          )
                        : revision.changes.pabrik?.name || "";
                    const prevPabrikLabel =
                      typeof revision.previousValues.pabrik === "string"
                        ? getLabelFromValue(
                            PABRIK_OPTIONS,
                            revision.previousValues.pabrik,
                          )
                        : revision.previousValues.pabrik?.name || "";
                    const pabrikChanged =
                      JSON.stringify(revision.changes.pabrik) !==
                      JSON.stringify(revision.previousValues.pabrik);

                    const revPelangganLabel =
                      typeof revision.changes.namaPelanggan === "string"
                        ? getLabelFromValue(
                            ATAS_NAMA_OPTIONS,
                            revision.changes.namaPelanggan,
                          )
                        : revision.changes.namaPelanggan?.name || "";
                    const prevPelangganLabel =
                      typeof revision.previousValues.namaPelanggan === "string"
                        ? getLabelFromValue(
                            ATAS_NAMA_OPTIONS,
                            revision.previousValues.namaPelanggan,
                          )
                        : revision.previousValues.namaPelanggan?.name || "";
                    const pelangganChanged =
                      JSON.stringify(revision.changes.namaPelanggan) !==
                      JSON.stringify(revision.previousValues.namaPelanggan);

                    const etaChanged =
                      revision.changes.waktuKirim &&
                      revision.previousValues.waktuKirim !==
                        revision.changes.waktuKirim;

                    return (
                      <div key={index} className="flex gap-4 pb-6">
                        <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                          <div className="font-medium text-gray-700">
                            {new Date(revision.timestamp).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div>
                            {new Date(revision.timestamp).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>

                        <div className="relative flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-400 mt-2 z-10" />
                        </div>

                        <div className="flex-1 pb-2">
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
                            className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -ml-2 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                Revision #{revision.revisionNumber}
                                {index ===
                                  currentRequest.revisionHistory!.length -
                                    1 && (
                                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                    Latest
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Updated by{" "}
                                {getFullNameFromUsername(revision.updatedBy)}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 border rounded-lg bg-gray-50 p-4 text-sm space-y-3">
                              {etaChanged && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    ETA Change
                                  </p>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-red-600 line-through">
                                      {revision.previousValues.waktuKirim
                                        ? new Date(
                                            revision.previousValues.waktuKirim,
                                          ).toLocaleDateString("id-ID")
                                        : "—"}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-green-700 font-semibold">
                                      {new Date(
                                        revision.changes.waktuKirim!,
                                      ).toLocaleDateString("id-ID")}
                                    </span>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                {pabrikChanged && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Supplier
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-500 line-through text-xs">
                                        {prevPabrikLabel}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-700 font-semibold">
                                        {revPabrikLabel}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {pelangganChanged && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Customer
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-500 line-through text-xs">
                                        {prevPelangganLabel}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-700 font-semibold">
                                        {revPelangganLabel}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {revision.changes.kategoriBarang &&
                                  revision.changes.kategoriBarang !==
                                    revision.previousValues.kategoriBarang && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Product Category
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 line-through text-xs">
                                          {getLabelFromValue(
                                            [
                                              {
                                                value: "basic",
                                                label: "Basic",
                                              },
                                              {
                                                value: "model",
                                                label: "Model",
                                              },
                                            ],
                                            revision.previousValues
                                              .kategoriBarang || "",
                                          )}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {getLabelFromValue(
                                            [
                                              {
                                                value: "basic",
                                                label: "Basic",
                                              },
                                              {
                                                value: "model",
                                                label: "Model",
                                              },
                                            ],
                                            revision.changes.kategoriBarang,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                {revision.changes.jenisProduk &&
                                  revision.changes.jenisProduk !==
                                    revision.previousValues.jenisProduk && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Product Type
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 line-through text-xs">
                                          {getLabelFromValue(
                                            JENIS_PRODUK_OPTIONS,
                                            revision.previousValues
                                              .jenisProduk || "",
                                          )}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {getLabelFromValue(
                                            JENIS_PRODUK_OPTIONS,
                                            revision.changes.jenisProduk,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                {revision.changes.namaBasic &&
                                  revision.changes.namaBasic !==
                                    revision.previousValues.namaBasic && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Basic Name
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 line-through text-xs">
                                          {getLabelFromValue(
                                            NAMA_BASIC_OPTIONS,
                                            revision.previousValues.namaBasic ||
                                              "",
                                          )}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {getLabelFromValue(
                                            NAMA_BASIC_OPTIONS,
                                            revision.changes.namaBasic,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                {revision.changes.namaProduk &&
                                  revision.changes.namaProduk !==
                                    revision.previousValues.namaProduk && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Nama Produk
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 line-through text-xs">
                                          {getLabelFromValue(
                                            NAMA_PRODUK_OPTIONS,
                                            revision.previousValues
                                              .namaProduk || "",
                                          )}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {getLabelFromValue(
                                            NAMA_PRODUK_OPTIONS,
                                            revision.changes.namaProduk,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                {revision.changes.customerExpectation &&
                                  revision.changes.customerExpectation !==
                                    revision.previousValues
                                      .customerExpectation && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Customer Expectation
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="text-red-500 line-through text-xs">
                                          {getLabelFromValue(
                                            CUSTOMER_EXPECTATION_OPTIONS,
                                            revision.previousValues
                                              .customerExpectation || "",
                                          )}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {getLabelFromValue(
                                            CUSTOMER_EXPECTATION_OPTIONS,
                                            revision.changes
                                              .customerExpectation,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                              </div>
                              {revision.changes.detailItems &&
                                revision.changes.detailItems.length > 0 && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-2">
                                      Detail Barang (
                                      {revision.changes.detailItems.length}{" "}
                                      items)
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
                                            (item, idx) => {
                                              const prevItem =
                                                revision.previousValues
                                                  .detailItems?.[idx];
                                              const isNewItem =
                                                !revision.previousValues
                                                  .detailItems ||
                                                idx >=
                                                  revision.previousValues
                                                    .detailItems.length;
                                              const kadarChanged =
                                                prevItem &&
                                                item.kadar !== prevItem.kadar;
                                              const warnaChanged =
                                                prevItem &&
                                                item.warna !== prevItem.warna;
                                              const ukuranChanged =
                                                prevItem &&
                                                item.ukuran !== prevItem.ukuran;
                                              const beratChanged =
                                                prevItem &&
                                                item.berat !== prevItem.berat;
                                              const pcsChanged =
                                                prevItem &&
                                                item.pcs !== prevItem.pcs;
                                              return (
                                                <tr
                                                  key={idx}
                                                  className={
                                                    isNewItem
                                                      ? "border-4 border-green-500"
                                                      : ""
                                                  }
                                                >
                                                  <td
                                                    className={`px-2 py-1 font-medium ${kadarChanged && !isNewItem ? "border-4 border-orange-400" : "border"}`}
                                                  >
                                                    {item.kadar}
                                                  </td>
                                                  <td
                                                    className={`px-2 py-1 ${getRevWarnaColor(item.warna)} ${warnaChanged && !isNewItem ? "border-4 border-orange-400" : "border"}`}
                                                  >
                                                    {getRevWarnaLabel(
                                                      item.warna,
                                                    )}
                                                  </td>
                                                  <td
                                                    className={`px-2 py-1 ${ukuranChanged && !isNewItem ? "border-4 border-orange-400" : "border"}`}
                                                  >
                                                    {(() => {
                                                      const ud =
                                                        getRevUkuranDisplay(
                                                          item.ukuran,
                                                        );
                                                      return ud.showUnit
                                                        ? `${ud.value} cm`
                                                        : ud.value;
                                                    })()}
                                                  </td>
                                                  <td
                                                    className={`px-2 py-1 text-right ${beratChanged && !isNewItem ? "border-4 border-orange-400" : "border"}`}
                                                  >
                                                    {item.berat}
                                                  </td>
                                                  <td
                                                    className={`px-2 py-1 text-right ${pcsChanged && !isNewItem ? "border-4 border-orange-400" : "border"}`}
                                                  >
                                                    {item.pcs}
                                                  </td>
                                                </tr>
                                              );
                                            },
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              {(revision.previousValues.photoId ||
                                revision.changes.photoId) &&
                                (() => {
                                  const beforeImg = revision.previousValues
                                    .photoId
                                    ? getImage(revision.previousValues.photoId)
                                    : null;
                                  const afterImg = revision.changes.photoId
                                    ? getImage(revision.changes.photoId)
                                    : null;
                                  const photoChanged =
                                    revision.previousValues.photoId !==
                                    revision.changes.photoId;
                                  if (!beforeImg && !afterImg) return null;
                                  if (photoChanged && beforeImg && afterImg) {
                                    return (
                                      <div className="flex gap-3 flex-wrap mt-3">
                                        <div className="w-32">
                                          <p className="font-medium text-gray-500 text-xs mb-1">
                                            Photo — Before
                                          </p>
                                          <img
                                            src={beforeImg}
                                            alt="Before"
                                            className="w-full h-32 object-cover rounded border border-red-200"
                                          />
                                        </div>
                                        <div className="w-32">
                                          <p className="font-medium text-green-700 text-xs mb-1">
                                            Photo — After
                                          </p>
                                          <img
                                            src={afterImg}
                                            alt="After"
                                            className="w-full h-32 object-cover rounded border border-green-400"
                                          />
                                        </div>
                                      </div>
                                    );
                                  }
                                  const singleImg = afterImg || beforeImg;
                                  return singleImg ? (
                                    <div className="mt-3">
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Photo
                                      </p>
                                      <img
                                        src={singleImg}
                                        alt="Product"
                                        className="w-32 h-32 object-cover rounded border"
                                      />
                                    </div>
                                  ) : null;
                                })()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gray-600 resize-none"
              placeholder="Reason of Rejection (required)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!rejectReason.trim()}
              onClick={() => {
                if (rejectReason.trim()) {
                  onReject!(rejectReason.trim());
                  setShowRejectDialog(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ready Stock Confirmation Dialog */}
      <AlertDialog
        open={showReadyStockDialog}
        onOpenChange={setShowReadyStockDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Ready Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure all items are available in stock? This will fill all
              "Available Pcs" according to "Requested Pcs" and change status to
              "Ready Stock Marketing".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReadyStock}>
              Yes, Ready Stock
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
            <AlertDialogTitle>Confirm Submit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this request to JB (Jewelry Buyer)?
              Status will change to "Requested to JB".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendToJB}>
              Yes, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
