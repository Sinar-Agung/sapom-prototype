import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import {
  Order,
  OrderArrival,
  OrderArrivalEditHistory,
  OrderRevision,
  OrderShipping,
  OrderShippingEditHistory,
} from "@/app/types/order";
import { DetailBarangItem, Request } from "@/app/types/request";
import { useImageMap } from "@/app/utils/image-storage";
import {
  notifyOrderArrival,
  notifyOrderClosed,
  notifyOrderFullyDelivered,
  notifyOrderShipmentCreated,
  notifyOrderShipmentEdited,
  notifyOrderStatusChanged,
} from "@/app/utils/notification-helper";
import { printQRCode } from "@/app/utils/qr-print";
import {
  getStatusBadgeClasses,
  getStatusLabel,
} from "@/app/utils/status-colors";
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
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  Info,
  Pencil,
  Printer,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { ProductHeader } from "./ui/product-header";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

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
  const [rowDecisions, setRowDecisions] = useState<
    Record<string, "accept" | "reject">
  >({});
  const [showingSupplierNoteTooltip, setShowingSupplierNoteTooltip] = useState<{
    notes: string;
    x: number;
    y: number;
  } | null>(null);
  const [etaDecision, setEtaDecision] = useState<"accept" | null>(null);
  const [photoDecision, setPhotoDecision] = useState<"accept" | null>(null);
  const [showRejectReasonDialog, setShowRejectReasonDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectContext, setRejectContext] = useState<string>("");

  useEffect(() => {
    if (order) setCurrentOrder(order);
  }, [order]);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    label: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [shippingPcs, setShippingPcs] = useState<Record<string, string>>({});
  const [shipmentEntries, setShipmentEntries] = useState<OrderShipping[]>([]);
  const [shipmentArrivals, setShipmentArrivals] = useState<OrderArrival[]>([]);
  const [arrivalEdits, setArrivalEdits] = useState<
    Record<string, Record<number, string>>
  >({});
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(
    null,
  );
  const [editingShipmentPcs, setEditingShipmentPcs] = useState<
    Record<number, string>
  >({});
  const [isShipmentEntriesOpen, setIsShipmentEntriesOpen] = useState(true);
  const [isArrivalsOpen, setIsArrivalsOpen] = useState(true);
  const [editingArrivalId, setEditingArrivalId] = useState<string | null>(null);
  const [editingArrivalItems, setEditingArrivalItems] = useState<
    Record<number, string>
  >({});
  const [editingArrivalUnlockedRows, setEditingArrivalUnlockedRows] = useState<
    Set<number>
  >(new Set());
  const [inlineArrivalPcs, setInlineArrivalPcs] = useState<
    Record<string, string>
  >({});
  const [inlineArrivalEditingRows, setInlineArrivalEditingRows] = useState<
    Set<string>
  >(new Set());
  const [arrivalEditingRows, setArrivalEditingRows] = useState<
    Record<string, Set<number>>
  >({});
  const [shippingEditingRows, setShippingEditingRows] = useState<Set<string>>(
    new Set(),
  );
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const userRole = (sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole") ||
    "sales") as "sales" | "stockist" | "jb" | "supplier";
  // JB cannot record new arrivals for terminal-status orders
  const canRecordArrival =
    userRole === "jb" &&
    !["Unable to Fulfill", "Closed", "Cancelled"].includes(currentOrder.status);
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

        if (newStatus === "Closed") {
          notifyOrderClosed(allOrders[orderIndex], currentUser);
        }

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

    // Apply per-row decisions when there are any
    if (Object.keys(rowDecisions).length > 0) {
      const lastRevision =
        currentOrder.revisionHistory?.[currentOrder.revisionHistory.length - 1];
      if (lastRevision?.previousValues.detailItems) {
        const pairs = buildSortedPairs(
          lastRevision.previousValues.detailItems,
          allOrders[idx].detailItems,
        );
        const finalItems: DetailBarangItem[] = [];
        for (const { orig, prop, pairKey } of pairs) {
          const decision = rowDecisions[pairKey];
          if (!prop) {
            // Deleted row — keep original only if user rejected the deletion
            if (decision === "reject" && orig) finalItems.push(orig);
          } else if (!orig) {
            // New row — include only if user accepted it
            if (decision === "accept") finalItems.push(prop);
          } else {
            // Modified row — rejected means remove the row entirely
            if (decision !== "reject")
              finalItems.push(decision === "accept" ? prop : orig);
          }
        }
        allOrders[idx].detailItems = finalItems;
      }
    }

    // Safety: if all items were removed by the decisions, cancel the order
    if (allOrders[idx].detailItems.length === 0) {
      allOrders[idx].status = "Cancelled";
      allOrders[idx].updatedDate = Date.now();
      allOrders[idx].updatedBy = currentUser;
      localStorage.setItem("orders", JSON.stringify(allOrders));
      setCurrentOrder(allOrders[idx]);
      toast.warning("All items were removed. The order has been cancelled.");
      setTimeout(() => onBack(), 500);
      return;
    }

    // Mark approval for the current user's role, and save sales row decisions for JB visibility
    if (userRole === "jb") {
      allOrders[idx].jbApproved = true;
    } else if (userRole === "sales") {
      allOrders[idx].salesApproved = true;
      // Persist row-level decisions so JB can see which rows sales rejected
      if (Object.keys(rowDecisions).length > 0) {
        const revisions = allOrders[idx].revisionHistory;
        if (revisions && revisions.length > 0) {
          revisions[revisions.length - 1].salesRowDecisions = {
            ...rowDecisions,
          };
        }
      }
    }

    // Only move to Order Revised when both have approved (sequential: Sales first, then JB)
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
      // Sales just submitted: advance to Pending JB Review
      if (userRole === "sales") {
        allOrders[idx].status = "Pending JB Review";
      }
      allOrders[idx].updatedDate = Date.now();
      allOrders[idx].updatedBy = currentUser;
      localStorage.setItem("orders", JSON.stringify(allOrders));
      setCurrentOrder({ ...allOrders[idx] });
      const waitingFor = userRole === "jb" ? "Sales" : "JB";
      toast.success(`Review submitted. Awaiting ${waitingFor} review.`);
    }
  };

  const handleRejectSupplierRevision = (
    reason: string = "",
    context: string = "",
  ) => {
    const savedOrders = localStorage.getItem("orders");
    if (!savedOrders) return;
    const allOrders: Order[] = JSON.parse(savedOrders);
    const idx = allOrders.findIndex((o) => o.id === currentOrder.id);
    if (idx === -1) return;
    const existing = allOrders[idx];
    const revisions = existing.revisionHistory || [];
    const lastRevision = revisions[revisions.length - 1];
    if (lastRevision) {
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
        status: "Cancelled",
        updatedDate: Date.now(),
        updatedBy: currentUser,
        ...(() => {
          const parts = [
            context.trim() ? `Rejected part: ${context.trim()}` : null,
            reason.trim() ? `Reason: ${reason.trim()}` : null,
          ].filter(Boolean);
          return parts.length ? { revisionNotes: parts.join(" | ") } : {};
        })(),
      };
    } else {
      allOrders[idx].status = "Cancelled";
    }
    localStorage.setItem("orders", JSON.stringify(allOrders));
    setCurrentOrder(allOrders[idx]);
    toast.success("Supplier revision rejected. Order has been cancelled.");
    setTimeout(() => onBack(), 500);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setShowRejectReasonDialog(false);
    handleRejectSupplierRevision(rejectReason, rejectContext);
    setRejectReason("");
    setRejectContext("");
  };

  const loadShipmentEntries = (orderId: string) => {
    const all: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    const forOrder = all.filter((s) => s.orderId === orderId);
    setShipmentEntries(forOrder);

    const allArrivals: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    const forOrderArrivals = allArrivals.filter((a) => a.orderId === orderId);
    setShipmentArrivals(forOrderArrivals);

    // Pre-fill arrival edits from existing OrderArrival records linked to these entries
    const initEdits: Record<string, Record<number, string>> = {};
    forOrder.forEach((se) => {
      const linked = forOrderArrivals.filter((a) => a.shippingId === se.id);
      if (linked.length > 0) {
        const sums: Record<number, number> = {};
        se.items.forEach((item, idx) => {
          const total = linked.reduce((acc, arrival) => {
            const found = arrival.items.find(
              (ai) =>
                ai.karat === item.kadar &&
                ai.warna === item.warna &&
                ai.size === item.ukuran &&
                ai.berat === item.berat,
            );
            return acc + (found?.pcs || 0);
          }, 0);
          if (total > 0) sums[idx] = total;
        });
        if (Object.keys(sums).length > 0) {
          initEdits[se.id] = Object.fromEntries(
            Object.entries(sums).map(([k, v]) => [k, String(v)]),
          );
        }
      }
    });
    // Do NOT pre-fill arrival edits — input boxes should always start empty (0)
    setArrivalEdits({});
  };

  const handleSaveArrivals = (shippingId: string, shipping: OrderShipping) => {
    const edits = arrivalEdits[shippingId] || {};
    const items = shipping.items
      .map((item, idx) => ({
        karat: item.kadar,
        warna: item.warna,
        size: item.ukuran,
        berat: item.berat,
        pcs: parseInt(edits[idx] || "0") || 0,
      }))
      .filter((item) => item.pcs > 0);

    if (items.length === 0) {
      toast.error("Please enter at least one arrival quantity");
      return;
    }

    const arrival: OrderArrival = {
      id: (() => {
        const existingArrivalsForId: OrderArrival[] = JSON.parse(
          localStorage.getItem("orderArrivals") || "[]",
        );
        const forOrderArrivalsId = existingArrivalsForId.filter(
          (a) => a.orderId === currentOrder.id,
        );
        const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const n = forOrderArrivalsId.length;
        return `${currentOrder.PONumber}R${BASE36[Math.floor(n / 36)]}${BASE36[n % 36]}`;
      })(),
      orderId: currentOrder.id,
      orderPONumber: currentOrder.PONumber,
      shippingId,
      createdDate: Date.now(),
      createdBy: currentUser,
      items,
    };

    const existingArrivals: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    existingArrivals.push(arrival);
    localStorage.setItem("orderArrivals", JSON.stringify(existingArrivals));

    // Auto-update delivery status
    const orderArrivals = existingArrivals.filter(
      (a) => a.orderId === currentOrder.id,
    );
    const getTotalReceived = (item: DetailBarangItem) =>
      orderArrivals.reduce((sum, a) => {
        const found = a.items.find(
          (i) =>
            i.karat === item.kadar &&
            i.warna === item.warna &&
            i.size === item.ukuran &&
            i.berat === item.berat,
        );
        return sum + (found?.pcs || 0);
      }, 0);
    const allFulfilled = currentOrder.detailItems.every(
      (item) => getTotalReceived(item) >= (parseInt(item.pcs) || 0),
    );
    const anyReceived = currentOrder.detailItems.some(
      (item) => getTotalReceived(item) > 0,
    );
    const newDeliveryStatus = allFulfilled
      ? "Fully Delivered"
      : anyReceived
        ? "Partially Delivered"
        : null;
    if (newDeliveryStatus && currentOrder.status !== newDeliveryStatus) {
      handleUpdateStatus(currentOrder.id, newDeliveryStatus);
    }

    const totalArrivalPcs = items.reduce((sum, i) => sum + i.pcs, 0);
    notifyOrderArrival(currentOrder, currentUser, totalArrivalPcs);
    if (newDeliveryStatus === "Fully Delivered") {
      notifyOrderFullyDelivered(currentOrder, currentUser);
    }
    toast.success("Arrivals recorded");
    loadShipmentEntries(currentOrder.id);
  };

  const handleSaveDirectArrivals = () => {
    const items = currentOrder.detailItems
      .map((item) => ({
        karat: item.kadar,
        warna: item.warna,
        size: item.ukuran,
        berat: item.berat,
        pcs: parseInt(inlineArrivalPcs[item.id] || "0") || 0,
      }))
      .filter((item) => item.pcs > 0);

    if (items.length === 0) {
      toast.error("Please enter at least one arrival quantity");
      return;
    }

    const arrival: OrderArrival = {
      id: (() => {
        const existingArrivalsForId: OrderArrival[] = JSON.parse(
          localStorage.getItem("orderArrivals") || "[]",
        );
        const forOrderArrivalsId = existingArrivalsForId.filter(
          (a) => a.orderId === currentOrder.id,
        );
        const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const n = forOrderArrivalsId.length;
        return `${currentOrder.PONumber}R${BASE36[Math.floor(n / 36)]}${BASE36[n % 36]}`;
      })(),
      orderId: currentOrder.id,
      orderPONumber: currentOrder.PONumber,
      createdDate: Date.now(),
      createdBy: currentUser,
      items,
    };

    const existingArrivals: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    existingArrivals.push(arrival);
    localStorage.setItem("orderArrivals", JSON.stringify(existingArrivals));

    const orderArrivals = existingArrivals.filter(
      (a) => a.orderId === currentOrder.id,
    );
    const getTotalReceived = (item: DetailBarangItem) =>
      orderArrivals.reduce((sum, a) => {
        const found = a.items.find(
          (i) =>
            i.karat === item.kadar &&
            i.warna === item.warna &&
            i.size === item.ukuran &&
            i.berat === item.berat,
        );
        return sum + (found?.pcs || 0);
      }, 0);
    const allFulfilled = currentOrder.detailItems.every(
      (item) => getTotalReceived(item) >= (parseInt(item.pcs) || 0),
    );
    const anyReceived = currentOrder.detailItems.some(
      (item) => getTotalReceived(item) > 0,
    );
    const newDeliveryStatus = allFulfilled
      ? "Fully Delivered"
      : anyReceived
        ? "Partially Delivered"
        : null;
    if (newDeliveryStatus && currentOrder.status !== newDeliveryStatus) {
      handleUpdateStatus(currentOrder.id, newDeliveryStatus);
    }

    const totalDirectPcs = items.reduce((sum, i) => sum + i.pcs, 0);
    notifyOrderArrival(currentOrder, currentUser, totalDirectPcs);
    if (newDeliveryStatus === "Fully Delivered") {
      notifyOrderFullyDelivered(currentOrder, currentUser);
    }
    setInlineArrivalPcs({});
    toast.success("Arrivals recorded");
    loadShipmentEntries(currentOrder.id);
  };

  const handleSaveShipmentEdit = (entry: OrderShipping) => {
    const newItems = entry.items
      .map((item, idx) => ({
        ...item,
        pcs: parseInt(editingShipmentPcs[idx] || "0") || 0,
      }))
      .filter((item) => item.pcs > 0);

    if (newItems.length === 0) {
      toast.error("Please enter at least one item quantity");
      return;
    }

    const historyEntry: OrderShippingEditHistory = {
      editedAt: Date.now(),
      editedBy: currentUser,
      previousItems: entry.items,
      newItems,
    };

    const all: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    const idx = all.findIndex((s) => s.id === entry.id);
    if (idx !== -1) {
      all[idx].items = newItems;
      all[idx].editHistory = [...(all[idx].editHistory || []), historyEntry];
      localStorage.setItem("orderShippings", JSON.stringify(all));
    }

    setEditingShipmentId(null);
    setEditingShipmentPcs({});
    notifyOrderShipmentEdited(currentOrder, currentUser, entry.id);
    toast.success("Shipment entry updated");
    loadShipmentEntries(currentOrder.id);
  };

  const handleSaveArrivalEdit = (arrival: OrderArrival) => {
    const newItems = arrival.items
      .map((item, idx) => ({
        ...item,
        pcs: parseInt(editingArrivalItems[idx] || "0") || 0,
      }))
      .filter((item) => item.pcs > 0);

    if (newItems.length === 0) {
      toast.error("Please enter at least one item quantity");
      return;
    }

    const historyEntry: OrderArrivalEditHistory = {
      editedAt: Date.now(),
      editedBy: currentUser,
      previousItems: arrival.items,
      newItems,
    };

    const all: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    const idx = all.findIndex((a) => a.id === arrival.id);
    if (idx !== -1) {
      all[idx].items = newItems;
      all[idx].editHistory = [...(all[idx].editHistory || []), historyEntry];
      localStorage.setItem("orderArrivals", JSON.stringify(all));
    }

    // Re-compute delivery status
    const orderArrivals = all.filter((a) => a.orderId === currentOrder.id);
    const getTotalReceived = (item: DetailBarangItem) =>
      orderArrivals.reduce((sum, a) => {
        const found = a.items.find(
          (i) =>
            i.karat === item.kadar &&
            i.warna === item.warna &&
            i.size === item.ukuran &&
            i.berat === item.berat,
        );
        return sum + (found?.pcs || 0);
      }, 0);
    const allFulfilled = currentOrder.detailItems.every(
      (item) => getTotalReceived(item) >= (parseInt(item.pcs) || 0),
    );
    const anyReceived = currentOrder.detailItems.some(
      (item) => getTotalReceived(item) > 0,
    );
    const newDeliveryStatus = allFulfilled
      ? "Fully Delivered"
      : anyReceived
        ? "Partially Delivered"
        : null;
    if (newDeliveryStatus && currentOrder.status !== newDeliveryStatus) {
      handleUpdateStatus(currentOrder.id, newDeliveryStatus);
    }

    setEditingArrivalId(null);
    setEditingArrivalItems({});
    toast.success("Arrival updated");
    loadShipmentEntries(currentOrder.id);
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

    const existing: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    const existingForOrder = existing.filter(
      (s) => s.orderId === currentOrder.id,
    );
    const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const n = existingForOrder.length;
    const suffix = BASE36[Math.floor(n / 36)] + BASE36[n % 36];
    const shippingId = `${currentOrder.PONumber}S${suffix}`;

    const shipping: OrderShipping = {
      id: shippingId,
      orderId: currentOrder.id,
      orderPONumber: currentOrder.PONumber,
      shippingDate: new Date().toISOString().split("T")[0],
      createdDate: Date.now(),
      createdBy: currentUser,
      items,
    };

    existing.push(shipping);
    localStorage.setItem("orderShippings", JSON.stringify(existing));

    notifyOrderShipmentCreated(currentOrder, currentUser, shippingId);

    setShippingPcs({});
    toast.success("Shipping entry submitted successfully");
    loadShipmentEntries(currentOrder.id);
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

  useEffect(() => {
    if (order?.id) {
      loadShipmentEntries(order.id);
    }
  }, [order?.id]);

  // Scroll to a specific shipment entry when redirected from a notification
  useEffect(() => {
    if (shipmentEntries.length === 0) return;
    const targetId = sessionStorage.getItem("order-details-scroll-shipment");
    if (!targetId) return;
    const entry = shipmentEntries.find((e) => e.id === targetId);
    if (!entry) return;
    sessionStorage.removeItem("order-details-scroll-shipment");
    setIsShipmentEntriesOpen(true);
    // Defer scroll until section is rendered
    setTimeout(() => {
      const el = document.getElementById(`shipment-entry-${targetId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [shipmentEntries]);

  // Scroll to arrivals section when redirected from an arrival notification
  useEffect(() => {
    if (shipmentArrivals.length === 0) return;
    const flag = sessionStorage.getItem("order-details-scroll-arrivals");
    if (!flag) return;
    sessionStorage.removeItem("order-details-scroll-arrivals");
    setTimeout(() => {
      const el = document.getElementById("order-arrivals-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [shipmentArrivals]);

  // Collect all photo IDs referenced by this order (current + all revision history)
  const allOrderPhotoIds = [
    currentOrder.photoId,
    ...(currentOrder.revisionHistory || []).flatMap((r: OrderRevision) => [
      r.previousValues?.photoId,
      r.changes?.photoId,
    ]),
  ].filter(Boolean) as string[];
  const imageMap = useImageMap(allOrderPhotoIds);

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

  const compareItems = (a: DetailBarangItem, b: DetailBarangItem) => {
    const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
    const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
    if (kadarA !== kadarB) return kadarA - kadarB;
    if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
    if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
    return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
  };

  const sortDetailItems = (items: DetailBarangItem[]): DetailBarangItem[] =>
    [...items].sort(compareItems);

  const buildSortedPairs = (
    origItems: DetailBarangItem[],
    propItems: DetailBarangItem[],
  ) => {
    const propById = new Map(propItems.map((item) => [item.id, item]));
    const origById = new Map(origItems.map((item) => [item.id, item]));

    const pairs: Array<{
      orig: DetailBarangItem | undefined;
      prop: DetailBarangItem | undefined;
      pairKey: string;
    }> = [];

    // Pair each original item with its proposed counterpart (same ID), or mark as deleted
    for (const orig of origItems) {
      pairs.push({
        orig,
        prop: propById.get(orig.id),
        pairKey: orig.id,
      });
    }

    // New items added by supplier (no matching original ID)
    for (const prop of propItems) {
      if (!origById.has(prop.id)) {
        pairs.push({
          orig: undefined,
          prop,
          pairKey: `new_${prop.id}`,
        });
      }
    }

    return pairs.sort((a, b) =>
      compareItems(a.prop ?? a.orig!, b.prop ?? b.orig!),
    );
  };

  const getOrderImage = () => {
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

  if (!order) return null;

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
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white -mx-4 px-4 pt-4 pb-3 border-b border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">
              {reviewMode ? "Review Order Revision" : "Order Details"}
            </h1>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-600 font-mono font-semibold truncate">
                {order.PONumber}
              </p>
              {userRole === "supplier" && (
                <button
                  title="Print QR code for PO Number"
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                  onClick={() => printQRCode(order.PONumber, order.PONumber)}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${getStatusBadgeClasses(currentOrder.status)}`}
          >
            {getStatusLabel(currentOrder.status)}
          </span>
        </div>
      </div>

      {/* Combined Order Details Card */}
      <Card className="p-4 mb-4">
        <ProductHeader
          imageSrc={getOrderImage() as string}
          imageAlt={productNameLabel}
          title={`${jenisProdukLabel} ${productNameLabel}`}
          visibleAttributes={[
            "createdBy",
            "poNumber",
            "branch",
            "supplier",
            "eta",
            "status",
            "created",
          ]}
          status={currentOrder.status}
          poNumber={order.PONumber}
          createdByUsername={userRole !== "supplier" ? order.jbId : undefined}
          branchCode={order.branchCode}
          supplier={pabrikLabel}
          eta={order.waktuKirim}
          created={order.createdDate}
          onOriginalRequest={() => setShowRequestDialog(true)}
          hasRelatedRequest={!!relatedRequest}
        />

        {/* Supplier Revision Review - shown for Sales/JB when supplier has proposed changes */}
        {(userRole === "sales" || userRole === "jb") &&
          (currentOrder.status === "Pending Sales Review" ||
            currentOrder.status === "Pending JB Review") &&
          currentOrder.revisionHistory &&
          currentOrder.revisionHistory.length > 0 &&
          (() => {
            const lastRevision =
              currentOrder.revisionHistory[
                currentOrder.revisionHistory.length - 1
              ];
            const etaChanged =
              lastRevision.previousValues.waktuKirim !==
              currentOrder.waktuKirim;

            // Photo change at outer level so allItemsDecided can reference it
            const photoChangedOuter =
              lastRevision.previousValues.photoId !==
                lastRevision.changes.photoId &&
              !!(
                lastRevision.previousValues.photoId ||
                lastRevision.changes.photoId
              );

            // Compute whether every changed row has a decision
            // For JB or Sales reviewing submitted decisions: use the full supplier proposal
            const revisedPropItems =
              lastRevision.changes.detailItems &&
              (userRole === "jb" ||
                (userRole === "sales" && currentOrder.salesApproved))
                ? lastRevision.changes.detailItems
                : currentOrder.detailItems;
            const revisedPairs = lastRevision.previousValues.detailItems
              ? buildSortedPairs(
                  lastRevision.previousValues.detailItems,
                  revisedPropItems,
                )
              : [];
            const salesDecisionsOuter = lastRevision.salesRowDecisions ?? {};
            const allItemsDecided =
              (!etaChanged || etaDecision === "accept") &&
              (!photoChangedOuter || photoDecision === "accept") &&
              revisedPairs
                .filter(({ orig, prop, pairKey }) => {
                  // Sales-rejected rows don't need a JB decision
                  if (salesDecisionsOuter[pairKey] === "reject") return false;
                  // Deleted rows that sales already accepted don't need a JB decision
                  if (
                    !!orig &&
                    !prop &&
                    salesDecisionsOuter[pairKey] === "accept"
                  )
                    return false;
                  const del = !!orig && !prop;
                  const nw = !orig && !!prop;
                  return (
                    nw ||
                    del ||
                    (!nw &&
                      !del &&
                      (orig!.kadar !== prop!.kadar ||
                        orig!.warna !== prop!.warna ||
                        orig!.ukuran !== prop!.ukuran ||
                        (orig!.berat || "") !== (prop!.berat || "") ||
                        orig!.pcs !== prop!.pcs))
                  );
                })
                .every(({ pairKey }) => !!rowDecisions[pairKey]);

            // Who can take action: Sales at Pending Sales Review, JB at Pending JB Review
            const canAct =
              (currentOrder.status === "Pending Sales Review" &&
                userRole === "sales") ||
              (currentOrder.status === "Pending JB Review" &&
                userRole === "jb");

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
                    <div className="flex items-center gap-2 text-sm flex-wrap">
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
                          ? new Date(
                              currentOrder.waktuKirim,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                      <div className="flex gap-1 ml-2">
                        {canAct && (
                          <>
                            <button
                              onClick={() =>
                                setEtaDecision(
                                  etaDecision === "accept" ? null : "accept",
                                )
                              }
                              title="Accept ETA change"
                              className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                                etaDecision === "accept"
                                  ? "bg-green-600 text-white"
                                  : "border border-green-600 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectContext("ETA change");
                                setShowRejectReasonDialog(true);
                              }}
                              title="Reject ETA change (will cancel order)"
                              className="h-6 w-6 rounded flex items-center justify-center transition-colors border border-red-500 text-red-500 hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
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
                              <p className="text-xs text-gray-500 mb-1">
                                Before
                              </p>
                              <img
                                src={beforeImg}
                                alt="Before"
                                className="w-36 h-36 object-cover rounded border-2 border-red-500"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-red-700 font-medium mb-1">
                                After (proposed)
                              </p>
                              <img
                                src={afterImg}
                                alt="After"
                                className="w-36 h-36 object-cover rounded border-2 border-red-500"
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
                        {photoChanged && canAct && (
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() =>
                                setPhotoDecision(
                                  photoDecision === "accept" ? null : "accept",
                                )
                              }
                              title="Accept photo change"
                              className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                                photoDecision === "accept"
                                  ? "bg-green-600 text-white"
                                  : "border border-green-600 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectContext("Photo change");
                                setShowRejectReasonDialog(true);
                              }}
                              title="Reject photo change (will cancel order)"
                              className="h-6 w-6 rounded flex items-center justify-center transition-colors border border-red-500 text-red-500 hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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

                {lastRevision.previousValues.detailItems &&
                  (() => {
                    const origItems = lastRevision.previousValues.detailItems!;
                    // When JB reviews or Sales views their submitted review, show the full supplier
                    // proposal (before sales filtered it) so all rows are visible with sales decisions.
                    const useFullProposal =
                      lastRevision.changes.detailItems &&
                      (userRole === "jb" ||
                        (userRole === "sales" && currentOrder.salesApproved));
                    const propItems = useFullProposal
                      ? lastRevision.changes.detailItems!
                      : currentOrder.detailItems;
                    const sortedPairs = buildSortedPairs(origItems, propItems);
                    const salesDecisions = lastRevision.salesRowDecisions ?? {};

                    // Returns true if applying `newDecision` to `newPairKey` would leave 0 surviving rows
                    const wouldRemoveLastRow = (
                      newPairKey: string,
                      newDecision: "accept" | "reject",
                    ) => {
                      const proposed: Record<string, "accept" | "reject"> = {
                        ...rowDecisions,
                        [newPairKey]: newDecision,
                      };
                      return sortedPairs.every(
                        ({ orig, prop, pairKey: pk }) => {
                          const dec = proposed[pk] ?? salesDecisions[pk];
                          if (!!orig && !prop && dec === "accept") return true; // deleted + accepted → removed
                          if (!orig && !!prop && dec === "reject") return true; // new + rejected → removed
                          if (!!orig && !!prop && dec === "reject") return true; // updated + rejected → removed
                          return false;
                        },
                      );
                    };

                    return (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Item Changes:
                        </p>
                        <div className="overflow-auto max-h-[280px]">
                          <table className="w-full border-collapse border text-xs">
                            <thead className="bg-orange-50 sticky top-0">
                              <tr>
                                <th className="border p-1 w-6">#</th>
                                <th className="border p-1">Kadar</th>
                                <th className="border p-1">Warna</th>
                                <th className="border p-1">Ukuran</th>
                                <th className="border p-1">Berat</th>
                                <th className="border p-1">Pcs</th>
                                <th className="border p-1">
                                  Supplier's change
                                </th>
                                <th className="border p-1">Sales's choice</th>
                                <th className="border p-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedPairs.map(
                                ({ orig, prop, pairKey }, displayIdx) => {
                                  const decision = rowDecisions[pairKey];
                                  // Effective sales decision: in-progress local decision (while reviewing) OR saved decision (after submission)
                                  const effectiveSalesDecision =
                                    canAct && userRole === "sales"
                                      ? decision
                                      : salesDecisions[pairKey];
                                  // Whether a sales decision is visible (during review by sales, or after submission for JB/sales)
                                  const salesDecisionMade =
                                    (canAct &&
                                      userRole === "sales" &&
                                      !!decision) ||
                                    ((userRole === "jb" ||
                                      (userRole === "sales" &&
                                        currentOrder.salesApproved)) &&
                                      !!salesDecisions[pairKey]);
                                  const salesRejectedRow =
                                    salesDecisionMade &&
                                    effectiveSalesDecision === "reject";
                                  // Only true when sales has SAVED their reject decision (after submission)
                                  // Used for button visibility so buttons stay visible while sales is choosing
                                  const salesSavedRejected =
                                    salesDecisions[pairKey] === "reject";
                                  const isDeleted = !!orig && !prop;
                                  const isNew = !orig && !!prop;
                                  const kadarChanged =
                                    !isNew &&
                                    !isDeleted &&
                                    orig!.kadar !== prop!.kadar;
                                  const warnaChanged =
                                    !isNew &&
                                    !isDeleted &&
                                    orig!.warna !== prop!.warna;
                                  const ukuranChanged =
                                    !isNew &&
                                    !isDeleted &&
                                    orig!.ukuran !== prop!.ukuran;
                                  const beratChanged =
                                    !isNew &&
                                    !isDeleted &&
                                    (orig!.berat || "") !== (prop!.berat || "");
                                  const pcsChanged =
                                    !isNew &&
                                    !isDeleted &&
                                    orig!.pcs !== prop!.pcs;
                                  const hasChange =
                                    isNew ||
                                    isDeleted ||
                                    kadarChanged ||
                                    warnaChanged ||
                                    ukuranChanged ||
                                    beratChanged ||
                                    pcsChanged;
                                  const isAccepted = decision === "accept";
                                  const isRejected = decision === "reject";
                                  // Whether sales already accepted this row (visible to JB and Sales after submission)
                                  const salesAcceptedRow =
                                    salesDecisionMade &&
                                    effectiveSalesDecision === "accept";

                                  // User confirmed the row will be removed:
                                  // - deleted by supplier and user accepted the deletion (or sales pre-approved it)
                                  // - new row added by supplier that user rejected
                                  // - updated row that user rejected (row is dropped)
                                  const isConfirmedRemoval =
                                    salesRejectedRow ||
                                    (isDeleted &&
                                      (isAccepted || salesAcceptedRow)) ||
                                    (isNew && isRejected) ||
                                    (!isNew && !isDeleted && isRejected);

                                  // Any row that should show strikethrough on values:
                                  // - supplier proposed deletion (any decision state)
                                  // - new row that user rejected
                                  // - updated row that user rejected
                                  const needsStrike =
                                    isDeleted || isConfirmedRemoval;

                                  // For modified rows that are rejected (or sales-rejected), show the proposed values with strikethrough
                                  const displayItem = salesRejectedRow
                                    ? (prop ?? orig!)
                                    : !isNew && isRejected && orig
                                      ? orig
                                      : (prop ?? orig!);
                                  const origUd = orig
                                    ? getUkuranDisplay(orig.ukuran)
                                    : null;
                                  const displayUd = getUkuranDisplay(
                                    displayItem.ukuran,
                                  );

                                  let rowBg = "";
                                  if (isConfirmedRemoval) rowBg = "bg-red-50";
                                  else if (isDeleted) rowBg = "bg-red-50";
                                  else if (salesAcceptedRow)
                                    rowBg = "bg-green-50";
                                  else if (isNew)
                                    rowBg = isAccepted
                                      ? "bg-green-100"
                                      : "bg-green-50";
                                  else if (!isNew && isRejected)
                                    rowBg = "bg-amber-50";
                                  else if (isAccepted) rowBg = "bg-green-50";

                                  const showStrikeLine = isConfirmedRemoval;
                                  const strikeLineTdStyle = showStrikeLine
                                    ? {
                                        backgroundImage:
                                          "linear-gradient(transparent calc(50% - 1px), #ef4444 calc(50% - 1px), #ef4444 calc(50% + 1px), transparent calc(50% + 1px))",
                                      }
                                    : undefined;

                                  return (
                                    <tr key={pairKey} className={rowBg}>
                                      {/* # cell — XCircle when confirmed removal, strikethrough when pending deletion */}
                                      <td
                                        className="border p-1 text-center"
                                        style={strikeLineTdStyle}
                                      >
                                        {isConfirmedRemoval ? (
                                          <XCircle className="w-3.5 h-3.5 text-red-500 mx-auto" />
                                        ) : isDeleted ? (
                                          <span className="line-through text-red-500">
                                            {displayIdx + 1}
                                          </span>
                                        ) : (
                                          displayIdx + 1
                                        )}
                                      </td>

                                      {/* Kadar */}
                                      <td
                                        className="border p-1 font-medium"
                                        style={strikeLineTdStyle}
                                      >
                                        {kadarChanged && !isRejected && (
                                          <span className="line-through text-red-500 mr-1">
                                            {orig!.kadar.toUpperCase()}
                                          </span>
                                        )}
                                        <span
                                          className={`${
                                            kadarChanged &&
                                            !isRejected &&
                                            !salesRejectedRow
                                              ? "text-green-700 font-semibold"
                                              : ""
                                          } ${needsStrike ? "line-through text-red-500" : ""}`}
                                        >
                                          {displayItem.kadar.toUpperCase()}
                                        </span>
                                      </td>

                                      {/* Warna */}
                                      <td
                                        className={`border p-1 ${
                                          !warnaChanged && !needsStrike
                                            ? getWarnaColor(displayItem.warna)
                                            : ""
                                        }`}
                                        style={strikeLineTdStyle}
                                      >
                                        {warnaChanged && !isRejected && (
                                          <span className="line-through text-red-500 mr-1">
                                            {getWarnaLabel(orig!.warna)}
                                          </span>
                                        )}
                                        <span
                                          className={`${
                                            warnaChanged &&
                                            !isRejected &&
                                            !salesRejectedRow
                                              ? "text-green-700 font-semibold"
                                              : ""
                                          } ${needsStrike ? "line-through text-red-500" : ""}`}
                                        >
                                          {getWarnaLabel(displayItem.warna)}
                                        </span>
                                      </td>

                                      {/* Ukuran */}
                                      <td
                                        className="border p-1"
                                        style={strikeLineTdStyle}
                                      >
                                        {ukuranChanged &&
                                          origUd &&
                                          !isRejected && (
                                            <span className="line-through text-red-500 mr-1">
                                              {origUd.showUnit
                                                ? `${origUd.value} cm`
                                                : origUd.value}
                                            </span>
                                          )}
                                        <span
                                          className={`${
                                            ukuranChanged &&
                                            !isRejected &&
                                            !salesRejectedRow
                                              ? "text-green-700 font-semibold"
                                              : ""
                                          } ${needsStrike ? "line-through text-red-500" : ""}`}
                                        >
                                          {displayUd.showUnit
                                            ? `${displayUd.value} cm`
                                            : displayUd.value}
                                        </span>
                                      </td>

                                      {/* Berat */}
                                      <td
                                        className="border p-1"
                                        style={strikeLineTdStyle}
                                      >
                                        {beratChanged && !isRejected && (
                                          <span className="line-through text-red-500 mr-1">
                                            {orig!.berat || "-"}
                                          </span>
                                        )}
                                        <span
                                          className={`${
                                            beratChanged &&
                                            !isRejected &&
                                            !salesRejectedRow
                                              ? "text-green-700 font-semibold"
                                              : ""
                                          } ${needsStrike ? "line-through text-red-500" : ""}`}
                                        >
                                          {displayItem.berat || "-"}
                                        </span>
                                      </td>

                                      {/* Pcs */}
                                      <td
                                        className="border p-1"
                                        style={strikeLineTdStyle}
                                      >
                                        {pcsChanged && !isRejected && (
                                          <span className="line-through text-red-500 mr-1">
                                            {orig!.pcs}
                                          </span>
                                        )}
                                        <span
                                          className={`${
                                            pcsChanged &&
                                            !isRejected &&
                                            !salesRejectedRow
                                              ? "text-green-700 font-semibold"
                                              : ""
                                          } ${needsStrike ? "line-through text-red-500" : ""}`}
                                        >
                                          {displayItem.pcs}
                                        </span>
                                      </td>

                                      {/* Supplier's change */}
                                      <td className="border p-1 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-between gap-1">
                                          <span>
                                            {isDeleted && (
                                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                                Removed
                                              </span>
                                            )}
                                            {isNew && (
                                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                                New
                                              </span>
                                            )}
                                            {!isDeleted &&
                                              !isNew &&
                                              hasChange && (
                                                <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                                                  Updated
                                                </span>
                                              )}
                                            {!hasChange && (
                                              <span className="text-gray-400">
                                                —
                                              </span>
                                            )}
                                          </span>
                                          {prop?.supplierNotes ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = (
                                                  e.currentTarget as HTMLElement
                                                ).getBoundingClientRect();
                                                setShowingSupplierNoteTooltip(
                                                  (
                                                    prev: typeof showingSupplierNoteTooltip,
                                                  ) =>
                                                    prev
                                                      ? null
                                                      : {
                                                          notes:
                                                            prop.supplierNotes!,
                                                          x:
                                                            rect.left +
                                                            window.scrollX,
                                                          y:
                                                            rect.bottom +
                                                            window.scrollY +
                                                            6,
                                                        },
                                                );
                                              }}
                                              title="Supplier Notes"
                                              className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                                            >
                                              <Info className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <span className="w-3.5" />
                                          )}
                                        </div>
                                      </td>

                                      {/* Sales's choice */}
                                      <td className="border p-1 text-center whitespace-nowrap">
                                        {salesRejectedRow && (
                                          <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                            ✕ Rejected
                                          </span>
                                        )}
                                        {salesAcceptedRow && (
                                          <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                            ✓ Approved
                                          </span>
                                        )}
                                        {!salesRejectedRow &&
                                          !salesAcceptedRow && (
                                            <span className="text-gray-400">
                                              —
                                            </span>
                                          )}
                                      </td>

                                      {/* Accept / Reject buttons — only on changed rows, only when canAct, not for sales-rejected rows,
                                          and not for rows sales already approved for removal (e.g. deleted row accepted by sales) */}
                                      <td className="border p-1 text-center whitespace-nowrap">
                                        {hasChange &&
                                          canAct &&
                                          !salesSavedRejected &&
                                          !(
                                            userRole === "jb" &&
                                            isDeleted &&
                                            salesAcceptedRow
                                          ) && (
                                            <div className="flex gap-1 justify-center">
                                              <button
                                                onClick={() => {
                                                  const nextDecision =
                                                    isAccepted
                                                      ? undefined
                                                      : "accept";
                                                  if (
                                                    nextDecision === "accept" &&
                                                    isDeleted &&
                                                    wouldRemoveLastRow(
                                                      pairKey,
                                                      "accept",
                                                    )
                                                  ) {
                                                    setPendingAction({
                                                      label:
                                                        "Remove last remaining item?",
                                                      description:
                                                        "Approving this removal will leave the order with no items, which will cancel the order. Are you sure?",
                                                      onConfirm: () =>
                                                        setRowDecisions(
                                                          (
                                                            prev: Record<
                                                              string,
                                                              | "accept"
                                                              | "reject"
                                                            >,
                                                          ) => ({
                                                            ...prev,
                                                            [pairKey]: "accept",
                                                          }),
                                                        ),
                                                    });
                                                  } else {
                                                    setRowDecisions(
                                                      (
                                                        prev: Record<
                                                          string,
                                                          "accept" | "reject"
                                                        >,
                                                      ) => ({
                                                        ...prev,
                                                        [pairKey]:
                                                          prev[pairKey] ===
                                                          "accept"
                                                            ? (undefined as any)
                                                            : "accept",
                                                      }),
                                                    );
                                                  }
                                                }}
                                                title="Accept this change"
                                                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                                                  isAccepted
                                                    ? "bg-green-600 text-white"
                                                    : "border border-green-600 text-green-600 hover:bg-green-50"
                                                }`}
                                              >
                                                <Check className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (isDeleted) {
                                                    const label = `Removed row #${displayIdx + 1}: ${orig!.kadar} ${orig!.warna} ${orig!.ukuran}`;
                                                    setRejectContext(label);
                                                    setShowRejectReasonDialog(
                                                      true,
                                                    );
                                                  } else if (
                                                    !isRejected &&
                                                    wouldRemoveLastRow(
                                                      pairKey,
                                                      "reject",
                                                    )
                                                  ) {
                                                    setPendingAction({
                                                      label:
                                                        "Remove last remaining item?",
                                                      description: isNew
                                                        ? "Rejecting this new item will leave the order with no items, which will cancel the order. Are you sure?"
                                                        : "Rejecting this change removes the row entirely and will leave the order with no items, which will cancel the order. Are you sure?",
                                                      onConfirm: () =>
                                                        setRowDecisions(
                                                          (
                                                            prev: Record<
                                                              string,
                                                              | "accept"
                                                              | "reject"
                                                            >,
                                                          ) => ({
                                                            ...prev,
                                                            [pairKey]: "reject",
                                                          }),
                                                        ),
                                                    });
                                                  } else {
                                                    setRowDecisions(
                                                      (
                                                        prev: Record<
                                                          string,
                                                          "accept" | "reject"
                                                        >,
                                                      ) => ({
                                                        ...prev,
                                                        [pairKey]:
                                                          prev[pairKey] ===
                                                          "reject"
                                                            ? (undefined as any)
                                                            : "reject",
                                                      }),
                                                    );
                                                  }
                                                }}
                                                title={
                                                  isDeleted
                                                    ? "Reject this removal (will cancel order)"
                                                    : "Reject this change"
                                                }
                                                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                                                  isRejected
                                                    ? "bg-red-600 text-white"
                                                    : "border border-red-500 text-red-500 hover:bg-red-50"
                                                }`}
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                <div className="flex gap-3 justify-end flex-wrap items-center">
                  {canAct &&
                    (() => {
                      const actionableKeys = revisedPairs
                        .filter(({ orig, prop, pairKey }) => {
                          if (salesDecisionsOuter[pairKey] === "reject")
                            return false;
                          if (
                            !!orig &&
                            !prop &&
                            salesDecisionsOuter[pairKey] === "accept"
                          )
                            return false;
                          const del = !!orig && !prop;
                          const nw = !orig && !!prop;
                          return (
                            nw ||
                            del ||
                            (!nw &&
                              !del &&
                              (orig!.kadar !== prop!.kadar ||
                                orig!.warna !== prop!.warna ||
                                orig!.ukuran !== prop!.ukuran ||
                                (orig!.berat || "") !== (prop!.berat || "") ||
                                orig!.pcs !== prop!.pcs))
                          );
                        })
                        .map(({ pairKey }) => pairKey);
                      return (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRowDecisions((prev) => {
                                const next = { ...prev };
                                actionableKeys.forEach((k) => {
                                  next[k] = "accept";
                                });
                                return next;
                              });
                              if (etaChanged) setEtaDecision("accept");
                              if (photoChangedOuter) setPhotoDecision("accept");
                            }}
                            className="border-green-600 text-green-700 hover:bg-green-50"
                          >
                            Approve All
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setRowDecisions({});
                              if (typeof setEtaDecision === "function")
                                setEtaDecision(null);
                              if (typeof setPhotoDecision === "function")
                                setPhotoDecision(null);
                            }}
                            className="border-gray-400 text-gray-700 hover:bg-gray-100"
                          >
                            Clear Selection
                          </Button>

                          <Button
                            onClick={() =>
                              setPendingAction({
                                label: "Submit Review",
                                description:
                                  "Are you sure you want to submit your review of the supplier's proposed changes? This action cannot be undone.",
                                onConfirm: handleApproveSupplierRevision,
                              })
                            }
                            disabled={!allItemsDecided}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit
                          </Button>
                        </>
                      );
                    })()}
                  {!canAct && (
                    <span className="text-sm text-gray-500 italic self-center">
                      {currentOrder.status === "Pending Sales Review"
                        ? "Awaiting Sales review…"
                        : userRole === "sales"
                          ? "✓ Your review has been submitted. Awaiting JB review."
                          : "✓ Your review has been submitted. Awaiting JB review."}
                    </span>
                  )}
                </div>
              </Card>
            );
          })()}

        {/* Supplier's own submitted revision view — shown to supplier while awaiting review */}
        {userRole === "supplier" &&
          (currentOrder.status === "Pending Sales Review" ||
            currentOrder.status === "Pending JB Review") &&
          currentOrder.revisionHistory &&
          currentOrder.revisionHistory.length > 0 &&
          (() => {
            const lastRevision =
              currentOrder.revisionHistory[
                currentOrder.revisionHistory.length - 1
              ];
            const origItems = lastRevision.previousValues.detailItems ?? [];
            const propItems =
              lastRevision.changes.detailItems ?? currentOrder.detailItems;
            const pairs =
              origItems.length > 0
                ? buildSortedPairs(origItems, propItems)
                : [];
            const etaChanged =
              lastRevision.previousValues.waktuKirim !== undefined &&
              lastRevision.previousValues.waktuKirim !==
                currentOrder.waktuKirim;

            return (
              <Card className="p-4 mb-4 border-blue-300 bg-blue-50">
                <h3 className="font-semibold text-lg mb-1 text-blue-900">
                  Your Submitted Changes
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  ⏳{" "}
                  {currentOrder.status === "Pending Sales Review"
                    ? "Awaiting Sales review"
                    : "Awaiting JB review"}
                </p>

                {lastRevision.revisionNotes && (
                  <div className="bg-white p-3 rounded border border-blue-200 mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Your Notes:
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {lastRevision.revisionNotes}
                    </p>
                  </div>
                )}

                {etaChanged && (
                  <div className="bg-white p-3 rounded border border-blue-200 mb-3">
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
                          ? new Date(
                              currentOrder.waktuKirim,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </div>
                )}

                {pairs.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Item Changes:
                    </p>
                    <div className="overflow-auto max-h-[240px]">
                      <table className="w-full border-collapse border text-xs">
                        <thead className="bg-blue-100 sticky top-0">
                          <tr>
                            <th className="border p-1 w-6">#</th>
                            <th className="border p-1">Kadar</th>
                            <th className="border p-1">Warna</th>
                            <th className="border p-1">Ukuran</th>
                            <th className="border p-1">Berat</th>
                            <th className="border p-1">Pcs</th>
                            <th className="border p-1">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairs.map(({ orig, prop, pairKey }, idx) => {
                            const isDeleted = !!orig && !prop;
                            const isNew = !orig && !!prop;
                            const display = prop ?? orig!;
                            const ukuranD = getUkuranDisplay(display.ukuran);
                            const hasChange =
                              isNew ||
                              isDeleted ||
                              (!isNew &&
                                !isDeleted &&
                                (orig!.kadar !== prop!.kadar ||
                                  orig!.warna !== prop!.warna ||
                                  orig!.ukuran !== prop!.ukuran ||
                                  (orig!.berat || "") !== (prop!.berat || "") ||
                                  orig!.pcs !== prop!.pcs));
                            let rowBg = "";
                            if (isDeleted) rowBg = "bg-red-50";
                            else if (isNew) rowBg = "bg-green-50";
                            else if (hasChange) rowBg = "bg-orange-50";
                            return (
                              <tr key={pairKey} className={rowBg}>
                                <td className="border p-1 text-center">
                                  {idx + 1}
                                </td>
                                <td
                                  className={`border p-1 font-medium ${isDeleted ? "line-through text-red-500" : ""}`}
                                >
                                  {display.kadar.toUpperCase()}
                                </td>
                                <td
                                  className={`border p-1 ${isDeleted ? "line-through text-red-500" : ""}`}
                                >
                                  {getWarnaLabel(display.warna)}
                                </td>
                                <td
                                  className={`border p-1 ${isDeleted ? "line-through text-red-500" : ""}`}
                                >
                                  {ukuranD.showUnit
                                    ? `${ukuranD.value} cm`
                                    : ukuranD.value}
                                </td>
                                <td
                                  className={`border p-1 ${isDeleted ? "line-through text-red-500" : ""}`}
                                >
                                  {display.berat || "-"}
                                </td>
                                <td
                                  className={`border p-1 ${isDeleted ? "line-through text-red-500" : ""}`}
                                >
                                  {display.pcs}
                                </td>
                                <td className="border p-1 text-center">
                                  <div className="flex items-center justify-between gap-1">
                                    <span>
                                      {isDeleted && (
                                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                                          Removed
                                        </span>
                                      )}
                                      {isNew && (
                                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                          New
                                        </span>
                                      )}
                                      {!isDeleted && !isNew && hasChange && (
                                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                                          Updated
                                        </span>
                                      )}
                                      {!hasChange && (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </span>
                                    {prop?.supplierNotes ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const rect = (
                                            e.currentTarget as HTMLElement
                                          ).getBoundingClientRect();
                                          setShowingSupplierNoteTooltip(
                                            (
                                              prev: typeof showingSupplierNoteTooltip,
                                            ) =>
                                              prev
                                                ? null
                                                : {
                                                    notes: prop.supplierNotes!,
                                                    x:
                                                      rect.left +
                                                      window.scrollX,
                                                    y:
                                                      rect.bottom +
                                                      window.scrollY +
                                                      6,
                                                  },
                                          );
                                        }}
                                        title="Supplier Notes"
                                        className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                                      >
                                        <Info className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <span className="w-3.5" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}

        {/* Order Items */}
        {((currentOrder.status !== "Pending Sales Review" &&
          currentOrder.status !== "Pending JB Review" &&
          currentOrder.status !== "Change Pending Approval") ||
          userRole === "supplier") && (
          <div className="border-t pt-4 mt-4">
            {userRole === "supplier" &&
            (currentOrder.status === "In Production" ||
              currentOrder.status === "Stock Ready" ||
              currentOrder.status === "Partially Delivered")
              ? (() => {
                  const getShippedPcs = (item: DetailBarangItem) =>
                    shipmentEntries.reduce((total, se) => {
                      const found = se.items.find(
                        (i) =>
                          i.kadar === item.kadar &&
                          i.warna === item.warna &&
                          i.ukuran === item.ukuran &&
                          i.berat === item.berat,
                      );
                      return total + (found?.pcs || 0);
                    }, 0);

                  const getReceivedPcs = (item: DetailBarangItem) =>
                    shipmentArrivals.reduce((total, arrival) => {
                      const found = arrival.items.find(
                        (i) =>
                          i.karat === item.kadar &&
                          i.warna === item.warna &&
                          i.size === item.ukuran &&
                          i.berat === item.berat,
                      );
                      return total + (found?.pcs || 0);
                    }, 0);

                  const hasAnyShipping = currentOrder.detailItems.some(
                    (item) => parseInt(shippingPcs[item.id] || "0") > 0,
                  );

                  return (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Order Items
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Kadar</th>
                              <th className="px-3 py-2 text-left">Warna</th>
                              <th className="px-3 py-2 text-left">Ukuran</th>
                              <th className="px-3 py-2 text-right">Berat</th>
                              <th className="px-3 py-2 text-right">Ordered</th>
                              <th className="px-3 py-2 text-right">Shipped</th>
                              <th className="px-3 py-2 text-right">Received</th>
                              <th className="px-3 py-2 w-12" />
                              <th className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  Shipping
                                  <button
                                    title="Match all outstanding quantities (Ordered − Shipped)"
                                    className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                    onClick={() => {
                                      const newPcs: Record<string, string> = {};
                                      sortDetailItems(
                                        currentOrder.detailItems,
                                      ).forEach((item) => {
                                        const ordered = parseInt(item.pcs) || 0;
                                        const shipped = getShippedPcs(item);
                                        newPcs[item.id] = String(
                                          Math.max(0, ordered - shipped),
                                        );
                                      });
                                      setShippingPcs(newPcs);
                                    }}
                                  >
                                    <CheckCheck className="w-4 h-4" />
                                  </button>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortDetailItems(currentOrder.detailItems).map(
                              (item) => {
                                const ordered = parseInt(item.pcs) || 0;
                                const shipped = getShippedPcs(item);
                                const received = getReceivedPcs(item);
                                const outstanding = Math.max(
                                  0,
                                  ordered - shipped,
                                );
                                const ukuranDisplay = getUkuranDisplay(
                                  item.ukuran,
                                );
                                return (
                                  <tr
                                    key={item.id}
                                    className={`border-t ${received >= ordered && ordered > 0 ? "bg-green-100" : shipped >= ordered && ordered > 0 ? "bg-green-50" : ""}`}
                                  >
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
                                    <td className="px-3 py-2 text-right">
                                      {item.berat || "-"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {ordered}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {shipped}
                                        {shipped >= ordered && ordered > 0 && (
                                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        {received}
                                        {received >= ordered && ordered > 0 ? (
                                          <CheckCheck className="w-4 h-4 text-green-600 shrink-0" />
                                        ) : received >= shipped &&
                                          shipped > 0 ? (
                                          <Check className="w-4 h-4 text-green-600 shrink-0" />
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 w-12 text-center">
                                      {item.notes ? (
                                        <Tooltip
                                          open={notesOpenId === item.id}
                                          onOpenChange={(open) =>
                                            setNotesOpenId(
                                              open ? item.id : null,
                                            )
                                          }
                                        >
                                          <TooltipTrigger asChild>
                                            <button
                                              className="p-0.5 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                              onClick={() =>
                                                setNotesOpenId(
                                                  notesOpenId === item.id
                                                    ? null
                                                    : item.id,
                                                )
                                              }
                                            >
                                              <Info className="w-4 h-4" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="max-w-[240px] whitespace-pre-wrap break-words text-xs"
                                          >
                                            {item.notes}
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : null}
                                    </td>
                                    <td className="px-3 py-2">
                                      {shipped >= ordered &&
                                      ordered > 0 &&
                                      !shippingEditingRows.has(item.id) ? (
                                        <div className="flex items-center justify-end">
                                          <button
                                            title="Edit shipping quantity"
                                            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                            onClick={() =>
                                              setShippingEditingRows((prev) => {
                                                const next = new Set(prev);
                                                next.add(item.id);
                                                return next;
                                              })
                                            }
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end gap-1">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={shippingPcs[item.id] || ""}
                                            onChange={(e) => {
                                              const v = e.target.value.replace(
                                                /[^0-9]/g,
                                                "",
                                              );
                                              setShippingPcs((prev) => ({
                                                ...prev,
                                                [item.id]: v,
                                              }));
                                            }}
                                            className="w-20 text-right"
                                            placeholder="0"
                                          />
                                          <button
                                            title="Match outstanding quantity"
                                            onClick={() =>
                                              setShippingPcs((prev) => ({
                                                ...prev,
                                                [item.id]: String(outstanding),
                                              }))
                                            }
                                            className="p-1 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                                          >
                                            <ChevronsRight className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={() => {
                            const total = currentOrder.detailItems.reduce(
                              (s, item) =>
                                s +
                                (parseInt(shippingPcs[item.id] || "0") || 0),
                              0,
                            );
                            setPendingAction({
                              label: "Submit Shipping",
                              description: `Submit shipping of ${total} pcs for order ${currentOrder.PONumber}?`,
                              onConfirm: handleSubmitShipping,
                            });
                          }}
                          disabled={!hasAnyShipping}
                          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Shipping
                        </Button>
                      </div>
                    </div>
                  );
                })()
              : userRole === "sales" || userRole === "jb"
                ? (() => {
                    const getShippedPcsSJ = (item: DetailBarangItem) =>
                      shipmentEntries.reduce((total, se) => {
                        const found = se.items.find(
                          (i) =>
                            i.kadar === item.kadar &&
                            i.warna === item.warna &&
                            i.ukuran === item.ukuran &&
                            i.berat === item.berat,
                        );
                        return total + (found?.pcs || 0);
                      }, 0);

                    const getReceivedPcsSJ = (item: DetailBarangItem) =>
                      shipmentArrivals.reduce((total, arrival) => {
                        const found = arrival.items.find(
                          (i) =>
                            i.karat === item.kadar &&
                            i.warna === item.warna &&
                            i.size === item.ukuran &&
                            i.berat === item.berat,
                        );
                        return total + (found?.pcs || 0);
                      }, 0);

                    return (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Order Items
                        </h3>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left">Kadar</th>
                                <th className="px-3 py-2 text-left">Warna</th>
                                <th className="px-3 py-2 text-left">Ukuran</th>
                                <th className="px-3 py-2 text-right">Berat</th>
                                <th className="px-3 py-2 text-right">
                                  Ordered
                                </th>
                                <th className="px-3 py-2 text-right">
                                  Shipped
                                </th>
                                <th className="px-3 py-2 text-right">
                                  Received
                                </th>
                                <th className="px-3 py-2 w-12" />
                                {canRecordArrival && (
                                  <>
                                    <th className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        Arrival
                                        <button
                                          title="Match all remaining (Ordered − Received)"
                                          className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                          onClick={() => {
                                            const newPcs: Record<
                                              string,
                                              string
                                            > = {};
                                            sortDetailItems(
                                              currentOrder.detailItems,
                                            ).forEach((item) => {
                                              const ordered =
                                                parseInt(item.pcs) || 0;
                                              const received =
                                                getReceivedPcsSJ(item);
                                              newPcs[item.id] = String(
                                                Math.max(0, ordered - received),
                                              );
                                            });
                                            setInlineArrivalPcs(newPcs);
                                          }}
                                        >
                                          <CheckCheck className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {sortDetailItems(currentOrder.detailItems).map(
                                (item) => {
                                  const ordered = parseInt(item.pcs) || 0;
                                  const shipped = getShippedPcsSJ(item);
                                  const received = getReceivedPcsSJ(item);
                                  const remaining = Math.max(
                                    0,
                                    ordered - received,
                                  );
                                  const ukuranDisplay = getUkuranDisplay(
                                    item.ukuran,
                                  );
                                  return (
                                    <tr
                                      key={item.id}
                                      className={`border-t ${received >= ordered && ordered > 0 ? "bg-green-100" : shipped >= ordered && ordered > 0 ? "bg-green-50" : ""}`}
                                    >
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
                                      <td className="px-3 py-2 text-right">
                                        {item.berat || "-"}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {ordered}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {shipped}
                                          {shipped >= ordered &&
                                            ordered > 0 && (
                                              <Check className="w-4 h-4 text-green-600 shrink-0" />
                                            )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {received}
                                          {received >= ordered &&
                                          ordered > 0 ? (
                                            <CheckCheck className="w-4 h-4 text-green-600 shrink-0" />
                                          ) : received >= shipped &&
                                            shipped > 0 ? (
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                          ) : null}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 w-12 text-center">
                                        {item.notes ? (
                                          <Tooltip
                                            open={notesOpenId === item.id}
                                            onOpenChange={(open) =>
                                              setNotesOpenId(
                                                open ? item.id : null,
                                              )
                                            }
                                          >
                                            <TooltipTrigger asChild>
                                              <button
                                                className="p-0.5 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                                onClick={() =>
                                                  setNotesOpenId(
                                                    notesOpenId === item.id
                                                      ? null
                                                      : item.id,
                                                  )
                                                }
                                              >
                                                <Info className="w-4 h-4" />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="top"
                                              className="max-w-[240px] whitespace-pre-wrap break-words text-xs"
                                            >
                                              {item.notes}
                                            </TooltipContent>
                                          </Tooltip>
                                        ) : null}
                                      </td>
                                      {canRecordArrival && (
                                        <td className="px-3 py-2">
                                          {received >= shipped &&
                                          shipped > 0 &&
                                          !inlineArrivalEditingRows.has(
                                            item.id,
                                          ) ? (
                                            <div className="flex items-center justify-end">
                                              <button
                                                title="Edit arrival quantity"
                                                className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                                onClick={() =>
                                                  setInlineArrivalEditingRows(
                                                    (prev) => {
                                                      const next = new Set(
                                                        prev,
                                                      );
                                                      next.add(item.id);
                                                      return next;
                                                    },
                                                  )
                                                }
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-end gap-1">
                                              <Input
                                                type="number"
                                                min="0"
                                                value={
                                                  inlineArrivalPcs[item.id] ??
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  setInlineArrivalPcs(
                                                    (prev) => ({
                                                      ...prev,
                                                      [item.id]: e.target.value,
                                                    }),
                                                  )
                                                }
                                                className="w-20 text-right"
                                                placeholder="0"
                                              />
                                              <button
                                                title="Match remaining quantity"
                                                className="p-1 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                                                onClick={() =>
                                                  setInlineArrivalPcs(
                                                    (prev) => ({
                                                      ...prev,
                                                      [item.id]:
                                                        String(remaining),
                                                    }),
                                                  )
                                                }
                                              >
                                                <ChevronsRight className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                        {canRecordArrival && (
                          <div className="flex justify-end mt-3">
                            <Button
                              onClick={() => {
                                const total = Object.values(
                                  inlineArrivalPcs,
                                ).reduce((s, v) => s + (parseInt(v) || 0), 0);
                                setPendingAction({
                                  label: "Record Arrivals",
                                  description: `Record ${total} pcs manual arrival for order ${currentOrder.PONumber}?`,
                                  onConfirm: handleSaveDirectArrivals,
                                });
                              }}
                              disabled={
                                !Object.values(inlineArrivalPcs).some(
                                  (v) => parseInt(v) > 0,
                                )
                              }
                              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Record Arrivals
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()
                : (() => {
                    // For supplier in Pending states, show their proposed (latest revision) items
                    const isPendingReview =
                      userRole === "supplier" &&
                      (currentOrder.status === "Pending Sales Review" ||
                        currentOrder.status === "Pending JB Review");
                    const lastRevision =
                      currentOrder.revisionHistory?.[
                        currentOrder.revisionHistory.length - 1
                      ];
                    const displayItems =
                      isPendingReview && lastRevision?.changes?.detailItems
                        ? lastRevision.changes.detailItems
                        : sortDetailItems(order.detailItems);

                    return (
                      <div>
                        {isPendingReview && (
                          <p className="text-xs text-orange-600 mb-2 italic">
                            Showing your proposed items — awaiting review
                          </p>
                        )}
                        <DetailItemsTable
                          items={sortDetailItems(displayItems)}
                          mode="readonly"
                          getKadarColor={getKadarColor}
                          getWarnaColor={getWarnaColor}
                          getWarnaLabel={getWarnaLabel}
                          getUkuranLabel={(ukuran) => {
                            const display = getUkuranDisplay(ukuran);
                            return display.showUnit
                              ? `${display.value} cm`
                              : display.value;
                          }}
                          title="Order Items"
                        />
                      </div>
                    );
                  })()}
          </div>
        )}

        {/* Revision History - always visible for all users */}
        {(userRole !== "supplier" ||
          currentOrder.status === "Order Revised" ||
          currentOrder.status === "Pending Sales Review" ||
          currentOrder.status === "Pending JB Review" ||
          currentOrder.status === "Change Pending Approval") && (
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setIsRevisionHistoryOpen(!isRevisionHistoryOpen)}
              className="w-full flex items-center justify-between hover:bg-gray-50 py-1 rounded-lg transition-colors"
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
                    const firstRevision = currentOrder.revisionHistory?.[0];

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
                                        imageMap.get(
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
                  {[...(currentOrder.revisionHistory || [])]
                    .slice()
                    .reverse()
                    .map((revision, revIdx, arr) => {
                      // Reverse index for expandedRevisions
                      const index =
                        (currentOrder.revisionHistory?.length ?? 0) -
                        1 -
                        revIdx;
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
                                        ? (imageMap.get(
                                            revision.previousValues.photoId,
                                          ) ?? null)
                                        : null;
                                      const afterImg = revision.changes.photoId
                                        ? (imageMap.get(
                                            revision.changes.photoId,
                                          ) ?? null)
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
                                                className="w-full h-36 object-cover rounded border-2 border-red-500"
                                              />
                                            </div>
                                            <div className="w-36">
                                              <p className="font-medium text-red-700 text-xs mb-1">
                                                Photo — After
                                              </p>
                                              <img
                                                src={afterImg}
                                                alt="After"
                                                className="w-full h-36 object-cover rounded border-2 border-red-500"
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
                                            {/* Deleted items — in prevItems but removed in this revision */}
                                            {revision.previousValues
                                              ?.detailItems &&
                                              revision.previousValues.detailItems
                                                .slice(
                                                  revision.changes.detailItems
                                                    .length,
                                                )
                                                .map((deletedItem, i) => {
                                                  const ud = getUkuranDisplay(
                                                    deletedItem.ukuran,
                                                  );
                                                  return (
                                                    <tr
                                                      key={`deleted-${i}`}
                                                      className="opacity-70 bg-red-50"
                                                    >
                                                      <td
                                                        className={`px-2 py-1 font-medium border line-through text-red-600 ${getKadarColor(deletedItem.kadar)}`}
                                                      >
                                                        {deletedItem.kadar}
                                                      </td>
                                                      <td
                                                        className={`px-2 py-1 border line-through text-red-600 ${getWarnaColor(deletedItem.warna)}`}
                                                      >
                                                        {getWarnaLabel(
                                                          deletedItem.warna,
                                                        )}
                                                      </td>
                                                      <td className="px-2 py-1 border line-through text-red-600">
                                                        {ud.showUnit
                                                          ? `${ud.value} cm`
                                                          : ud.value}
                                                      </td>
                                                      <td className="px-2 py-1 text-right border line-through text-red-600">
                                                        {deletedItem.berat}
                                                      </td>
                                                      <td className="px-2 py-1 text-right border line-through text-red-600">
                                                        {deletedItem.pcs}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
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
          </div>
        )}

        {/* Request Revision History - visible to non-supplier users whenever a linked request exists */}
        {userRole !== "supplier" && relatedRequest && (
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() =>
                setIsRequestRevisionHistoryOpen(!isRequestRevisionHistoryOpen)
              }
              className="w-full flex items-center justify-between hover:bg-gray-50 py-1 rounded-lg transition-colors"
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
                    const firstRevision = (relatedRequest.revisionHistory ??
                      [])[0];

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
                  {[...(relatedRequest.revisionHistory ?? [])]
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
          </div>
        )}
        {/* Shipment Entries - collapsible */}
        {shipmentEntries.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setIsShipmentEntriesOpen(!isShipmentEntriesOpen)}
              className="w-full flex items-center justify-between hover:bg-gray-50 py-1 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-gray-900">
                Shipment Entries ({shipmentEntries.length})
              </h3>
              {isShipmentEntriesOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isShipmentEntriesOpen && (
              <div className="mt-3 space-y-4">
                {shipmentEntries.map((entry) => {
                  const edits = arrivalEdits[entry.id] || {};
                  const linkedArrivals = shipmentArrivals.filter(
                    (a) => a.shippingId === entry.id,
                  );
                  const totalArrived = linkedArrivals.reduce(
                    (sum, a) => sum + a.items.reduce((s, i) => s + i.pcs, 0),
                    0,
                  );
                  const totalShipped = entry.items.reduce(
                    (s, i) => s + i.pcs,
                    0,
                  );
                  const isEditing = editingShipmentId === entry.id;
                  const canEdit =
                    userRole === "supplier" && linkedArrivals.length === 0;

                  return (
                    <div
                      key={entry.id}
                      id={`shipment-entry-${entry.id}`}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Entry header */}
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className="font-mono text-sm font-semibold text-blue-700">
                            {entry.id}
                          </span>
                          {userRole === "supplier" && (
                            <button
                              title="Print QR code for Shipment ID"
                              className="ml-1 p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors inline-flex"
                              onClick={() => printQRCode(entry.id, entry.id)}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="ml-3 text-xs text-gray-500">
                            {new Date(entry.shippingDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            · {getFullNameFromUsername(entry.createdBy)}
                          </span>
                          {(userRole === "jb" || userRole === "supplier") && (
                            <span className="ml-3 text-xs text-gray-500">
                              Shipped: {totalShipped} pcs | Received:{" "}
                              {totalArrived} pcs
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit && !isEditing && (
                            <button
                              title="Edit this shipment entry"
                              className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                              onClick={() => {
                                const initPcs: Record<number, string> = {};
                                entry.items.forEach((item, idx) => {
                                  initPcs[idx] = String(item.pcs);
                                });
                                setEditingShipmentId(entry.id);
                                setEditingShipmentPcs(initPcs);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {userRole === "jb" && (
                            <button
                              title="Auto-match remaining quantities for all items"
                              className="p-1 rounded hover:bg-gray-200 text-blue-600 transition-colors"
                              onClick={() => {
                                const newEdits: Record<number, string> = {};
                                entry.items.forEach((item, idx) => {
                                  const receivedForItem = linkedArrivals.reduce(
                                    (sum, a) => {
                                      const found = a.items.find(
                                        (ai) =>
                                          ai.karat === item.kadar &&
                                          ai.warna === item.warna &&
                                          ai.size === item.ukuran &&
                                          ai.berat === item.berat,
                                      );
                                      return sum + (found?.pcs || 0);
                                    },
                                    0,
                                  );
                                  newEdits[idx] = String(
                                    Math.max(0, item.pcs - receivedForItem),
                                  );
                                });
                                setArrivalEdits((prev) => ({
                                  ...prev,
                                  [entry.id]: newEdits,
                                }));
                              }}
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Kadar</th>
                              <th className="px-3 py-2 text-left">Warna</th>
                              <th className="px-3 py-2 text-left">Ukuran</th>
                              <th className="px-3 py-2 text-right">Berat</th>
                              <th className="px-3 py-2 text-right">Shipped</th>
                              {(userRole === "jb" ||
                                userRole === "supplier") && (
                                <th className="px-3 py-2 text-right">
                                  Received
                                </th>
                              )}
                              {isEditing && (
                                <th className="px-3 py-2 text-right">
                                  New Qty
                                </th>
                              )}
                              {userRole === "jb" && (
                                <>
                                  <th className="px-3 py-2 text-right">
                                    Arrival
                                  </th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {entry.items.map((item, idx) => {
                              const ukuranDisplayEntry = getUkuranDisplay(
                                item.ukuran,
                              );
                              // Total pcs already received for this item across all arrival records
                              const receivedForItem = linkedArrivals.reduce(
                                (sum, a) => {
                                  const found = a.items.find(
                                    (ai) =>
                                      ai.karat === item.kadar &&
                                      ai.warna === item.warna &&
                                      ai.size === item.ukuran &&
                                      ai.berat === item.berat,
                                  );
                                  return sum + (found?.pcs || 0);
                                },
                                0,
                              );
                              // Max additional pcs that can still be recorded
                              const remaining = Math.max(
                                0,
                                item.pcs - receivedForItem,
                              );
                              return (
                                <tr
                                  key={idx}
                                  className={`border-t ${
                                    receivedForItem >= item.pcs && item.pcs > 0
                                      ? "bg-green-50"
                                      : ""
                                  }`}
                                >
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
                                    {ukuranDisplayEntry.showUnit
                                      ? `${ukuranDisplayEntry.value} cm`
                                      : ukuranDisplayEntry.value}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {item.berat || "-"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {item.pcs}
                                  </td>
                                  {(userRole === "jb" ||
                                    userRole === "supplier") && (
                                    <td
                                      className={`px-3 py-2 text-right font-medium ${
                                        receivedForItem >= item.pcs
                                          ? "text-green-600"
                                          : receivedForItem > 0
                                            ? "text-amber-600"
                                            : "text-gray-400"
                                      }`}
                                    >
                                      <span className="inline-flex items-center justify-end gap-1">
                                        {receivedForItem > 0
                                          ? receivedForItem
                                          : "-"}
                                        {receivedForItem >= item.pcs &&
                                          item.pcs > 0 && (
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                          )}
                                      </span>
                                    </td>
                                  )}
                                  {isEditing && (
                                    <td className="px-3 py-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={editingShipmentPcs[idx] ?? ""}
                                        onChange={(e) => {
                                          const v = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          setEditingShipmentPcs((prev) => ({
                                            ...prev,
                                            [idx]: v,
                                          }));
                                        }}
                                        className="w-20 text-right"
                                        placeholder="0"
                                      />
                                    </td>
                                  )}
                                  {userRole === "jb" && (
                                    <>
                                      <td className="px-3 py-2">
                                        {receivedForItem >= item.pcs &&
                                        item.pcs > 0 &&
                                        !arrivalEditingRows[entry.id]?.has(
                                          idx,
                                        ) ? (
                                          <div className="flex items-center justify-end">
                                            <button
                                              title="Edit arrival quantity"
                                              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                                              onClick={() =>
                                                setArrivalEditingRows(
                                                  (prev) => ({
                                                    ...prev,
                                                    [entry.id]: new Set([
                                                      ...(prev[entry.id] ?? []),
                                                      idx,
                                                    ]),
                                                  }),
                                                )
                                              }
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            <Input
                                              type="number"
                                              min="0"
                                              value={edits[idx] ?? ""}
                                              onChange={(e) =>
                                                setArrivalEdits((prev) => ({
                                                  ...prev,
                                                  [entry.id]: {
                                                    ...(prev[entry.id] || {}),
                                                    [idx]: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="w-20 text-right"
                                              placeholder="0"
                                            />
                                            <button
                                              title="Match remaining quantity"
                                              className="p-1 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                                              onClick={() =>
                                                setArrivalEdits((prev) => ({
                                                  ...prev,
                                                  [entry.id]: {
                                                    ...(prev[entry.id] || {}),
                                                    [idx]: String(remaining),
                                                  },
                                                }))
                                              }
                                            >
                                              <ChevronsRight className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Edit action row (supplier only, when editing) */}
                      {isEditing && (
                        <div className="px-3 py-2 flex justify-end gap-2 border-t bg-gray-50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingShipmentId(null);
                              setEditingShipmentPcs({});
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleSaveShipmentEdit(entry)}
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}

                      {/* Save arrivals button (JB only) */}
                      {userRole === "jb" && (
                        <div className="px-3 py-2 flex justify-end border-t bg-gray-50">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={
                              !entry.items.some(
                                (_, idx) =>
                                  parseInt(
                                    (arrivalEdits[entry.id] || {})[idx] || "0",
                                  ) > 0,
                              )
                            }
                            onClick={() => {
                              const edits = arrivalEdits[entry.id] || {};
                              const total = entry.items.reduce(
                                (s, item, idx) =>
                                  s + (parseInt(edits[idx] || "0") || 0),
                                0,
                              );
                              setPendingAction({
                                label: "Record Arrivals",
                                description: `Record ${total} pcs arrival for shipment ${entry.id}?`,
                                onConfirm: () =>
                                  handleSaveArrivals(entry.id, entry),
                              });
                            }}
                          >
                            Record Arrivals
                          </Button>
                        </div>
                      )}

                      {/* Edit history */}
                      {entry.editHistory && entry.editHistory.length > 0 && (
                        <div className="border-t px-3 py-2 bg-amber-50">
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            Edit History ({entry.editHistory.length})
                          </p>
                          <div className="space-y-1">
                            {entry.editHistory.map((hist, hIdx) => (
                              <div key={hIdx} className="text-xs text-gray-600">
                                <span className="font-medium">
                                  {new Date(hist.editedAt).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}{" "}
                                  {new Date(hist.editedAt).toLocaleTimeString(
                                    "id-ID",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>{" "}
                                by {getFullNameFromUsername(hist.editedBy)}:{" "}
                                {hist.previousItems.map((prev, pi) => {
                                  const next = hist.newItems[pi];
                                  if (!next || prev.pcs === next.pcs)
                                    return null;
                                  return (
                                    <span key={pi} className="mr-2">
                                      {prev.kadar.toUpperCase()} {prev.warna}{" "}
                                      {prev.ukuran}:{" "}
                                      <span className="line-through text-red-500">
                                        {prev.pcs}
                                      </span>{" "}
                                      →{" "}
                                      <span className="text-green-600">
                                        {next.pcs}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Order Arrivals */}
        {shipmentArrivals.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => setIsArrivalsOpen(!isArrivalsOpen)}
              className="w-full flex items-center justify-between hover:bg-gray-50 py-1 rounded-lg transition-colors"
            >
              <h3
                id="order-arrivals-section"
                className="font-semibold text-gray-900"
              >
                Order Arrivals ({shipmentArrivals.length})
              </h3>
              {isArrivalsOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isArrivalsOpen && (
              <div className="mt-3 space-y-4">
                {shipmentArrivals.map((arrival) => {
                  const isEditing = editingArrivalId === arrival.id;
                  const linkedShipment = arrival.shippingId
                    ? shipmentEntries.find((s) => s.id === arrival.shippingId)
                    : undefined;
                  const totalReceived = arrival.items.reduce(
                    (s, i) => s + i.pcs,
                    0,
                  );
                  const totalShipped = linkedShipment
                    ? linkedShipment.items.reduce((s, i) => s + i.pcs, 0)
                    : 0;
                  const hasMissingItems =
                    !!linkedShipment && totalReceived < totalShipped;
                  return (
                    <div
                      key={arrival.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Arrival header */}
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span className="font-mono text-sm font-semibold text-purple-700">
                            {arrival.id}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(arrival.createdDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            · {getFullNameFromUsername(arrival.createdBy)}
                          </span>
                          {arrival.shippingId && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-blue-600">
                                {arrival.shippingId}
                              </span>
                            </>
                          )}
                          {!arrival.shippingId && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              Manual Entry
                            </span>
                          )}
                          {hasMissingItems && (
                            <span className="animate-missing-badge text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                              Incomplete Arrival
                            </span>
                          )}
                        </div>
                        {userRole === "jb" &&
                          !isEditing &&
                          currentOrder.status !== "Closed" && (
                            <button
                              className="p-1 hover:bg-gray-200 rounded"
                              onClick={() => {
                                setEditingArrivalId(arrival.id);
                                setEditingArrivalUnlockedRows(new Set());
                                const init: Record<number, string> = {};
                                arrival.items.forEach((item, idx) => {
                                  init[idx] = String(item.pcs);
                                });
                                setEditingArrivalItems(init);
                              }}
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                      </div>
                      {/* Items table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Kadar</th>
                              <th className="px-3 py-2 text-left">Warna</th>
                              <th className="px-3 py-2 text-left">Ukuran</th>
                              <th className="px-3 py-2 text-right">Berat</th>
                              {linkedShipment && (
                                <th className="px-3 py-2 text-right">
                                  Shipped
                                </th>
                              )}
                              <th className="px-3 py-2 text-right">
                                Pcs Received
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {arrival.items.map((item, idx) => {
                              const shippedPcsForRow = linkedShipment
                                ? (linkedShipment.items.find(
                                    (si) =>
                                      si.kadar === item.karat &&
                                      si.warna === item.warna &&
                                      si.ukuran === item.size &&
                                      si.berat === item.berat,
                                  )?.pcs ?? 0)
                                : 0;
                              const isRowFulfilled =
                                !!linkedShipment &&
                                item.pcs >= shippedPcsForRow &&
                                shippedPcsForRow > 0;
                              const isRowUnderReceived =
                                !!linkedShipment &&
                                shippedPcsForRow > 0 &&
                                item.pcs < shippedPcsForRow;
                              const isRowUnlocked =
                                editingArrivalUnlockedRows.has(idx);
                              return (
                                <tr
                                  key={idx}
                                  className={`border-t ${
                                    isRowFulfilled ? "bg-green-50" : ""
                                  }`}
                                >
                                  <td className="px-3 py-2 font-medium">
                                    {item.karat.toUpperCase()}
                                  </td>
                                  <td
                                    className={`px-3 py-2 ${getWarnaColor(item.warna)}`}
                                  >
                                    {getWarnaLabel(item.warna)}
                                  </td>
                                  <td className="px-3 py-2">{item.size}</td>
                                  <td className="px-3 py-2 text-right">
                                    {item.berat || "-"}
                                  </td>
                                  {linkedShipment && (
                                    <td className="px-3 py-2 text-right">
                                      {shippedPcsForRow || "-"}
                                    </td>
                                  )}
                                  <td className="px-3 py-2 text-right">
                                    {isEditing ? (
                                      isRowFulfilled && !isRowUnlocked ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <span className="font-medium text-green-700">
                                            {editingArrivalItems[idx] ??
                                              item.pcs}
                                          </span>
                                          <button
                                            title="Edit this quantity"
                                            className="p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                                            onClick={() =>
                                              setEditingArrivalUnlockedRows(
                                                (prev) =>
                                                  new Set([...prev, idx]),
                                              )
                                            }
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end gap-1">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={
                                              editingArrivalItems[idx] ??
                                              String(item.pcs)
                                            }
                                            onChange={(e) =>
                                              setEditingArrivalItems(
                                                (prev) => ({
                                                  ...prev,
                                                  [idx]: e.target.value,
                                                }),
                                              )
                                            }
                                            className="w-20 text-right"
                                          />
                                          <button
                                            title="Match to shipped quantity"
                                            className="p-0.5 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                                            onClick={() =>
                                              setEditingArrivalItems(
                                                (prev) => ({
                                                  ...prev,
                                                  [idx]: String(
                                                    shippedPcsForRow ||
                                                      item.pcs,
                                                  ),
                                                }),
                                              )
                                            }
                                          >
                                            <ChevronsRight className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )
                                    ) : (
                                      <span
                                        className={`font-medium ${
                                          isRowUnderReceived
                                            ? "text-red-600 font-bold"
                                            : isRowFulfilled
                                              ? "text-green-700"
                                              : ""
                                        }`}
                                      >
                                        {item.pcs}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {isEditing && (
                        <div className="px-3 py-2 flex gap-2 justify-end border-t bg-gray-50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingArrivalId(null);
                              setEditingArrivalItems({});
                              setEditingArrivalUnlockedRows(new Set());
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveArrivalEdit(arrival)}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                      {arrival.editHistory &&
                        arrival.editHistory.length > 0 && (
                          <div className="border-t px-3 py-2 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                              Edit History ({arrival.editHistory.length})
                            </p>
                            <div className="space-y-2">
                              {arrival.editHistory.map((h, hi) => (
                                <div
                                  key={hi}
                                  className="text-xs bg-white border rounded p-2"
                                >
                                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <span>
                                      {new Date(h.editedAt).toLocaleDateString(
                                        "id-ID",
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )}{" "}
                                      {new Date(h.editedAt).toLocaleTimeString(
                                        "id-ID",
                                        { hour: "2-digit", minute: "2-digit" },
                                      )}
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {getFullNameFromUsername(h.editedBy)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="font-medium text-red-600 mb-1">
                                        Before
                                      </p>
                                      {h.previousItems.map((pi, pii) => (
                                        <div
                                          key={pii}
                                          className="text-gray-600"
                                        >
                                          {pi.karat.toUpperCase()} {pi.warna}{" "}
                                          {pi.size} — {pi.pcs} pcs
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <p className="font-medium text-green-600 mb-1">
                                        After
                                      </p>
                                      {h.newItems.map((ni, nii) => (
                                        <div
                                          key={nii}
                                          className="text-gray-600"
                                        >
                                          {ni.karat.toUpperCase()} {ni.warna}{" "}
                                          {ni.size} — {ni.pcs} pcs
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Supplier Action Buttons */}
      {userRole === "supplier" &&
        (currentOrder.status === "New Order" ||
          currentOrder.status === "Supplier Viewed") && (
          <div className="sticky bottom-16 md:bottom-0 left-0 right-0 mt-6 z-40">
            <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg p-4">
              <div className="flex gap-3 flex-wrap justify-end max-w-7xl mx-auto">
                <Button
                  onClick={() =>
                    setPendingAction({
                      label: "Start Production",
                      description:
                        "Are you sure you want to mark this order as In Production?",
                      onConfirm: () =>
                        handleUpdateStatusWithToast(
                          currentOrder.id,
                          "In Production",
                          "You've marked the Order as In Production",
                        ),
                    })
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Start Production
                </Button>
                <Button
                  onClick={() =>
                    setPendingAction({
                      label: "Mark Stock Ready",
                      description:
                        "Are you sure you want to mark this order as Stock Ready?",
                      onConfirm: () =>
                        handleUpdateStatusWithToast(
                          currentOrder.id,
                          "Stock Ready",
                          "You've marked the Order as Ready Stock",
                        ),
                    })
                  }
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Mark Stock Ready
                </Button>
                {onUpdateOrder && !currentOrder.revisionHistory?.length && (
                  <Button
                    variant="outline"
                    onClick={() => onUpdateOrder(currentOrder)}
                  >
                    Request Change
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() =>
                    setPendingAction({
                      label: "Unable to Fulfill",
                      description:
                        "Are you sure you are unable to fulfill this order? This action cannot be undone.",
                      onConfirm: () =>
                        handleUpdateStatus(
                          currentOrder.id,
                          "Unable to Fulfill",
                        ),
                    })
                  }
                >
                  Unable to Fulfill
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Supplier Action Buttons - Order Revised */}
      {userRole === "supplier" && currentOrder.status === "Order Revised" && (
        <div className="sticky bottom-16 md:bottom-0 left-0 right-0 mt-6 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg p-4">
            <div className="flex gap-3 flex-wrap justify-end max-w-7xl mx-auto">
              <Button
                onClick={() =>
                  setPendingAction({
                    label: "Start Production",
                    description:
                      "Are you sure you want to mark this order as In Production?",
                    onConfirm: () =>
                      handleUpdateStatusWithToast(
                        currentOrder.id,
                        "In Production",
                        "You've marked the Order as In Production",
                      ),
                  })
                }
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Start Production
              </Button>
              <Button
                onClick={() =>
                  setPendingAction({
                    label: "Mark Stock Ready",
                    description:
                      "Are you sure you want to mark this order as Stock Ready?",
                    onConfirm: () =>
                      handleUpdateStatusWithToast(
                        currentOrder.id,
                        "Stock Ready",
                        "You've marked the Order as Ready Stock",
                      ),
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Mark Stock Ready
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* JB - Close Order */}
      {userRole === "jb" && currentOrder.status === "Fully Delivered" && (
        <div className="sticky bottom-16 md:bottom-0 left-0 right-0 mt-6 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg p-4">
            <div className="flex gap-3 flex-wrap justify-end max-w-7xl mx-auto">
              <Button
                onClick={() =>
                  setPendingAction({
                    label: "Close Order",
                    description:
                      "Are you sure you want to close this order? This marks the order as complete and no further changes can be made.",
                    onConfirm: () =>
                      handleUpdateStatusWithToast(
                        currentOrder.id,
                        "Closed",
                        "Order has been closed",
                      ),
                  })
                }
                className="bg-gray-800 hover:bg-gray-900 text-white"
              >
                Close Order
              </Button>
            </div>
          </div>
        </div>
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
                    PO Number: {relatedRequest.requestNo}
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
                      <span className="text-gray-500">PO Number: </span>
                      <span className="font-medium font-mono">
                        {relatedRequest.requestNo}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Created</span>
                    <span className="col-span-3">
                      <span>:</span>
                      <span className="font-medium">
                        {formatTimestamp(relatedRequest.timestamp)}
                      </span>
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
                      {getStatusLabel(relatedRequest.status)}
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

      {/* Supplier Note tooltip overlay */}
      {showingSupplierNoteTooltip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowingSupplierNoteTooltip(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-blue-200 p-3 max-w-xs"
            style={{
              left: `${showingSupplierNoteTooltip.x}px`,
              top: `${showingSupplierNoteTooltip.y}px`,
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 mb-1">
              <Info className="w-3.5 h-3.5" />
              Supplier Notes
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {showingSupplierNoteTooltip.notes}
            </div>
          </div>
        </>
      )}

      {/* Reject Revision Reason Dialog */}
      <Dialog
        open={showRejectReasonDialog}
        onOpenChange={(open) => {
          setShowRejectReasonDialog(open);
          if (!open) {
            setRejectReason("");
            setRejectContext("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Supplier Revision</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                {rejectContext && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Rejecting:</span>{" "}
                    {rejectContext}
                  </p>
                )}
                <p className="text-sm font-semibold text-red-600">
                  ⚠️ Warning: clicking OK will permanently CANCEL this order.
                </p>
                <p className="text-sm text-gray-600">
                  A rejection reason is mandatory for record keeping.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for Rejection *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejecting this revision..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectReasonDialog(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              OK
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

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                pendingAction?.onConfirm();
                setPendingAction(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
