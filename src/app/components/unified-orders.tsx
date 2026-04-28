import { Package } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Order } from "../types/order";
import { EntityReference, Request } from "../types/request";
import {
  notifyOrderStatusChanged,
  notifyRequestCancelled,
} from "../utils/notification-helper";
import {
  getBranchName,
  getCurrentUserDetails,
  getFullNameFromUsername,
  SupplierUser,
} from "../utils/user-data";
import { FilterSortControls } from "./filter-sort-controls";
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
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Convert a Request to an Order-compatible structure for rendering with OrderCard
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
    assignedSalesUsername: (request as any).assignedSalesUsername,
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

// Role type for the component
export type UserRole = "sales" | "jb" | "supplier" | "personal";

// Tab configuration by role
interface TabConfig {
  value: string;
  label: string;
  requestStatuses?: string[];
  orderStatuses?: string[];
  colorClass?: string;
}

// Props interface with all optional callbacks
interface UnifiedOrdersProps {
  userRole: UserRole;
  // Request-related callbacks
  onEditRequest?: (request: Request) => void;
  onDuplicateRequest?: (request: Request, currentTab: string) => void;
  onCancelRequest?: (requestId: string) => void;
  onViewRequestDetails?: (request: Request, currentTab: string) => void;
  onVerifyRequest?: (request: Request, currentTab: string) => void;
  // Order-related callbacks
  onSeeDetail?: (order: Order, currentTab?: string) => void;
  onUpdateOrder?: (order: Order, currentTab?: string) => void;
  // General props
  initialTab?: string;
  justCreatedRequest?: boolean;
  onClearJustCreated?: () => void;
  supplierId?: string; // For supplier role
  focusSearch?: boolean;
  onFocusSearchConsumed?: () => void;
}

// Role-specific tab configurations
const TAB_CONFIGS: Record<UserRole, TabConfig[]> = {
  personal: [
    { value: "all", label: "tabs.all" },
    {
      value: "internal",
      label: "tabs.internal",
      requestStatuses: ["Requested to JB"],
    },
    { value: "open", label: "tabs.open", requestStatuses: ["Open"] },
    {
      value: "in-progress",
      label: "tabs.inProgress",
      requestStatuses: ["JB Verifying"],
    },
    {
      value: "assigned",
      label: "tabs.assigned",
      requestStatuses: ["Requested to JB"],
    },
    { value: "done", label: "tabs.done", requestStatuses: ["Done"] },
    {
      value: "cancelled",
      label: "tabs.cancelled",
      requestStatuses: ["Cancelled"],
    },
    {
      value: "expired",
      label: "Expired",
      requestStatuses: ["Request Expired"],
      colorClass: "text-red-600 border-red-600",
    },
  ],
  sales: [
    { value: "all", label: "All" },
    {
      value: "internal",
      label: "Internal",
      requestStatuses: ["Open", "JB Verifying"],
    },
    {
      value: "negotiation",
      label: "Negotiation",
      orderStatuses: [
        "New Order",
        "Supplier Viewed",
        "Change Pending Approval",
        "Pending Sales Review",
        "Pending JB Review",
        "Order Revised",
      ],
    },
    {
      value: "shipping",
      label: "In Progress",
      orderStatuses: [
        "In Production",
        "Stock Ready",
        "Shipping",
        "Partially Delivered",
        "Fully Delivered",
      ],
    },
    {
      value: "closed",
      label: "Closed",
      orderStatuses: [
        "Closed",
        "Completed",
        "Rejected",
        "Cancelled",
        "Unable to Fulfill",
      ],
      requestStatuses: ["Cancelled", "Rejected", "Request Expired"],
    },
  ],
  jb: [
    { value: "all", label: "All" },
    {
      value: "internal",
      label: "Internal",
      requestStatuses: ["Open", "JB Verifying", "Requested to JB"],
    },
    {
      value: "negotiation",
      label: "In Negotiation",
      orderStatuses: [
        "New Order",
        "Supplier Viewed",
        "Change Pending Approval",
        "Pending Sales Review",
        "Pending JB Review",
        "Pending Sales Review",
        "Pending JB Review",
        "Order Revised",
      ],
    },
    {
      value: "shipping",
      label: "In Progress",
      orderStatuses: [
        "In Production",
        "Stock Ready",
        "Shipping",
        "Partially Delivered",
        "Fully Delivered",
      ],
    },
    {
      value: "closed",
      label: "Closed",
      orderStatuses: ["Closed", "Rejected", "Cancelled", "Unable to Fulfill"],
      requestStatuses: ["Rejected", "Cancelled", "Request Expired"],
    },
  ],
  supplier: [
    { value: "all", label: "All" },
    {
      value: "negotiation",
      label: "Negotiation",
      orderStatuses: [
        "New Order",
        "Supplier Viewed",
        "Change Pending Approval",
        "Pending Sales Review",
        "Pending JB Review",
        "Order Revised",
      ],
    },
    {
      value: "shipping",
      label: "In Progress",
      orderStatuses: [
        "In Production",
        "Stock Ready",
        "Shipping",
        "Partially Delivered",
        "Fully Delivered",
      ],
    },
    {
      value: "closed",
      label: "Closed",
      orderStatuses: ["Closed", "Rejected", "Cancelled", "Unable to Fulfill"],
    },
  ],
};

/** All valid order/request statuses — used for the status filter dropdown. */
const ALL_STATUSES = [
  "Open",
  "JB Verifying",
  "New Order",
  "Rejected",
  "Cancelled",
  "Change Pending Approval",
  "Supplier Viewed",
  "In Production",
  "Stock Ready",
  "Unable to Fulfill",
  "Partially Delivered",
  "Fully Delivered",
  "Closed",
  "Pending Sales Review",
  "Pending JB Review",
  "Order Revised",
  "Shipping",
];

function useRequestSortOptions(role: UserRole) {
  const { t } = useTranslation();
  const options = [
    { value: "updatedDate", label: t("sortOptions.updatedDate") },
    { value: "created", label: t("sortOptions.created") },
    { value: "eta", label: t("sortOptions.eta") },
    { value: "productName", label: t("sortOptions.productName") },
    { value: "sales", label: t("sortOptions.sales") },
    { value: "atasNama", label: t("sortOptions.atasNama") },
    { value: "pabrik", label: t("sortOptions.pabrik") },
    { value: "requestNo", label: t("sortOptions.requestNo") },
  ];
  if (role === "supplier") {
    options.push({ value: "branch", label: "Branch" });
  }
  options.push({ value: "status", label: "Status" });
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function UnifiedOrders({
  userRole,
  onEditRequest,
  onDuplicateRequest,
  onCancelRequest,
  onViewRequestDetails,
  onVerifyRequest,
  onSeeDetail,
  onUpdateOrder,
  initialTab,
  justCreatedRequest,
  onClearJustCreated,
  supplierId,
  focusSearch,
  onFocusSearchConsumed,
}: UnifiedOrdersProps) {
  const { t } = useTranslation();
  const sortOptions = useRequestSortOptions(userRole);

  // State
  const [requests, setRequests] = useState<Request[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Get session storage key prefix based on role
  const storagePrefix =
    userRole === "personal" ? "myOrders" : `${userRole}Order`;

  const [activeTab, setActiveTab] = useState(() => {
    if (justCreatedRequest && userRole === "personal") {
      return "open";
    }
    if (initialTab) return initialTab;
    const stored = sessionStorage.getItem(
      `${userRole === "personal" ? "myOrders" : `${userRole}Order`}ActiveTab`,
    );
    return stored || TAB_CONFIGS[userRole][0].value;
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem(`${storagePrefix}SortBy`) || "updatedDate";
  });

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem(`${storagePrefix}SortDirection`) as
        | "asc"
        | "desc") || "desc"
    );
  });

  const [searchFilter, setSearchFilter] = useState<string>(() => {
    return sessionStorage.getItem(`${storagePrefix}Filter`) || "";
  });

  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const stored = sessionStorage.getItem(
      `${userRole === "personal" ? "myOrders" : `${userRole}Order`}StatusFilter`,
    );
    return stored ? JSON.parse(stored) : [];
  });
  const [branchFilter, setBranchFilter] = useState<string[]>(() => {
    // Pre-populate from supplier user's branches attribute
    const userDetails = getCurrentUserDetails();
    if (userDetails?.accountType === "supplier") {
      const supplierUser = userDetails as SupplierUser;
      if (supplierUser.branches && supplierUser.branches.length > 0) {
        return supplierUser.branches;
      }
    }
    return [];
  });
  const [kadarFilter, setKadarFilter] = useState<string[]>(() => {
    // Pre-populate from supplier user's kadar attribute
    const userDetails = getCurrentUserDetails();
    if (userDetails?.accountType === "supplier") {
      const supplierUser = userDetails as SupplierUser;
      if (supplierUser.kadar && supplierUser.kadar.length > 0) {
        return supplierUser.kadar;
      }
    }
    return [];
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search box when requested (e.g. JB clicks Inbound)
  useEffect(() => {
    if (focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
      onFocusSearchConsumed?.();
    }
  }, [focusSearch]);

  const [displayedCount, setDisplayedCount] = useState(20);

  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(`${storagePrefix}SortBy`, sortBy);
  }, [sortBy, storagePrefix]);

  useEffect(() => {
    sessionStorage.setItem(`${storagePrefix}SortDirection`, sortDirection);
  }, [sortDirection, storagePrefix]);

  useEffect(() => {
    sessionStorage.setItem(`${storagePrefix}Filter`, searchFilter);
  }, [searchFilter, storagePrefix]);

  useEffect(() => {
    sessionStorage.setItem(`${storagePrefix}ActiveTab`, activeTab);
  }, [activeTab, storagePrefix]);

  useEffect(() => {
    sessionStorage.setItem(
      `${storagePrefix}StatusFilter`,
      JSON.stringify(statusFilter),
    );
  }, [statusFilter, storagePrefix]);

  // Load data on mount and when window regains focus
  useEffect(() => {
    loadData();

    const handleFocus = () => loadData();
    const handleVisibilityChange = () => {
      if (!document.hidden) loadData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userRole, supplierId]);

  // Update activeTab when initialTab changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Clear justCreated flag after showing
  useEffect(() => {
    if (justCreatedRequest && onClearJustCreated) {
      const timer = setTimeout(() => {
        onClearJustCreated();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [justCreatedRequest, onClearJustCreated]);

  // Lazy loading via IntersectionObserver — refs declared here, effect runs
  // after totalCount is computed further below.
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset displayedCount when filters change
  useEffect(() => {
    setDisplayedCount(20);
  }, [
    activeTab,
    sortBy,
    sortDirection,
    searchFilter,
    statusFilter,
    branchFilter,
    kadarFilter,
  ]);

  const loadData = () => {
    // Load requests (for personal, sales, jb roles)
    if (userRole === "personal" || userRole === "sales" || userRole === "jb") {
      const savedRequests = localStorage.getItem("orders");
      if (savedRequests) {
        const allRequests: Request[] = JSON.parse(savedRequests);

        if (userRole === "personal") {
          // Filter by current user (createdBy field)
          const myRequests = allRequests.filter(
            (req: Request) =>
              req.createdBy?.toLowerCase() === currentUser.toLowerCase(),
          );
          setRequests(myRequests);
        } else if (userRole === "sales") {
          // Sales see their own requests OR requests where they are atas nama, scoped to their branch
          const currentUserDetails = getCurrentUserDetails();
          const myBranch = currentUserDetails?.branchCode;
          const myRequests = allRequests.filter(
            (req: Request) =>
              (req.createdBy?.toLowerCase() === currentUser.toLowerCase() ||
                (req as any).assignedSalesUsername?.toLowerCase() ===
                  currentUser.toLowerCase()) &&
              (!myBranch || !req.branchCode || req.branchCode === myBranch),
          );
          setRequests(myRequests);
        } else if (userRole === "jb") {
          // JB sees all requests scoped to their branch
          const currentUserDetails = getCurrentUserDetails();
          const myBranch = currentUserDetails?.branchCode;
          const myRequests = allRequests.filter(
            (req: Request) =>
              !myBranch || !req.branchCode || req.branchCode === myBranch,
          );
          setRequests(myRequests);
        } else {
          setRequests(allRequests);
        }
      }
    }

    // Load orders (for sales, jb, supplier roles)
    if (userRole === "sales" || userRole === "jb" || userRole === "supplier") {
      const savedOrders = localStorage.getItem("orders");
      if (savedOrders) {
        const allOrders: Order[] = JSON.parse(savedOrders);

        if (userRole === "supplier" && supplierId) {
          // Filter by supplier ID only; kadar/branch filtering is done via UI filters
          const myOrders = allOrders.filter(
            (order) => (typeof order.pabrik === 'string' ? order.pabrik === supplierId : order.pabrik?.id === supplierId),
          );
          setOrders(myOrders);
        } else if (userRole === "sales") {
          // Sales see their own orders OR orders where they are atas nama, scoped to their branch
          const currentUserDetails = getCurrentUserDetails();
          const myBranch = currentUserDetails?.branchCode;
          const myOrders = allOrders.filter(
            (order) =>
              (order.sales?.toLowerCase() === currentUser.toLowerCase() ||
                order.assignedSalesUsername?.toLowerCase() ===
                  currentUser.toLowerCase()) &&
              (!myBranch || !order.branchCode || order.branchCode === myBranch),
          );
          setOrders(myOrders);
        } else if (userRole === "jb") {
          // JB sees all orders scoped to their branch
          const currentUserDetails = getCurrentUserDetails();
          const myBranch = currentUserDetails?.branchCode;
          const myOrders = allOrders.filter(
            (order) =>
              !myBranch || !order.branchCode || order.branchCode === myBranch,
          );
          setOrders(myOrders);
        } else {
          setOrders(allOrders);
        }
      }
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleTabClick = useCallback(() => {
    setExpandedOrderId(null);
  }, []);

  // Cancel request handler
  const handleCancelRequest = (requestId: string) => {
    setRequestToCancel(requestId);
    setShowCancelDialog(true);
  };

  const confirmCancelRequest = () => {
    if (!requestToCancel) return;

    const updatedRequests = requests.map((request: Request) =>
      request.id === requestToCancel
        ? { ...request, status: "Cancelled" }
        : request,
    );
    setRequests(updatedRequests);

    const allRequests: Request[] = JSON.parse(
      localStorage.getItem("orders") || "[]",
    );
    const updatedAllRequests = allRequests.map((request: Request) =>
      request.id === requestToCancel
        ? { ...request, status: "Cancelled" }
        : request,
    );
    localStorage.setItem("orders", JSON.stringify(updatedAllRequests));

    const cancelledRequest = updatedAllRequests.find(
      (request) => request.id === requestToCancel,
    );
    if (cancelledRequest) {
      notifyRequestCancelled(cancelledRequest, currentUser);
    }

    if (onCancelRequest) {
      onCancelRequest(requestToCancel);
    }

    toast.success("Request cancelled successfully");
    setShowCancelDialog(false);
    setRequestToCancel(null);
  };

  // Verify request handler (for JB role)
  const handleVerifyRequest = (request: Request, currentTab: string) => {
    if (request.status === "Open") {
      const updatedRequests = requests.map((r: Request) => {
        if (r.id === request.id) {
          return {
            ...r,
            status: "JB Verifying" as const,
            viewedBy: [...(r.viewedBy || []), currentUser],
            updatedDate: Date.now(),
          };
        }
        return r;
      });

      localStorage.setItem("orders", JSON.stringify(updatedRequests));

      request = {
        ...request,
        status: "JB Verifying" as const,
        viewedBy: [...(request.viewedBy || []), currentUser],
        updatedDate: Date.now(),
      };
    }

    if (onVerifyRequest) {
      onVerifyRequest(request, currentTab);
    }
  };

  // Update order status handler (for supplier role)
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

        notifyOrderStatusChanged(
          allOrders[orderIndex],
          oldStatus,
          newStatus,
          currentUser,
          "supplier",
        );

        loadData();
      }
    }
  };

  // Filter by search term
  const searchFiltered = {
    requests: requests.filter((req: Request) => {
      if (searchFilter.trim()) {
        const searchTerm = searchFilter.trim().toLowerCase();
        const requestNo = req.requestNo?.toLowerCase() || "";
        const createdBy = req.createdBy?.toLowerCase() || "";
        const pabrikName =
          (typeof req.pabrik === "object"
            ? req.pabrik?.name
            : req.pabrik
          )?.toLowerCase() || "";
        const customerName =
          (typeof req.namaPelanggan === "object"
            ? req.namaPelanggan?.name
            : req.namaPelanggan
          )?.toLowerCase() || "";
        const stockistId = req.stockistId?.toLowerCase() || "";
        const createdByFull = getFullNameFromUsername(
          req.createdBy || "",
        ).toLowerCase();
        const stockistFull = getFullNameFromUsername(
          req.stockistId || "",
        ).toLowerCase();
        const namaProduk = req.namaProduk?.toLowerCase() || "";
        const jenisProduk = req.jenisProduk?.toLowerCase() || "";
        const namaBasic = req.namaBasic?.toLowerCase() || "";
        return (
          requestNo.includes(searchTerm) ||
          createdBy.includes(searchTerm) ||
          createdByFull.includes(searchTerm) ||
          pabrikName.includes(searchTerm) ||
          customerName.includes(searchTerm) ||
          stockistId.includes(searchTerm) ||
          stockistFull.includes(searchTerm) ||
          namaProduk.includes(searchTerm) ||
          jenisProduk.includes(searchTerm) ||
          namaBasic.includes(searchTerm)
        );
      }
      return true;
    }),
    orders: orders.filter((order: Order) => {
      if (searchFilter.trim()) {
        const searchTerm = searchFilter.trim().toLowerCase();
        const poNumber = order.PONumber?.toLowerCase() || "";
        const sales = order.sales?.toLowerCase() || "";
        const salesFull = getFullNameFromUsername(
          order.sales || "",
        ).toLowerCase();
        const jbId = order.jbId?.toLowerCase() || "";
        const jbFull = getFullNameFromUsername(order.jbId || "").toLowerCase();
        const supplierName = (typeof order.pabrik === 'string' ? order.pabrik : order.pabrik?.name || '').toLowerCase();
        const customerName = order.atasNama?.toLowerCase() || "";
        const namaProduk = order.namaProduk?.toLowerCase() || "";
        const jenisProduk = order.jenisProduk?.toLowerCase() || "";
        const namaBasic = order.namaBasic?.toLowerCase() || "";
        const namaBarang = order.namaBarang?.toLowerCase() || "";
        const branchName = order.branchCode
          ? getBranchName(order.branchCode).toLowerCase()
          : "";
        return (
          poNumber.includes(searchTerm) ||
          sales.includes(searchTerm) ||
          salesFull.includes(searchTerm) ||
          jbId.includes(searchTerm) ||
          jbFull.includes(searchTerm) ||
          supplierName.includes(searchTerm) ||
          customerName.includes(searchTerm) ||
          namaProduk.includes(searchTerm) ||
          jenisProduk.includes(searchTerm) ||
          namaBasic.includes(searchTerm) ||
          namaBarang.includes(searchTerm) ||
          branchName.includes(searchTerm)
        );
      }
      return true;
    }),
  };

  // Get tab configs for current role
  const tabConfigs = TAB_CONFIGS[userRole];

  // Calculate counts for each tab — after all filters (search + status + branch)
  const tabCounts = tabConfigs.map((tab) => {
    let count = 0;
    let unseenCount = 0;

    // Apply status + branch filters to search-filtered data for this tab
    const tabRequests = searchFiltered.requests.filter((req: Request) => {
      if (tab.value !== "all" && !tab.requestStatuses?.includes(req.status))
        return false;
      if (statusFilter.length > 0 && !statusFilter.includes(req.status))
        return false;
      return true;
    });
    const tabOrders = searchFiltered.orders.filter((order: Order) => {
      if (tab.value !== "all" && !tab.orderStatuses?.includes(order.status))
        return false;
      if (statusFilter.length > 0 && !statusFilter.includes(order.status))
        return false;
      if (
        branchFilter.length > 0 &&
        (!order.branchCode || !branchFilter.includes(order.branchCode))
      )
        return false;
      if (
        kadarFilter.length > 0 &&
        !order.detailItems?.some((item) => kadarFilter.includes(item.kadar))
      )
        return false;
      return true;
    });

    count = tabRequests.length + tabOrders.length;
    unseenCount =
      tabRequests.filter((r: Request) => !r.viewedBy?.includes(currentUser))
        .length +
      tabOrders.filter((o: Order) => !o.viewedBy?.includes(currentUser)).length;

    return { tab: tab.value, count, unseenCount };
  });

  // Filter data by active tab, then by status filter
  const tabFilteredData = {
    requests: searchFiltered.requests.filter((req: Request) => {
      const currentTabConfig = tabConfigs.find((t) => t.value === activeTab);
      if (!currentTabConfig) return false;

      if (activeTab === "all") return true;

      return currentTabConfig.requestStatuses?.includes(req.status) || false;
    }),
    orders: searchFiltered.orders.filter((order: Order) => {
      const currentTabConfig = tabConfigs.find((t) => t.value === activeTab);
      if (!currentTabConfig) return false;

      if (activeTab === "all") return true;

      return currentTabConfig.orderStatuses?.includes(order.status) || false;
    }),
  };

  // Build status options: all statuses shown; disabled when not present across all tabs ("All" tab view)
  const allTabStatusSet = new Set([
    ...searchFiltered.requests.map((r: Request) => r.status),
    ...searchFiltered.orders.map((o: Order) => o.status),
  ]);
  const availableStatuses: {
    value: string;
    label: string;
    disabled?: boolean;
  }[] = ALL_STATUSES.map((s) => ({
    value: s,
    label: s,
    disabled: !allTabStatusSet.has(s),
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Build branch options: all known branches shown; disabled when not present across all orders
  const ALL_BRANCHES: Array<{ code: string; label: string }> = [
    { code: "SBY", label: "Surabaya" },
    { code: "JKT", label: "Jakarta" },
    { code: "BDG", label: "Bandung" },
  ];
  const allTabBranchSet = new Set(
    searchFiltered.orders
      .map((o: Order) => o.branchCode)
      .filter(Boolean) as string[],
  );
  const availableBranches: {
    value: string;
    label: string;
    disabled?: boolean;
  }[] =
    userRole === "supplier"
      ? ALL_BRANCHES.map(({ code, label }) => ({
          value: code,
          label,
          disabled: !allTabBranchSet.has(code),
        }))
      : [];

  // Build kadar options from all orders/requests (show for supplier + jb roles)
  const ALL_KADAR = [
    { value: "6k", label: "6K" },
    { value: "8k", label: "8K" },
    { value: "9k", label: "9K" },
    { value: "16k", label: "16K" },
    { value: "17k", label: "17K" },
    { value: "24k", label: "24K" },
  ];
  const allKadarSet = new Set<string>(
    [
      ...searchFiltered.orders.flatMap((o: Order) =>
        (o.detailItems || []).map((item) => item.kadar),
      ),
      ...searchFiltered.requests.flatMap((r: Request) =>
        (r.detailItems || []).map((item: any) => item.kadar),
      ),
    ].filter(Boolean),
  );
  const availableKadar: { value: string; label: string; disabled?: boolean }[] =
    userRole === "supplier" || userRole === "jb"
      ? ALL_KADAR.map(({ value, label }) => ({
          value,
          label,
          disabled: !allKadarSet.has(value),
        }))
      : [];

  const statusFiltered = {
    requests:
      statusFilter.length > 0
        ? tabFilteredData.requests.filter((r: Request) =>
            statusFilter.includes(r.status),
          )
        : tabFilteredData.requests,
    orders:
      statusFilter.length > 0
        ? tabFilteredData.orders.filter((o: Order) =>
            statusFilter.includes(o.status),
          )
        : tabFilteredData.orders,
  };

  const filteredData = {
    requests: statusFiltered.requests,
    orders: (() => {
      let result = statusFiltered.orders;
      if (branchFilter.length > 0) {
        result = result.filter(
          (o: Order) => o.branchCode && branchFilter.includes(o.branchCode),
        );
      }
      if (kadarFilter.length > 0) {
        result = result.filter(
          (o: Order) =>
            o.detailItems &&
            o.detailItems.some((item) => kadarFilter.includes(item.kadar)),
        );
      }
      return result;
    })(),
  };

  // Sort requests
  const sortedRequests = filteredData.requests.sort(
    (a: Request, b: Request) => {
      let comparison = 0;
      switch (sortBy) {
        case "updatedDate":
          comparison =
            (b.updatedDate || b.timestamp) - (a.updatedDate || a.timestamp);
          break;
        case "created":
          comparison = b.timestamp - a.timestamp;
          break;
        case "eta":
          comparison = (a.waktuKirim || "").localeCompare(b.waktuKirim || "");
          break;
        case "productName":
          const aProduct = `${a.jenisProduk} ${a.namaProduk || a.namaBasic}`;
          const bProduct = `${b.jenisProduk} ${b.namaProduk || b.namaBasic}`;
          comparison = aProduct.localeCompare(bProduct);
          break;
        case "sales":
          comparison = (a.createdBy || "").localeCompare(b.createdBy || "");
          break;
        case "atasNama":
          const aCustomer =
            typeof a.namaPelanggan === "string"
              ? a.namaPelanggan
              : a.namaPelanggan?.name || "";
          const bCustomer =
            typeof b.namaPelanggan === "string"
              ? b.namaPelanggan
              : b.namaPelanggan?.name || "";
          comparison = aCustomer.localeCompare(bCustomer);
          break;
        case "pabrik":
          const aPabrik =
            typeof a.pabrik === "string" ? a.pabrik : a.pabrik?.name || "";
          const bPabrik =
            typeof b.pabrik === "string" ? b.pabrik : b.pabrik?.name || "";
          comparison = aPabrik.localeCompare(bPabrik);
          break;
        case "requestNo":
          comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "desc" ? comparison : -comparison;
    },
  );

  // Sort orders
  const sortedOrders = filteredData.orders.sort((a: Order, b: Order) => {
    let comparison = 0;
    switch (sortBy) {
      case "updatedDate":
        comparison =
          (b.updatedDate || b.createdDate) - (a.updatedDate || a.createdDate);
        break;
      case "created":
        comparison = b.createdDate - a.createdDate;
        break;
      case "eta":
        comparison = (a.waktuKirim || "").localeCompare(b.waktuKirim || "");
        break;
      case "productName":
        const aProduct = `${a.jenisProduk} ${a.namaProduk || a.namaBasic}`;
        const bProduct = `${b.jenisProduk} ${b.namaProduk || b.namaBasic}`;
        comparison = aProduct.localeCompare(bProduct);
        break;
      case "pabrik":
        const aPabrik =
          typeof a.pabrik === "string" ? a.pabrik : a.pabrik?.name || "";
        const bPabrik =
          typeof b.pabrik === "string" ? b.pabrik : b.pabrik?.name || "";
        comparison = aPabrik.localeCompare(bPabrik);
        break;
      case "atasNama":
        comparison = (a.atasNama || "").localeCompare(b.atasNama || "");
        break;
      case "requestNo":
        comparison = (a.requestNo || "").localeCompare(b.requestNo || "");
        break;
      case "branch":
        const BRANCH_RANK: Record<string, number> = { SBY: 0, JKT: 1, BDG: 2 };
        const aRank = a.branchCode ? (BRANCH_RANK[a.branchCode] ?? 99) : 99;
        const bRank = b.branchCode ? (BRANCH_RANK[b.branchCode] ?? 99) : 99;
        comparison = aRank - bRank;
        break;
      case "status":
        comparison = (a.status || "").localeCompare(b.status || "");
        break;
      default:
        comparison = 0;
    }
    return sortDirection === "desc" ? comparison : -comparison;
  });

  // Combine and interleave requests and orders for display
  const allItems: Array<{ type: "request" | "order"; data: Request | Order }> =
    [
      ...sortedRequests.map((r: Request) => ({
        type: "request" as const,
        data: r,
      })),
      ...sortedOrders.map((o: Order) => ({ type: "order" as const, data: o })),
    ];

  // Re-sort combined items by updatedDate to interleave properly
  const sortedAllItems = allItems.sort((a, b) => {
    const aDate =
      a.data.updatedDate ||
      (a.type === "request"
        ? (a.data as Request).timestamp
        : (a.data as Order).createdDate);
    const bDate =
      b.data.updatedDate ||
      (b.type === "request"
        ? (b.data as Request).timestamp
        : (b.data as Order).createdDate);
    return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
  });

  const displayedItems = sortedAllItems.slice(0, displayedCount);
  const totalCount = sortedAllItems.length;

  // IntersectionObserver for lazy loading — fires when sentinel enters viewport
  // regardless of which ancestor element scrolls. Re-created on each batch load
  // so it fires again if the sentinel is still visible after new items render.
  // The custom TabsContent returns null for inactive tabs, so only ONE sentinel
  // is ever in the DOM at a time (no ref collision across tabConfigs.map()).
  useEffect(() => {
    const el = sentinelRef.current;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || displayedCount >= totalCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev: number) => prev + 20);
        }
      },
      { root: null, rootMargin: "0px 0px 400px 0px", threshold: 0 },
    );
    observer.observe(el);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [displayedCount, totalCount]);

  // Mark items as viewed
  const markAsViewed = (id: string, type: "request" | "order") => {
    if (type === "request") {
      const request = requests.find((r: Request) => r.id === id);
      if (request && !request.viewedBy?.includes(currentUser)) {
        const updatedRequests = requests.map((r: Request) =>
          r.id === id
            ? { ...r, viewedBy: [...(r.viewedBy || []), currentUser] }
            : r,
        );
        setRequests(updatedRequests);

        const allRequests: Request[] = JSON.parse(
          localStorage.getItem("orders") || "[]",
        );
        const updatedAllRequests = allRequests.map((r: Request) =>
          r.id === id
            ? { ...r, viewedBy: [...(r.viewedBy || []), currentUser] }
            : r,
        );
        localStorage.setItem("orders", JSON.stringify(updatedAllRequests));
      }
    } else {
      const order = orders.find((o: Order) => o.id === id);
      if (order && !order.viewedBy?.includes(currentUser)) {
        const updatedOrders = orders.map((o: Order) =>
          o.id === id
            ? { ...o, viewedBy: [...(o.viewedBy || []), currentUser] }
            : o,
        );
        setOrders(updatedOrders);

        const allOrders: Order[] = JSON.parse(
          localStorage.getItem("orders") || "[]",
        );
        const updatedAllOrders = allOrders.map((o: Order) =>
          o.id === id
            ? { ...o, viewedBy: [...(o.viewedBy || []), currentUser] }
            : o,
        );
        localStorage.setItem("orders", JSON.stringify(updatedAllOrders));
      }
    }
  };

  const ROLE_TITLES: Record<UserRole, string> = {
    personal: t("navigation.myRequests"),
    sales: t("navigation.salesOrders"),
    jb: t("navigation.jbOrders"),
    supplier: t("navigation.supplierOrders"),
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Single sticky header: title + filters + tab titles */}
        <div className="sticky top-0 z-10 bg-gray-50 -mx-4 px-4 pt-4">
          <div className="mb-4">
            <h1 className="text-xl font-semibold">{ROLE_TITLES[userRole]}</h1>
          </div>

          <FilterSortControls
            type={userRole === "personal" ? "request" : "order"}
            totalCount={totalCount}
            displayedCount={displayedItems.length}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={setSortBy}
            onSortDirectionChange={setSortDirection}
            sortOptions={sortOptions}
            filterValue={searchFilter}
            onFilterChange={setSearchFilter}
            searchInputRef={searchInputRef}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={availableStatuses}
            branchFilter={branchFilter}
            onBranchFilterChange={setBranchFilter}
            branchOptions={
              availableBranches.length > 0 ? availableBranches : undefined
            }
            kadarFilter={kadarFilter}
            onKadarFilterChange={setKadarFilter}
            kadarOptions={
              availableKadar.length > 0 ? availableKadar : undefined
            }
          />

          <TabsList className="flex w-full overflow-x-auto scrollbar-hide mt-4 mb-2 cursor-grab active:cursor-grabbing">
            {tabConfigs.map((tab) => {
              const tabCount = tabCounts.find((tc) => tc.tab === tab.value);
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={handleTabClick}
                  className={
                    activeTab === tab.value ? tab.colorClass || "" : ""
                  }
                >
                  {tab.label.startsWith("tabs.") ? t(tab.label) : tab.label} (
                  {tabCount?.count || 0})
                  {tabCount && tabCount.unseenCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                    >
                      {tabCount.unseenCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {tabConfigs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="m-0 mt-2">
            {totalCount === 0 ? (
              <Card className="p-8">
                <div className="text-center text-gray-500">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg mb-2">
                    {userRole === "personal"
                      ? "No requests yet"
                      : "No orders yet"}
                  </p>
                  <p className="text-sm">
                    {tab.value === "all"
                      ? userRole === "personal"
                        ? "Your saved requests will appear here"
                        : "Orders will appear here"
                      : `${tab.label.startsWith("tabs.") ? t(tab.label) : tab.label} ${userRole === "personal" ? "requests" : "orders"} will appear here`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3 pb-4">
                {displayedItems.map((item) => {
                  if (item.type === "request") {
                    const request = item.data as Request;
                    const orderData = requestToOrder(request);
                    const effectiveRole =
                      userRole === "personal"
                        ? "sales"
                        : userRole === "supplier"
                          ? "jb"
                          : userRole;

                    // Atas nama sales can view but not edit/cancel/duplicate
                    const isRequestAtasNama =
                      userRole === "sales" &&
                      (request as any).assignedSalesUsername?.toLowerCase() ===
                        currentUser.toLowerCase();

                    return (
                      <OrderCard
                        key={request.id}
                        order={orderData}
                        userRole={effectiveRole}
                        activeTab={activeTab}
                        isExpanded={expandedOrderId === request.id}
                        onToggleExpand={() => {
                          toggleExpand(request.id);
                          markAsViewed(request.id, "request");
                        }}
                        onCancelOrder={
                          isRequestAtasNama ? undefined : handleCancelRequest
                        }
                        onEditOrder={
                          !isRequestAtasNama && onEditRequest
                            ? (_o) => onEditRequest(request)
                            : undefined
                        }
                        onDuplicateOrder={
                          onDuplicateRequest
                            ? (_o) => onDuplicateRequest(request, activeTab)
                            : undefined
                        }
                        onSeeDetail={
                          onViewRequestDetails
                            ? (_o) => onViewRequestDetails(request, activeTab)
                            : userRole === "jb"
                              ? (_o) => handleVerifyRequest(request, activeTab)
                              : undefined
                        }
                        currentUser={currentUser}
                      />
                    );
                  } else {
                    const order = item.data as Order;

                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        userRole={userRole === "personal" ? "sales" : userRole}
                        isExpanded={expandedOrderId === order.id}
                        onToggleExpand={() => {
                          toggleExpand(order.id);
                          markAsViewed(order.id, "order");
                        }}
                        onSeeDetail={
                          onSeeDetail
                            ? (o) => {
                                if (
                                  userRole === "supplier" &&
                                  o.status === "New Order"
                                ) {
                                  handleUpdateStatus(o.id, "Supplier Viewed");
                                }
                                onSeeDetail(o, activeTab);
                              }
                            : undefined
                        }
                        onUpdateOrder={
                          onUpdateOrder &&
                          userRole !== "sales" &&
                          userRole !== "supplier" &&
                          activeTab !== "shipping" &&
                          !(userRole === "jb" && order.status === "New Order")
                            ? (o) => onUpdateOrder(o, activeTab)
                            : undefined
                        }
                        onDuplicateOrder={
                          onDuplicateRequest &&
                          (userRole === "personal" || userRole === "sales")
                            ? (o) =>
                                onDuplicateRequest(
                                  {
                                    ...o,
                                    namaPelanggan: {
                                      id: "",
                                      name: o.atasNama || "",
                                    },
                                    timestamp: o.createdDate,
                                    status: "Open",
                                    viewedBy: [],
                                  } as unknown as Request,
                                  activeTab,
                                )
                            : undefined
                        }
                        currentUser={currentUser}
                      />
                    );
                  }
                })}
                {displayedCount < totalCount && (
                  <div ref={sentinelRef} className="flex justify-center py-4">
                    <div className="text-sm text-gray-500">
                      {t("common.loadingMore")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Cancel Request Dialog (for sales/personal roles) */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this request? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelRequest}>
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
