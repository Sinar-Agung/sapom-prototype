import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order, OrderShipping } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { getImage } from "@/app/utils/image-storage";
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
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(
    new Set(),
  );
  const [isRequestRevisionHistoryOpen, setIsRequestRevisionHistoryOpen] =
    useState(false);
  const [expandedRequestRevisions, setExpandedRequestRevisions] = useState<
    Set<number>
  >(new Set());
  const [currentOrder, setCurrentOrder] = useState<Order>(order);

  useEffect(() => {
    if (order) setCurrentOrder(order);
  }, [order]);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [shippingPcs, setShippingPcs] = useState<Record<string, string>>({});
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

    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders);
      const idx = allOrders.findIndex((o) => o.id === currentOrder.id);
      if (idx !== -1) {
        const oldStatus = allOrders[idx].status;
        allOrders[idx].status = "Shipping";
        allOrders[idx].updatedDate = Date.now();
        allOrders[idx].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));
        notifyOrderStatusChanged(
          allOrders[idx],
          oldStatus,
          "Shipping",
          currentUser,
          userRole,
        );
        setCurrentOrder(allOrders[idx]);
      }
    }

    setShowShippingDialog(false);
    setShippingPcs({});
    toast.success("Shipping entry submitted successfully");
    setTimeout(() => onBack(), 500);
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
                <p>
                  <span className="text-gray-600">Request No:</span>{" "}
                  {order.requestNo ? (
                    <button
                      onClick={() => setShowRequestDialog(true)}
                      className="font-mono text-blue-600 underline hover:text-blue-800"
                    >
                      {order.requestNo}
                    </button>
                  ) : (
                    <span className="font-mono">-</span>
                  )}
                </p>
              )}
              {userRole !== "supplier" && (
                <div className="grid grid-cols-5 gap-x-3">
                  <span className="text-gray-600 pr-1">Request No:</span>
                  <span className="font-mono">{order.requestNo || "-"}</span>
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
                    ? getImage(lastRevision.previousValues.photoId)
                    : null;
                  const afterImg = lastRevision.changes.photoId
                    ? getImage(lastRevision.changes.photoId)
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
      {currentOrder.status !== "Change Pending Approval" && (
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
      )}

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
                  "You've marked the Order as In Production",
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
                  "You've marked the Order as Ready Stock",
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
                handleUpdateStatus(currentOrder.id, "Unable to Fulfill")
              }
            >
              Unable to Fulfill
            </Button>
          </div>
        )}

      {/* Supplier Action Buttons - In Production / Stock Ready */}
      {userRole === "supplier" &&
        (currentOrder.status === "In Production" ||
          currentOrder.status === "Stock Ready") && (
          <div className="flex gap-2 flex-wrap justify-end mt-6">
            <Button
              onClick={() => setShowShippingDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Shipping
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
                "You've marked the Order as In Production",
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
                "You've marked the Order as Ready Stock",
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

                <div className="flex flex-col">
                  {/* Initial Version */}
                  {(() => {
                    const isExpanded = expandedRevisions.has(-1);
                    const firstRevision = currentOrder.revisionHistory[0];

                    return (
                      <div className="flex gap-4 pb-6 order-last">
                        {/* Left: date/time column */}
                        <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                          <div className="font-medium text-gray-700">
                            {new Date(
                              currentOrder.createdDate,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            {new Date(
                              currentOrder.createdDate,
                            ).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {/* Timeline dot */}
                        <div className="relative flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white ring-1 ring-blue-400 mt-2 z-10" />
                        </div>

                        {/* Right: title + collapsible content */}
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
                                  currentOrder.createdBy,
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
                            <div className="mt-2 border rounded-lg bg-white p-4 text-sm">
                              <div className="flex flex-col md:flex-row gap-4">
                                {/* Left side: Fields */}
                                <div className="flex-1 space-y-3">
                                  {/* Product Category */}
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
                                          .kategoriBarang ||
                                          currentOrder.kategoriBarang,
                                      )}
                                    </p>
                                  </div>

                                  {/* Product Type */}
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Product Type
                                    </p>
                                    <p className="text-gray-900">
                                      {getLabelFromValue(
                                        JENIS_PRODUK_OPTIONS,
                                        firstRevision?.previousValues
                                          .jenisProduk ||
                                          currentOrder.jenisProduk,
                                      )}
                                    </p>
                                  </div>

                                  {/* Basic Name */}
                                  {(firstRevision?.previousValues.namaBasic ||
                                    currentOrder.namaBasic) && (
                                    <div>
                                      <p className="font-medium text-gray-700 text-xs mb-1">
                                        Basic Name
                                      </p>
                                      <p className="text-gray-900">
                                        {getLabelFromValue(
                                          NAMA_BASIC_OPTIONS,
                                          firstRevision?.previousValues
                                            .namaBasic ||
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
                                            .namaProduk ||
                                            currentOrder.namaProduk,
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
                                      Product Photo
                                    </p>
                                    <img
                                      src={
                                        getImage(
                                          firstRevision?.previousValues
                                            .photoId ||
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
                                        Product Details ({detailItems.length}{" "}
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
                                                  {(() => {
                                                    const ukuranDisplay =
                                                      getUkuranDisplay(
                                                        item.ukuran,
                                                      );
                                                    return ukuranDisplay.showUnit
                                                      ? `${ukuranDisplay.value} cm`
                                                      : ukuranDisplay.value;
                                                  })()}
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
                      </div>
                    );
                  })()}

                  {/* Revision entries */}
                  {[...currentOrder.revisionHistory]
                    .slice()
                    .reverse()
                    .map((revision, revIdx, arr) => {
                      // Reverse index for expandedRevisions
                      const index =
                        currentOrder.revisionHistory.length - 1 - revIdx;
                      const isExpanded = expandedRevisions.has(index);
                      return (
                        <div key={index} className="flex gap-4 pb-6">
                          {/* Left: date/time column */}
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

                          {/* Timeline dot */}
                          <div className="relative flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-400 mt-2 z-10" />
                          </div>

                          {/* Right: title + collapsible content */}
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
                                    currentOrder.revisionHistory.length - 1 && (
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
                              <div className="mt-2 border rounded-lg bg-gray-50 p-4 text-sm">
                                {/* ETA before/after */}
                                {revision.changes.waktuKirim &&
                                  revision.previousValues.waktuKirim !==
                                    revision.changes.waktuKirim && (
                                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                                      <p className="text-xs font-semibold text-gray-700 mb-1">
                                        ETA Change
                                      </p>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-red-600 line-through">
                                          {revision.previousValues.waktuKirim
                                            ? new Date(
                                                revision.previousValues
                                                  .waktuKirim,
                                              ).toLocaleDateString("id-ID")
                                            : "—"}
                                        </span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-green-700 font-semibold">
                                          {new Date(
                                            revision.changes.waktuKirim,
                                          ).toLocaleDateString("id-ID")}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                <div className="flex flex-col md:flex-row gap-4">
                                  {/* Left side: Fields */}
                                  <div className="flex-1 space-y-3">
                                    {/* Product Category */}
                                    {revision.changes.kategoriBarang && (
                                      <div>
                                        <p className="font-medium text-gray-700 text-xs mb-1">
                                          Product Category
                                        </p>
                                        <p className="text-gray-900">
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
                                        </p>
                                      </div>
                                    )}

                                    {/* Product Type */}
                                    {revision.changes.jenisProduk && (
                                      <div>
                                        <p className="font-medium text-gray-700 text-xs mb-1">
                                          Product Type
                                        </p>
                                        <p className="text-gray-900">
                                          {getLabelFromValue(
                                            JENIS_PRODUK_OPTIONS,
                                            revision.changes.jenisProduk,
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {/* Basic Name */}
                                    {revision.changes.namaBasic && (
                                      <div>
                                        <p className="font-medium text-gray-700 text-xs mb-1">
                                          Basic Name
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

                                  {/* Right side: Photo before/after */}
                                  {(revision.previousValues.photoId ||
                                    revision.changes.photoId) &&
                                    (() => {
                                      const beforeImg = revision.previousValues
                                        .photoId
                                        ? getImage(
                                            revision.previousValues.photoId,
                                          )
                                        : null;
                                      const afterImg = revision.changes.photoId
                                        ? getImage(revision.changes.photoId)
                                        : null;
                                      const photoChanged =
                                        revision.previousValues.photoId !==
                                        revision.changes.photoId;
                                      if (
                                        photoChanged &&
                                        beforeImg &&
                                        afterImg
                                      ) {
                                        return (
                                          <div className="flex gap-3 flex-wrap">
                                            <div className="w-36">
                                              <p className="font-medium text-gray-500 text-xs mb-1">
                                                Photo — Before
                                              </p>
                                              <img
                                                src={beforeImg}
                                                alt="Before"
                                                className="w-full h-36 object-cover rounded border border-red-200"
                                              />
                                            </div>
                                            <div className="w-36">
                                              <p className="font-medium text-green-700 text-xs mb-1">
                                                Photo — After
                                              </p>
                                              <img
                                                src={afterImg}
                                                alt="After"
                                                className="w-full h-36 object-cover rounded border border-green-400"
                                              />
                                            </div>
                                          </div>
                                        );
                                      }
                                      const singleImg = afterImg || beforeImg;
                                      return singleImg ? (
                                        <div className="md:w-48">
                                          <p className="font-medium text-gray-700 text-xs mb-2">
                                            Product Photo
                                          </p>
                                          <img
                                            src={singleImg}
                                            alt="Product"
                                            className="w-full h-48 object-cover rounded border"
                                          />
                                        </div>
                                      ) : null;
                                    })()}
                                </div>

                                {/* Detail Items */}
                                {revision.changes.detailItems &&
                                  revision.changes.detailItems.length > 0 && (
                                    <div className="mt-4">
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
                                                // Get corresponding previous item for comparison
                                                const prevItem =
                                                  revision.previousValues
                                                    ?.detailItems?.[idx];

                                                // Check if this is a new item (no previous item at this index or beyond previous length)
                                                const isNewItem =
                                                  !revision.previousValues
                                                    ?.detailItems ||
                                                  idx >=
                                                    revision.previousValues
                                                      .detailItems.length;

                                                // Determine if each field changed
                                                const kadarChanged =
                                                  prevItem &&
                                                  item.kadar !== prevItem.kadar;
                                                const warnaChanged =
                                                  prevItem &&
                                                  item.warna !== prevItem.warna;
                                                const ukuranChanged =
                                                  prevItem &&
                                                  item.ukuran !==
                                                    prevItem.ukuran;
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
                                                        ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50"
                                                        : ""
                                                    }
                                                  >
                                                    <td
                                                      className={`px-2 py-1 font-medium ${getKadarColor(item.kadar)} ${kadarChanged && !isNewItem ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : "border"}`}
                                                    >
                                                      {item.kadar}
                                                    </td>
                                                    <td
                                                      className={`px-2 py-1 ${getWarnaColor(item.warna)} ${warnaChanged && !isNewItem ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : "border"}`}
                                                    >
                                                      {getWarnaLabel(
                                                        item.warna,
                                                      )}
                                                    </td>
                                                    <td
                                                      className={`px-2 py-1 ${ukuranChanged && !isNewItem ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : "border"}`}
                                                    >
                                                      {(() => {
                                                        const ukuranDisplay =
                                                          getUkuranDisplay(
                                                            item.ukuran,
                                                          );
                                                        return ukuranDisplay.showUnit
                                                          ? `${ukuranDisplay.value} cm`
                                                          : ukuranDisplay.value;
                                                      })()}
                                                    </td>
                                                    <td
                                                      className={`px-2 py-1 text-right ${beratChanged && !isNewItem ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : "border"}`}
                                                    >
                                                      {item.berat}
                                                    </td>
                                                    <td
                                                      className={`px-2 py-1 text-right ${pcsChanged && !isNewItem ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : "border"}`}
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

      {/* Request Revision History - visible to non-supplier users when linked request has revisions */}
      {userRole !== "supplier" &&
        relatedRequest &&
        relatedRequest.revisionHistory &&
        relatedRequest.revisionHistory.length > 0 && (
          <Card className="p-4 mb-4">
            <button
              onClick={() =>
                setIsRequestRevisionHistoryOpen(!isRequestRevisionHistoryOpen)
              }
              className="w-full flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-gray-900">
                Request Revision History
              </h3>
              {isRequestRevisionHistoryOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {isRequestRevisionHistoryOpen && (
              <div className="mt-6 relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gray-200" />

                <div className="flex flex-col">
                  {/* Initial Version */}
                  {(() => {
                    const isExpanded = expandedRequestRevisions.has(-1);
                    const firstRevision = relatedRequest.revisionHistory![0];

                    const initialPabrik =
                      firstRevision?.previousValues.pabrik ??
                      relatedRequest.pabrik;
                    const initialPabrikLabel =
                      typeof initialPabrik === "string"
                        ? getLabelFromValue(PABRIK_OPTIONS, initialPabrik)
                        : initialPabrik?.name || "";

                    const initialPelanggan =
                      firstRevision?.previousValues.namaPelanggan ??
                      relatedRequest.namaPelanggan;
                    const initialPelangganLabel =
                      typeof initialPelanggan === "string"
                        ? getLabelFromValue(ATAS_NAMA_OPTIONS, initialPelanggan)
                        : initialPelanggan?.name || "";

                    const initialDetailItems =
                      firstRevision?.previousValues.detailItems ??
                      relatedRequest.detailItems;

                    return (
                      <div className="flex gap-4 pb-6 order-last">
                        <div className="w-28 shrink-0 text-right text-xs text-gray-500 pt-2 pr-4">
                          <div className="font-medium text-gray-700">
                            {new Date(
                              relatedRequest.timestamp,
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            {new Date(
                              relatedRequest.timestamp,
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
                              const newExpanded = new Set(
                                expandedRequestRevisions,
                              );
                              if (isExpanded) {
                                newExpanded.delete(-1);
                              } else {
                                newExpanded.add(-1);
                              }
                              setExpandedRequestRevisions(newExpanded);
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
                                  relatedRequest.createdBy || "",
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
                                    ETA
                                  </p>
                                  <p className="text-gray-900">
                                    {(firstRevision?.previousValues
                                      .waktuKirim ?? relatedRequest.waktuKirim)
                                      ? new Date(
                                          firstRevision?.previousValues
                                            .waktuKirim ??
                                            relatedRequest.waktuKirim,
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
                                        relatedRequest.customerExpectation,
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
                                                  className={`border px-2 py-1 ${getWarnaColor(item.warna)}`}
                                                >
                                                  {getWarnaLabel(item.warna)}
                                                </td>
                                                <td className="border px-2 py-1">
                                                  {(() => {
                                                    const ud = getUkuranDisplay(
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
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Revision entries */}
                  {[...relatedRequest.revisionHistory!]
                    .slice()
                    .reverse()
                    .map((revision, index) => {
                      const isExpanded = expandedRequestRevisions.has(index);

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
                        typeof revision.previousValues.namaPelanggan ===
                        "string"
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
                                const newExpanded = new Set(
                                  expandedRequestRevisions,
                                );
                                if (isExpanded) {
                                  newExpanded.delete(index);
                                } else {
                                  newExpanded.add(index);
                                }
                                setExpandedRequestRevisions(newExpanded);
                              }}
                              className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded p-2 -ml-2 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  Revision #{revision.revisionNumber}
                                  {index === 0 && (
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
                                  <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                      ETA Change
                                    </p>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-red-600 line-through">
                                        {revision.previousValues.waktuKirim
                                          ? new Date(
                                              revision.previousValues
                                                .waktuKirim,
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
                                {pabrikChanged && (
                                  <div>
                                    <p className="font-medium text-gray-700 text-xs mb-1">
                                      Supplier
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-600 line-through text-xs">
                                        {prevPabrikLabel}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-700 font-medium text-xs">
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
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-600 line-through text-xs">
                                        {prevPelangganLabel}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-700 font-medium text-xs">
                                        {revPelangganLabel}
                                      </span>
                                    </div>
                                  </div>
                                )}
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
                                                    ?.detailItems?.[idx];
                                                const isNewItem =
                                                  !revision.previousValues
                                                    ?.detailItems ||
                                                  idx >=
                                                    revision.previousValues
                                                      .detailItems.length;
                                                return (
                                                  <tr
                                                    key={idx}
                                                    className={
                                                      isNewItem
                                                        ? "bg-green-50"
                                                        : ""
                                                    }
                                                  >
                                                    <td className="border px-2 py-1 font-medium">
                                                      {item.kadar}
                                                    </td>
                                                    <td
                                                      className={`border px-2 py-1 ${getWarnaColor(item.warna)}`}
                                                    >
                                                      {getWarnaLabel(
                                                        item.warna,
                                                      )}
                                                    </td>
                                                    <td className="border px-2 py-1">
                                                      {(() => {
                                                        const ud =
                                                          getUkuranDisplay(
                                                            item.ukuran,
                                                          );
                                                        return ud.showUnit
                                                          ? `${ud.value} cm`
                                                          : ud.value;
                                                      })()}
                                                    </td>
                                                    <td
                                                      className={`border px-2 py-1 text-right ${prevItem && item.berat !== prevItem.berat ? "font-bold text-orange-600" : ""}`}
                                                    >
                                                      {item.berat}
                                                    </td>
                                                    <td
                                                      className={`border px-2 py-1 text-right ${prevItem && item.pcs !== prevItem.pcs ? "font-bold text-orange-600" : ""}`}
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

      {/* Shipping Entry Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Shipping Entry</DialogTitle>
            <DialogDescription>
              Enter the number of pieces you are shipping for each item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shipping Date</Label>
              <p className="text-sm font-medium mt-1">
                {new Date().toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="mb-2 block">Items to Ship</Label>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Kadar</th>
                      <th className="px-3 py-2 text-left">Warna</th>
                      <th className="px-3 py-2 text-left">Ukuran</th>
                      <th className="px-3 py-2 text-right">Ordered</th>
                      <th className="px-3 py-2 text-right">Pcs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.detailItems.map((item) => {
                      const ukuranDisplay = getUkuranDisplay(item.ukuran);
                      return (
                        <tr key={item.id} className="border-t">
                          <td
                            className={`px-3 py-2 font-medium ${getKadarColor(item.kadar)}`}
                          >
                            {item.kadar.toUpperCase()}
                          </td>
                          <td
                            className={`px-3 py-2 ${getWarnaColor(item.warna)}`}
                          >
                            {getWarnaLabel(item.warna)}
                          </td>
                          <td className="px-3 py-2">
                            {ukuranDisplay.showUnit
                              ? `${ukuranDisplay.value} cm`
                              : ukuranDisplay.value}
                          </td>
                          <td className="px-3 py-2 text-right">{item.pcs}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              max={item.pcs}
                              value={shippingPcs[item.id] || ""}
                              onChange={(e) =>
                                setShippingPcs((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
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
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShippingDialog(false);
                setShippingPcs({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitShipping}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Submit Shipping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
