import { Notification } from "@/app/types/notification";
import {
  getNotificationsForUser,
  markAllAsReadForUser,
  markNotificationAsRead,
} from "@/app/utils/notification-helper";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  Package,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface NotificationsProps {
  onNavigateToRequest?: (requestId: string) => void;
}

export function Notifications({ onNavigateToRequest }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";
  const accountType = (localStorage.getItem("userRole") ||
    sessionStorage.getItem("userRole") ||
    "sales") as "sales" | "stockist" | "jb" | "supplier";

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

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    loadNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("🔔 Notification clicked:", notification);
    console.log("   Entity Type:", notification.entityType);
    console.log("   Entity ID:", notification.entityId);
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
    } else {
      console.log(
        "   ⚠️ Not navigating - entityType:",
        notification.entityType,
        "hasCallback:",
        !!onNavigateToRequest,
      );
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.readBy.includes(currentUser))
      : notifications;

  const unreadCount = notifications.filter(
    (n) => !n.readBy.includes(currentUser),
  ).length;

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("request")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (eventType.includes("order")) {
      return <Package className="w-5 h-5 text-green-600" />;
    }
    return <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getEventColor = (eventType: string) => {
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

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bell className={`w-6 h-6 ${isRefreshing ? "animate-pulse" : ""}`} />
          <h1 className="text-xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "unread")}
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
                {filteredNotifications.map((notification) => {
                  const isUnread = !notification.readBy.includes(currentUser);
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);

                  // Generalize 'You <action>' for all event types
                  let displayMessage = notification.message;
                  if (isCurrentUser) {
                    switch (notification.eventType) {
                      case "request_created":
                        displayMessage = `You created request ${notification.entityNumber}`;
                        break;
                      case "request_updated":
                        displayMessage = `You updated request ${notification.entityNumber}`;
                        break;
                      case "request_cancelled":
                        displayMessage = `You cancelled request ${notification.entityNumber}`;
                        break;
                      case "request_status_changed":
                        displayMessage = notification.message.replace(
                          getFullNameFromUsername(notification.triggeredBy),
                          "You",
                        );
                        break;
                      case "request_viewed_by_stockist":
                        displayMessage = `You viewed request ${notification.entityNumber}`;
                        break;
                      case "request_approved_by_stockist":
                        displayMessage = `You approved request ${notification.entityNumber}`;
                        break;
                      case "request_rejected_by_stockist":
                        displayMessage = `You rejected request ${notification.entityNumber}`;
                        break;
                      case "request_converted_to_order":
                        displayMessage = `You converted request ${notification.entityNumber} to order`;
                        break;
                      case "order_created":
                        displayMessage = `You created order ${notification.entityNumber}`;
                        break;
                      case "order_updated":
                        displayMessage = `You updated order ${notification.entityNumber}`;
                        break;
                      case "order_status_changed":
                        displayMessage = notification.message.replace(
                          getFullNameFromUsername(notification.triggeredBy),
                          "You",
                        );
                        break;
                      case "order_viewed_by_supplier":
                        displayMessage = `You viewed order ${notification.entityNumber}`;
                        break;
                      case "order_arrival_recorded":
                        displayMessage = `You recorded arrival for order ${notification.entityNumber}`;
                        break;
                      case "order_closed":
                        displayMessage = `You closed order ${notification.entityNumber}`;
                        break;
                      default:
                        // fallback: replace name with You if present
                        displayMessage = notification.message.replace(
                          getFullNameFromUsername(notification.triggeredBy),
                          "You",
                        );
                    }
                  }

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                        isUnread
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
                            <h3
                              className={`font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}
                            >
                              {notification.title}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isUnread ? "text-gray-700" : "text-gray-600"} mb-2`}
                          >
                            {displayMessage}
                          </p>
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
                            <span>by {triggeredByName}</span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
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
                {filteredNotifications.map((notification) => {
                  const isCurrentUser =
                    notification.triggeredBy === currentUser;
                  const triggeredByName = isCurrentUser
                    ? "You"
                    : getFullNameFromUsername(notification.triggeredBy);

                  // Customize message for "viewed" notifications when it's the current user
                  const displayMessage =
                    isCurrentUser &&
                    notification.eventType === "request_viewed_by_stockist"
                      ? `You viewed request ${notification.entityNumber}`
                      : notification.message;

                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-all cursor-pointer hover:shadow-md border-l-4 border-l-blue-500 ${getEventColor(notification.eventType)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {displayMessage}
                          </p>
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
                            <span>by {triggeredByName}</span>
                          </div>
                          {notification.changes &&
                            notification.changes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
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
    </div>
  );
}
