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

  // Stockist: see all expiring requests with status Open
  if (request.status === "Open" && userRole === "stockist") {
    shouldNotify = true;
    if (!targetAudience.includes("stockist")) targetAudience.push("stockist");
  }

  // JB: see all expiring requests with status Requested to JB (Assigned to JB)
  if (request.status === "Requested to JB" && userRole === "jb") {
    shouldNotify = true;
    if (!targetAudience.includes("jb")) targetAudience.push("jb");
  }

  // Sales: see all expiring requests that JB hasn't written yet
  if (request.status !== "New Order" && userRole === "sales") {
    shouldNotify = true;
    if (!targetAudience.includes("sales")) targetAudience.push("sales");
  }

  if (!shouldNotify) return;

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

  // Remove any previous expiring notification for this request
  let notifications = getAllNotifications();
  notifications = notifications.filter(
    (n) => !(n.eventType === "request_expiring" && n.entityId === request.id),
  );

  const title = `<strong class="text-green-600">${productName}</strong> for ${atasNamaLabel}`;

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
    title: title,
    message: `Request ${request.requestNo || request.id} is nearing its ETA deadline in ${daysToETA} day${daysToETA !== 1 ? "s" : ""} (${etaDate.toLocaleDateString("id-ID")})`,
    changes: [{ field: "daysToETA", oldValue: null, newValue: daysToETA }],
    originator: request.createdBy, // Add originator
    branchCode: request.branchCode, // Add branch code
    readBy: [],
  };

  notifications.unshift(notification); // Add at the beginning for newest first
  saveNotifications(notifications);
};

// Check all requests and create expiring notifications for relevant users
export const checkAndNotifyExpiringRequests = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
) => {
  console.log(`Checking expiring requests for ${username} (${userRole})`);
  const requestsJson = localStorage.getItem("orders");
  if (!requestsJson) return;

  const requests = JSON.parse(requestsJson);
  requests.forEach((req: Request) => {
    upsertRequestExpiringNotification(req, userRole);
  });
};

// Check all requests and expire those that have passed their ETA
export const checkAndExpireRequests = () => {
  console.log("Checking for expired requests");
  const requestsJson = localStorage.getItem("orders");
  if (!requestsJson) return;

  const requests: Request[] = JSON.parse(requestsJson);

  // No need to load a separate "orders" store — everything is unified.
  // Orders that have been written by JB will have status beyond the request-phase.
  const REQUEST_PHASE_STATUSES = new Set([
    "Open",
    "JB Verifying",
    "Requested to JB",
  ]);

  const now = new Date();
  let hasChanges = false;

  requests.forEach((req: Request) => {
    // Skip if no ETA or already in terminal state
    if (
      !req.waktuKirim ||
      req.status === "Request Expired" ||
      req.status === "Cancelled" ||
      !REQUEST_PHASE_STATUSES.has(req.status)
    ) {
      return;
    }

    const etaDate = new Date(req.waktuKirim);
    // Check if ETA has passed
    if (etaDate < now) {
      console.log(`Request ${req.requestNo || req.id} has expired`);
      const oldStatus = req.status;
      req.status = "Request Expired";
      hasChanges = true;

      // Get product name (Jenis Produk + Nama Basic/Nama Model)
      const jenisProdukLabel = getLabelFromValue(
        JENIS_PRODUK_OPTIONS,
        req.jenisProduk,
      );
      const productNameLabel =
        req.kategoriBarang === "basic"
          ? getLabelFromValue(NAMA_BASIC_OPTIONS, req.namaBasic)
          : getLabelFromValue(NAMA_PRODUK_OPTIONS, req.namaProduk);
      const productName = `${jenisProdukLabel} ${productNameLabel}`;

      // Get Atas Nama
      const atasNamaLabel =
        typeof req.namaPelanggan === "string"
          ? getLabelFromValue(ATAS_NAMA_OPTIONS, req.namaPelanggan)
          : req.namaPelanggan?.name ||
            getLabelFromValue(ATAS_NAMA_OPTIONS, req.namaPelanggan?.id || "");

      const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

      // Build standardized message format
      const pabrikLabel =
        typeof req.pabrik === "string"
          ? getLabelFromValue(PABRIK_OPTIONS, req.pabrik)
          : req.pabrik?.name ||
            getLabelFromValue(PABRIK_OPTIONS, req.pabrik?.id || "");

      const formatDate = (isoString: string) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };

      const etaDateFormatted = formatDate(req.waktuKirim);
      const itemCount = req.detailItems?.length || 0;
      const salesName = getFullNameFromUsername(req.createdBy || "");

      const message = `Supplier: ${pabrikLabel}\nETA: ${etaDateFormatted}\nSales: ${salesName}\nItem count: ${itemCount}`;

      // Build specific targets: sales creator, JB, and stockist (if assigned)
      const specificTargets: string[] = [];
      if (req.createdBy) {
        specificTargets.push(req.createdBy);
      }
      if (req.stockistId) {
        specificTargets.push(req.stockistId);
      }
      // Note: JB users will see this through role-based targetAudience filtering
      // We don't have a specific JB assignment field, so all JB users can see expired requests

      // Create notification for expired request
      createNotification(
        "request_expired",
        "system",
        "jb", // System notifications use jb role
        "request",
        req.id,
        req.requestNo || req.id,
        title,
        message,
        ["sales", "stockist", "jb"],
        specificTargets.length > 0 ? specificTargets : undefined,
        [{ field: "status", oldValue: oldStatus, newValue: "Request Expired" }],
        undefined,
        undefined,
        req.createdBy,
        req.branchCode,
      );
    }
  });

  // Save updated requests if any changes
  if (hasChanges) {
    localStorage.setItem("orders", JSON.stringify(requests));
    console.log("Expired requests updated");
  }
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

  // Only for Open
  if (request.status !== "Open") return;

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
  notifications.unshift(reminder); // Add at the beginning for newest first
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

// Sort existing notifications in localStorage (utility function)
export const sortExistingNotifications = (): void => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  const notifications = JSON.parse(stored);
  // Sort by timestamp (newest first)
  const sorted = notifications.sort(
    (a: Notification, b: Notification) => b.timestamp - a.timestamp,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  console.log(
    `✅ Sorted ${sorted.length} existing notifications (newest to oldest)`,
  );
};

// Get all notifications from localStorage
export const getAllNotifications = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const notifications = JSON.parse(stored);
  // Always return sorted by timestamp (newest first)
  return notifications.sort(
    (a: Notification, b: Notification) => b.timestamp - a.timestamp,
  );
};

// Save notifications to localStorage
const MAX_NOTIFICATIONS = 500;
const saveNotifications = (notifications: Notification[]) => {
  // Sort by timestamp (newest first) before saving, then cap
  const sorted = [...notifications]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
};

// Get notifications for a specific user
export const getNotificationsForUser = (
  username: string,
  userRole: "sales" | "stockist" | "jb" | "supplier",
): Notification[] => {
  const all = getAllNotifications();
  console.log("All notifications in storage:", all.length);

  // Get current user details for branch filtering
  const currentUser = findUserByUsername(username);
  const userBranchCode = currentUser?.branchCode;
  console.log(`User ${username} branch: ${userBranchCode}`);

  // Get all requests to check their status
  const requestsJson = localStorage.getItem("orders");
  const requests = requestsJson ? JSON.parse(requestsJson) : [];
  console.log("All requests:", requests.length);

  // Get all orders (used for sales-specific order notification filtering)
  const ordersJson = localStorage.getItem("orders");
  const orders = ordersJson ? JSON.parse(ordersJson) : [];

  const filtered = all
    .filter((notification) => {
      // Filter out notifications that have been removed by this user
      if (notification.removedBy?.includes(username)) {
        return false;
      }

      // Branch filtering for request notifications
      if (
        notification.entityType === "request" &&
        userBranchCode &&
        notification.branchCode
      ) {
        // Only show notifications for requests from the same branch
        if (notification.branchCode !== userBranchCode) {
          console.log(
            `Filtering out notification ${notification.id}: notification branch ${notification.branchCode} != user branch ${userBranchCode}`,
          );
          return false;
        }
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
            // Stockist: only see Open
            if (userRole === "stockist" && request.status !== "Open") {
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

        // Sales-specific filtering for ALL request notifications
        if (userRole === "sales" && notification.entityType === "request") {
          // Also allow if the sales user is the "atas nama" (assignedSalesUsername) for this request
          const relatedRequest = requests.find(
            (r: any) => r.id === notification.entityId,
          );
          const isAtasNama = relatedRequest?.assignedSalesUsername === username;

          // Sales users should only see notifications for their own requests
          // OR requests where they are set as atas nama sales
          if (notification.originator) {
            if (notification.originator !== username && !isAtasNama) {
              return false; // Different sales user's request and not atas nama, don't show
            }
          } else {
            if (!isAtasNama) {
              // No originator field - for safety, don't show unless user is atas nama
              console.warn(
                `Request notification ${notification.id} missing originator field`,
              );
              return false;
            }
          }
        }

        // Sales-specific filtering for ALL order notifications
        if (userRole === "sales" && notification.entityType === "order") {
          const relatedOrder = orders.find(
            (o: any) => o.id === notification.entityId,
          );
          if (relatedOrder) {
            const isOwner =
              relatedOrder.sales?.toLowerCase() === username.toLowerCase();
            const isAtasNama =
              relatedOrder.assignedSalesUsername?.toLowerCase() ===
              username.toLowerCase();
            if (!isOwner && !isAtasNama) {
              return false; // Not this sales user's order, don't show
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

export const markNotificationAsUnread = (
  notificationId: string,
  username: string,
) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((n) => {
    if (n.id === notificationId) {
      return {
        ...n,
        readBy: n.readBy.filter((u) => u !== username),
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

export const archiveNotificationForUser = (
  notificationId: string,
  username: string,
) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((n) => {
    if (n.id === notificationId && !n.archivedBy?.includes(username)) {
      return { ...n, archivedBy: [...(n.archivedBy || []), username] };
    }
    return n;
  });
  saveNotifications(updated);
};

export const unarchiveNotificationForUser = (
  notificationId: string,
  username: string,
) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((n) => {
    if (n.id === notificationId) {
      return {
        ...n,
        archivedBy: (n.archivedBy || []).filter((u) => u !== username),
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
  branchCode?: string,
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
    branchCode: branchCode as any,
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
  // Deduplicate: remove any existing notification with same eventType, entityId, and triggeredBy
  const deduped = notifications.filter(
    (n) =>
      !(
        n.eventType === eventType &&
        n.entityId === entityId &&
        n.triggeredBy === triggeredBy
      ),
  );
  deduped.unshift(notification); // Add at the beginning for newest first
  saveNotifications(deduped);

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

  // Title: Product Name in bold green + "for <Atas Nama>" if available (HTML formatted)
  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  // Message: Supplier, ETA, Sales, and item count
  const etaDate = formatDate(request.waktuKirim);
  const itemCount = request.detailItems?.length || 0;
  const creatorUser = findUserByUsername(createdBy);
  const isSalesInternalCreator = creatorUser?.accountType === "salesInternal";
  const salesLabel = isSalesInternalCreator ? "Sales Int." : "Sales";
  const atasNamaSalesLine =
    isSalesInternalCreator && request.assignedSalesUsername
      ? `\nA/N Sales: ${getFullNameFromUsername(request.assignedSalesUsername)}`
      : "";
  const message = `Supplier: ${pabrikLabel}\nETA: ${etaDate}\n${salesLabel}: ${creatorName}${atasNamaSalesLine}\nItem count: ${itemCount}`;

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
    (() => {
      const specific: string[] = [createdBy]; // notify the author themselves
      if (
        request.assignedSalesUsername &&
        !specific.includes(request.assignedSalesUsername)
      )
        specific.push(request.assignedSalesUsername);
      return specific;
    })(),
    undefined,
    undefined,
    undefined,
    createdBy, // originator
    request.branchCode, // branchCode
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
  const targets: NotificationTargetAudience[] = [];
  const specificTargets: string[] = [];

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

  // Notify the sales person who created it
  if (request.createdBy && request.createdBy !== changedBy) {
    specificTargets.push(request.createdBy);
  }

  // Also notify the atas nama sales (assignedSalesUsername) if set and different from changedBy
  if (
    request.assignedSalesUsername &&
    request.assignedSalesUsername !== changedBy &&
    !specificTargets.includes(request.assignedSalesUsername)
  ) {
    specificTargets.push(request.assignedSalesUsername);
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
    // Also notify atas nama sales if set
    if (
      request.assignedSalesUsername &&
      !salesTargets.includes(request.assignedSalesUsername)
    ) {
      salesTargets.push(request.assignedSalesUsername);
    }

    const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

    const orderedEta = (() => {
      if (!order.waktuKirim) return "-";
      return new Date(order.waktuKirim).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    })();
    const orderedItems = order.detailItems?.length || 0;
    const orderedMessage = `Supplier: ${supplierName}\nETA: ${orderedEta}\n${buildOrderSalesLines(order)}\nItems: ${orderedItems}`;

    return createNotification(
      "order_written",
      changedBy,
      changedByRole,
      "order",
      order.id,
      order.PONumber,
      title,
      orderedMessage,
      ["jb", "supplier", "sales"],
      salesTargets.length > 0 ? salesTargets : undefined,
      [{ field: "status", oldValue: "Assigned to JB", newValue: newStatus }],
      {
        supplierId:
          typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id,
        supplierName: supplierName,
        requestId: request.id,
        ...(order.assignedSalesUsername
          ? { assignedSalesUsername: order.assignedSalesUsername }
          : request.assignedSalesUsername
            ? { assignedSalesUsername: request.assignedSalesUsername }
            : {}),
      },
      supplierName,
      undefined,
      order.branchCode,
    );
  }

  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  // Standardized format for all status changes
  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");

  const formatStatusDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const etaDate = formatStatusDate(request.waktuKirim);
  const itemCount = request.detailItems?.length || 0;
  const salesName = getFullNameFromUsername(request.createdBy || "");

  // Determine event type based on new status
  let eventType: NotificationEventType = "request_status_changed";
  const message = `Supplier: ${pabrikLabel}\nETA: ${etaDate}\nSales: ${salesName}\nItem count: ${itemCount}`;

  if (newStatus === "Requested to JB") {
    eventType = "request_to_jb";
  } else if (newStatus === "Ready Stock Marketing") {
    eventType = "request_stock_ready";
  } else if (newStatus === "Stock Unavailable") {
    eventType = "request_stock_unavailable";
  }

  return createNotification(
    eventType,
    changedBy,
    changedByRole,
    "request",
    request.id,
    request.requestNo || request.id,
    title,
    message,
    targets,
    specificTargets.length > 0 ? specificTargets : undefined,
    [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};

// Helper: Create notification for request viewed by stockist
export const notifyRequestViewedByStockist = (
  request: Request,
  stockistUsername: string,
  oldStatus?: string,
  newStatus?: string,
) => {
  const requestNo = request.requestNo || request.id;

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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  // Get additional info for message
  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const etaDate = formatDate(request.waktuKirim);
  const itemCount = request.detailItems?.length || 0;
  const salesName = getFullNameFromUsername(request.createdBy || "");

  const message = `Supplier: ${pabrikLabel}\nETA: ${etaDate}\nSales: ${salesName}\nItem count: ${itemCount}`;

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
    title,
    message,
    ["sales", "stockist"],
    request.createdBy ? [request.createdBy] : undefined,
    changes,
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};

// Helper: Create notification when JB views an Open request
export const notifyRequestViewedByJB = (
  request: Request,
  jbUsername: string,
) => {
  const requestNo = request.requestNo || request.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    request.jenisProduk,
  );
  const productNameLabel =
    request.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, request.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, request.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  const atasNamaLabel =
    typeof request.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan)
      : request.namaPelanggan?.name ||
        getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan?.id || "");

  const title = `<strong class="text-cyan-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");

  const jbName = getFullNameFromUsername(jbUsername);
  const salesName = getFullNameFromUsername(request.createdBy || "");
  const message = `Viewed by: ${jbName}\nSales: ${salesName}\nSupplier: ${pabrikLabel}`;

  return createNotification(
    "request_viewed_by_jb",
    jbUsername,
    "jb",
    "request",
    request.id,
    requestNo,
    title,
    message,
    ["sales"],
    request.createdBy ? [request.createdBy] : undefined,
    undefined,
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};

// Helper: Create notification when JB rejects a request
export const notifyRequestRejectedByJB = (
  request: Request,
  jbUsername: string,
  reason: string,
) => {
  const requestNo = request.requestNo || request.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    request.jenisProduk,
  );
  const productNameLabel =
    request.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, request.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, request.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  const atasNamaLabel =
    typeof request.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan)
      : request.namaPelanggan?.name ||
        getLabelFromValue(ATAS_NAMA_OPTIONS, request.namaPelanggan?.id || "");

  const title = `<strong class="text-red-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  const pabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");

  const jbName = getFullNameFromUsername(jbUsername);
  const salesName = getFullNameFromUsername(request.createdBy || "");
  const message = `Rejected by: ${jbName}\nReason: ${reason}\nSales: ${salesName}\nSupplier: ${pabrikLabel}`;

  return createNotification(
    "request_rejected",
    jbUsername,
    "jb",
    "request",
    request.id,
    requestNo,
    title,
    message,
    ["sales", "jb"],
    request.createdBy ? [request.createdBy] : undefined,
    [{ field: "status", oldValue: "JB Verifying", newValue: "Rejected" }],
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};

// Helper: Create notification for request approval/rejection
export const notifyRequestReviewed = (
  request: Request,
  approved: boolean,
  stockistUsername: string,
) => {
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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  const pabrikLabelR =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");
  const formatDateR = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const etaDateR = formatDateR(request.waktuKirim);
  const salesNameR = getFullNameFromUsername(request.createdBy || "");
  const itemCountR = request.detailItems?.length || 0;
  const message = `Supplier: ${pabrikLabelR}\nETA: ${etaDateR}\nSales: ${salesNameR}\nItems: ${itemCountR}`;

  return createNotification(
    approved ? "request_approved_by_stockist" : "request_rejected_by_stockist",
    stockistUsername,
    "stockist",
    "request",
    request.id,
    request.requestNo || request.id,
    title,
    message,
    ["sales", "stockist"],
    request.createdBy ? [request.createdBy] : undefined,
    undefined,
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};

// Helper: Create notification when supplier views a New Order
export const notifyOrderViewedBySupplier = (
  order: Order,
  supplierUsername: string,
) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  const atasNama = order.atasNama || "";
  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const etaFormatted = order.waktuKirim ? formatDate(order.waktuKirim) : "N/A";
  const itemCount = order.detailItems?.length || 0;
  const message = `Supplier: ${supplierName}\nETA: ${etaFormatted}\n${buildOrderSalesLines(order)}\nItem count: ${itemCount}`;

  return createNotification(
    "supplier_views_order",
    supplierUsername,
    "supplier",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    ["jb", "sales"],
    undefined,
    [{ field: "status", oldValue: "New Order", newValue: "Supplier Viewed" }],
    {
      supplierId: supplierId,
      supplierName: supplierName,
      requestId: order.requestId,
    },
    supplierName,
    undefined,
    order.branchCode,
  );
};

/**
 * Build the Sales line(s) for an order notification message body.
 * Returns "Sales Int.: Name\nA/N Sales: Name" when order.sales is a salesInternal user,
 * or "Sales: Name" for regular sales.
 */
const buildOrderSalesLines = (order: Order): string => {
  const salesUser = findUserByUsername(order.sales || "");
  const salesName = getFullNameFromUsername(order.sales || "");
  if (salesUser?.accountType === "salesInternal") {
    const lines = [`Sales Int.: ${salesName}`];
    if (order.assignedSalesUsername) {
      lines.push(
        `A/N Sales: ${getFullNameFromUsername(order.assignedSalesUsername)}`,
      );
    }
    return lines.join("\n");
  }
  return `Sales: ${salesName}`;
};

// Helper: Create notification for order creation
export const notifyOrderCreated = (order: Order, createdBy: string) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

  // Format date helper
  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format message with standardized fields
  const etaFormatted = order.waktuKirim ? formatDate(order.waktuKirim) : "N/A";
  const itemCount = order.detailItems?.length || 0;
  const message = `Supplier: ${supplierName}\nETA: ${etaFormatted}\n${buildOrderSalesLines(order)}\nItem count: ${itemCount}`;

  console.log("🏭 Creating order notification:", {
    orderPONumber: order.PONumber,
    supplierName: supplierName,
    supplierId: supplierId,
    pabrikType: typeof order.pabrik,
  });

  return createNotification(
    "order_written",
    createdBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    ["jb", "supplier", "sales"], // Notify JB, supplier, and sales with standardized message
    undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
      requestId: order.requestId,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
    order.branchCode,
  );
};

// Helper: Create notification for order revision by JB
export const notifyOrderRevised = (order: Order, revisedBy: string) => {
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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

  console.log("✏️ Creating order revision notification:", {
    orderPONumber: order.PONumber,
    revisedBy: revisedBy,
    salesPerson: order.sales,
    productName: productName,
    atasNama: atasNama,
  });

  const formatDateRev = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const revEta = formatDateRev(order.waktuKirim);
  const revItems = order.detailItems?.length || 0;
  const revMessage = `Supplier: ${supplierName}\nETA: ${revEta}\n${buildOrderSalesLines(order)}\nItems: ${revItems}`;

  return createNotification(
    "order_revised",
    revisedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    title,
    revMessage,
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
    order.branchCode,
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
  const targets: NotificationTargetAudience[] = [];

  // Helper to format dates
  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

  // Special handling for "Pending Sales Review" status
  if (changedByRole === "supplier" && newStatus === "Pending Sales Review") {
    // Supplier should also receive their own change request notification
    targets.push("supplier");
    // Sales also needs to review the proposed changes
    targets.push("sales");

    // Create special notification for Order Change Requested
    const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

    // Format the detailed body
    const itemCount = order.detailItems?.length || 0;
    const etaFormatted = order.waktuKirim
      ? formatDate(order.waktuKirim)
      : "N/A";

    const message = `Supplier: ${supplierName}\nETA: ${etaFormatted}\n${buildOrderSalesLines(order)}\nItem count: ${itemCount}`;

    const specificTargets: string[] = order.sales ? [order.sales] : [];
    if (
      order.assignedSalesUsername &&
      !specificTargets.includes(order.assignedSalesUsername)
    ) {
      specificTargets.push(order.assignedSalesUsername);
    }

    return createNotification(
      "order_change_requested",
      changedBy,
      changedByRole,
      "order",
      order.id,
      order.PONumber,
      title,
      message,
      targets,
      specificTargets.length > 0 ? specificTargets : undefined,
      [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
      {
        supplierId: supplierId,
        supplierName: supplierName,
      },
      supplierName, // addressedTo
      undefined, // originator (not applicable for orders)
      order.branchCode,
    );
  }

  // Use standard title format
  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;
  const stdEta = order.waktuKirim ? formatDate(order.waktuKirim) : "N/A";
  const stdItems = order.detailItems?.length || 0;
  // Resolve assignedSalesUsername from order or linked request for message body
  const resolvedOrderForMessage: typeof order =
    !order.assignedSalesUsername && order.requestId
      ? (() => {
          const savedRequests = localStorage.getItem("orders");
          if (savedRequests) {
            const allRequests = JSON.parse(savedRequests);
            const linked = allRequests.find(
              (r: any) => r.id === order.requestId,
            );
            if (linked?.assignedSalesUsername) {
              return {
                ...order,
                assignedSalesUsername: linked.assignedSalesUsername,
              };
            }
          }
          return order;
        })()
      : order;
  const message = `Supplier: ${supplierName}\nETA: ${stdEta}\n${buildOrderSalesLines(resolvedOrderForMessage)}\nItems: ${stdItems}`;

  let eventType: NotificationEventType = "order_status_changed";
  let specificTargetsForEvent: string[] | undefined = undefined;
  if (newStatus === "In Production") {
    eventType = "order_in_production";
    // Supplier also gets a record of their own action
    if (!targets.includes("supplier")) targets.push("supplier");
    // Sales who placed the order also gets notified
    if (!targets.includes("sales")) targets.push("sales");
    const inProdTargets: string[] = order.sales ? [order.sales] : [];
    if (
      order.assignedSalesUsername &&
      !inProdTargets.includes(order.assignedSalesUsername)
    )
      inProdTargets.push(order.assignedSalesUsername);
    specificTargetsForEvent =
      inProdTargets.length > 0 ? inProdTargets : undefined;
  } else if (newStatus === "Stock Ready") {
    eventType = "order_stock_ready";
    // Supplier also gets a record of their own action
    if (!targets.includes("supplier")) targets.push("supplier");
    // Sales who placed the order also gets notified
    if (!targets.includes("sales")) targets.push("sales");
    const stockReadyTargets: string[] = order.sales ? [order.sales] : [];
    // Resolve assignedSalesUsername from order or fallback to original request in localStorage
    let resolvedAssignedSales = order.assignedSalesUsername;
    if (!resolvedAssignedSales && order.requestId) {
      const savedRequests = localStorage.getItem("orders");
      if (savedRequests) {
        const allRequests = JSON.parse(savedRequests);
        const linkedRequest = allRequests.find(
          (r: any) => r.id === order.requestId,
        );
        if (linkedRequest?.assignedSalesUsername) {
          resolvedAssignedSales = linkedRequest.assignedSalesUsername;
        }
      }
    }
    if (
      resolvedAssignedSales &&
      !stockReadyTargets.includes(resolvedAssignedSales)
    )
      stockReadyTargets.push(resolvedAssignedSales);
    specificTargetsForEvent =
      stockReadyTargets.length > 0 ? stockReadyTargets : undefined;
  } else if (newStatus === "Unable to Fulfill") {
    eventType = "order_unable_to_fulfill";
    // Sales who placed the order also gets notified
    if (!targets.includes("sales")) targets.push("sales");
    const unableTargets: string[] = order.sales ? [order.sales] : [];
    if (
      order.assignedSalesUsername &&
      !unableTargets.includes(order.assignedSalesUsername)
    )
      unableTargets.push(order.assignedSalesUsername);
    specificTargetsForEvent =
      unableTargets.length > 0 ? unableTargets : undefined;
  }

  return createNotification(
    eventType,
    changedBy,
    changedByRole,
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    targets,
    specificTargetsForEvent,
    [{ field: "status", oldValue: oldStatus, newValue: newStatus }],
    {
      supplierId: supplierId,
      supplierName: supplierName,
      ...(order.assignedSalesUsername
        ? { assignedSalesUsername: order.assignedSalesUsername }
        : {}),
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
    order.branchCode,
  );
};

// Helper: Create notification when Sales submits their review (→ Pending JB Review)
export const notifyPendingJBReview = (order: Order, reviewedBy: string) => {
  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;
  const atasNama = order.atasNama || "Unknown Customer";
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  const title = `<strong class="text-blue-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;
  const reviewerName = getFullNameFromUsername(reviewedBy);
  const message = `${buildOrderSalesLines(order)}\nSupplier: ${supplierName}\nReviewed by: ${reviewerName}\nStatus: Pending JB Review`;

  const targets: NotificationTargetAudience[] = ["jb", "sales", "supplier"];
  const specific: string[] = [];
  if (order.sales) specific.push(order.sales);
  if (order.jbId) specific.push(order.jbId);
  if (
    order.assignedSalesUsername &&
    !specific.includes(order.assignedSalesUsername)
  )
    specific.push(order.assignedSalesUsername);

  return createNotification(
    "order_pending_jb_review",
    reviewedBy,
    "sales",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    targets,
    specific.length > 0 ? specific : undefined,
    [
      {
        field: "status",
        oldValue: "Pending Sales Review",
        newValue: "Pending JB Review",
      },
    ],
    { supplierId, supplierName },
    supplierName,
    order.sales,
    order.branchCode,
  );
};

// Helper: Create notification when Sales or JB approves an order change revision
export const notifyOrderChangeApproved = (
  order: Order,
  approvedBy: string,
  approvedByRole: "sales" | "jb",
  bothApproved: boolean,
) => {
  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;
  const approverName = getFullNameFromUsername(approvedBy);
  const atasNama = order.atasNama || "Unknown Customer";
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";

  const title = bothApproved
    ? `Order change fully approved: <strong class="text-green-600">${productName}</strong>`
    : `Order change approved by ${approvedByRole.toUpperCase()}: <strong class="text-blue-600">${productName}</strong>`;

  const message = `Product: ${productName}\nCustomer: ${atasNama}\nSupplier: ${supplierName}\nApproved by: ${approverName}\nStatus: ${bothApproved ? "Fully Approved — Order Revised" : `Waiting for ${approvedByRole === "jb" ? "Sales" : "JB"} approval`}`;

  // Notify the other party and the originating sales (and atas nama if set)
  // When fully approved (Order Revised), also notify supplier
  const targets: NotificationTargetAudience[] = bothApproved
    ? ["jb", "sales", "supplier"]
    : ["jb", "sales"];
  const specific: string[] = [];
  if (order.sales) specific.push(order.sales);
  if (order.jbId) specific.push(order.jbId);
  if (
    order.assignedSalesUsername &&
    !specific.includes(order.assignedSalesUsername)
  )
    specific.push(order.assignedSalesUsername);

  return createNotification(
    "order_change_approved",
    approvedBy,
    approvedByRole,
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    targets,
    specific.length > 0 ? specific : undefined,
    undefined,
    { productName, atasNama, bothApproved },
    atasNama,
    order.sales,
    order.branchCode,
  );
};

// Helper: Create notification for order arrival
export const notifyOrderArrival = (
  order: Order,
  recordedBy: string,
  pcsDelivered: number,
) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

  const formatDateArr = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const arrEta = formatDateArr(order.waktuKirim);
  const arrItems = order.detailItems?.length || 0;
  const arrMessage = `Supplier: ${supplierName}\nETA: ${arrEta}\n${buildOrderSalesLines(order)}\nItems: ${arrItems}\nPcs Received: ${pcsDelivered}`;

  const arrSpecificTargets: string[] = [];
  if (order.sales) arrSpecificTargets.push(order.sales);
  if (
    order.assignedSalesUsername &&
    !arrSpecificTargets.includes(order.assignedSalesUsername)
  )
    arrSpecificTargets.push(order.assignedSalesUsername);

  return createNotification(
    "order_arrival_recorded",
    recordedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    title,
    arrMessage,
    ["jb", "supplier", "sales"],
    arrSpecificTargets.length > 0 ? arrSpecificTargets : undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
    order.branchCode,
  );
};

// Helper: Create notification when supplier creates a new shipment entry
export const notifyOrderShipmentCreated = (
  order: Order,
  createdBy: string,
  shippingId: string,
) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;
  const atasNama = order.atasNama || "Unknown Customer";

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;
  const message = `Supplier: ${supplierName}\nShipment ID: ${shippingId}\n${buildOrderSalesLines(order)}`;

  const shipCreTargets: string[] = [];
  if (order.sales) shipCreTargets.push(order.sales);
  if (
    order.assignedSalesUsername &&
    !shipCreTargets.includes(order.assignedSalesUsername)
  )
    shipCreTargets.push(order.assignedSalesUsername);

  return createNotification(
    "order_shipment_created",
    createdBy,
    "supplier",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    ["jb", "supplier", "sales"],
    shipCreTargets.length > 0 ? shipCreTargets : undefined,
    undefined,
    { supplierId, supplierName, shippingId },
    supplierName,
    undefined,
    order.branchCode,
  );
};

// Helper: Create notification when supplier edits a shipment entry
export const notifyOrderShipmentEdited = (
  order: Order,
  editedBy: string,
  shippingId: string,
) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;
  const atasNama = order.atasNama || "Unknown Customer";

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;
  const message = `Supplier: ${supplierName}\nShipment ID: ${shippingId}\n${buildOrderSalesLines(order)}`;

  const shipEdiTargets: string[] = [];
  if (order.sales) shipEdiTargets.push(order.sales);
  if (
    order.assignedSalesUsername &&
    !shipEdiTargets.includes(order.assignedSalesUsername)
  )
    shipEdiTargets.push(order.assignedSalesUsername);

  return createNotification(
    "order_shipment_edited",
    editedBy,
    "supplier",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    ["jb", "supplier", "sales"],
    shipEdiTargets.length > 0 ? shipEdiTargets : undefined,
    undefined,
    { supplierId, supplierName, shippingId },
    supplierName,
    undefined,
    order.branchCode,
  );
};

// Helper: Create notification when all order items have been fully delivered
export const notifyOrderFullyDelivered = (order: Order, recordedBy: string) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;
  const atasNama = order.atasNama || "Unknown Customer";

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;
  const etaFormatted = order.waktuKirim
    ? new Date(order.waktuKirim).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
  const itemCount = order.detailItems?.length || 0;
  const message = `Supplier: ${supplierName}\nETA: ${etaFormatted}\n${buildOrderSalesLines(order)}\nItems: ${itemCount}`;

  const fullyDelTargets: string[] = [];
  if (order.sales) fullyDelTargets.push(order.sales);
  if (
    order.assignedSalesUsername &&
    !fullyDelTargets.includes(order.assignedSalesUsername)
  )
    fullyDelTargets.push(order.assignedSalesUsername);

  return createNotification(
    "order_fully_delivered",
    recordedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    title,
    message,
    ["jb", "supplier", "sales"],
    fullyDelTargets.length > 0 ? fullyDelTargets : undefined,
    undefined,
    { supplierId, supplierName },
    supplierName,
    undefined,
    order.branchCode,
  );
};

// Helper: Create notification for order closure
export const notifyOrderClosed = (order: Order, closedBy: string) => {
  const supplierName =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Supplier";
  const supplierId =
    typeof order.pabrik === "string" ? order.pabrik : order.pabrik?.id;

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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNama ? ` for ${atasNama}` : ""}`;

  const formatDateCl = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const clEta = formatDateCl(order.waktuKirim);
  const clItems = order.detailItems?.length || 0;
  const clMessage = `Supplier: ${supplierName}\nETA: ${clEta}\n${buildOrderSalesLines(order)}\nItems: ${clItems}`;

  const closedTargets: string[] = [];
  if (order.sales) closedTargets.push(order.sales);
  if (
    order.assignedSalesUsername &&
    !closedTargets.includes(order.assignedSalesUsername)
  )
    closedTargets.push(order.assignedSalesUsername);

  return createNotification(
    "order_closed",
    closedBy,
    "jb",
    "order",
    order.id,
    order.PONumber,
    title,
    clMessage,
    ["jb", "supplier", "sales"],
    closedTargets.length > 0 ? closedTargets : undefined,
    undefined,
    {
      supplierId: supplierId,
      supplierName: supplierName,
    },
    supplierName, // addressedTo
    undefined, // originator (not applicable for orders)
    order.branchCode,
  );
};

// Helper: Create notification for request update
export const notifyRequestUpdated = (
  oldRequest: Request,
  newRequest: Request,
  updatedBy: string,
) => {
  const changes: NotificationChange[] = [];

  // Get product name (Jenis Produk + Nama Basic/Nama Model)
  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    newRequest.jenisProduk,
  );
  const productNameLabel =
    newRequest.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, newRequest.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, newRequest.namaProduk);
  const productName = `${jenisProdukLabel} ${productNameLabel}`;

  // Get Atas Nama
  const atasNamaLabel =
    typeof newRequest.namaPelanggan === "string"
      ? getLabelFromValue(ATAS_NAMA_OPTIONS, newRequest.namaPelanggan)
      : newRequest.namaPelanggan?.name ||
        getLabelFromValue(
          ATAS_NAMA_OPTIONS,
          newRequest.namaPelanggan?.id || "",
        );

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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  // Target both stockists and the sales user who made the update
  const specificTargets = [updatedBy];

  const updPabrikLabel =
    typeof newRequest.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, newRequest.pabrik)
      : newRequest.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, newRequest.pabrik?.id || "");
  const formatDateUpd = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const updEta = formatDateUpd(newRequest.waktuKirim);
  const updSalesName = getFullNameFromUsername(updatedBy);
  const updItems = newRequest.detailItems?.length || 0;
  const updUser = findUserByUsername(updatedBy);
  const isUpdSalesInternal = updUser?.accountType === "salesInternal";
  const updSalesLabel = isUpdSalesInternal ? "Sales Int." : "Sales";
  const updAtasNamaLine =
    isUpdSalesInternal && newRequest.assignedSalesUsername
      ? `\nA/N Sales: ${getFullNameFromUsername(newRequest.assignedSalesUsername)}`
      : "";
  const updMessage = `Supplier: ${updPabrikLabel}\nETA: ${updEta}\n${updSalesLabel}: ${updSalesName}${updAtasNamaLine}\nItems: ${updItems}`;

  return createNotification(
    "request_updated",
    updatedBy,
    "sales",
    "request",
    newRequest.id,
    newRequest.requestNo || newRequest.id,
    title,
    updMessage,
    ["stockist", "sales"],
    specificTargets,
    changes,
    undefined,
    undefined,
    newRequest.createdBy,
    newRequest.branchCode,
  );
};

// Helper: Create notification for request cancellation
export const notifyRequestCancelled = (
  request: Request,
  cancelledBy: string,
) => {
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

  const title = `<strong class="text-green-600">${productName}</strong>${atasNamaLabel ? ` for ${atasNamaLabel}` : ""}`;

  const canPabrikLabel =
    typeof request.pabrik === "string"
      ? getLabelFromValue(PABRIK_OPTIONS, request.pabrik)
      : request.pabrik?.name ||
        getLabelFromValue(PABRIK_OPTIONS, request.pabrik?.id || "");
  const formatDateCan = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";
  const canEta = formatDateCan(request.waktuKirim);
  const canCancelledByUser = findUserByUsername(cancelledBy);
  const isCanSalesInternal =
    canCancelledByUser?.accountType === "salesInternal";
  const canSalesLabel = isCanSalesInternal ? "Sales Int." : "Sales";
  const canSalesName = getFullNameFromUsername(cancelledBy);
  const canAtasNamaLine =
    isCanSalesInternal && request.assignedSalesUsername
      ? `\nA/N Sales: ${getFullNameFromUsername(request.assignedSalesUsername)}`
      : "";
  const canItems = request.detailItems?.length || 0;
  const canMessage = `Supplier: ${canPabrikLabel}\nETA: ${canEta}\n${canSalesLabel}: ${canSalesName}${canAtasNamaLine}\nItems: ${canItems}`;

  return createNotification(
    "request_cancelled",
    cancelledBy,
    "sales",
    "request",
    request.id,
    request.requestNo || request.id,
    title,
    canMessage,
    ["stockist", "sales"],
    undefined,
    undefined,
    undefined,
    undefined,
    request.createdBy,
    request.branchCode,
  );
};
