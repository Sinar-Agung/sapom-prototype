import { Order, OrderArrival, OrderShipping } from "@/app/types/order";
import { DetailBarangItem } from "@/app/types/request";
import {
  notifyOrderArrival,
  notifyOrderFullyDelivered,
} from "@/app/utils/notification-helper";
import {
  getStatusBadgeClasses,
  getStatusLabel,
} from "@/app/utils/status-colors";
import {
  getCurrentUserDetails,
  getFullNameFromUsername,
} from "@/app/utils/user-data";
import {
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ChevronsRight,
  Pencil,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OrderCard } from "./order-card";
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
import { Input } from "./ui/input";

// PO Number format: SA<B><YY><M><D><NN> = 9 chars
// Shipment IDs = PO + 2 chars = 11 chars
// Input longer than 9 chars => shipment ID mode
const PO_NUMBER_LENGTH = 9;

// ---- local style helpers ----
const getKadarColor = (_k: string) => "";

const getWarnaColor = (warna: string) => {
  const c: Record<string, string> = {
    rg: "bg-rose-300 text-gray-800",
    ap: "bg-gray-200 text-gray-800",
    kn: "bg-yellow-400 text-gray-800",
    ks: "bg-yellow-300 text-gray-800",
    "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
    "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
  };
  return c[warna?.toLowerCase()] ?? "bg-gray-300 text-gray-800";
};

const getWarnaLabel = (warna: string) => {
  const l: Record<string, string> = {
    rg: "RG",
    ap: "AP",
    kn: "KN",
    ks: "KS",
    "2w-ap-rg": "2W (AP+RG)",
    "2w-ap-kn": "2W (AP+KN)",
  };
  return l[warna?.toLowerCase()] ?? warna?.toUpperCase() ?? "";
};

const getUkuranDisplay = (
  ukuran: string,
): { value: string; showUnit: boolean } => {
  const n = parseFloat(ukuran);
  if (!isNaN(n)) return { value: ukuran, showUnit: true };
  const m: Record<string, string> = { a: "A", n: "N", p: "P", t: "T" };
  return { value: m[ukuran?.toLowerCase()] ?? ukuran ?? "", showUnit: false };
};

interface JBInboundSearchProps {
  onSeeDetail: (order: Order) => void;
}

export function JBInboundSearch({ onSeeDetail }: JBInboundSearchProps) {
  const [search, setSearch] = useState(
    () => sessionStorage.getItem("inboundSearch") || "",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Order Arrival Dialog (PO mode)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderShipments, setOrderShipments] = useState<OrderShipping[]>([]);
  const [orderArrivals, setOrderArrivals] = useState<OrderArrival[]>([]);
  const [isEntriesOpen, setIsEntriesOpen] = useState(true);
  const [entryFilter, setEntryFilter] = useState("");
  const [arrivalEdits, setArrivalEdits] = useState<
    Record<string, Record<number, string>>
  >({});

  // Manual Arrival Dialog
  const [showManualArrival, setShowManualArrival] = useState(false);
  const [manualPcs, setManualPcs] = useState<Record<string, string>>({});

  // Shipment ID mode
  const [foundEntries, setFoundEntries] = useState<OrderShipping[]>([]);
  const [foundEntryOrder, setFoundEntryOrder] = useState<Order | null>(null);
  const [singleEdits, setSingleEdits] = useState<
    Record<string, Record<number, string>>
  >({});

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("orders");
    if (stored) setOrders(JSON.parse(stored));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("inboundSearch", search);
  }, [search]);

  const trimmed = search.trim().toUpperCase();
  const isShipmentMode = trimmed.length > PO_NUMBER_LENGTH;

  // ---- Data loading ----
  const loadOrderData = (orderId: string) => {
    const allShipments: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    const allArrivals: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    const shipments = allShipments.filter((s) => s.orderId === orderId);
    const arrivals = allArrivals.filter((a) => a.orderId === orderId);
    setOrderShipments(shipments);
    setOrderArrivals(arrivals);
    const initEdits: Record<string, Record<number, string>> = {};
    shipments.forEach((se) => {
      initEdits[se.id] = {};
    });
    setArrivalEdits(initEdits);
  };

  // ---- Shipment ID search effect ----
  useEffect(() => {
    if (!isShipmentMode || !trimmed) {
      setFoundEntries([]);
      setFoundEntryOrder(null);
      return;
    }
    const allShipments: OrderShipping[] = JSON.parse(
      localStorage.getItem("orderShippings") || "[]",
    );
    const matches = allShipments.filter((s) =>
      s.id.toUpperCase().includes(trimmed),
    );
    // Exclude shipments whose order is Closed
    const allOrders: Order[] = JSON.parse(
      localStorage.getItem("orders") || "[]",
    );
    const openMatches = matches.filter((s) => {
      const ord = allOrders.find((o) => o.id === s.orderId);
      return ord?.status !== "Closed";
    });
    setFoundEntries(openMatches);
    if (openMatches.length > 0) {
      const matchOrder =
        allOrders.find((o) => o.id === openMatches[0].orderId) || null;
      setFoundEntryOrder(matchOrder);
      const allArrivals: OrderArrival[] = JSON.parse(
        localStorage.getItem("orderArrivals") || "[]",
      );
      setOrderArrivals(
        allArrivals.filter((a) => a.orderId === openMatches[0].orderId),
      );
      const init: Record<string, Record<number, string>> = {};
      openMatches.forEach((m) => {
        init[m.id] = {};
      });
      setSingleEdits(init);
    } else {
      setFoundEntryOrder(null);
      setOrderArrivals([]);
    }
  }, [trimmed, isShipmentMode]);

  // ---- Save arrivals to localStorage + update order status ----
  const saveArrivalItems = (
    orderId: string,
    items: {
      karat: string;
      warna: string;
      size: string;
      berat: string;
      pcs: number;
    }[],
    shippingId?: string,
    onSuccess?: () => void,
  ) => {
    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const allArrivals: OrderArrival[] = JSON.parse(
      localStorage.getItem("orderArrivals") || "[]",
    );
    const forOrderCount = allArrivals.filter(
      (a) => a.orderId === orderId,
    ).length;
    const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const arrivalId = `${order.PONumber}R${BASE36[Math.floor(forOrderCount / 36)]}${BASE36[forOrderCount % 36]}`;

    const arrival: OrderArrival = {
      id: arrivalId,
      orderId,
      orderPONumber: order.PONumber,
      createdDate: Date.now(),
      createdBy: currentUser,
      shippingId,
      items,
    };

    allArrivals.push(arrival);
    localStorage.setItem("orderArrivals", JSON.stringify(allArrivals));

    // Recompute delivery status
    const forOrder = allArrivals.filter((a) => a.orderId === orderId);
    const getTotalReceived = (item: DetailBarangItem) =>
      forOrder.reduce((sum, a) => {
        const found = a.items.find(
          (i) =>
            i.karat === item.kadar &&
            i.warna === item.warna &&
            i.size === item.ukuran &&
            i.berat === item.berat,
        );
        return sum + (found?.pcs || 0);
      }, 0);

    const allFulfilled = order.detailItems.every(
      (item) => getTotalReceived(item) >= (parseInt(item.pcs) || 0),
    );
    const anyReceived = order.detailItems.some(
      (item) => getTotalReceived(item) > 0,
    );
    const newStatus = allFulfilled
      ? "Fully Delivered"
      : anyReceived
        ? "Partially Delivered"
        : order.status;

    if (newStatus !== order.status) {
      const allOrders: Order[] = JSON.parse(
        localStorage.getItem("orders") || "[]",
      );
      const idx = allOrders.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        allOrders[idx].status = newStatus as Order["status"];
        allOrders[idx].updatedDate = Date.now();
        allOrders[idx].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));
        setOrders(allOrders);
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(allOrders[idx]);
        }
      }
    }

    toast.success("Arrivals recorded");

    // Notify relevant parties about the arrival
    const arrivalOrder = orders.find((o) => o.id === orderId);
    if (arrivalOrder) {
      const totalPcs = items.reduce((sum, i) => sum + i.pcs, 0);
      notifyOrderArrival(arrivalOrder, currentUser, totalPcs);
      if (
        newStatus === "Fully Delivered" &&
        order.status !== "Fully Delivered"
      ) {
        notifyOrderFullyDelivered(arrivalOrder, currentUser);
      }
    }

    // Refresh display data
    if (selectedOrder?.id === orderId) {
      loadOrderData(orderId);
    } else if (foundEntries.length > 0 && foundEntries[0].orderId === orderId) {
      const reloaded: OrderArrival[] = JSON.parse(
        localStorage.getItem("orderArrivals") || "[]",
      );
      setOrderArrivals(reloaded.filter((a) => a.orderId === orderId));
    }

    onSuccess?.();
  };

  // ---- Received pcs helper ----
  const getReceivedPcs = (
    orderId: string,
    kadar: string,
    warna: string,
    ukuran: string,
    berat: string,
  ): number =>
    orderArrivals
      .filter((a) => a.orderId === orderId)
      .reduce((sum, a) => {
        const found = a.items.find(
          (i) =>
            i.karat === kadar &&
            i.warna === warna &&
            i.size === ukuran &&
            i.berat === berat,
        );
        return sum + (found?.pcs || 0);
      }, 0);

  // ---- Shipment entry table sub-component ----
  const ShipmentEntryTable = ({
    entry,
    edits,
    onEditChange,
    onMatchOne,
    onMatchAll,
    onRecord,
  }: {
    entry: OrderShipping;
    edits: Record<number, string>;
    onEditChange: (idx: number, val: string) => void;
    onMatchOne: (idx: number, pcs: number) => void;
    onMatchAll: () => void;
    onRecord: () => void;
  }) => {
    const linkedArrivals = orderArrivals.filter(
      (a) => a.shippingId === entry.id,
    );
    const totalShipped = entry.items.reduce((s, i) => s + i.pcs, 0);
    const totalArrived = linkedArrivals.reduce(
      (s, a) => s + a.items.reduce((ss, i) => ss + i.pcs, 0),
      0,
    );
    const hasAnyEdit = Object.values(edits).some((v) => parseInt(v) > 0);
    const [editingRows, setEditingRows] = useState<Set<number>>(new Set());

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Entry header */}
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="font-mono text-sm font-semibold text-blue-700">
              {entry.id}
            </span>
            <span className="ml-3 text-xs text-gray-500">
              {new Date(entry.shippingDate).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              · {getFullNameFromUsername(entry.createdBy)}
            </span>
            <span className="ml-3 text-xs text-gray-500">
              Shipped: {totalShipped} pcs | Arrived: {totalArrived} pcs
            </span>
          </div>
          <button
            title="Match all to shipped quantities"
            className="p-1 rounded hover:bg-gray-200 text-blue-600 transition-colors"
            onClick={onMatchAll}
          >
            <CheckCheck className="w-4 h-4" />
          </button>
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
                <th className="px-3 py-2 text-right">Received</th>
                <th className="px-3 py-2 text-right">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {entry.items.map((item, idx) => {
                const ukuran = getUkuranDisplay(item.ukuran);
                const received = getReceivedPcs(
                  entry.orderId,
                  item.kadar,
                  item.warna,
                  item.ukuran,
                  item.berat,
                );
                return (
                  <tr
                    key={idx}
                    className={`border-t ${
                      received >= item.pcs && item.pcs > 0 ? "bg-green-50" : ""
                    }`}
                  >
                    <td
                      className={`px-3 py-2 font-medium ${getKadarColor(item.kadar)}`}
                    >
                      {item.kadar.toUpperCase()}
                    </td>
                    <td className={`px-3 py-2 ${getWarnaColor(item.warna)}`}>
                      {getWarnaLabel(item.warna)}
                    </td>
                    <td className="px-3 py-2">
                      {ukuran.showUnit ? `${ukuran.value} cm` : ukuran.value}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.berat || "-"}
                    </td>
                    <td className="px-3 py-2 text-right">{item.pcs}</td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`font-medium ${
                          received >= item.pcs && item.pcs > 0
                            ? "text-green-700"
                            : received > 0 && received < item.pcs
                              ? "font-bold text-red-600"
                              : "text-gray-400"
                        }`}
                      >
                        {received > 0 ? received : "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {received >= item.pcs &&
                      item.pcs > 0 &&
                      !editingRows.has(idx) ? (
                        <div className="flex items-center justify-end">
                          <button
                            title="Edit arrival quantity"
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                            onClick={() =>
                              setEditingRows((prev) => {
                                const next = new Set(prev);
                                next.add(idx);
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
                            value={edits[idx] ?? ""}
                            onChange={(e) => onEditChange(idx, e.target.value)}
                            className="w-20 text-right"
                            placeholder="0"
                          />
                          <button
                            title="Match to shipped quantity"
                            className="p-1 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                            onClick={() => onMatchOne(idx, item.pcs)}
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Record button */}
        <div className="px-3 py-2 flex justify-end border-t bg-gray-50">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!hasAnyEdit}
            onClick={onRecord}
          >
            Record Arrivals
          </Button>
        </div>
      </div>
    );
  };

  // ---- PO mode filtered orders (In Production, Stock Ready, or Partially Delivered) ----
  const currentUser = getCurrentUserDetails();
  const filteredOrders =
    trimmed && !isShipmentMode
      ? orders.filter(
          (o) =>
            (o.status === "In Production" ||
              o.status === "Stock Ready" ||
              o.status === "Partially Delivered") &&
            o.PONumber.toUpperCase().includes(trimmed) &&
            (!currentUser?.branchCode ||
              o.branchCode === currentUser.branchCode),
        )
      : [];

  // Auto-expand when there is exactly one match
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isShipmentMode || !trimmed) {
      setSelectedOrder(null);
      return;
    }
    const matches = orders.filter(
      (o) =>
        (o.status === "In Production" ||
          o.status === "Stock Ready" ||
          o.status === "Partially Delivered") &&
        o.PONumber.toUpperCase().includes(trimmed) &&
        (!currentUser?.branchCode || o.branchCode === currentUser.branchCode),
    );
    if (matches.length === 1) {
      const order = matches[0];
      if (selectedOrder?.id !== order.id) {
        setSelectedOrder(order);
        setEntryFilter("");
        setIsEntriesOpen(true);
        loadOrderData(order.id);
      }
    } else if (
      selectedOrder &&
      !matches.find((o) => o.id === selectedOrder.id)
    ) {
      setSelectedOrder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, isShipmentMode]);

  // ---- Filtered shipment entries for the expanded inline panel ----
  const filteredEntries = entryFilter
    ? orderShipments.filter((s) =>
        s.id.toLowerCase().includes(entryFilter.toLowerCase()),
      )
    : orderShipments;

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-6">Inbound</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="Enter PO Number or Shipment ID…"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))
          }
          className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:border-blue-500 shadow-sm"
          autoComplete="off"
        />
      </div>

      {/* Empty state */}
      {trimmed === "" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
          Type a PO Number to find orders, or a Shipment ID to look up a
          specific shipment entry
        </div>
      )}

      {/* ---- PO Number mode: matching orders list ---- */}
      {!isShipmentMode && trimmed !== "" && (
        <>
          {filteredOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
              No orders found for "{search}"
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pb-4 scrollbar-hide">
              {filteredOrders.map((order) => (
                <div key={order.id}>
                  {/* Order card — click to expand/collapse the arrival panel */}
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedOrder?.id === order.id) {
                        setSelectedOrder(null);
                      } else {
                        setSelectedOrder(order);
                        setEntryFilter("");
                        setManualPcs({});
                        setShowManualArrival(false);
                        setIsEntriesOpen(true);
                        loadOrderData(order.id);
                      }
                    }}
                  >
                    <OrderCard
                      order={order}
                      userRole="jb"
                      onSeeDetail={() => {
                        setSelectedOrder(null);
                        onSeeDetail(order);
                      }}
                    />
                  </div>

                  {/* Inline arrival panel */}
                  {selectedOrder?.id === order.id && (
                    <div className="border border-t-0 rounded-b-lg bg-white px-4 py-4 space-y-4">
                      {/* Manual Arrival Entry — inline collapsible */}
                      <div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant={showManualArrival ? "outline" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!showManualArrival) setManualPcs({});
                              setShowManualArrival(!showManualArrival);
                            }}
                          >
                            {showManualArrival ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide Manual Arrival
                              </>
                            ) : (
                              "Manual Arrival Entry"
                            )}
                          </Button>
                        </div>

                        {showManualArrival && (
                          <div className="mt-3 border rounded-lg p-4 space-y-4 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700">
                              Manual Arrival — {order.PONumber}
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left">
                                      Kadar
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Warna
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Ukuran
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Berat
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Ordered
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Received
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        Arrival
                                        <button
                                          title="Match all remaining (Ordered − Received)"
                                          className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const capturedItems =
                                              order.detailItems
                                                .map((item) => {
                                                  const received =
                                                    getReceivedPcs(
                                                      order.id,
                                                      item.kadar,
                                                      item.warna,
                                                      item.ukuran,
                                                      item.berat,
                                                    );
                                                  return {
                                                    karat: item.kadar,
                                                    warna: item.warna,
                                                    size: item.ukuran,
                                                    berat: item.berat,
                                                    pcs: Math.max(
                                                      0,
                                                      (parseInt(item.pcs) ||
                                                        0) - received,
                                                    ),
                                                  };
                                                })
                                                .filter((i) => i.pcs > 0);
                                            const newPcs: Record<
                                              string,
                                              string
                                            > = {};
                                            order.detailItems.forEach(
                                              (item) => {
                                                const received = getReceivedPcs(
                                                  order.id,
                                                  item.kadar,
                                                  item.warna,
                                                  item.ukuran,
                                                  item.berat,
                                                );
                                                newPcs[item.id] = String(
                                                  Math.max(
                                                    0,
                                                    (parseInt(item.pcs) || 0) -
                                                      received,
                                                  ),
                                                );
                                              },
                                            );
                                            setManualPcs(newPcs);
                                            const total = capturedItems.reduce(
                                              (s, i) => s + i.pcs,
                                              0,
                                            );
                                            setConfirmAction({
                                              title: "Match All Remaining",
                                              description: `Record arrivals for all ${total} remaining pcs for order ${order.PONumber}?`,
                                              onConfirm: () => {
                                                if (
                                                  capturedItems.length === 0
                                                ) {
                                                  toast.error(
                                                    "No remaining pcs to record",
                                                  );
                                                  return;
                                                }
                                                saveArrivalItems(
                                                  order.id,
                                                  capturedItems,
                                                  undefined,
                                                  () => {
                                                    setManualPcs({});
                                                    setShowManualArrival(false);
                                                  },
                                                );
                                              },
                                            });
                                          }}
                                        >
                                          <CheckCheck className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </th>
                                    <th className="px-3 py-2 w-8" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.detailItems.map((item) => {
                                    const received = getReceivedPcs(
                                      order.id,
                                      item.kadar,
                                      item.warna,
                                      item.ukuran,
                                      item.berat,
                                    );
                                    const ordered = parseInt(item.pcs) || 0;
                                    const remaining = Math.max(
                                      0,
                                      ordered - received,
                                    );
                                    const ukuran = getUkuranDisplay(
                                      item.ukuran,
                                    );
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
                                          {ukuran.showUnit
                                            ? `${ukuran.value} cm`
                                            : ukuran.value}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {item.berat || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {ordered}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {received}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={manualPcs[item.id] ?? ""}
                                            onChange={(e) =>
                                              setManualPcs((prev) => ({
                                                ...prev,
                                                [item.id]: e.target.value,
                                              }))
                                            }
                                            className="w-20 text-right"
                                            placeholder="0"
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <button
                                            title="Match remaining quantity"
                                            className="p-1 rounded hover:bg-gray-100 text-blue-500 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setManualPcs((prev) => ({
                                                ...prev,
                                                [item.id]: String(remaining),
                                              }));
                                            }}
                                          >
                                            <ChevronsRight className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowManualArrival(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={
                                  !Object.values(manualPcs).some(
                                    (v) => parseInt(v) > 0,
                                  )
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const items = order.detailItems
                                    .map((item) => ({
                                      karat: item.kadar,
                                      warna: item.warna,
                                      size: item.ukuran,
                                      berat: item.berat,
                                      pcs:
                                        parseInt(manualPcs[item.id] || "0") ||
                                        0,
                                    }))
                                    .filter((i) => i.pcs > 0);
                                  if (items.length === 0) {
                                    toast.error(
                                      "Please enter at least one arrival quantity",
                                    );
                                    return;
                                  }
                                  const total = items.reduce(
                                    (s, i) => s + i.pcs,
                                    0,
                                  );
                                  setConfirmAction({
                                    title: "Record Arrivals",
                                    description: `Record ${total} pcs manual arrival for order ${order.PONumber}?`,
                                    onConfirm: () => {
                                      saveArrivalItems(
                                        order.id,
                                        items,
                                        undefined,
                                        () => {
                                          setManualPcs({});
                                          setShowManualArrival(false);
                                        },
                                      );
                                    },
                                  });
                                }}
                              >
                                Record Arrivals
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shipment Entries */}
                      {orderShipments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-2">
                          No shipment entries found for this order
                        </p>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEntriesOpen(!isEntriesOpen);
                              }}
                              className="flex items-center gap-2 font-semibold text-gray-900"
                            >
                              Shipment Entries ({orderShipments.length})
                              {isEntriesOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {isEntriesOpen && (
                              <Input
                                placeholder="Filter by Shipment ID…"
                                value={entryFilter}
                                onChange={(e) => setEntryFilter(e.target.value)}
                                className="ml-auto w-48 h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          </div>

                          {isEntriesOpen && (
                            <div className="space-y-3">
                              {filteredEntries.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                  No matching shipment entries
                                </p>
                              ) : (
                                filteredEntries.map((entry) => (
                                  <ShipmentEntryTable
                                    key={entry.id}
                                    entry={entry}
                                    edits={arrivalEdits[entry.id] || {}}
                                    onEditChange={(idx, val) =>
                                      setArrivalEdits((prev) => ({
                                        ...prev,
                                        [entry.id]: {
                                          ...(prev[entry.id] || {}),
                                          [idx]: val,
                                        },
                                      }))
                                    }
                                    onMatchOne={(idx, pcs) =>
                                      setArrivalEdits((prev) => ({
                                        ...prev,
                                        [entry.id]: {
                                          ...(prev[entry.id] || {}),
                                          [idx]: String(pcs),
                                        },
                                      }))
                                    }
                                    onMatchAll={() => {
                                      const newEdits: Record<number, string> =
                                        {};
                                      entry.items.forEach((item, idx) => {
                                        newEdits[idx] = String(item.pcs);
                                      });
                                      setArrivalEdits((prev) => ({
                                        ...prev,
                                        [entry.id]: newEdits,
                                      }));
                                      const total = entry.items.reduce(
                                        (s, i) => s + i.pcs,
                                        0,
                                      );
                                      const capturedItems = entry.items.map(
                                        (item) => ({
                                          karat: item.kadar,
                                          warna: item.warna,
                                          size: item.ukuran,
                                          berat: item.berat,
                                          pcs: item.pcs,
                                        }),
                                      );
                                      setConfirmAction({
                                        title: "Match All",
                                        description: `Record arrivals for all ${total} pcs for shipment ${entry.id}?`,
                                        onConfirm: () => {
                                          saveArrivalItems(
                                            selectedOrder!.id,
                                            capturedItems,
                                            entry.id,
                                            () => {
                                              setArrivalEdits((prev) => ({
                                                ...prev,
                                                [entry.id]: {},
                                              }));
                                            },
                                          );
                                        },
                                      });
                                    }}
                                    onRecord={() => {
                                      const edits =
                                        arrivalEdits[entry.id] || {};
                                      const items = entry.items
                                        .map((item, idx) => ({
                                          karat: item.kadar,
                                          warna: item.warna,
                                          size: item.ukuran,
                                          berat: item.berat,
                                          pcs: parseInt(edits[idx] || "0") || 0,
                                        }))
                                        .filter((i) => i.pcs > 0);
                                      if (items.length === 0) {
                                        toast.error(
                                          "Please enter at least one arrival quantity",
                                        );
                                        return;
                                      }
                                      const total = items.reduce(
                                        (s, i) => s + i.pcs,
                                        0,
                                      );
                                      setConfirmAction({
                                        title: "Record Arrivals",
                                        description: `Record ${total} pcs arrival for shipment ${entry.id}?`,
                                        onConfirm: () => {
                                          saveArrivalItems(
                                            selectedOrder!.id,
                                            items,
                                            entry.id,
                                            () => {
                                              setArrivalEdits((prev) => ({
                                                ...prev,
                                                [entry.id]: {},
                                              }));
                                            },
                                          );
                                        },
                                      });
                                    }}
                                  />
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---- Shipment ID mode ---- */}
      {isShipmentMode && trimmed !== "" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {foundEntries.length === 0 ? (
            <div className="flex items-center justify-center text-gray-400 text-sm h-32">
              No shipment entry found for "{search}"
            </div>
          ) : (
            <>
              {/* Order info bar */}
              {foundEntryOrder && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <span className="font-semibold">
                    {foundEntryOrder.PONumber}
                  </span>
                  <span
                    className={`${getStatusBadgeClasses(foundEntryOrder.status)} px-2 py-0.5 rounded-full text-xs`}
                  >
                    {getStatusLabel(foundEntryOrder.status)}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {foundEntryOrder.pabrik?.name}
                  </span>
                </div>
              )}

              {/* Matched shipment entries */}
              {foundEntries.map((entry) => (
                <ShipmentEntryTable
                  key={entry.id}
                  entry={entry}
                  edits={singleEdits[entry.id] || {}}
                  onEditChange={(idx, val) =>
                    setSingleEdits((prev) => ({
                      ...prev,
                      [entry.id]: { ...(prev[entry.id] || {}), [idx]: val },
                    }))
                  }
                  onMatchOne={(idx, pcs) =>
                    setSingleEdits((prev) => ({
                      ...prev,
                      [entry.id]: {
                        ...(prev[entry.id] || {}),
                        [idx]: String(pcs),
                      },
                    }))
                  }
                  onMatchAll={() => {
                    const newEdits: Record<number, string> = {};
                    entry.items.forEach((item, idx) => {
                      newEdits[idx] = String(item.pcs);
                    });
                    setSingleEdits((prev) => ({
                      ...prev,
                      [entry.id]: newEdits,
                    }));
                    const total = entry.items.reduce((s, i) => s + i.pcs, 0);
                    const capturedItems = entry.items.map((item) => ({
                      karat: item.kadar,
                      warna: item.warna,
                      size: item.ukuran,
                      berat: item.berat,
                      pcs: item.pcs,
                    }));
                    setConfirmAction({
                      title: "Match All",
                      description: `Record arrivals for all ${total} pcs for shipment ${entry.id}?`,
                      onConfirm: () => {
                        saveArrivalItems(
                          entry.orderId,
                          capturedItems,
                          entry.id,
                          () => {
                            setSingleEdits((prev) => ({
                              ...prev,
                              [entry.id]: {},
                            }));
                          },
                        );
                      },
                    });
                  }}
                  onRecord={() => {
                    const edits = singleEdits[entry.id] || {};
                    const items = entry.items
                      .map((item, idx) => ({
                        karat: item.kadar,
                        warna: item.warna,
                        size: item.ukuran,
                        berat: item.berat,
                        pcs: parseInt(edits[idx] || "0") || 0,
                      }))
                      .filter((i) => i.pcs > 0);
                    if (items.length === 0) {
                      toast.error("Please enter at least one arrival quantity");
                      return;
                    }
                    const total = items.reduce((s, i) => s + i.pcs, 0);
                    setConfirmAction({
                      title: "Record Arrivals",
                      description: `Record ${total} pcs arrival for shipment ${entry.id}?`,
                      onConfirm: () => {
                        saveArrivalItems(entry.orderId, items, entry.id, () => {
                          setSingleEdits((prev) => ({
                            ...prev,
                            [entry.id]: {},
                          }));
                        });
                      },
                    });
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ========== Confirmation AlertDialog ========== */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction?.onConfirm();
                setConfirmAction(null);
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
