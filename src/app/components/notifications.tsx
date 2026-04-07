import { Notification } from "@/app/types/notification";
import {
  archiveNotificationForUser,
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllAsReadForUser,
  markNotificationAsRead,
  markNotificationAsUnread,
  unarchiveNotificationForUser,
} from "@/app/utils/notification-helper";
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
  AlertTriangle,
  ArchiveX,
  Bell,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  Clock,
  Edit,
  FileText,
  MailOpen,
  Package,
  RefreshCw,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FilterSortControls, SortOption } from "./filter-sort-controls";
import { NewBadge } from "./new-badge";
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
import { Checkbox } from "./ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface NotificationsProps {
  onNavigateToRequest?: (requestId: string) => void;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToUpdateOrder?: (orderId: string) => void;
}

const NAMA_BASIC_IMAGES: Record<string, string> = {
  "italy-santa": italySanta,
  "italy-kaca": italyKaca,
  "italy-bambu": italyBambu,
  "kalung-flexi": kalungFlexi,
  milano: milano,
  "sunny-vanessa": sunnyVanessa,
  casteli: casteli,
  tambang: tambang,
  "hollow-fancy-nori": hollowFancyNori,
};

function ArchiveBoxIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* lid */}
      <rect x="2" y="3" width="20" height="3" rx="1" />
      {/* box body */}
      <path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
      {/* down arrow */}
      <path d="M13 10h-2v3H9l3 3.5 3-3.5h-2v-3z" fill="white" />
    </svg>
  );
}

function UnarchiveBoxIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* lid */}
      <rect x="2" y="3" width="20" height="3" rx="1" />
      {/* box body */}
      <path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
      {/* up arrow */}
      <path d="M11 17h2v-3h2l-3-3.5-3 3.5h2v3z" fill="white" />
    </svg>
  );
}

const NOTIFICATION_SORT_OPTIONS: SortOption[] = [
  { value: "timestamp", label: "Date" },
  { value: "eventType", label: "Event Type" },
  { value: "entityNumber", label: "Request/Order No" },
  { value: "triggeredBy", label: "User" },
];

export function Notifications({
  onNavigateToRequest,
  onNavigateToOrder,
  onNavigateToUpdateOrder,
}: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(40);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "expiring" | "archived"
  >(() => {
    const saved = sessionStorage.getItem("notificationsActiveTab");
    return (saved as "all" | "unread" | "expiring") || "all";
  });
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [notificationToArchive, setNotificationToArchive] = useState<
    string | null
  >(null);

  const handleArchiveNotification = (
    e: React.MouseEvent,
    notificationId: string,
  ) => {
    e.stopPropagation();
    setNotificationToArchive(notificationId);
    setShowArchiveDialog(true);
  };

  const handleBulkArchive = () => {
    selectedIds.forEach((id) => archiveNotificationForUser(id, currentUser));
    setSelectedIds(new Set());
    loadNotifications();
  };

  const handleBulkUnarchive = () => {
    selectedIds.forEach((id) => unarchiveNotificationForUser(id, currentUser));
    setSelectedIds(new Set());
    loadNotifications();
  };

  const handleBulkMarkAsRead = () => {
    selectedIds.forEach((id) => markNotificationAsRead(id, currentUser));
    setSelectedIds(new Set());
    loadNotifications();
  };

  const handleBulkMarkAsUnread = () => {
    selectedIds.forEach((id) => markNotificationAsUnread(id, currentUser));
    setSelectedIds(new Set());
    loadNotifications();
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(new Set(visibleNotifications.map((n) => n.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const confirmArchive = () => {
    if (notificationToArchive) {
      archiveNotificationForUser(notificationToArchive, currentUser);
      loadNotifications();
    }
    setShowArchiveDialog(false);
    setNotificationToArchive(null);
  };

  const [filterText, setFilterText] = useState(() => {
    return sessionStorage.getItem("notificationsFilterText") || "";
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem("notificationsSortBy") || "timestamp";
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    return (
      (sessionStorage.getItem("notificationsSortDirection") as
        | "asc"
        | "desc") || "desc"
    );
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";
  const accountType = (localStorage.getItem("userRole") ||
    sessionStorage.getItem("userRole") ||
    "sales") as "sales" | "stockist" | "jb" | "supplier";

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("notificationsActiveTab", activeTab);
    setSelectedIds(new Set()); // Clear selection when switching tabs
    setVisibleCount(40); // Reset lazy load on tab change
  }, [activeTab]);

  // Persist filter and sort states to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("notificationsFilterText", filterText);
  }, [filterText]);

  useEffect(() => {
    sessionStorage.setItem("notificationsSortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("notificationsSortDirection", sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    loadNotifications();

    // Set up periodic check every 5 seconds to mimic push notifications
    const intervalId = setInterval(() => {
      console.log("🔄 Periodic notification check...");
      loadNotifications();
    }, 5000); // Check every 5 seconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
      console.log("✓ Notification polling stopped");
    };
  }, []);

  const loadNotifications = () => {
    setIsRefreshing(true);
    console.log("Loading notifications for:", currentUser, accountType);
    const userNotifications = getNotificationsForUser(currentUser, accountType);
    console.log("Found notifications:", userNotifications.length);
    setNotifications(userNotifications);

    // Reset refreshing state after a brief moment
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId, currentUser);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadForUser(currentUser, accountType);
    loadNotifications();
  };

  const handleUnarchiveNotification = (
    e: React.MouseEvent,
    notificationId: string,
  ) => {
    e.stopPropagation();
    unarchiveNotificationForUser(notificationId, currentUser);
    loadNotifications();
  };

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("🔔 Notification clicked:", notification);
    console.log("   Entity Type:", notification.entityType);
    console.log("   Entity ID:", notification.entityId);
    console.log("   Event Type:", notification.eventType);
    console.log("   Current User:", currentUser);
    console.log("   Account Type:", accountType);

    const isUnread = !notification.readBy.includes(currentUser);

    // Mark as read if unread
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to request detail for request-related notifications
    if (notification.entityType === "request" && onNavigateToRequest) {
      console.log(
        "   → Calling onNavigateToRequest with ID:",
        notification.entityId,
      );
      onNavigateToRequest(notification.entityId);
    } else if (notification.entityType === "order") {
      // Special handling for order_change_requested - navigate to update page
      if (
        notification.eventType === "order_change_requested" &&
        onNavigateToUpdateOrder
      ) {
        console.log(
          "   → Calling onNavigateToUpdateOrder with ID:",
          notification.entityId,
        );
        onNavigateToUpdateOrder(notification.entityId);
      } else if (onNavigateToOrder) {
        console.log(
          "   → Calling onNavigateToOrder with ID:",
          notification.entityId,
        );
        onNavigateToOrder(notification.entityId);
      }
    } else {
      console.log(
        "   ⚠️ Not navigating - entityType:",
        notification.entityType,
        "hasRequestCallback:",
        !!onNavigateToRequest,
        "hasOrderCallback:",
        !!onNavigateToOrder,
      );
    }
  };

  // 30 days in milliseconds
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Archived = manually archived by user OR older than 30 days
  const archivedNotifications = notifications.filter(
    (n) =>
      n.archivedBy?.includes(currentUser) || now - n.timestamp > THIRTY_DAYS_MS,
  );
  const nonArchivedNotifications = notifications.filter(
    (n) =>
      !n.archivedBy?.includes(currentUser) &&
      now - n.timestamp <= THIRTY_DAYS_MS,
  );

  const tabFilteredNotifications =
    activeTab === "archived"
      ? archivedNotifications
      : activeTab === "unread"
        ? nonArchivedNotifications.filter(
            (n) =>
              !n.readBy.includes(currentUser) &&
              n.eventType !== "request_expiring",
          )
        : activeTab === "expiring"
          ? nonArchivedNotifications.filter(
              (n) => n.eventType === "request_expiring",
            )
          : nonArchivedNotifications.filter(
              (n) => n.eventType !== "request_expiring",
            ); // Exclude expiring from All tab

  // Apply text filter
  const filteredNotifications = tabFilteredNotifications.filter((n) => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      n.entityNumber?.toLowerCase().includes(searchText) ||
      n.message.toLowerCase().includes(searchText) ||
      n.triggeredBy.toLowerCase().includes(searchText)
    );
  });

  // Sort notifications based on user preference
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    // Special sorting for expiring tab: sort by days to ETA (ascending - closest to expiring first)
    if (activeTab === "expiring" && sortBy === "timestamp") {
      const aDaysToETA = a.changes?.[0]?.newValue as number;
      const bDaysToETA = b.changes?.[0]?.newValue as number;
      return (aDaysToETA || 0) - (bDaysToETA || 0);
    }

    let comparison = 0;

    switch (sortBy) {
      case "timestamp":
        comparison = b.timestamp - a.timestamp;
        break;
      case "eventType":
        comparison = a.eventType.localeCompare(b.eventType);
        break;
      case "entityNumber":
        comparison = (a.entityNumber || "").localeCompare(b.entityNumber || "");
        break;
      case "triggeredBy":
        comparison = a.triggeredBy.localeCompare(b.triggeredBy);
        break;
      default:
        comparison = b.timestamp - a.timestamp;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Lazy-load: when sentinel comes into view, load next 20
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev: number) => prev + 20);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedNotifications.length]);

  const selectedNotifications = sortedNotifications.filter((n) =>
    selectedIds.has(n.id),
  );
  const allSelectedRead =
    selectedIds.size > 0 &&
    selectedNotifications.every((n) => n.readBy.includes(currentUser));
  const allSelectedUnread =
    selectedIds.size > 0 &&
    selectedNotifications.every((n) => !n.readBy.includes(currentUser));

  const unreadCount = nonArchivedNotifications.filter(
    (n) =>
      !n.readBy.includes(currentUser) && n.eventType !== "request_expiring",
  ).length;

  const unreadCountHeader = getUnreadCountForUser(currentUser, accountType);

  const expiringCount = nonArchivedNotifications.filter(
    (n) => n.eventType === "request_expiring",
  ).length;

  const archivedCount = archivedNotifications.length;

  const getEventIcon = (eventType: string) => {
    if (eventType === "request_expiring") {
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
    if (eventType === "request_expired") {
      return <X className="w-5 h-5 text-red-600" />;
    }
    if (eventType === "order_change_requested") {
      return <Edit className="w-5 h-5 text-blue-600" />;
    }
    if (eventType === "order_change_approved") {
      return <CheckCheck className="w-5 h-5 text-green-600" />;
    }
    if (eventType === "order_revised") {
      return <Edit className="w-5 h-5 text-amber-600" />;
    }
    if (eventType.includes("request")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (eventType.includes("order")) {
      return <Package className="w-5 h-5 text-green-600" />;
    }
    return <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType === "request_expiring")
      return "bg-orange-50 border-orange-300";
    if (eventType === "request_expired") return "bg-red-50 border-red-300";
    if (eventType === "order_change_requested")
      return "bg-blue-50 border-blue-200";
    if (eventType === "order_change_approved")
      return "bg-green-50 border-green-300";
    if (eventType.includes("created")) return "bg-green-50 border-green-200";
    if (eventType.includes("updated")) return "bg-amber-50 border-amber-200";
    if (eventType.includes("cancelled")) return "bg-rose-50 border-rose-200";
    if (eventType.includes("rejected")) return "bg-red-50 border-red-200";
    if (eventType.includes("approved")) return "bg-blue-50 border-blue-200";
    if (eventType.includes("viewed")) return "bg-cyan-50 border-cyan-200";
    if (eventType.includes("status_changed"))
      return "bg-yellow-50 border-yellow-200";
    if (eventType.includes("arrival")) return "bg-purple-50 border-purple-200";
    if (eventType.includes("closed")) return "bg-gray-50 border-gray-200";
    return "bg-white border-gray-200";
  };

  const formatEventType = (eventType: string): string => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getEventTypePillColor = (eventType: string): string => {
    if (eventType === "request_expiring")
      return "bg-orange-100 text-orange-700";
    if (eventType === "request_expired") return "bg-red-100 text-red-700";
    if (eventType === "order_change_requested")
      return "bg-blue-100 text-blue-700";
    if (eventType === "order_change_approved")
      return "bg-green-100 text-green-700";
    if (eventType.includes("created")) return "bg-green-100 text-green-700";
    if (eventType.includes("updated")) return "bg-amber-100 text-amber-700";
    if (eventType.includes("cancelled")) return "bg-rose-100 text-rose-700";
    if (eventType.includes("rejected")) return "bg-red-100 text-red-700";
    if (eventType.includes("approved")) return "bg-blue-100 text-blue-700";
    if (eventType.includes("viewed")) return "bg-cyan-100 text-cyan-700";
    if (eventType.includes("status_changed"))
      return "bg-yellow-100 text-yellow-700";
    if (eventType.includes("arrival")) return "bg-purple-100 text-purple-700";
    if (eventType.includes("closed")) return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getThumbnailImage = (notification: Notification): string | null => {
    try {
      if (notification.entityType === "request") {
        const requestsJson = localStorage.getItem("requests");
        if (requestsJson) {
          const requests = JSON.parse(requestsJson);
          const request = requests.find(
            (r: any) => r.id === notification.entityId,
          );
          if (request?.fotoBarangBase64) return request.fotoBarangBase64;
          if (request?.kategoriBarang === "basic" && request?.namaBasic) {
            return NAMA_BASIC_IMAGES[request.namaBasic] || null;
          }
        }
      } else if (notification.entityType === "order") {
        const ordersJson = localStorage.getItem("orders");
        if (ordersJson) {
          const orders = JSON.parse(ordersJson);
          const order = orders.find((o: any) => o.id === notification.entityId);
          if (order?.fotoBarangBase64) return order.fotoBarangBase64;
          if (order?.kategoriBarang === "basic" && order?.namaBasic) {
            return NAMA_BASIC_IMAGES[order.namaBasic] || null;
          }
        }
      }
    } catch (error) {
      console.error("Error getting thumbnail image:", error);
    }
    return null;
  };

  const renderMessageFields = (
    message: string,
    isExpiring: boolean,
    isUnread: boolean,
    thumbnailImage: string | null,
  ) => {
    const lines = message.split("\n").filter(Boolean);
    const isParseable =
      lines.length > 1 && lines.every((l) => l.includes(": "));

    if (!isParseable) {
      return (
        <div className="flex gap-3 items-start mb-2">
          <p
            className={`text-sm whitespace-pre-wrap flex-1 ${
              isExpiring
                ? "text-orange-800 font-medium"
                : isUnread
                  ? "text-gray-700"
                  : "text-gray-600"
            }`}
          >
            {message}
          </p>
          {thumbnailImage && (
            <img
              src={thumbnailImage}
              alt="Product"
              className="w-14 h-14 object-cover rounded-md border border-gray-200 shrink-0"
            />
          )}
        </div>
      );
    }

    const pairs = lines.map((l) => {
      const colonIdx = l.indexOf(": ");
      return { field: l.slice(0, colonIdx), value: l.slice(colonIdx + 2) };
    });

    const numRows = Math.ceil(pairs.length / 2);
    const fieldStyle = isExpiring ? "text-orange-700" : "text-gray-500";
    const valueStyle = isExpiring
      ? "text-orange-800"
      : isUnread
        ? "text-gray-700"
        : "text-gray-600";

    const gridItems: React.ReactNode[] = pairs
      .map(({ field, value }, i) => {
        const row = Math.floor(i / 2) + 1;
        const isLeft = i % 2 === 0;
        return [
          <span
            key={`f${i}`}
            style={{ gridRow: row, gridColumn: isLeft ? 1 : 3 }}
            className={`text-xs font-semibold whitespace-nowrap ${fieldStyle}`}
          >
            {field}:
          </span>,
          <span
            key={`v${i}`}
            style={{ gridRow: row, gridColumn: isLeft ? 2 : 4 }}
            className={`text-xs truncate ${valueStyle}`}
          >
            {value || "—"}
          </span>,
        ];
      })
      .flat();

    if (thumbnailImage) {
      gridItems.push(
        <img
          key="photo"
          src={thumbnailImage}
          alt="Product"
          style={{ gridColumn: 5, gridRow: `1 / ${numRows + 1}` }}
          className="w-14 h-14 object-cover rounded-md border border-gray-200 self-start"
        />,
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "90px 190px 90px 190px auto",
          columnGap: "8px",
          rowGap: "2px",
          alignItems: "start",
        }}
        className="mb-2"
      >
        {gridItems}
      </div>
    );
  };

  const renderNotificationCard = (
    notification: Notification,
    opts: { forceUnread?: boolean; isArchived?: boolean } = {},
  ) => {
    const isUnread = opts.isArchived
      ? false
      : (opts.forceUnread ?? !notification.readBy.includes(currentUser));
    const isCurrentUser = notification.triggeredBy === currentUser;
    const triggeredByName = isCurrentUser
      ? "You"
      : getFullNameFromUsername(notification.triggeredBy);
    const isExpiring = notification.eventType === "request_expiring";
    const isExpired = notification.eventType === "request_expired";
    const displayMessage = notification.message;
    const thumbnailImage = getThumbnailImage(notification);

    // Look up notes from the linked request
    const requestNotes = (() => {
      if (notification.entityType !== "request") return "";
      try {
        const reqs = JSON.parse(localStorage.getItem("orders") || "[]");
        const req = reqs.find((r: any) => r.id === notification.entityId);
        return req?.notes || "";
      } catch {
        return "";
      }
    })();
    const isNotesExpanded = expandedNotes.has(notification.id);

    const cardClass = opts.isArchived
      ? "bg-gray-50 border-gray-300 opacity-75"
      : isExpiring
        ? "border-2 border-orange-400 bg-orange-50"
        : isUnread
          ? `border-l-4 border-l-blue-500 ${getEventColor(notification.eventType)}`
          : `bg-white border-gray-200`;

    const titleClass = isExpiring
      ? "text-orange-900"
      : isExpired
        ? "text-red-900"
        : isUnread
          ? "text-gray-900"
          : opts.isArchived
            ? "text-gray-600"
            : "text-gray-700";

    return (
      <Card
        key={notification.id}
        className={`p-3 transition-all cursor-pointer hover:shadow-md ${cardClass} ${selectedIds.has(notification.id) ? "ring-2 ring-blue-400" : ""}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex gap-3">
          {/* Checkbox */}
          <div
            className="flex-shrink-0 mt-1"
            onClick={(e) => toggleSelect(e, notification.id)}
          >
            <Checkbox
              checked={selectedIds.has(notification.id)}
              onCheckedChange={() => {}}
              className="mt-0.5"
            />
          </div>

          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getEventIcon(notification.eventType)}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header: badge + pill + title */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isUnread && (
                <NewBadge className="w-8 h-8 flex-shrink-0 animate-pulse-scale" />
              )}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypePillColor(notification.eventType)}`}
              >
                {formatEventType(notification.eventType)}
              </span>
              <h3
                className={`font-semibold ${titleClass}`}
                dangerouslySetInnerHTML={{ __html: notification.title }}
              />
              {requestNotes && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedNotes((prev) => {
                      const next = new Set(prev);
                      if (next.has(notification.id))
                        next.delete(notification.id);
                      else next.add(notification.id);
                      return next;
                    });
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title={isNotesExpanded ? "Hide notes" : "Show notes"}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isNotesExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* 5-column message grid */}
            {renderMessageFields(
              displayMessage,
              isExpiring,
              isUnread,
              thumbnailImage,
            )}

            {/* Entity info */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="font-medium">PO Number:</span>
                <span className="font-mono">{notification.entityNumber}</span>
              </span>
              <span>•</span>
              <span>
                by {triggeredByName === "system" ? "System" : triggeredByName}
              </span>
            </div>

            {/* Collapsible notes */}
            {requestNotes && isNotesExpanded && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-700">
                <p className="font-semibold mb-0.5">Notes:</p>
                <p className="whitespace-pre-wrap">{requestNotes}</p>
              </div>
            )}
          </div>

          {/* Right column: timestamp + archive/unarchive */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(notification.timestamp)}
            </span>
            {opts.isArchived ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleUnarchiveNotification(e, notification.id)}
                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
              >
                <UnarchiveBoxIcon className="w-3.5 h-3.5 mr-1" />
                Unarchive
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleArchiveNotification(e, notification.id)}
                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
              >
                <ArchiveBoxIcon className="w-3.5 h-3.5 mr-1" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const visibleNotifications = sortedNotifications.slice(0, visibleCount);

  return (
    <div className="space-y-0">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "all" | "unread" | "expiring" | "archived")
        }
      >
        {/* Sticky top section: title + filter + tabs + options panel */}
        <div className="sticky top-0 z-10 bg-gray-50 -mx-4 px-4 pt-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Bell
                className={`w-6 h-6 ${isRefreshing ? "animate-pulse" : ""}`}
              />
              <h1 className="text-xl font-semibold">Notifications</h1>
              {unreadCountHeader > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCountHeader}
                </span>
              )}
              {isRefreshing && (
                <span className="text-xs text-gray-500 animate-pulse">
                  Checking for updates...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                className="flex items-center gap-2"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="mb-3">
            <FilterSortControls
              type="notification"
              totalCount={sortedNotifications.length}
              displayedCount={visibleNotifications.length}
              filterValue={filterText}
              onFilterChange={setFilterText}
              sortOptions={NOTIFICATION_SORT_OPTIONS}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
            />
          </div>

          {/* Tabs bar */}
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing mb-0">
            <TabsTrigger value="all">
              All Notifications
              {nonArchivedNotifications.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                  {nonArchivedNotifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expiring">
              Expiring Requests
              {expiringCount > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                  {expiringCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived
              {archivedCount > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {archivedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notification Options Panel — always visible, sticky under tabs */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-b-lg mt-0">
            <span className="text-sm font-medium text-blue-800 min-w-[80px]">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : "0 selected"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkAsRead}
              disabled={selectedIds.size === 0 || allSelectedRead}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Mark as Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkAsUnread}
              disabled={selectedIds.size === 0 || allSelectedUnread}
              className="h-7 px-2 text-xs"
            >
              <MailOpen className="w-3.5 h-3.5 mr-1" />
              Mark as Unread
            </Button>
            {activeTab === "archived" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnarchive}
                disabled={selectedIds.size === 0}
                className="h-7 px-2 text-xs"
              >
                <UnarchiveBoxIcon className="w-3.5 h-3.5 mr-1" />
                Unarchive
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={selectedIds.size === 0}
                className="h-7 px-2 text-xs"
              >
                <ArchiveX className="w-3.5 h-3.5 mr-1" />
                Archive
              </Button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-7 px-2 text-xs text-blue-700"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 px-2 text-xs text-gray-500"
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Deselect All
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <TabsContent value="all" className="mt-3">
          {visibleNotifications.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm mt-1">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {visibleNotifications.map((notification) =>
                renderNotificationCard(notification),
              )}
              {visibleCount < sortedNotifications.length && (
                <div ref={sentinelRef} className="h-8" />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-3">
          {visibleNotifications.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <CheckCheck className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm mt-1">
                  You have no unread notifications.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {visibleNotifications.map((notification) =>
                renderNotificationCard(notification, { forceUnread: true }),
              )}
              {visibleCount < sortedNotifications.length && (
                <div ref={sentinelRef} className="h-8" />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="mt-3">
          {visibleNotifications.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <CheckCheck className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="text-lg font-medium">No expiring requests</p>
                <p className="text-sm mt-1">
                  All requests are within their ETA deadlines.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {visibleNotifications.map((notification) =>
                renderNotificationCard(notification),
              )}
              {visibleCount < sortedNotifications.length && (
                <div ref={sentinelRef} className="h-8" />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-3">
          {visibleNotifications.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium">No archived notifications</p>
                <p className="text-sm mt-1">
                  Notifications older than 30 days will appear here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {visibleNotifications.map((notification) =>
                renderNotificationCard(notification, { isArchived: true }),
              )}
              {visibleCount < sortedNotifications.length && (
                <div ref={sentinelRef} className="h-8" />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Archive this notification? You can unarchive it at any time from
              the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
