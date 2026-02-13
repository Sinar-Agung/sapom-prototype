import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Request } from "../types/request";
import { RequestCard } from "./request-card";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBRequestsProps {
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
}

export function JBRequests({ onSeeDetail, initialTab }: JBRequestsProps) {
  const [orders, setOrders] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab || "assigned");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("updatedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [requestNoFilter, setRequestNoFilter] = useState<string>("");

  useEffect(() => {
    loadOrders();

    // Reload orders when window regains focus
    const handleFocus = () => {
      loadOrders();
    };
    window.addEventListener("focus", handleFocus);

    // Also reload when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Reload data when tab changes
  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("requests");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Filter by Request No first (before tab filtering)
  const requestNoFiltered = orders.filter((order: Request) => {
    if (requestNoFilter) {
      const searchTerm = requestNoFilter.toLowerCase();
      const requestNo = order.requestNo?.toLowerCase() || "";
      return requestNo.includes(searchTerm);
    }
    return true;
  });

  // Calculate filtered counts for each tab based on requestNo filter
  const filteredAssignedCount = requestNoFiltered.filter(
    (order: Request) => order.status === "Requested to JB",
  ).length;
  const filteredWaitingCount = requestNoFiltered.filter(
    (order: Request) => order.status === "Ordered",
  ).length;

  // Filter by active tab
  let filteredOrders = requestNoFiltered.filter((order: Request) => {
    if (activeTab === "assigned") {
      return order.status === "Requested to JB";
    } else if (activeTab === "waiting") {
      return order.status === "Ordered";
    }
    return false;
  });

  // Sort orders
  filteredOrders = filteredOrders.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        comparison =
          new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
        break;
      case "created":
        comparison =
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        break;
      case "eta":
        comparison =
          new Date(a.waktuKirim).getTime() - new Date(b.waktuKirim).getTime();
        break;
      case "productName":
        comparison = (a.namaBarang || "").localeCompare(b.namaBarang || "");
        break;
      case "sales":
        comparison = (a.sales || "").localeCompare(b.sales || "");
        break;
      case "atasNama":
        comparison = (a.atasNama || "").localeCompare(b.atasNama || "");
        break;
      case "pabrik":
        comparison = (a.pabrik?.nama || "").localeCompare(b.pabrik?.nama || "");
        break;
      case "requestNo":
        comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
        break;
      default:
        return 0;
    }
    return sortDirection === "desc" ? comparison : -comparison;
  });

  // Calculate counts for each tab (total, not filtered)
  const assignedCount = orders.filter(
    (order: Request) => order.status === "Requested to JB",
  ).length;
  const waitingCount = orders.filter(
    (order: Request) => order.status === "Ordered",
  ).length;

  const handleTabClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const value = target.getAttribute("data-value");
    if (value) {
      setActiveTab(value);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Requests</h1>
      </div>

      {/* Total and Controls */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm">
          Total: {assignedCount + waitingCount} requests
        </p>
        <div className="flex gap-6 items-center">
          <div className="w-52 relative">
            <Input
              placeholder="Filter by Request No..."
              value={requestNoFilter}
              onChange={(e) => setRequestNoFilter(e.target.value)}
              className="h-9 pr-8"
            />
            {requestNoFilter && (
              <button
                onClick={() => setRequestNoFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Sort by
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedDate">Updated Date</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="eta">ETA</SelectItem>
                <SelectItem value="productName">Product Name</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="atasNama">Atas Nama</SelectItem>
                <SelectItem value="pabrik">Pabrik</SelectItem>
                <SelectItem value="requestNo">Request No</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="h-9 w-9 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors"
              title={sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              {sortDirection === "asc" ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-shrink-0">
          <TabsTrigger
            value="assigned"
            onClick={handleTabClick}
            className={
              activeTab === "assigned"
                ? "text-purple-600 border-purple-600"
                : ""
            }
          >
            Assigned to JB ({filteredAssignedCount})
          </TabsTrigger>
          <TabsTrigger
            value="waiting"
            onClick={handleTabClick}
            className={
              activeTab === "waiting" ? "text-blue-600 border-blue-600" : ""
            }
          >
            Ordered ({filteredWaitingCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p>No requests in this tab</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <RequestCard
                    key={order.id}
                    order={order}
                    userRole="jb"
                    activeTab={activeTab}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(order.id)}
                    onSeeDetail={onSeeDetail}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
