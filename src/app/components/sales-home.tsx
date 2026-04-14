import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import type { Order, OrderArrival } from "@/app/types/order";
import type { Request } from "@/app/types/request";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import {
  getBranchName,
  getCurrentUserDetails,
  getFullNameFromUsername,
} from "@/app/utils/user-data";
import { ArrowRight, Bell, Package, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface SalesHomeProps {
  onNavigateToOrders?: (tab?: string) => void;
  onSeeOrderDetail?: (order: Order) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SalesHome({
  onNavigateToOrders,
  onSeeOrderDetail,
}: SalesHomeProps) {
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";
  const fullName = getFullNameFromUsername(currentUser);
  const currentUserDetails = getCurrentUserDetails();

  const [pendingReviewOrders, setPendingReviewOrders] = useState<Order[]>([]);
  const [recentArrivals, setRecentArrivals] = useState<
    { arrival: OrderArrival; order: Order }[]
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const ordersJson = localStorage.getItem("orders");
    const requestsJson = localStorage.getItem("requests");
    const arrivalsJson = localStorage.getItem("orderArrivals");

    const allOrders: Order[] = ordersJson ? JSON.parse(ordersJson) : [];
    const allRequests: Request[] = requestsJson ? JSON.parse(requestsJson) : [];
    const allArrivals: OrderArrival[] = arrivalsJson
      ? JSON.parse(arrivalsJson)
      : [];

    // Build a set of request IDs that belong to this sales person
    const myRequestIds = new Set(
      allRequests.filter((r) => r.createdBy === currentUser).map((r) => r.id),
    );

    // Orders linked to my requests
    const myOrders = allOrders.filter(
      (o) =>
        o.sales === currentUser ||
        (o.requestId && myRequestIds.has(o.requestId)),
    );

    // Pending Sales Review orders — latest first
    const pending = [...myOrders]
      .filter((o) => o.status === "Pending Sales Review")
      .sort(
        (a, b) =>
          (b.updatedDate || b.createdDate) - (a.updatedDate || a.createdDate),
      )
      .slice(0, 5);
    setPendingReviewOrders(pending);

    // Build order lookup
    const orderById = new Map(myOrders.map((o) => [o.id, o]));

    // Arrivals for my orders — latest first
    const myArrivals = allArrivals
      .filter((a) => orderById.has(a.orderId))
      .sort((a, b) => b.createdDate - a.createdDate)
      .slice(0, 5)
      .map((a) => ({ arrival: a, order: orderById.get(a.orderId)! }));
    setRecentArrivals(myArrivals);
  };

  const getProductLabel = (order: Order) => {
    const jenis =
      getLabelFromValue(JENIS_PRODUK_OPTIONS, order.jenisProduk) ||
      order.jenisProduk;
    const name =
      order.kategoriBarang === "basic"
        ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic) ||
          order.namaBasic
        : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk) ||
          order.namaProduk;
    return `${jenis} ${name}`.trim();
  };

  const getTotalArrivalPcs = (arrival: OrderArrival) =>
    arrival.items.reduce((sum, i) => sum + i.pcs, 0);

  const getTotalOrderPcs = (order: Order) =>
    order.detailItems.reduce((sum, i) => sum + (parseInt(i.pcs) || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-4">
      {/* Welcome Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Welcome, {fullName}!</h1>
          {currentUserDetails?.branchCode && (
            <Badge variant="secondary" className="text-sm">
              {getBranchName(currentUserDetails.branchCode)}
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-sm">
          Here's what needs your attention today.
        </p>
      </div>

      {/* Pending Sales Review */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-base">Pending Your Review</h2>
            {pendingReviewOrders.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingReviewOrders.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateToOrders?.("review")}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {pendingReviewOrders.length === 0 ? (
          <Card className="p-6 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No orders pending your review</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingReviewOrders.map((order) => {
              const lastRevision =
                order.revisionHistory?.[order.revisionHistory.length - 1];
              const revisedBy = lastRevision
                ? getFullNameFromUsername(lastRevision.updatedBy)
                : null;
              const revisionTime = lastRevision?.timestamp;
              const totalPcs = getTotalOrderPcs(order);

              return (
                <Card
                  key={order.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border-amber-200 hover:border-amber-400"
                  onClick={() => onSeeOrderDetail?.(order)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {order.PONumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {getProductLabel(order)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{totalPcs} pcs</span>
                        <span>ETA {order.waktuKirim}</span>
                        {revisedBy && (
                          <span>
                            Revised by {revisedBy}
                            {revisionTime && ` · ${timeAgo(revisionTime)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Arrivals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-base">Recent Arrivals</h2>
          </div>
          <button
            onClick={() => onNavigateToOrders?.("shipping")}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentArrivals.length === 0 ? (
          <Card className="p-6 text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No arrivals recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentArrivals.map(({ arrival, order }) => {
              const arrivalPcs = getTotalArrivalPcs(arrival);
              const totalPcs = getTotalOrderPcs(order);

              return (
                <Card
                  key={arrival.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSeeOrderDetail?.(order)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {order.PONumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {getProductLabel(order)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="text-green-700 font-medium">
                          +{arrivalPcs} pcs arrived
                        </span>
                        <span>of {totalPcs} pcs ordered</span>
                        <span>{formatDate(arrival.createdDate)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
