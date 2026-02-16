/**
 * Notification type definitions for the SAPOM system
 * Tracks events and changes across Requests and Orders
 */

export type NotificationEventType =
  // Request events
  | "request_created"
  | "request_updated"
  | "request_cancelled"
  | "request_status_changed"
  | "request_viewed_by_stockist"
  | "request_approved_by_stockist"
  | "request_rejected_by_stockist"
  | "request_converted_to_order"
  // Order events
  | "order_created"
  | "order_updated"
  | "order_status_changed"
  | "order_viewed_by_supplier"
  | "order_arrival_recorded"
  | "order_closed";

export type NotificationTargetAudience =
  | "sales" // Sales user who created the request
  | "stockist" // Stockist who needs to review
  | "jb" // JB who manages orders
  | "supplier" // Supplier who fulfills orders
  | "all"; // All users

export interface NotificationChange {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export interface Notification {
  id: string;
  eventType: NotificationEventType;
  timestamp: number;

  // Who triggered this event
  triggeredBy: string; // username
  triggeredByRole: "sales" | "stockist" | "jb" | "supplier";

  // What was affected
  entityType: "request" | "order";
  entityId: string; // Request ID or Order ID
  entityNumber: string; // Request No or PO Number for display

  // Target audience
  targetAudience: NotificationTargetAudience[];
  specificTargets?: string[]; // Specific usernames who should see this

  // Event details
  title: string;
  message: string;
  changes?: NotificationChange[]; // What changed

  // Status
  readBy: string[]; // Array of usernames who have read this notification
}

export interface NotificationFilter {
  eventTypes?: NotificationEventType[];
  entityTypes?: ("request" | "order")[];
  unreadOnly?: boolean;
  fromDate?: number;
  toDate?: number;
}
