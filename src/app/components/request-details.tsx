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
import { useImageMap } from "@/app/utils/image-storage";
import {
  notifyRequestStatusChanged,
  removeETAReminderForStockist,
} from "@/app/utils/notification-helper";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
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
import { ProductHeader } from "./ui/product-header";
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
import { RevisionHistoryPanel } from "./ui/revision-history-panel";

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
  const userRole = (sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole") ||
    "sales") as "sales" | "stockist" | "jb" | "supplier";
  const [detailItems, setDetailItems] = useState<DetailBarangItem[]>([]);
  const [showReadyStockDialog, setShowReadyStockDialog] = useState(false);
  const [showSendToJBDialog, setShowSendToJBDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [wasUpdated, setWasUpdated] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Request>(request);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  const allRevisionPhotoIds = (currentRequest.revisionHistory || []).flatMap(
    (r: any) => [r.previousValues?.photoId, r.changes?.photoId],
  );
  const imageMap = useImageMap([
    currentRequest.photoId,
    ...allRevisionPhotoIds,
  ]);

  const getOrderImage = () => {
    if (request.photoId) {
      const storedImage = imageMap.get(request.photoId);
      if (storedImage) return storedImage;
    }
    if (request.kategoriBarang === "basic" && request.namaBasic) {
      return NAMA_BASIC_IMAGES[request.namaBasic] || italySanta;
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
    <div className="min-h-screen pb-20 md:pb-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white -mx-4 px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
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
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold">
              {mode === "detail"
                ? isJBWaiting
                  ? "Order Detail"
                  : "Request Detail"
                : "Verify Stock"}
            </h1>
            {currentRequest.requestNo && (
              <p className="text-sm text-gray-600 font-mono font-semibold truncate">
                {currentRequest.requestNo}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${getStatusBadgeClasses(currentRequest.status)}`}
          >
            {currentRequest.status}
          </span>
        </div>
      </div>

      {/* Request Header */}
      <Card className="p-4 mb-4">
        <ProductHeader
          imageSrc={getOrderImage()}
          imageAlt={productNameLabel}
          title={`${jenisProdukLabel} ${productNameLabel}`}
          visibleAttributes={[
            "poNumber",
            "branch",
            "stockist",
            "customerName",
            "supplier",
            "customerExpectation",
            "eta",
            "status",
            "created",
            "sales",
            "updated",
            "updatedBy",
          ]}
          status={currentRequest.status}
          poNumber={currentRequest.requestNo}
          salesUsername={currentRequest.createdBy}
          branchCode={currentRequest.branchCode}
          stockistUsername={currentRequest.stockistId}
          customerName={request.namaPelanggan ? atasNamaLabel : undefined}
          supplier={pabrikLabel}
          customerExpectation={
            request.customerExpectation
              ? getLabelFromValue(CUSTOMER_EXPECTATION_OPTIONS, request.customerExpectation)
              : undefined
          }
          eta={request.waktuKirim}
          created={currentRequest.timestamp}
          updated={currentRequest.updatedDate}
          updatedByUsername={currentRequest.updatedBy}
        />
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

      {/* Revision History - always visible for non-supplier users */}
      {userRole !== "supplier" && (
        <RevisionHistoryPanel
          title="Request Revision History"
          createdTimestamp={currentRequest.timestamp}
          createdBy={currentRequest.createdBy || ""}
          revisions={currentRequest.revisionHistory || []}
          entitySnapshot={{
            pabrik: currentRequest.pabrik,
            namaPelanggan: currentRequest.namaPelanggan,
            kategoriBarang: currentRequest.kategoriBarang,
            jenisProduk: currentRequest.jenisProduk,
            namaProduk: currentRequest.namaProduk,
            namaBasic: currentRequest.namaBasic,
            waktuKirim: currentRequest.waktuKirim,
            customerExpectation: currentRequest.customerExpectation,
            detailItems: currentRequest.detailItems,
            photoId: currentRequest.photoId,
          }}
        />
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
