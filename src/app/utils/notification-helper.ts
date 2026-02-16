/**
 * Notification helper utilities
 * Manages notification creation, storage, and retrieval
 */

import {
  Notification,
  NotificationChange,
  NotificationEventType,
  NotificationTargetAudience,
} from "@/app/types/notification";
import { Order } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { getFullNameFromUsername } from "./user-data";

const STORAGE_KEY = "notifications";

// Get all notifications from localStorage
export const getAllNotifications = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save notifications to localStorage
const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

// Get notifications for a specific user
export const getNotificationsForUser = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
): Notification[] => {
  const all = getAllNotifications();
  console.log("All notifications in storage:", all.length);

  // Get all requests to check their status
  const requestsJson = localStorage.getItem("requests");
  const requests = requestsJson ? JSON.parse(requestsJson) : [];
  console.log("All requests:", requests.length);

  const filtered = all
    .filter((notification) => {
      // Check if user is in specific targets
      if (notification.specificTargets?.includes(username)) {
        return true;
      }

      // Check if user's role is in target audience
      if (notification.targetAudience.includes(userRole)) {
        return true;
      }

      // Check if notification is for all users
      if (notification.targetAudience.includes("all")) {
        return true;
      }

      return false;
    })
    .filter((notification) => {
      // For stockists, only show notifications for Open or recently updated requests
      if (userRole === "stockist" && notification.entityType === "request") {
        // Always show cancelled/updated/status_changed notifications regardless of request status
        if (
          notification.eventType === "request_cancelled" ||
          notification.eventType === "request_updated" ||
          notification.eventType === "request_status_changed"
        ) {
          return true;
        }

        const request = requests.find(
          (r: any) => r.id === notification.entityId,
        );
        if (request) {
          const isOpen = request.status === "Open";
          const isRecentlyUpdated =
            request.updatedDate &&
            Date.now() - request.updatedDate < 7 * 24 * 60 * 60 * 1000; // Within 7 days
          console.log(
            `Request ${request.requestNo || request.id} - Status: ${request.status}, isOpen: ${isOpen}, isRecentlyUpdated: ${isRecentlyUpdated}`,
          );
          return isOpen || isRecentlyUpdated;
        }
        // If request not found, show notification anyway (might be deleted)
        return true;
      }
      // For other roles, show all notifications
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

  console.log(
    "Filtered notifications for",
    username,
    userRole,
    ":",
    filtered.length,
  );
  return filtered;
};

// Get unread count for a user
export const getUnreadCountForUser = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
): number => {
  const userNotifications = getNotificationsForUser(username, userRole);
  return userNotifications.filter((n) => !n.readBy.includes(username)).length;
};

// Mark notification as read
export const markNotificationAsRead = (
  notificationId: string,
  username: string,
) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((n) => {
    if (n.id === notificationId && !n.readBy.includes(username)) {
      return {
        ...n,
        readBy: [...n.readBy, username],
      };
    }
    return n;
  });
  saveNotifications(updated);
};

// Mark all notifications as read for a user
export const markAllAsReadForUser = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  const notifications = getAllNotifications();
  const userNotifications = getNotificationsForUser(username, userRole);
  const userNotificationIds = new Set(userNotifications.map((n) => n.id));

  const updated = notifications.map((n) => {
    if (userNotificationIds.has(n.id) && !n.readBy.includes(username)) {
      return {
        ...n,
        readBy: [...n.readBy, username],
      };
    }
    return n;
  });
  saveNotifications(updated);
};

// Create a new notification
export const createNotification = (
  eventType: NotificationEventType,
  triggeredBy: string,
  triggeredByRole: "sales" | "stockist" | "jb" | "supplier",
  entityType: "request" | "order",
  entityId: string,
  entityNumber: string,
  title: string,
  message: string,
  targetAudience: NotificationTargetAudience[],
  specificTargets?: string[],
  changes?: NotificationChange[],
) => {
  const notification: Notification = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: Date.now(),
    triggeredBy,
    triggeredByRole,
    entityType,
    entityId,
    entityNumber,
    targetAudience,
    specificTargets,
    title,
    message,
    changes,
    readBy: [],
  };

  const notifications = getAllNotifications();
  notifications.push(notification);
  saveNotifications(notifications);

  return notification;
};

// Helper: Create notification for request creation
export const notifyRequestCreated = (request: Request, createdBy: string) => {
  const creatorName = getFullNameFromUsername(createdBy);
  const itemCount = request.detailItems?.length || 0;

  console.log(
    "Creating notification for request:",
    request.requestNo || request.id,
    "by",
    creatorName,
  );

  const notification = createNotification(
    "request_created",
    createdBy,
    "sales",
    "request",
    request.id,
    request.requestNo || request.id,
    "New Request Created",
    `${creatorName} created a new request ${request.requestNo || request.id} with ${itemCount} item(s)`,
    ["stockist", "jb"],
  );

  console.log("Notification created:", notification.id);
  return notification;
};

// Helper: Create notification for request status change
export const notifyRequestStatusChanged = (
  request: Request,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  changedByRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  const changerName = getFullNameFromUsername(changedBy);
  const targets: NotificationTargetAudience[] = [];
  const specificTargets: string[] = [];

  // Notify the sales person who created it
  if (request.createdBy && request.createdBy !== changedBy) {
    specificTargets.push(request.createdBy);
  }

  // Notify stockists when status changes (always include stockists)
  targets.push("stockist");

  // Notify sales when request becomes Stock Unavailable or Ready Stock Marketing
  if (
    newStatus === "Stock Unavailable" ||
    newStatus === "Ready Stock Marketing"
  ) {
    targets.push("sales");
  }

  // Notify JB when request becomes Requested to JB (assigned to JB)
  if (newStatus === "Requested to JB") {
    targets.push("jb");
  }

  // Notify JB when request becomes Ordered
  if (newStatus === "Ordered") {
    targets.push("jb");
  }

  return createNotification(
    "request_status_changed",
    changedBy,
    changedByRole,
    "request",
    request.id,
    request.requestNo || request.id,
    `Request ${request.requestNo || request.id} Status Changed`,
    `${changerName} changed status from "${oldStatus}" to "${newStatus}"`,
    targets,
    specificTargets.length > 0 ? specificTargets : undefined,
    [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
  );
};

// Helper: Create notification for request viewed by stockist
export const notifyRequestViewedByStockist = (
  request: Request,
  stockistUsername: string,
  oldStatus?: string,
  newStatus?: string,
) => {
  const stockistName = getFullNameFromUsername(stockistUsername);
  const requestNo = request.requestNo || request.id;

  // Create changes array if status change is provided
  const changes =
    oldStatus && newStatus
      ? [
          {
            field: "status",
            oldValue: oldStatus,
            newValue: newStatus,
          },
        ]
      : undefined;

  return createNotification(
    "request_viewed_by_stockist",
    stockistUsername,
    "stockist",
    "request",
    request.id,
    requestNo,
    `Request ${requestNo} viewed`,
    `${stockistName} viewed request ${requestNo}`,
    ["sales", "stockist"],
    request.createdBy ? [request.createdBy] : undefined,
    changes,
  );
};

// Helper: Create notification for request approval/rejection
export const notifyRequestReviewed = (
  request: Request,
  approved: boolean,
  stockistUsername: string,
) => {
  const stockistName = getFullNameFromUsername(stockistUsername);
  const action = approved ? "approved" : "rejected";

  return createNotification(
    approved ? "request_approved_by_stockist" : "request_rejected_by_stockist",
    stockistUsername,
    "stockist",
    "request",
    request.id,
    request.requestNo || request.id,
    `Request ${request.requestNo || request.id} ${approved ? "Approved" : "Rejected"}`,
    `${stockistName} ${action} request ${request.requestNo || request.id}`,
    ["sales", "stockist"],
    request.createdBy ? [request.createdBy] : undefined,
  );
};

// Helper: Create notification for order creation
export const notifyOrderCreated = (order: Order, createdBy: string) => {
  const creatorName = getFullNameFromUsername(createdBy);

  // Find supplier username from supplierId
  // Note: This assumes supplier username can be derived from supplierId or is stored
  const supplierTargets: string[] = [];

  return createNotification(
    "order_created",
    createdBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    "New Order Created",
    `${creatorName} created order ${order.PONumber} for ${order.pabrik.name}`,
    ["supplier"],
    supplierTargets,
  );
};

// Helper: Create notification for order status change
export const notifyOrderStatusChanged = (
  order: Order,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  changedByRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  const changerName = getFullNameFromUsername(changedBy);
  const targets: NotificationTargetAudience[] = [];

  // Notify JB when supplier changes status
  if (changedByRole === "supplier") {
    targets.push("jb");
  }

  // Notify supplier when JB changes status
  if (changedByRole === "jb") {
    targets.push("supplier");
  }

  return createNotification(
    "order_status_changed",
    changedBy,
    changedByRole,
    "order",
    order.id,
    order.PONumber,
    `Order ${order.PONumber} Status Changed`,
    `${changerName} changed status from "${oldStatus}" to "${newStatus}"`,
    targets,
    undefined,
    [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
  );
};

// Helper: Create notification for order arrival
export const notifyOrderArrival = (
  order: Order,
  recordedBy: string,
  pcsDelivered: number,
) => {
  const recorderName = getFullNameFromUsername(recordedBy);

  return createNotification(
    "order_arrival_recorded",
    recordedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    `Arrival Recorded for ${order.PONumber}`,
    `${recorderName} recorded arrival of ${pcsDelivered} pieces for order ${order.PONumber}`,
    ["supplier"],
  );
};

// Helper: Create notification for order closure
export const notifyOrderClosed = (order: Order, closedBy: string) => {
  const closerName = getFullNameFromUsername(closedBy);

  return createNotification(
    "order_closed",
    closedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    `Order ${order.PONumber} Closed`,
    `${closerName} closed and confirmed order ${order.PONumber}`,
    ["supplier"],
  );
};

// Helper: Create notification for request update
export const notifyRequestUpdated = (
  oldRequest: Request,
  newRequest: Request,
  updatedBy: string,
) => {
  const updaterName = getFullNameFromUsername(updatedBy);
  const changes: NotificationChange[] = [];

  // Helper to get display value for entity references
  const getDisplayValue = (value: any): string => {
    if (typeof value === "object" && value !== null && "name" in value) {
      return value.name;
    }
    return String(value);
  };

  // Check factory/supplier change
  if (
    getDisplayValue(oldRequest.pabrik) !== getDisplayValue(newRequest.pabrik)
  ) {
    changes.push({
      field: "Factory",
      oldValue: getDisplayValue(oldRequest.pabrik),
      newValue: getDisplayValue(newRequest.pabrik),
    });
  }

  // Check customer change
  if (
    getDisplayValue(oldRequest.namaPelanggan) !==
    getDisplayValue(newRequest.namaPelanggan)
  ) {
    changes.push({
      field: "Customer",
      oldValue: getDisplayValue(oldRequest.namaPelanggan),
      newValue: getDisplayValue(newRequest.namaPelanggan),
    });
  }

  // Check category change
  if (oldRequest.kategoriBarang !== newRequest.kategoriBarang) {
    changes.push({
      field: "Category",
      oldValue: oldRequest.kategoriBarang,
      newValue: newRequest.kategoriBarang,
    });
  }

  // Check product type change
  if (oldRequest.jenisProduk !== newRequest.jenisProduk) {
    changes.push({
      field: "Product Type",
      oldValue: oldRequest.jenisProduk,
      newValue: newRequest.jenisProduk,
    });
  }

  // Check product name change
  if (oldRequest.namaProduk !== newRequest.namaProduk) {
    changes.push({
      field: "Product Name",
      oldValue: oldRequest.namaProduk,
      newValue: newRequest.namaProduk,
    });
  }

  // Check basic name change
  if (oldRequest.namaBasic !== newRequest.namaBasic) {
    changes.push({
      field: "Basic Name",
      oldValue: oldRequest.namaBasic,
      newValue: newRequest.namaBasic,
    });
  }

  // Check delivery time change
  if (oldRequest.waktuKirim !== newRequest.waktuKirim) {
    changes.push({
      field: "Delivery Time",
      oldValue: oldRequest.waktuKirim
        ? new Date(oldRequest.waktuKirim).toLocaleDateString("id-ID")
        : "",
      newValue: newRequest.waktuKirim
        ? new Date(newRequest.waktuKirim).toLocaleDateString("id-ID")
        : "",
    });
  }

  // Check customer expectation change
  if (oldRequest.customerExpectation !== newRequest.customerExpectation) {
    changes.push({
      field: "Customer Expectation",
      oldValue: oldRequest.customerExpectation,
      newValue: newRequest.customerExpectation,
    });
  }

  // Check detail items changes
  const oldItemsJson = JSON.stringify(oldRequest.detailItems || []);
  const newItemsJson = JSON.stringify(newRequest.detailItems || []);
  if (oldItemsJson !== newItemsJson) {
    changes.push({
      field: "Detail Items",
      oldValue: `${oldRequest.detailItems?.length || 0} item(s)`,
      newValue: `${newRequest.detailItems?.length || 0} item(s)`,
    });
  }

  // Check photo change
  if (oldRequest.fotoBarangBase64 !== newRequest.fotoBarangBase64) {
    changes.push({
      field: "Product Photo",
      oldValue: oldRequest.fotoBarangBase64 ? "Yes" : "No",
      newValue: newRequest.fotoBarangBase64 ? "Yes" : "No",
    });
  }

  // Only create notification if there are actual changes
  if (changes.length === 0) {
    console.log("No changes detected, skipping notification");
    return null;
  }

  // Target both stockists and the sales user who made the update
  const specificTargets = [updatedBy];

  return createNotification(
    "request_updated",
    updatedBy,
    "sales",
    "request",
    newRequest.id,
    newRequest.requestNo || newRequest.id,
    `Request ${newRequest.requestNo || newRequest.id} Updated`,
    `${updaterName} updated request ${newRequest.requestNo || newRequest.id} (${changes.length} change${changes.length > 1 ? "s" : ""})`,
    ["stockist", "sales"],
    specificTargets,
    changes,
  );
};

// Helper: Create notification for request cancellation
export const notifyRequestCancelled = (
  request: Request,
  cancelledBy: string,
) => {
  const cancellerName = getFullNameFromUsername(cancelledBy);

  return createNotification(
    "request_cancelled",
    cancelledBy,
    "sales",
    "request",
    request.id,
    request.requestNo || request.id,
    `Request ${request.requestNo || request.id} Cancelled`,
    `${cancellerName} cancelled request ${request.requestNo || request.id}`,
    ["stockist", "sales"],
  );
};
