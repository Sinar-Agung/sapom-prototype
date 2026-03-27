import { Notification } from "@/app/types/notification";
import { getImage } from "@/app/utils/image-storage";
import {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllAsReadForUser,
  markNotificationAsRead,
  removeNotificationForUser,
} from "@/app/utils/notification-helper";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  Clock,
  Edit,
  FileText,
  Package,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface NotificationsProps {
  onNavigateToRequest?: (requestId: string) => void;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToUpdateOrder?: (orderId: string) => void;
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
  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "expiring" | "archived"
  >(() => {
    const saved = sessionStorage.getItem("notificationsActiveTab");
    return (saved as "all" | "unread" | "expiring") || "all";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [notificationToRemove, setNotificationToRemove] = useState<
    string | null
  >(null);
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

  const handleRemoveNotification = (
    e: React.MouseEvent,
    notificationId: string,
  ) => {
    e.stopPropagation(); // Prevent triggering the notification click
    setNotificationToRemove(notificationId);
    setShowRemoveDialog(true);
  };

  const confirmRemoveNotification = () => {
    if (notificationToRemove) {
      removeNotificationForUser(notificationToRemove, currentUser);
      loadNotifications();
    }
    setShowRemoveDialog(false);
    setNotificationToRemove(null);
  };

  const cancelRemoveNotification = () => {
    setShowRemoveDialog(false);
    setNotificationToRemove(null);
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

  // First, separate archived notifications (older than 30 days)
  const archivedNotifications = notifications.filter(
    (n) => now - n.timestamp > THIRTY_DAYS_MS,
  );
  const nonArchivedNotifications = notifications.filter(
    (n) => now - n.timestamp <= THIRTY_DAYS_MS,
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
          if (request?.photoId) {
            const img = getImage(request.photoId);
            if (img) return img;
          }
        }
      } else if (notification.entityType === "order") {
        const ordersJson = localStorage.getItem("orders");
        if (ordersJson) {
          const orders = JSON.parse(ordersJson);
          const order = orders.find((o: any) => o.id === notification.entityId);
          if (order?.fotoBarangBase64) return order.fotoBarangBase64;
          if (order?.photoId) {
            const img = getImage(order.photoId);
            if (img) return img;
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
  ) => {
    const lines = message.split("\n").filter(Boolean);
    const isParseable =
      lines.length > 1 && lines.every((l) => l.includes(": "));

    if (!isParseable) {
      return (
        <p
          className={`text-sm whitespace-pre-wrap ${
            isExpiring
              ? "text-orange-800 font-medium"
              : isUnread
                ? "text-gray-700"
                : "text-gray-600"
          } mb-2`}
        >
          {message}
        </p>
      );
    }

    const pairs = lines.map((l) => {
      const colonIdx = l.indexOf(": ");
      return { field: l.slice(0, colonIdx), value: l.slice(colonIdx + 2) };
    });

    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-2">
        {pairs.map(({ field, value }, i) => (
          <div key={i} className="flex gap-1.5 text-xs min-w-0">
            <span
              className={`font-semibold whitespace-nowrap shrink-0 ${
                isExpiring ? "text-orange-700" : "text-gray-500"
              }`}
            >
              {field}:
            </span>
            <span
              className={`truncate ${
                isExpiring
                  ? "text-orange-800"
                  : isUnread
                    ? "text-gray-700"
                    : "text-gray-600"
              }`}
            >
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bell className={`w-6 h-6 ${isRefreshing ? "animate-pulse" : ""}`} />
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
      <div className="flex-shrink-0 mb-4">
        <FilterSortControls
          type="notification"
          totalCount={filteredNotifications.length}
          filterValue={filterText}
          onFilterChange={setFilterText}
          sortOptions={NOTIFICATION_SORT_OPTIONS}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "all" | "unread" | "expiring" | "archived")
        }
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full flex-shrink-0 cursor-grab overflow-x-auto scrollbar-hide">
          <TabsTrigger value="all">
            All Notifications
            {notifications.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                {notifications.length}
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

        <TabsContent
          value="all"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            {filteredNotifications.length === 0 ? (
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
                {sortedNotifications.map((notification) => {
                  const isUnread = !notification.readBy.includes(currentUser);
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);
                  const isExpiring =
                    notification.eventType === "request_expiring";
                  const isExpired =
                    notification.eventType === "request_expired";

                  // Generalize 'You <action>' for all event types
                  const displayMessage = notification.message;

                  const thumbnailImage = getThumbnailImage(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                        isExpiring
                          ? "border-2 border-orange-400 bg-orange-50"
                          : isUnread
                            ? `border-l-4 border-l-blue-500 ${getEventColor(notification.eventType)}`
                            : "bg-white border-gray-200"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <NewBadge className="w-8 h-8 flex-shrink-0 animate-pulse-scale" />
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypePillColor(notification.eventType)}`}
                                >
                                  {formatEventType(notification.eventType)}
                                </span>
                                <h3
                                  className={`font-semibold ${
                                    isExpiring
                                      ? "text-orange-900"
                                      : isExpired
                                        ? "text-red-900"
                                        : isUnread
                                          ? "text-gray-900"
                                          : "text-gray-700"
                                  }`}
                                  dangerouslySetInnerHTML={{
                                    __html: notification.title,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleRemoveNotification(e, notification.id)
                                }
                                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
                              >
                                <Archive className="w-3.5 h-3.5 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {renderMessageFields(
                                displayMessage,
                                isExpiring,
                                isUnread,
                              )}
                            </div>
                            {thumbnailImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={thumbnailImage}
                                  alt="Product"
                                  className="w-14 h-14 object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">
                                {notification.entityType === "request"
                                  ? "Request"
                                  : "Order"}
                                :
                              </span>
                              <span className="font-mono">
                                {notification.entityNumber}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              by{" "}
                              {triggeredByName === "system"
                                ? "System"
                                : triggeredByName}
                            </span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {isExpiring ? (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Days to ETA:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-orange-700 font-semibold"
                                      >
                                        {change.newValue} day
                                        {change.newValue !== 1 ? "s" : ""}{" "}
                                        remaining
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Changes:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-600"
                                      >
                                        <span className="font-medium">
                                          {change.field}:
                                        </span>{" "}
                                        <span className="line-through text-red-600">
                                          {change.oldValue || "N/A"}
                                        </span>{" "}
                                        →{" "}
                                        <span className="text-green-600">
                                          {change.newValue || "N/A"}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="unread"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            {filteredNotifications.length === 0 ? (
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
                {sortedNotifications.map((notification) => {
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);
                  const isExpiring =
                    notification.eventType === "request_expiring";
                  const isExpired =
                    notification.eventType === "request_expired";

                  // Customize message for "viewed" notifications when it's the current user
                  const displayMessage = notification.message;

                  const thumbnailImage = getThumbnailImage(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                        isExpiring
                          ? "border-2 border-orange-400 bg-orange-50"
                          : isExpired
                            ? "border-2 border-red-400 bg-red-50"
                            : `border-l-4 border-l-blue-500 ${getEventColor(notification.eventType)}`
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <NewBadge className="w-8 h-8 flex-shrink-0 animate-pulse-scale" />
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypePillColor(notification.eventType)}`}
                                >
                                  {formatEventType(notification.eventType)}
                                </span>
                                <h3
                                  className={`font-semibold ${
                                    isExpiring
                                      ? "text-orange-900"
                                      : isExpired
                                        ? "text-red-900"
                                        : "text-gray-900"
                                  }`}
                                  dangerouslySetInnerHTML={{
                                    __html: notification.title,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleRemoveNotification(e, notification.id)
                                }
                                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
                              >
                                <Archive className="w-3.5 h-3.5 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {renderMessageFields(
                                displayMessage,
                                isExpiring,
                                true,
                              )}
                            </div>
                            {thumbnailImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={thumbnailImage}
                                  alt="Product"
                                  className="w-14 h-14 object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">
                                {notification.entityType === "request"
                                  ? "Request"
                                  : "Order"}
                                :
                              </span>
                              <span className="font-mono">
                                {notification.entityNumber}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              by{" "}
                              {triggeredByName === "system"
                                ? "System"
                                : triggeredByName}
                            </span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {isExpiring ? (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Days to ETA:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-orange-700 font-semibold"
                                      >
                                        {change.newValue} day
                                        {change.newValue !== 1 ? "s" : ""}{" "}
                                        remaining
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Changes:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-600"
                                      >
                                        <span className="font-medium">
                                          {change.field}:
                                        </span>{" "}
                                        <span className="line-through text-red-600">
                                          {change.oldValue || "N/A"}
                                        </span>{" "}
                                        →{" "}
                                        <span className="text-green-600">
                                          {change.newValue || "N/A"}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="expiring"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            {filteredNotifications.length === 0 ? (
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
                {sortedNotifications.map((notification) => {
                  const isUnread = !notification.readBy.includes(currentUser);
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);
                  const isExpiring =
                    notification.eventType === "request_expiring";
                  const isExpired =
                    notification.eventType === "request_expired";

                  const thumbnailImage = getThumbnailImage(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                        isExpiring
                          ? "border-2 border-orange-400 bg-orange-50"
                          : isExpired
                            ? "border-2 border-red-400 bg-red-50"
                            : isUnread
                              ? `border-l-4 border-l-blue-500 ${getEventColor(notification.eventType)}`
                              : "bg-white border-gray-200"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <NewBadge className="w-8 h-8 flex-shrink-0 animate-pulse-scale" />
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypePillColor(notification.eventType)}`}
                                >
                                  {formatEventType(notification.eventType)}
                                </span>
                                <h3
                                  className={`font-semibold ${
                                    isExpiring
                                      ? "text-orange-900"
                                      : isExpired
                                        ? "text-red-900"
                                        : "text-gray-900"
                                  }`}
                                  dangerouslySetInnerHTML={{
                                    __html: notification.title,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleRemoveNotification(e, notification.id)
                                }
                                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
                              >
                                <Archive className="w-3.5 h-3.5 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {renderMessageFields(
                                notification.message,
                                isExpiring,
                                isUnread,
                              )}
                            </div>
                            {thumbnailImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={thumbnailImage}
                                  alt="Product"
                                  className="w-14 h-14 object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">
                                {notification.entityType === "request"
                                  ? "Request"
                                  : "Order"}
                                :
                              </span>
                              <span className="font-mono">
                                {notification.entityNumber}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              by{" "}
                              {triggeredByName === "system"
                                ? "System"
                                : triggeredByName}
                            </span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  Days to ETA:
                                </p>
                                {notification.changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-orange-700 font-semibold"
                                  >
                                    {change.newValue} day
                                    {change.newValue !== 1 ? "s" : ""} remaining
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="archived"
          className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            {filteredNotifications.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">
                    No archived notifications
                  </p>
                  <p className="text-sm mt-1">
                    Notifications older than 30 days will appear here.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {sortedNotifications.map((notification) => {
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);
                  const isExpiring =
                    notification.eventType === "request_expiring";

                  // Generalize 'You <action>' for all event types
                  const displayMessage = notification.message;

                  const thumbnailImage = getThumbnailImage(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md bg-gray-50 border-gray-300 opacity-75`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypePillColor(notification.eventType)}`}
                                >
                                  {formatEventType(notification.eventType)}
                                </span>
                                <h3
                                  className="font-semibold text-gray-600"
                                  dangerouslySetInnerHTML={{
                                    __html: notification.title,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) =>
                                  handleRemoveNotification(e, notification.id)
                                }
                                className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
                              >
                                <Archive className="w-3.5 h-3.5 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {renderMessageFields(
                                displayMessage,
                                false,
                                false,
                              )}
                            </div>
                            {thumbnailImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={thumbnailImage}
                                  alt="Product"
                                  className="w-14 h-14 object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">
                                {notification.entityType === "request"
                                  ? "Request"
                                  : "Order"}
                                :
                              </span>
                              <span className="font-mono">
                                {notification.entityNumber}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              by{" "}
                              {triggeredByName === "system"
                                ? "System"
                                : triggeredByName}
                            </span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                {isExpiring ? (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Days to ETA:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-600 font-semibold"
                                      >
                                        {change.newValue} day
                                        {change.newValue !== 1 ? "s" : ""}{" "}
                                        remaining
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                      Changes:
                                    </p>
                                    {notification.changes.map((change, idx) => (
                                      <div
                                        key={idx}
                                        className="text-xs text-gray-600"
                                      >
                                        <span className="font-medium">
                                          {change.field}:
                                        </span>{" "}
                                        <span className="line-through text-red-600">
                                          {change.oldValue || "N/A"}
                                        </span>{" "}
                                        →{" "}
                                        <span className="text-green-600">
                                          {change.newValue || "N/A"}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this notification? This action
              cannot be undone. The notification will be permanently removed
              from your view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRemoveNotification}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveNotification}
              className="bg-gray-600 hover:bg-gray-700 focus:ring-gray-600"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
