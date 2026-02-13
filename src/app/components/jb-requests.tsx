import { useEffect, useState } from "react";
import { Request } from "../types/request";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { RequestCard } from "./request-card";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface JBRequestsProps {
  onSeeDetail?: (order: Request, currentTab: string) => void;
  initialTab?: string;
}

const REQUEST_SORT_OPTIONS: SortOption[] = [
  { value: "updatedDate", label: "Updated Date" },
  { value: "created", label: "Created Date" },
  { value: "eta", label: "ETA" },
  { value: "productName", label: "Product Name" },
  { value: "sales", label: "Sales" },
  { value: "atasNama", label: "Atas Nama" },
  { value: "pabrik", label: "Pabrik" },
  { value: "requestNo", label: "Request No" },
];

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl font-semibold">Requests</h1>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex-shrink-0 mb-4">
        <FilterSortControls
          type="request"
          totalCount={assignedCount + waitingCount}
          filterValue={requestNoFilter}
          onFilterChange={setRequestNoFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          sortOptions={REQUEST_SORT_OPTIONS}
        />
      </div>

      {/* Tabs and Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger
            value="assigned"
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
            className={
              activeTab === "waiting" ? "text-blue-600 border-blue-600" : ""
            }
          >
            Ordered ({filteredWaitingCount})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="flex-1 min-h-0 m-0">
          {filteredOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p>No requests in this tab</p>
              </div>
            </Card>
          ) : (
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="space-y-3 pb-4">
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
