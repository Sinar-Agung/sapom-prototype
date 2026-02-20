// Remove ETA reminder notification for a request and stockist
export const removeETAReminderForStockist = (
  requestId: string,
  stockistUsername: string,
) => {
  let notifications = getAllNotifications();
  notifications = notifications.filter(
    (n) =>
      !(
        n.eventType === "request_eta_reminder" &&
        n.entityId === requestId &&
        n.specificTargets?.includes(stockistUsername)
      ),
  );
  saveNotifications(notifications);
};

// Helper: Create or update expiring request notification
export const upsertRequestExpiringNotification = (
  request: Request,
  userRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  if (!request.waktuKirim) return;

  const etaDate = new Date(request.waktuKirim);
  const now = new Date();
  const daysToETA = Math.ceil(
    (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Only notify if ETA is under 7 days and hasn't passed
  if (daysToETA < 0 || daysToETA >= 7) {
    // Remove any existing expiring notification if ETA is not within range
    let notifications = getAllNotifications();
    notifications = notifications.filter(
      (n) => !(n.eventType === "request_expiring" && n.entityId === request.id),
    );
    saveNotifications(notifications);
    return;
  }

  // Determine if this request should get an expiring notification based on status and role
  let shouldNotify = false;
  const targetAudience: NotificationTargetAudience[] = [];

  // Stockist: see all expiring requests with status Open or Stockist Processing
  if (
    (request.status === "Open" || request.status === "Stockist Processing") &&
    userRole === "stockist"
  ) {
    shouldNotify = true;
    if (!targetAudience.includes("stockist")) targetAudience.push("stockist");
  }

  // JB: see all expiring requests with status Requested to JB (Assigned to JB)
  if (request.status === "Requested to JB" && userRole === "jb") {
    shouldNotify = true;
    if (!targetAudience.includes("jb")) targetAudience.push("jb");
  }

  // Sales: see all expiring requests that are not Ordered yet
  if (request.status !== "Ordered" && userRole === "sales") {
    shouldNotify = true;
    if (!targetAudience.includes("sales")) targetAudience.push("sales");
  }

  if (!shouldNotify) return;

  // Remove any previous expiring notification for this request
  let notifications = getAllNotifications();
  notifications = notifications.filter(
    (n) => !(n.eventType === "request_expiring" && n.entityId === request.id),
  );

  // Create new expiring notification
  const notification: Notification = {
    id: `NOTIF-EXPIRING-${request.id}`,
    eventType: "request_expiring" as any,
    timestamp: Date.now(),
    triggeredBy: "system",
    triggeredByRole: "jb", // System notifications use jb role
    entityType: "request",
    entityId: request.id,
    entityNumber: request.requestNo || request.id,
    targetAudience: ["sales", "stockist", "jb"], // All roles can see, filtering done in getNotificationsForUser
    specificTargets: request.createdBy ? [request.createdBy] : undefined,
    title: `⚠️ Request ${request.requestNo || request.id} Expiring Soon`,
    message: `Request ${request.requestNo || request.id} is nearing its ETA deadline in ${daysToETA} day${daysToETA !== 1 ? "s" : ""} (${etaDate.toLocaleDateString("id-ID")})`,
    changes: [{ field: "daysToETA", oldValue: null, newValue: daysToETA }],
    originator: request.createdBy, // Add originator
    readBy: [],
  };

  notifications.push(notification);
  saveNotifications(notifications);
};

// Check all requests and create expiring notifications for relevant users
export const checkAndNotifyExpiringRequests = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  console.log(`Checking expiring requests for ${username} (${userRole})`);
  const requestsJson = localStorage.getItem("requests");
  if (!requestsJson) return;

  const requests = JSON.parse(requestsJson);
  requests.forEach((req: Request) => {
    upsertRequestExpiringNotification(req, userRole);
  });
};
// Helper: Create or update ETA reminder notification for stockist
export const upsertETAReminderForStockist = (
  request: Request,
  stockistUsername: string,
) => {
  if (!request.waktuKirim) return;
  const etaDate = new Date(request.waktuKirim);
  const now = new Date();
  const daysToETA = Math.ceil(
    (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysToETA < 0 || daysToETA > 7) return; // Only remind within 7 days before ETA

  // Only for Open or Stockist Processing
  if (request.status !== "Open" && request.status !== "Stockist Processing")
    return;

  // Remove any previous ETA reminder for this request and stockist
  let notifications = getAllNotifications();
  notifications = notifications.filter(
    (n) =>
      !(
        n.eventType === "request_eta_reminder" &&
        n.entityId === request.id &&
        n.specificTargets?.includes(stockistUsername)
      ),
  );

  // Add new reminder
  const reminder: Notification = {
    id: `NOTIF-ETA-${request.id}-${stockistUsername}`,
    eventType: "request_eta_reminder" as any,
    timestamp: Date.now(),
    triggeredBy: stockistUsername,
    triggeredByRole: "stockist",
    entityType: "request",
    entityId: request.id,
    entityNumber: request.requestNo || request.id,
    targetAudience: ["stockist"],
    specificTargets: [stockistUsername],
    title: `Request ${request.requestNo || request.id} Nearing ETA`,
    message: `Request ${request.requestNo || request.id} is nearing its ETA (${etaDate.toLocaleDateString("id-ID")}). Please verify or submit stock info.`,
    changes: [{ field: "daysToETA", oldValue: null, newValue: daysToETA }],
    originator: request.createdBy, // Add originator
    readBy: [],
  };
  notifications.push(reminder);
  saveNotifications(notifications);
};
/**
 * Notification helper utilities
 * Manages notification creation, storage, and retrieval
 */

import {
  ATAS_NAMA_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import {
  Notification,
  NotificationChange,
  NotificationEventType,
  NotificationTargetAudience,
} from "@/app/types/notification";
import { Order } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { findUserByUsername, getFullNameFromUsername } from "./user-data";

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
      // Filter out notifications that have been removed by this user
      if (notification.removedBy?.includes(username)) {
        return false;
      }

      // Check if user is in specific targets
      if (notification.specificTargets?.includes(username)) {
        return true;
      }

      // Check if user's role is in target audience
      if (notification.targetAudience.includes(userRole)) {
        // Special filtering for request_expiring notifications
        if (notification.eventType === "request_expiring") {
          const request = requests.find(
            (r: any) => r.id === notification.entityId,
          );
          if (request) {
            // Stockist: only see Open or Stockist Processing
            if (
              userRole === "stockist" &&
              request.status !== "Open" &&
              request.status !== "Stockist Processing"
            ) {
              return false;
            }
            // JB: only see Requested to JB (Assigned to JB)
            if (userRole === "jb" && request.status !== "Requested to JB") {
              return false;
            }
            // Sales: only see requests not Ordered yet
            if (userRole === "sales" && request.status === "Ordered") {
              return false;
            }
          }
        }

        // Supplier-specific filtering for ALL order notifications
        if (userRole === "supplier" && notification.entityType === "order") {
          // Get the supplier user to check their supplierName
          const supplierUser = findUserByUsername(username);
          if (supplierUser && "supplierName" in supplierUser) {
            console.log(
              `Filtering order notification ${notification.id} for supplier ${username} (${supplierUser.supplierName}):`,
              {
                notificationAddressedTo: notification.addressedTo,
                userSupplierName: supplierUser.supplierName,
                matches: notification.addressedTo === supplierUser.supplierName,
              },
            );
            // If notification has addressedTo, check if it matches
            if (notification.addressedTo) {
              if (notification.addressedTo !== supplierUser.supplierName) {
                return false; // Different supplier, don't show
              }
            } else {
              // No addressedTo - this shouldn't happen for new notifications
              // For safety, don't show order notifications without proper addressedTo
              console.warn(
                `Order notification ${notification.id} missing addressedTo field`,
              );
              return false;
            }
          }
        }

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

// Remove notification from a user's view
export const removeNotificationForUser = (
  notificationId: string,
  username: string,
) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((n) => {
    if (n.id === notificationId && !n.removedBy?.includes(username)) {
      return {
        ...n,
        removedBy: [...(n.removedBy || []), username],
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
  metadata?: any,
  addressedTo?: string,
  originator?: string,
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
    metadata,
    changes,
    addressedTo,
    originator,
    readBy: [],
  };

  console.log("📧 Creating notification:", {
    id: notification.id,
    eventType: notification.eventType,
    entityType: notification.entityType,
    addressedTo: notification.addressedTo,
    originator: notification.originator,
  });

  const notifications = getAllNotifications();
  notifications.push(notification);
  saveNotifications(notifications);

  return notification;
};

// Helper: Create notification for request creation
export const notifyRequestCreated = (request: Request, createdBy: string) => {
  const creatorName = getFullNameFromUsername(createdBy);

  // Get product name (Jenis Produk + Nama Basic/Nama Model)
  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    request.jenisProduk,
  );
  const productNameLabel =
    request.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, request.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, request.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  // Get Atas Nama
  const atasNamaLabel =
    typeof request.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan)
      : request.namaPelanggan?.name ||
        getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan?.id || "");

  // Get Supplier/Pabrik name
  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");

  console.log(
    "Creating notification for request:",
    request.requestNo || request.id,
    "by",
    creatorName,
  );

  // Format ETA date
  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Title: Product Name in bold green + "for <Atas Nama>" (HTML formatted)
  const title = `<strong class="text-green-600">${productName}</strong> for ${atasNamaLabel}`;

  // Message: Supplier, ETA, and item count
  const etaDate = formatDate(request.waktuKirim);
  const itemCount = request.detailItems?.length || 0;
  const message = `Supplier: ${pabrikLabel}\nETA: ${etaDate}\nItem count: ${itemCount}`;

  const notification = createNotification(
    "request_created",
    createdBy,
    "sales",
    "request",
    request.id,
    request.requestNo || request.id,
    title,
    message,
    ["sales", "stockist", "jb"], // Include sales so they can see their own request creation
    undefined,
    undefined,
    undefined,
    undefined,
    createdBy, // originator
  );

  console.log("Notification created:", notification.id);

  // Check if this request is expiring and create expiring notification
  upsertRequestExpiringNotification(request, "sales");
  upsertRequestExpiringNotification(request, "stockist");
  upsertRequestExpiringNotification(request, "jb");

  return notification;
};

// Helper: Create notification for request status change
export const notifyRequestStatusChanged = (
  request: Request,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  changedByRole: "sales" | "stockist" | "jb" | "supplier",
  order?: Order, // Optional order parameter for when status becomes "Ordered"
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

  // Special handling for status change to "Ordered"
  if (newStatus === "Ordered" && order) {
    const supplierName =
      typeof order.pabrik === "string"
        ? order.pabrik
        : order.pabrik?.name || "Unknown Supplier";

    // Only notify the sales user who created the request, and all JBs
    const salesTargets = request.createdBy ? [request.createdBy] : [];

    return createNotification(
      "request_status_changed",
      changedBy,
      changedByRole,
      "request",
      request.id,
      request.requestNo || request.id,
      `Request ${request.requestNo || request.id} has been Ordered`,
      `${changerName} has written an order for Request ${request.requestNo || request.id} to Supplier ${supplierName}`,
      ["jb", "sales"],
      salesTargets,
      [{ field: "status", oldValue: "Assigned to JB", newValue: newStatus }],
      {
        supplierId:
          typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id,
        supplierName: supplierName,
        requestId: request.id,
      },
      undefined,
      request.createdBy,
    );
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
    undefined,
    undefined,
    request.createdBy,
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
    undefined,
    undefined,
    request.createdBy,
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
    undefined,
    undefined,
    undefined,
    request.createdBy,
  );
};

// Helper: Create notification for order creation
export const notifyOrderCreated = (order: Order, createdBy: string) => {
  const creatorName = getFullNameFromUsername(createdBy);
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  console.log("🏭 Creating order notification:", {
    orderPONumber: order.PONumber,
    supplierName: supplierName,
    supplierId: supplierId,
    pabrikType: typeof order.pabrik,
  });

  return createNotification(
    "order_created",
    createdBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    "New Order Created",
    `${creatorName} created order ${order.PONumber} for ${supplierName}`,
    ["jb", "supplier"], // Only JB and supplier, not sales
    undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
      requestId: order.requestId,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
  );
};

// Helper: Create notification for order revision by JB
export const notifyOrderRevised = (order: Order, revisedBy: string) => {
  const reviserName = getFullNameFromUsername(revisedBy);

  // Get product name (Jenis Produk + Nama Basic/Nama Model)
  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  // Get Atas Nama
  const atasNama = order.atasNama || "Unknown Customer";

  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";

  console.log("✏️ Creating order revision notification:", {
    orderPONumber: order.PONumber,
    revisedBy: revisedBy,
    salesPerson: order.sales,
    productName: productName,
    atasNama: atasNama,
  });

  return createNotification(
    "order_revised",
    revisedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    "Revised - Internal Review",
    `${reviserName} revised order ${order.PONumber} - ${productName} for ${atasNama}`,
    ["sales"], // Only notify sales
    order.sales ? [order.sales] : undefined, // Specific target: sales who created the original request
    undefined,
    {
      supplierName: supplierName,
      requestId: order.requestId,
      productName: productName,
      atasNama: atasNama,
    },
    atasNama, // addressedTo
    order.sales, // originator: sales who created the original request
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

  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  // Customize message based on the new status
  let title = `Order ${order.PONumber} Status Changed`;
  let message = `${changerName} changed status from "${oldStatus}" to "${newStatus}"`;

  if (changedByRole === "supplier") {
    // Supplier actions with custom messages
    if (newStatus === "Stock Ready") {
      title = `Order ${order.PONumber} - Stock Ready`;
      message = `${changerName} from ${supplierName} has marked the stock as ready for Order ${order.PONumber}`;
    } else if (newStatus === "Unable to Fulfill") {
      title = `Order ${order.PONumber} - Unable to Fulfill`;
      message = `${changerName} from ${supplierName} has marked Order ${order.PONumber} as unable to fulfill`;
    } else if (newStatus === "In Production") {
      title = `Order ${order.PONumber} - Production Started`;
      message = `${changerName} from ${supplierName} has started production for Order ${order.PONumber}`;
    } else if (newStatus === "Change Requested") {
      title = `Order ${order.PONumber} - Change Requested`;
      message = `${changerName} from ${supplierName} has requested a change in the Order ${order.PONumber}`;
    }
  }

  return createNotification(
    "order_status_changed",
    changedBy,
    changedByRole,
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    targets,
    undefined,
    [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
    {
      supplierId: supplierId,
      supplierName: supplierName,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
  );
};

// Helper: Create notification for order arrival
export const notifyOrderArrival = (
  order: Order,
  recordedBy: string,
  pcsDelivered: number,
) => {
  const recorderName = getFullNameFromUsername(recordedBy);
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

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
    undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
  );
};

// Helper: Create notification for order closure
export const notifyOrderClosed = (order: Order, closedBy: string) => {
  const closerName = getFullNameFromUsername(closedBy);
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

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
    undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
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

  // Check if this request is expiring and create/update expiring notification
  upsertRequestExpiringNotification(newRequest, "sales");
  upsertRequestExpiringNotification(newRequest, "stockist");
  upsertRequestExpiringNotification(newRequest, "jb");

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
    undefined,
    undefined,
    newRequest.createdBy,
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
    undefined,
    undefined,
    undefined,
    undefined,
    request.createdBy,
  );
};
