import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order, OrderArrival, OrderShipping, OrderShippingEditHistory } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { useImageMap } from "@/app/utils/image-storage";
import { notifyOrderStatusChanged } from "@/app/utils/notification-helper";
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
import { ArrowLeft, ArrowRight, CheckCheck, CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { DetailItemsTable } from "./ui/detail-items-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RevisionHistoryPanel } from "./ui/revision-history-panel";
import { Textarea } from "./ui/textarea";

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
  reviewMode?: boolean;
  onApproveRevision?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onUpdateOrder?: (order: Order) => void;
}

export function OrderDetails({
  order,
  onBack,
  reviewMode = false,
  onApproveRevision,
  onCancelOrder,
  onUpdateOrder,
}: OrderDetailsProps) {
  const [relatedRequest, setRelatedRequest] = useState<Request | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  useEffect(() => {
    if (order) setCurrentOrder(order);
  }, [order]);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [shippingPcs, setShippingPcs] = useState<Record<string, string>>({});
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);
  const [editingShipmentPcs, setEditingShipmentPcs] = useState<Record<number, string>>({});
  // JB: received pcs per shipment entry – key: `${shipmentId}-${itemIdx}`
  const [receivedPcs, setReceivedPcs] = useState<Record<string, string>>({});
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
          userRole,
        );

        setCurrentOrder(allOrders[orderIndex]);
      }
    }
  };

  const handleUpdateStatusWithToast = (
    orderId: string,
    newStatus: string,
    toastMessage: string,
  ) => {
    handleUpdateStatus(orderId, newStatus);
    toast.success(toastMessage);
    // Redirect back to previous page after a short delay
    setTimeout(() => {
      onBack();
    }, 500);
  };

  const handleApproveSupplierRevision = () => {
    const savedOrders = localStorage.getItem("orders");
    if (!savedOrders) return;
    const allOrders: Order[] = JSON.parse(savedOrders);
    const idx = allOrders.findIndex((o) => o.id === currentOrder.id);
    if (idx === -1) return;

    // Mark approval for the current user's role
    if (userRole === "jb") {
      allOrders[idx].jbApproved = true;
    } else if (userRole === "sales") {
      allOrders[idx].salesApproved = true;
    }

    // Only move to Order Revised when both have approved
    if (allOrders[idx].jbApproved && allOrders[idx].salesApproved) {
      allOrders[idx].status = "Order Revised";
      allOrders[idx].updatedDate = Date.now();
      allOrders[idx].updatedBy = currentUser;
      localStorage.setItem("orders", JSON.stringify(allOrders));
      setCurrentOrder(allOrders[idx]);
      toast.success(
        "Both parties approved. Order is now ready for production.",
      );
    } else {
      allOrders[idx].updatedDate = Date.now();
      allOrders[idx].updatedBy = currentUser;
      localStorage.setItem("orders", JSON.stringify(allOrders));
      setCurrentOrder({ ...allOrders[idx] });
      const waitingFor = userRole === "jb" ? "Sales" : "JB";
      toast.success(
        `Approved. Waiting for ${waitingFor} to also approve before the order is confirmed.`,
      );
    }
  };

  const handleRejectSupplierRevision = () => {
    const savedOrders = localStorage.getItem("orders");
    if (!savedOrders) return;
    const allOrders: Order[] = JSON.parse(savedOrders);
    const idx = allOrders.findIndex((o) => o.id === currentOrder.id);
    if (idx === -1) return;
    const existing = allOrders[idx];
    const revisions = existing.revisionHistory || [];
    const lastRevision = revisions[revisions.length - 1];
    if (lastRevision) {
      // Revert the order to the previous values before the supplier's proposed change
      allOrders[idx] = {
        ...existing,
        detailItems:
          lastRevision.previousValues.detailItems || existing.detailItems,
        waktuKirim:
          lastRevision.previousValues.waktuKirim || existing.waktuKirim,
        kategoriBarang:
          lastRevision.previousValues.kategoriBarang || existing.kategoriBarang,
        jenisProduk:
          lastRevision.previousValues.jenisProduk || existing.jenisProduk,
        namaProduk:
          lastRevision.previousValues.namaProduk || existing.namaProduk,
        namaBasic: lastRevision.previousValues.namaBasic || existing.namaBasic,
        photoId: lastRevision.previousValues.photoId || existing.photoId,
        revisionHistory: revisions.slice(0, -1),
        status: "Viewed",
        updatedDate: Date.now(),
        updatedBy: currentUser,
      };
    } else {
      allOrders[idx].status = "Viewed";
    }
    localStorage.setItem("orders", JSON.stringify(allOrders));
    setCurrentOrder(allOrders[idx]);
    toast.success(
      "Supplier revision rejected. Order reverted to original values.",
    );
    setTimeout(() => onBack(), 500);
  };

  const handleSubmitShipping = () => {
    const items = currentOrder.detailItems
      .map((item) => ({
        kadar: item.kadar,
        warna: item.warna,
        ukuran: item.ukuran,
        berat: item.berat,
        pcs: parseInt(shippingPcs[item.id] || "0") || 0,
      }))
      .filter((item) => item.pcs > 0);

    if (items.length === 0) {
      toast.error("Please enter at least one item quantity to ship");
      return;
    }

    const shipping: OrderShipping = {
      id: `shipping-${Date.now()}`,
      orderId: currentOrder.id,
      orderPONumber: currentOrder.PONumber,
      shippingDate: new Date().toISOString().split("T")[0],
      createdDate: Date.now(),
      createdBy: currentUser,
      items,
    };

    const existing: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    existing.push(shipping);
    localStorage.setItem("orderShippings", JSON.stringify(existing));

    // Update only the updatedDate — do NOT change the order status
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      const idx = allOrders.findIndex((o) => o.id === currentOrder.id);
      if (idx !== -1) {
        allOrders[idx].updatedDate = Date.now();
        allOrders[idx].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));
        setCurrentOrder(allOrders[idx]);
      }
    }

    setShippingPcs({});
    toast.success("Shipment entry saved successfully");
  };

  useEffect(() => {
    // Load the related request from localStorage
    if (order?.requestId) {
      const savedRequests = localStorage.getItem("requests");
      if (savedRequests) {
        const requests: Request[] = JSON.parse(savedRequests);
        const request = requests.find((r) => r.id === order.requestId);
        if (request) {
          setRelatedRequest(request);
        }
      }
    }
  }, [order]);

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

  const allRevisionPhotoIds = (currentOrder.revisionHistory || []).flatMap(
    (r) => [r.previousValues.photoId, r.changes.photoId],
  );
  const imageMap = useImageMap([currentOrder.photoId, ...allRevisionPhotoIds]);

  const getOrderImage = () => {
    // First, check if there's a photoId and retrieve image from storage
    if (currentOrder.photoId) {
      const storedImage = imageMap.get(currentOrder.photoId);
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

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

  const pabrikLabel = order.pabrik?.name || "Unknown Supplier";

  const getKadarColor = (_kadar: string) => "";

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

  const getUkuranDisplay = (
    ukuran: string,
  ): { value: string; showUnit: boolean } => {
    const labels: Record<string, string> = {
      a: "Anak",
      n: "Normal",
      p: "Panjang",
      t: "Tanggung",
    };

    // Check if it's a predefined value
    const label = labels[ukuran.toLowerCase()];
    if (label) {
      return { value: label, showUnit: false };
    }

    // Otherwise it's a numeric value (cm)
    return { value: ukuran, showUnit: true };
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
          <h1 className="text-xl font-bold">
            {reviewMode ? "Review Order Revision" : "Order Details"}
          </h1>
          <p className="text-sm text-gray-600 font-mono font-semibold">
            {order.PONumber}
          </p>
        </div>
        {/* <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClasses(currentOrder.status)}`}
        >
          {currentOrder.status}
        </span> */}
      </div>

      {/* Combined Order Details Card */}
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
            <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-sm text-gray-700 mb-2 sm:mb-3">
              {userRole !== "supplier" && (
                <div className="grid grid-cols-5 gap-x-3">
                  <span className="text-gray-600 justify-self-start pr-1">
                    Created By:
                  </span>
                  <span className="font-bold">
                    {getFullNameFromUsername(order.jbId)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-600 pr-1">PO Number:</span>
                <span className="font-mono font-semibold text-blue-700">
                  {order.PONumber}
                </span>
              </div>
              {userRole !== "supplier" && (
                <div className="grid grid-cols-5 gap-x-3">
                  <span className="text-gray-600 pr-1">Request No:</span>
                  {order.requestNo ? (
                    <button
                      onClick={() => setShowRequestDialog(true)}
                      className="font-mono text-blue-600 underline hover:text-blue-800 text-left"
                    >
                      {order.requestNo}
                    </button>
                  ) : (
                    <span className="font-mono">-</span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-600 pr-1">Created:</span>
                <span>{formatTimestamp(order.createdDate)}</span>
              </div>
              {order.branchCode && (
                <div className="grid grid-cols-5 gap-x-3">
                  <span className="text-gray-600 pr-1">Branch:</span>
                  <span className="font-medium">
                    {getBranchName(order.branchCode)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-600 pr-1">Supplier:</span>
                <span className="font-medium">{pabrikLabel}</span>
              </div>
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-600 pr-1">ETA:</span>
                <span>{formatDate(order.waktuKirim)}</span>
              </div>
              <div className="grid grid-cols-5 gap-x-3 items-center">
                <span className="text-gray-600 pr-1">Status:</span>
                <span
                  className={`inline-block text-xs ${getStatusBadgeClasses(currentOrder.status)} px-2 py-1 rounded-full font-medium w-fit`}
                >
                  {currentOrder.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Supplier Revision Review - shown for Sales/JB when supplier has proposed changes */}
      {(userRole === "sales" || userRole === "jb") &&
        currentOrder.status === "Change Pending Approval" &&
        currentOrder.revisionHistory &&
        currentOrder.revisionHistory.length > 0 &&
        (() => {
          const lastRevision =
            currentOrder.revisionHistory[
              currentOrder.revisionHistory.length - 1
            ];
          const etaChanged =
            lastRevision.previousValues.waktuKirim !== currentOrder.waktuKirim;

          return (
            <Card className="p-4 mb-4 border-orange-300 bg-orange-50">
              <h3 className="font-semibold text-lg mb-1 text-orange-900">
                Supplier Proposed Changes
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Proposed by{" "}
                <span className="font-medium">
                  {getFullNameFromUsername(lastRevision.updatedBy)}
                </span>{" "}
                on {new Date(lastRevision.timestamp).toLocaleString("id-ID")}
              </p>

              {/* Approval status badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-semibold text-gray-600">
                  Approvals needed:
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    currentOrder.salesApproved
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}
                >
                  {currentOrder.salesApproved ? "✓" : "○"} Sales
                  {currentOrder.salesApproved && currentOrder.sales && (
                    <span className="ml-1 font-normal">
                      ({getFullNameFromUsername(currentOrder.sales)})
                    </span>
                  )}
                  {!currentOrder.salesApproved && (
                    <span className="ml-1 font-normal text-gray-400">
                      — pending
                    </span>
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    currentOrder.jbApproved
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}
                >
                  {currentOrder.jbApproved ? "✓" : "○"} JB
                  {currentOrder.jbApproved && currentOrder.jbId && (
                    <span className="ml-1 font-normal">
                      ({getFullNameFromUsername(currentOrder.jbId)})
                    </span>
                  )}
                  {!currentOrder.jbApproved && (
                    <span className="ml-1 font-normal text-gray-400">
                      — pending
                    </span>
                  )}
                </span>
              </div>

              {etaChanged && (
                <div className="bg-white p-3 rounded border border-orange-200 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Proposed ETA Change:
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-600 line-through">
                      {lastRevision.previousValues.waktuKirim
                        ? new Date(
                            lastRevision.previousValues.waktuKirim,
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-600 font-semibold">
                      {currentOrder.waktuKirim
                        ? new Date(currentOrder.waktuKirim).toLocaleDateString(
                            "id-ID",
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              )}

              {lastRevision.revisionNotes && (
                <div className="bg-white p-3 rounded border border-orange-200 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Supplier Notes:
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {lastRevision.revisionNotes}
                  </p>
                </div>
              )}

              {/* Photo before/after in comparison panel */}
              {(lastRevision.previousValues.photoId ||
                lastRevision.changes.photoId) &&
                (() => {
                  const beforeImg = lastRevision.previousValues.photoId
                    ? (imageMap.get(lastRevision.previousValues.photoId) ??
                      null)
                    : null;
                  const afterImg = lastRevision.changes.photoId
                    ? (imageMap.get(lastRevision.changes.photoId) ?? null)
                    : null;
                  const photoChanged =
                    lastRevision.previousValues.photoId !==
                    lastRevision.changes.photoId;
                  if (!beforeImg && !afterImg) return null;
                  return (
                    <div className="bg-white p-3 rounded border border-orange-200 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Product Photo:
                      </p>
                      {photoChanged && beforeImg && afterImg ? (
                        <div className="flex gap-4 flex-wrap">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Before</p>
                            <img
                              src={beforeImg}
                              alt="Before"
                              className="w-36 h-36 object-cover rounded border border-red-200"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-green-700 font-medium mb-1">
                              After (proposed)
                            </p>
                            <img
                              src={afterImg}
                              alt="After"
                              className="w-36 h-36 object-cover rounded border border-green-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={afterImg || beforeImg || ""}
                          alt="Product"
                          className="w-36 h-36 object-cover rounded border"
                        />
                      )}
                    </div>
                  );
                })()}

              {lastRevision.previousValues.detailItems &&
                (() => {
                  const origItems = lastRevision.previousValues.detailItems!;
                  const propItems = currentOrder.detailItems;
                  const maxLen = Math.max(origItems.length, propItems.length);
                  const diffCell = "bg-amber-200";
                  const getChanged = (
                    oi: (typeof origItems)[0] | undefined,
                    pi: (typeof propItems)[0] | undefined,
                  ) =>
                    !oi || !pi
                      ? {}
                      : {
                          kadar: oi.kadar !== pi.kadar,
                          warna: oi.warna !== pi.warna,
                          ukuran: oi.ukuran !== pi.ukuran,
                          berat: (oi.berat || "") !== (pi.berat || ""),
                          pcs: oi.pcs !== pi.pcs,
                        };
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Original Items:
                        </p>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full border-collapse border text-xs">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="border p-1">#</th>
                                <th className="border p-1">Kadar</th>
                                <th className="border p-1">Warna</th>
                                <th className="border p-1">Ukuran</th>
                                <th className="border p-1">Berat</th>
                                <th className="border p-1">Pcs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: maxLen }, (_, idx) => {
                                const item = origItems[idx];
                                if (!item) return null;
                                const propItem = propItems[idx];
                                const changed = getChanged(item, propItem);
                                const rowBg = propItem ? "" : "bg-red-100";
                                const ud = getUkuranDisplay(item.ukuran);
                                return (
                                  <tr key={idx} className={rowBg}>
                                    <td className="border p-1 text-center">
                                      {idx + 1}
                                    </td>
                                    <td
                                      className={`border p-1 font-medium ${changed.kadar ? diffCell : ""}`}
                                    >
                                      {item.kadar.toUpperCase()}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.warna ? diffCell : getWarnaColor(item.warna)}`}
                                    >
                                      {getWarnaLabel(item.warna)}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.ukuran ? diffCell : ""}`}
                                    >
                                      {ud.showUnit
                                        ? `${ud.value} cm`
                                        : ud.value}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.berat ? diffCell : ""}`}
                                    >
                                      {item.berat || "-"}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.pcs ? diffCell : ""}`}
                                    >
                                      {item.pcs}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          Proposed Items:
                        </p>
                        <div className="overflow-auto max-h-[200px]">
                          <table className="w-full border-collapse border text-xs">
                            <thead className="bg-green-50 sticky top-0">
                              <tr>
                                <th className="border p-1">#</th>
                                <th className="border p-1">Kadar</th>
                                <th className="border p-1">Warna</th>
                                <th className="border p-1">Ukuran</th>
                                <th className="border p-1">Berat</th>
                                <th className="border p-1">Pcs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: maxLen }, (_, idx) => {
                                const item = propItems[idx];
                                if (!item) return null;
                                const origItem = origItems[idx];
                                const changed = getChanged(origItem, item);
                                const rowBg = origItem ? "" : "bg-green-100";
                                const ud = getUkuranDisplay(item.ukuran);
                                return (
                                  <tr key={idx} className={rowBg}>
                                    <td className="border p-1 text-center">
                                      {idx + 1}
                                    </td>
                                    <td
                                      className={`border p-1 font-medium ${changed.kadar ? diffCell : ""}`}
                                    >
                                      {item.kadar.toUpperCase()}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.warna ? diffCell : getWarnaColor(item.warna)}`}
                                    >
                                      {getWarnaLabel(item.warna)}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.ukuran ? diffCell : ""}`}
                                    >
                                      {ud.showUnit
                                        ? `${ud.value} cm`
                                        : ud.value}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.berat ? diffCell : ""}`}
                                    >
                                      {item.berat || "-"}
                                    </td>
                                    <td
                                      className={`border p-1 ${changed.pcs ? diffCell : ""}`}
                                    >
                                      {item.pcs}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <div className="flex gap-3 justify-end">
                {/* Only show Reject if user hasn't approved */}
                {!(userRole === "jb" && currentOrder.jbApproved) &&
                  !(userRole === "sales" && currentOrder.salesApproved) && (
                    <Button
                      variant="outline"
                      onClick={handleRejectSupplierRevision}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Reject Revision
                    </Button>
                  )}
                {/* Only show Approve if current user hasn't already approved */}
                {!(userRole === "jb" && currentOrder.jbApproved) &&
                  !(userRole === "sales" && currentOrder.salesApproved) && (
                    <Button
                      onClick={handleApproveSupplierRevision}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                  )}
                {/* Show waiting message if already approved */}
                {((userRole === "jb" && currentOrder.jbApproved) ||
                  (userRole === "sales" && currentOrder.salesApproved)) && (
                  <span className="text-sm text-green-700 font-medium self-center">
                    ✓ You have approved. Waiting for{" "}
                    {userRole === "jb" ? "Sales" : "JB"} to approve.
                  </span>
                )}
              </div>
            </Card>
          );
        })()}

      {/* Order Items Card */}
      {currentOrder.status !== "Change Pending Approval" && (() => {
        const isSupplierShippingView =
          userRole === "supplier" &&
          (currentOrder.status === "In Production" ||
            currentOrder.status === "Stock Ready");

        if (!isSupplierShippingView) {
          return (
            <DetailItemsTable
              items={order.detailItems}
              mode="readonly"
              getKadarColor={getKadarColor}
              getWarnaColor={getWarnaColor}
              getWarnaLabel={getWarnaLabel}
              getUkuranLabel={(ukuran) => {
                const display = getUkuranDisplay(ukuran);
                return display.showUnit ? `${display.value} cm` : display.value;
              }}
              title="Order Items"
            />
          );
        }

        // Compute shipped qty per item key for inline shipment UI
        const shippingRecords: OrderShipping[] = JSON.parse(
          localStorage.getItem("orderShippings") || "[]"
        ).filter((s: OrderShipping) => s.orderId === currentOrder.id);
        const shippedMap: Record<string, number> = {};
        shippingRecords.forEach((s) =>
          s.items.forEach((it) => {
            const key = `${it.kadar}-${it.warna}-${it.ukuran}`;
            shippedMap[key] = (shippedMap[key] || 0) + it.pcs;
          })
        );

        // Compute received qty per item key from JB arrivals
        const arrivalRecords: OrderArrival[] = JSON.parse(
          localStorage.getItem("orderArrivals") || "[]"
        ).filter((a: OrderArrival) => a.orderId === currentOrder.id);
        const receivedMap: Record<string, number> = {};
        arrivalRecords.forEach((a) =>
          a.items.forEach((it) => {
            const key = `${it.karat}-${it.warna}-${it.size}`;
            receivedMap[key] = (receivedMap[key] || 0) + it.pcs;
          })
        );

        return (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Order Items &amp; Shipment Entry</h3>
              <Button
                size="sm"
                onClick={handleSubmitShipping}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit Shipment
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Kadar</th>
                    <th className="px-3 py-2 text-left">Warna</th>
                    <th className="px-3 py-2 text-left">Ukuran</th>
                    <th className="px-3 py-2 text-left">Berat</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Shipped</th>
                    <th className="px-3 py-2 text-right">Received</th>
                    <th className="px-3 py-2 text-right">Shipment Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.detailItems.map((item) => {
                    const ukuranDisplay = getUkuranDisplay(item.ukuran);
                    const key = `${item.kadar}-${item.warna}-${item.ukuran}`;
                    const shipped = shippedMap[key] || 0;
                    const received = receivedMap[key] || 0;
                    const remaining = Math.max(0, item.pcs - shipped);
                    return (
                      <tr key={item.id} className="border-t">
                        <td className={`px-3 py-2 font-medium ${getKadarColor(item.kadar)}`}>
                          {item.kadar.toUpperCase()}
                        </td>
                        <td className={`px-3 py-2 ${getWarnaColor(item.warna)}`}>
                          {getWarnaLabel(item.warna)}
                        </td>
                        <td className="px-3 py-2">
                          {ukuranDisplay.showUnit ? `${ukuranDisplay.value} cm` : ukuranDisplay.value}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.berat || "-"}</td>
                        <td className="px-3 py-2 text-right">{item.pcs}</td>
                        <td className="px-3 py-2 text-right text-blue-700 font-medium">{shipped}</td>
                        <td className="px-3 py-2 text-right text-green-700 font-medium">{received}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              min="0"
                              value={shippingPcs[item.id] || ""}
                              onChange={(e) =>
                                setShippingPcs((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-20 text-right"
                              placeholder="0"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              title={`Auto-fill remaining (${remaining})`}
                              onClick={() =>
                                setShippingPcs((prev) => ({ ...prev, [item.id]: String(remaining) }))
                              }
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {/* Shipment History Panel - visible to all roles when shipments exist */}
      {(() => {
        const CLOSED_STATUSES = ["Unable to Fulfill", "Completed", "Confirmed by JB", "Cancelled"];
        const isClosed = CLOSED_STATUSES.includes(currentOrder.status);
        const canSupplierEdit = userRole === "supplier" && !isClosed;
        const isJB = userRole === "jb";

        const allShipments: OrderShipping[] = JSON.parse(
          localStorage.getItem("orderShippings") || "[]"
        ).filter((s: OrderShipping) => s.orderId === currentOrder.id);
        if (allShipments.length === 0) return null;

        // Load already-recorded arrivals to show previously received totals
        const allArrivals: OrderArrival[] = JSON.parse(
          localStorage.getItem("orderArrivals") || "[]"
        ).filter((a: OrderArrival) => a.orderId === currentOrder.id);

        // Compute total already-received per shipment entry
        const receivedPerShipmentItem = (shipmentId: string, itemIdx: number, kadar: string, warna: string, ukuran: string) => {
          // Arrivals that reference this shipment entry by matching item attrs
          return allArrivals.reduce((sum, a) => {
            a.items.forEach((ai) => {
              if (ai.karat === kadar && ai.warna === warna && ai.size === ukuran) sum += ai.pcs;
            });
            return sum;
          }, 0);
        };

        // ---- Supplier edit handlers ----
        const handleStartEdit = (s: OrderShipping) => {
          const initialPcs: Record<number, string> = {};
          s.items.forEach((it, idx) => { initialPcs[idx] = String(it.pcs); });
          setEditingShipmentPcs(initialPcs);
          setEditingShipmentId(s.id);
        };

        const handleSaveEdit = (s: OrderShipping) => {
          const updatedItems = s.items.map((it, idx) => ({
            ...it,
            pcs: Number(editingShipmentPcs[idx] ?? it.pcs),
          }));
          const historyEntry: OrderShippingEditHistory = {
            editedAt: Date.now(),
            editedBy: currentUser,
            previousItems: s.items,
            newItems: updatedItems,
          };
          const allShippingsRaw: OrderShipping[] = JSON.parse(
            localStorage.getItem("orderShippings") || "[]"
          );
          const updated = allShippingsRaw.map((entry) =>
            entry.id === s.id
              ? { ...entry, items: updatedItems, editHistory: [...(entry.editHistory || []), historyEntry] }
              : entry
          );
          localStorage.setItem("orderShippings", JSON.stringify(updated));
          setEditingShipmentId(null);
          toast.success("Shipment entry updated.");
        };

        // ---- JB arrival handlers ----
        const handleMatchRow = (shipmentId: string, idx: number, shippedPcs: number) => {
          setReceivedPcs((prev) => ({ ...prev, [`${shipmentId}-${idx}`]: String(shippedPcs) }));
        };

        const handleMatchAll = (s: OrderShipping) => {
          const updates: Record<string, string> = {};
          s.items.forEach((it, idx) => {
            updates[`${s.id}-${idx}`] = String(it.pcs);
          });
          setReceivedPcs((prev) => ({ ...prev, ...updates }));
        };

        const handleSubmitArrival = (s: OrderShipping) => {
          const arrivalItems = s.items
            .map((it, idx) => ({
              karat: it.kadar,
              warna: it.warna,
              size: it.ukuran,
              berat: it.berat,
              pcs: Number(receivedPcs[`${s.id}-${idx}`] || 0),
            }))
            .filter((ai) => ai.pcs > 0);

          if (arrivalItems.length === 0) {
            toast.error("Please enter at least one received quantity.");
            return;
          }

          const arrival: OrderArrival = {
            id: `ARR${Date.now()}`,
            orderId: currentOrder.id,
            orderPONumber: currentOrder.PONumber,
            createdDate: Date.now(),
            createdBy: currentUser,
            items: arrivalItems,
          };

          const existingArrivals: OrderArrival[] = JSON.parse(
            localStorage.getItem("orderArrivals") || "[]"
          );
          existingArrivals.push(arrival);
          localStorage.setItem("orderArrivals", JSON.stringify(existingArrivals));

          // Clear the received inputs for this shipment
          setReceivedPcs((prev) => {
            const next = { ...prev };
            s.items.forEach((_, idx) => { delete next[`${s.id}-${idx}`]; });
            return next;
          });

          toast.success("Arrival recorded successfully.");
        };

        const fmtDate = (ts: number) =>
          `${new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

        // Column count for colSpan
        const colCount = isJB ? 6 : canSupplierEdit ? 5 : 4;

        return (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Shipment Entries</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Kadar</th>
                    <th className="px-3 py-2 text-left">Warna</th>
                    <th className="px-3 py-2 text-left">Ukuran</th>
                    <th className="px-3 py-2 text-right">Shipped</th>
                    {isJB && <th className="px-3 py-2 text-right">Received</th>}
                    {isJB && <th className="px-3 py-2 w-8"></th>}
                    {canSupplierEdit && <th className="px-3 py-2 w-20"></th>}
                  </tr>
                </thead>
                <tbody>
                  {allShipments
                    .slice()
                    .sort((a, b) => b.createdDate - a.createdDate)
                    .flatMap((s) => {
                      const isEditing = editingShipmentId === s.id;
                      const rows = [
                        // Group header row
                        <tr key={`header-${s.id}`} className="bg-gray-50 border-t">
                          <td colSpan={colCount} className="px-3 py-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span>
                                <span className="font-medium text-gray-700">{fmtDate(s.createdDate)}</span>
                                <span className="text-gray-500 ml-2">by {s.createdBy}</span>
                              </span>
                              <div className="flex items-center gap-1">
                                {isJB && !isClosed && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs px-2 gap-1"
                                      title="Match all shipped quantities"
                                      onClick={() => handleMatchAll(s)}
                                    >
                                      <CheckCheck className="w-3 h-3" />
                                      Match All
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleSubmitArrival(s)}
                                    >
                                      Submit Arrival
                                    </Button>
                                  </>
                                )}
                                {canSupplierEdit && !isEditing && (
                                  <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleStartEdit(s)}>
                                    Add Correction
                                  </Button>
                                )}
                                {canSupplierEdit && isEditing && (
                                  <div className="flex gap-1">
                                    <Button size="sm" className="h-6 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleSaveEdit(s)}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setEditingShipmentId(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>,
                        // Item rows
                        ...s.items.map((it, idx) => (
                          <tr key={`${s.id}-${idx}`} className="border-t">
                            <td className={`px-3 py-2 font-medium ${getKadarColor(it.kadar)}`}>
                              {it.kadar.toUpperCase()}
                            </td>
                            <td className={`px-3 py-2 ${getWarnaColor(it.warna)}`}>
                              {getWarnaLabel(it.warna)}
                            </td>
                            <td className="px-3 py-2">
                              {(() => {
                                const d = getUkuranDisplay(it.ukuran);
                                return d.showUnit ? `${d.value} cm` : d.value;
                              })()}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={editingShipmentPcs[idx] ?? String(it.pcs)}
                                  onChange={(e) =>
                                    setEditingShipmentPcs((prev) => ({ ...prev, [idx]: e.target.value }))
                                  }
                                  className="w-20 text-right h-7 text-sm ml-auto"
                                />
                              ) : it.pcs}
                            </td>
                            {isJB && (
                              <td className="px-3 py-2 text-right">
                                {isClosed ? (
                                  <span className="font-medium text-gray-600">
                                    {receivedPerShipmentItem(s.id, idx, it.kadar, it.warna, it.ukuran) || "-"}
                                  </span>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={receivedPcs[`${s.id}-${idx}`] ?? ""}
                                    onChange={(e) =>
                                      setReceivedPcs((prev) => ({ ...prev, [`${s.id}-${idx}`]: e.target.value }))
                                    }
                                    placeholder={String(receivedPerShipmentItem(s.id, idx, it.kadar, it.warna, it.ukuran) || "")}
                                    className="w-20 text-right h-7 text-sm ml-auto"
                                  />
                                )}
                              </td>
                            )}
                            {isJB && !isClosed && (
                              <td className="px-1 py-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="Match shipped quantity"
                                  onClick={() => handleMatchRow(s.id, idx, it.pcs)}
                                >
                                  <CheckSquare className="h-4 w-4 text-green-600" />
                                </Button>
                              </td>
                            )}
                            {isJB && isClosed && <td></td>}
                            {canSupplierEdit && <td></td>}
                          </tr>
                        )),
                        // Edit history / correction rows
                        ...(s.editHistory || []).flatMap((h, hIdx) => [
                          <tr key={`${s.id}-edit-header-${hIdx}`} className="bg-amber-50 border-t">
                            <td colSpan={colCount} className="px-3 py-1 text-xs text-amber-700">
                              <span className="font-medium">Correction</span> {fmtDate(h.editedAt)} by {h.editedBy}
                            </td>
                          </tr>,
                          ...h.previousItems.map((prev, pIdx) => {
                            const next = h.newItems[pIdx];
                            const changed = next && next.pcs !== prev.pcs;
                            if (!changed) return null;
                            return (
                              <tr key={`${s.id}-edit-${hIdx}-${pIdx}`} className="bg-amber-50 border-t">
                                <td className={`px-3 py-1.5 text-xs font-medium ${getKadarColor(prev.kadar)}`}>
                                  {prev.kadar.toUpperCase()}
                                </td>
                                <td className={`px-3 py-1.5 text-xs ${getWarnaColor(prev.warna)}`}>
                                  {getWarnaLabel(prev.warna)}
                                </td>
                                <td className="px-3 py-1.5 text-xs">
                                  {(() => {
                                    const d = getUkuranDisplay(prev.ukuran);
                                    return d.showUnit ? `${d.value} cm` : d.value;
                                  })()}
                                </td>
                                <td className="px-3 py-1.5 text-xs text-right" colSpan={isJB ? 3 : canSupplierEdit ? 2 : 1}>
                                  <span className="line-through text-red-500 mr-1">{prev.pcs}</span>
                                  <span className="text-green-600 font-medium">→ {next.pcs}</span>
                                </td>
                              </tr>
                            );
                          }).filter(Boolean),
                        ]),
                      ];
                      return rows;
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {/* Supplier Action Buttons */}
      {userRole === "supplier" &&
        (currentOrder.status === "New Order" ||
          currentOrder.status === "Viewed") && (
          <div className="flex gap-2 flex-wrap justify-end mt-6">
            <Button
              onClick={() =>
                handleUpdateStatusWithToast(
                  currentOrder.id,
                  "In Production",
                  "Order marked as In Production. It will now appear in the Shipping tab.",
                )
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Start Production
            </Button>
            <Button
              onClick={() =>
                handleUpdateStatusWithToast(
                  currentOrder.id,
                  "Stock Ready",
                  "Order marked as Stock Ready. It will now appear in the Shipping tab.",
                )
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Mark Stock Ready
            </Button>
            <Button
              onClick={() => onUpdateOrder?.(currentOrder)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Request Change
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleUpdateStatusWithToast(
                  currentOrder.id,
                  "Unable to Fulfill",
                  "Order marked as Unable to Fulfill. It has been moved to the Closed tab.",
                )
              }
            >
              Unable to Fulfill
            </Button>
          </div>
        )}

      {/* Supplier Action Buttons - Order Revised */}
      {userRole === "supplier" && currentOrder.status === "Order Revised" && (
        <div className="flex gap-2 flex-wrap justify-end mt-6">
          <Button
            onClick={() =>
              handleUpdateStatusWithToast(
                currentOrder.id,
                "In Production",
                "Order marked as In Production. It will now appear in the Shipping tab.",
              )
            }
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Start Production
          </Button>
          <Button
            onClick={() =>
              handleUpdateStatusWithToast(
                currentOrder.id,
                "Stock Ready",
                "Order marked as Stock Ready. It will now appear in the Shipping tab.",
              )
            }
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Mark Stock Ready
          </Button>
          <Button
            onClick={() => onUpdateOrder?.(currentOrder)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Request Change
          </Button>
        </div>
      )}

      {/* Revision History - Unified Timeline Panel (all users; suppliers when Order Revised or Change Pending Approval) */}
      {(userRole !== "supplier" ||
        currentOrder.status === "Order Revised" ||
        currentOrder.status === "Change Pending Approval") &&
        currentOrder.revisionHistory &&
        currentOrder.revisionHistory.length > 0 && (
          <RevisionHistoryPanel
            title="Revision History"
            createdTimestamp={currentOrder.createdDate}
            createdBy={currentOrder.createdBy}
            revisions={currentOrder.revisionHistory}
            entitySnapshot={{
              kategoriBarang: currentOrder.kategoriBarang,
              jenisProduk: currentOrder.jenisProduk,
              namaProduk: currentOrder.namaProduk,
              namaBasic: currentOrder.namaBasic,
              waktuKirim: currentOrder.waktuKirim,
              photoId: currentOrder.photoId,
              detailItems: currentOrder.detailItems,
            }}
          />
        )}

      {/* Request Revision History - visible to non-supplier users when linked request has revisions */}
      {userRole !== "supplier" &&
        relatedRequest &&
        relatedRequest.revisionHistory &&
        relatedRequest.revisionHistory.length > 0 && (
          <RevisionHistoryPanel
            title="Request Revision History"
            createdTimestamp={relatedRequest.timestamp}
            createdBy={relatedRequest.createdBy || ""}
            revisions={relatedRequest.revisionHistory}
            entitySnapshot={{
              pabrik: relatedRequest.pabrik,
              namaPelanggan: relatedRequest.namaPelanggan,
              kategoriBarang: relatedRequest.kategoriBarang,
              jenisProduk: relatedRequest.jenisProduk,
              namaProduk: relatedRequest.namaProduk,
              namaBasic: relatedRequest.namaBasic,
              waktuKirim: relatedRequest.waktuKirim,
              customerExpectation: relatedRequest.customerExpectation,
              detailItems: relatedRequest.detailItems,
              photoId: relatedRequest.photoId,
            }}
          />
        )}

      {/* Review Action Buttons - Only shown in review mode */}
      {reviewMode && onApproveRevision && onCancelOrder && (
        <div className="sticky bottom-16 md:bottom-0 left-0 right-0 mt-6 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg p-4">
            <div className="flex gap-3 justify-end max-w-7xl mx-auto">
              {userRole == "sales" ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelDialog(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  Cancel Order
                </Button>
              ) : undefined}
              <Button
                onClick={() => onApproveRevision(order.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Revision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Dialog */}
      {relatedRequest && (
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                {relatedRequest.requestNo && (
                  <span className="font-mono font-semibold">
                    {relatedRequest.requestNo}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              {/* Request Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="max-h-[300px] overflow-auto">
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
          </DialogContent>
        </Dialog>
      )}



      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter the reason for cancelling this order..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!cancelReason.trim()) {
                  toast.error("Please provide a reason for cancellation");
                  return;
                }
                if (onCancelOrder) {
                  onCancelOrder(order.id);
                }
                setShowCancelDialog(false);
                setCancelReason("");
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason.trim()}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
