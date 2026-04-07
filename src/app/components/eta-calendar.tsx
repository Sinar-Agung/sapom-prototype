import { EntityReference, Order } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { OrderCard } from "./order-card";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

function requestToOrder(request: Request): Order {
  const pabrik: EntityReference =
    typeof request.pabrik === "string"
      ? { id: "", name: request.pabrik }
      : (request.pabrik as EntityReference) || { id: "", name: "Unknown" };
  return {
    id: request.id,
    PONumber: "",
    requestNo: request.requestNo,
    requestId: request.id,
    sales: request.createdBy,
    atasNama:
      typeof request.namaPelanggan === "string"
        ? request.namaPelanggan
        : (request.namaPelanggan as EntityReference)?.name || "",
    createdDate: request.timestamp,
    createdBy: request.createdBy || "",
    updatedDate: request.updatedDate,
    jbId: "",
    branchCode: request.branchCode,
    pabrik,
    kategoriBarang: request.kategoriBarang,
    jenisProduk: request.jenisProduk,
    namaProduk: request.namaProduk || "",
    namaBasic: request.namaBasic || "",
    waktuKirim: request.waktuKirim || "",
    customerExpectation: request.customerExpectation || "",
    detailItems: request.detailItems || [],
    status: request.status as any,
    photoId: request.photoId,
    viewedBy: request.viewedBy || [],
    rejectionReason: request.rejectionReason,
  };
}

interface ETACalendarProps {
  userRole: "sales" | "jb";
  currentUser?: string;
  onSeeDetail?: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onCancelOrder?: (id: string) => void;
  onDuplicateOrder?: (order: Order) => void;
}

export function ETACalendar({
  userRole,
  currentUser,
  onSeeDetail,
  onUpdateOrder,
  onEditOrder,
  onCancelOrder,
  onDuplicateOrder,
}: ETACalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load requests and orders from localStorage
  const { etaMap, items } = useMemo(() => {
    const requests: Request[] = JSON.parse(
      localStorage.getItem("requests") ?? "[]",
    );
    const orders: Order[] = JSON.parse(localStorage.getItem("orders") ?? "[]");
    const user =
      currentUser ||
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "";

    // Filter active requests (not cancelled, not expired, not ordered)
    const activeRequests = requests.filter((r) => {
      if (!r.waktuKirim) return false;
      if (
        r.status === "Cancelled" ||
        r.status === "Request Expired" ||
        r.status === "Ordered"
      )
        return false;
      if (userRole === "sales" && r.createdBy !== user) return false;
      return true;
    });

    // Filter active orders (not closed/completed/cancelled)
    const activeOrders = orders.filter((o) => {
      if (!o.waktuKirim) return false;
      if (
        o.status === "Closed" ||
        o.status === "Completed" ||
        o.status === "Cancelled" ||
        o.status === "Rejected"
      )
        return false;
      if (userRole === "sales" && o.sales !== user) return false;
      return true;
    });

    // Build a date -> items map
    const map: Record<string, { requests: Request[]; orders: Order[] }> = {};
    const allItems: Array<
      | { type: "request"; item: Request; eta: string; orderData: Order }
      | { type: "order"; item: Order; eta: string; orderData: Order }
    > = [];

    for (const r of activeRequests) {
      const dateKey = r.waktuKirim.split("T")[0];
      if (!map[dateKey]) map[dateKey] = { requests: [], orders: [] };
      map[dateKey].requests.push(r);
      allItems.push({
        type: "request",
        item: r,
        eta: dateKey,
        orderData: requestToOrder(r),
      });
    }

    for (const o of activeOrders) {
      const dateKey = o.waktuKirim.split("T")[0];
      if (!map[dateKey]) map[dateKey] = { requests: [], orders: [] };
      map[dateKey].orders.push(o);
      allItems.push({ type: "order", item: o, eta: dateKey, orderData: o });
    }

    return { etaMap: map, items: allItems };
  }, [userRole, currentUser]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build calendar grid
  const cells: Array<{ day: number | null; dateKey: string | null }> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null, dateKey: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateKey });
  }

  // Items for selected date
  const selectedItems = selectedDate
    ? items.filter((i) => i.eta === selectedDate)
    : [];

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <CalendarDays className="h-5 w-5 text-blue-600" />
        <h1 className="text-xl font-semibold">ETA Calendar</h1>
      </div>

      {/* Calendar */}
      <Card className="p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={idx} className="h-14 sm:h-16" />;
            }

            const dateKey = cell.dateKey!;
            const entry = etaMap[dateKey];
            const reqCount = entry?.requests.length || 0;
            const ordCount = entry?.orders.length || 0;
            const total = reqCount + ordCount;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const isPast = new Date(dateKey) < new Date(todayKey) && !isToday;

            return (
              <button
                key={idx}
                onClick={() =>
                  setSelectedDate(selectedDate === dateKey ? null : dateKey)
                }
                className={`h-14 sm:h-16 rounded-lg text-sm relative flex flex-col items-center justify-start pt-1 transition-colors border ${
                  isSelected
                    ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
                    : isToday
                      ? "bg-blue-50 border-blue-200"
                      : "border-transparent hover:bg-gray-50"
                } ${isPast ? "opacity-50" : ""}`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      : ""
                  }`}
                >
                  {cell.day}
                </span>
                {total > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {reqCount > 0 && (
                      <span className="text-[9px] sm:text-[10px] bg-orange-100 text-orange-700 px-1 rounded font-medium">
                        {reqCount}R
                      </span>
                    )}
                    {ordCount > 0 && (
                      <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-medium">
                        {ordCount}O
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-orange-100 rounded" />
            Requests
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-blue-100 rounded" />
            Orders
          </span>
        </div>
      </Card>

      {/* Selected date details */}
      {selectedDate && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({selectedItems.length} item
              {selectedItems.length !== 1 ? "s" : ""})
            </span>
          </h3>

          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              No requests or orders due on this date.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((entry) => (
                <OrderCard
                  key={entry.orderData.id}
                  order={entry.orderData}
                  isExpanded={expandedId === entry.orderData.id}
                  onToggleExpand={() =>
                    setExpandedId(
                      expandedId === entry.orderData.id
                        ? null
                        : entry.orderData.id,
                    )
                  }
                  userRole={userRole}
                  currentUser={
                    currentUser ||
                    sessionStorage.getItem("username") ||
                    localStorage.getItem("username") ||
                    ""
                  }
                  onSeeDetail={onSeeDetail}
                  onUpdateOrder={onUpdateOrder}
                  onEditOrder={onEditOrder}
                  onCancelOrder={onCancelOrder}
                  onDuplicateOrder={onDuplicateOrder}
                  showSalesName={userRole === "jb"}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
