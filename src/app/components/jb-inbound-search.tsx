import { Order } from "@/app/types/order";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OrderCard } from "./order-card";
import { Input } from "./ui/input";

interface JBInboundSearchProps {
  onSeeDetail: (order: Order) => void;
}

export function JBInboundSearch({ onSeeDetail }: JBInboundSearchProps) {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("orders");
    if (stored) setOrders(JSON.parse(stored));
    // Focus the search input on mount
    inputRef.current?.focus();
  }, []);

  const ACTIVE_STATUSES = [
    "In Production",
    "Stock Ready",
    "Partially Delivered",
    "Fully Delivered",
    "Shipping",
    "New Order",
    "Supplier Viewed",
    "Order Revised",
    "Change Pending Approval",
    "Pending Sales Review",
    "Pending JB Review",
  ];

  const trimmed = search.trim().toLowerCase();

  const filtered = trimmed
    ? orders.filter(
        (o) =>
          ACTIVE_STATUSES.includes(o.status) &&
          o.PONumber.toLowerCase().includes(trimmed),
      )
    : [];

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-6">Inbound</h1>

      {/* Big search box */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="Search by PO Number..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
          }
          className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:border-blue-500 shadow-sm"
          autoComplete="off"
        />
      </div>

      {/* Results */}
      {trimmed === "" && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
          Type a PO Number to search for orders
        </div>
      )}

      {trimmed !== "" && filtered.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
          No orders found for "{search}"
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3 overflow-y-auto flex-1 pb-4 scrollbar-hide">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="cursor-pointer"
              onClick={() => onSeeDetail(order)}
            >
              <OrderCard
                order={order}
                userRole="jb"
                onSeeDetail={() => onSeeDetail(order)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
