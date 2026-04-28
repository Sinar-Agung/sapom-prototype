/**
 * Order type definitions for the SAPOM system
 * This is the single entity type for the SAPOM system.
 * What was previously "Request" is now an Order with early-lifecycle statuses (Open, JB Verifying, etc.)
 * Previously these types lived in request.ts; they now live here as the canonical source.
 */

import type { BranchCode } from "../utils/user-data";

/**
 * Represents a detail item in an order (detail barang)
 */
export interface DetailBarangItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
  orderPcs?: string;
  verified?: boolean;
  notes?: string;
  supplierNotes?: string;
}

/**
 * Entity reference with ID and name
 */
export interface EntityReference {
  id: string;
  name: string;
}

/**
 * Order Status enum
 * Represents the lifecycle of an order in the supplier workflow
 */
export type OrderStatus =
  // ── Request-phase statuses (sales-created, pre-JB-write) ─────────────────
  | "Open" // Order created by Sales/Sales Internal, awaiting stockist review
  | "JB Verifying" // Stockist has viewed and is verifying
  | "Requested to JB" // Stockist approved; forwarded to JB
  | "Request Expired" // ETA passed before JB wrote the order
  // ── Order-phase statuses (JB-written, in supplier workflow) ──────────────
  | "New Order" // Order written by JB, not yet viewed by supplier
  | "Supplier Viewed" // Supplier has viewed the order details
  | "Order Revised" // Supplier proposed changes have been approved by Sales and JB
  | "Rejected" // Sales rejected the revision
  | "Pending Sales Review" // Supplier changes submitted, awaiting Sales review
  | "Pending JB Review" // Sales reviewed, awaiting JB review
  | "Change Pending Approval" // Legacy alias for Pending Sales Review
  | "In Production" // Supplier has started production
  | "Stock Ready" // Order is ready for pickup/delivery
  | "Partially Delivered" // Order has partial deliveries
  | "Fully Delivered" // Order fully delivered to JB
  | "Shipping" // Supplier has dispatched the order
  | "Unable to Fulfill" // Supplier cannot fulfill the order
  | "Completed" // Order fulfilled and delivered
  | "Confirmed by JB" // Order delivery confirmed by JB
  | "Cancelled" // Order was cancelled
  | "Closed"; // Order closed by JB after full delivery

/**
 * Order Shipping Item - tracks dispatched quantities for a specific item
 */
export interface OrderShippingItem {
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: number;
}

/**
 * A snapshot of a shipment's items at a point in time (for audit trail)
 */
export interface OrderShippingEditHistory {
  editedAt: number;
  editedBy: string;
  previousItems: OrderShippingItem[];
  newItems: OrderShippingItem[];
}

/**
 * Order Shipping - created by supplier when dispatching goods
 */
export interface OrderShipping {
  id: string;
  orderId: string;
  orderPONumber: string;
  shippingDate: string; // ISO date string (YYYY-MM-DD)
  createdDate: number;
  createdBy: string;
  items: OrderShippingItem[];
  editHistory?: OrderShippingEditHistory[];
}

/**
 * A snapshot of an arrival's items at a point in time (for audit trail)
 */
export interface OrderArrivalEditHistory {
  editedAt: number;
  editedBy: string;
  previousItems: OrderArrivalItem[];
  newItems: OrderArrivalItem[];
}

/**
 * Order Arrival Item - tracks delivered quantities for a specific item
 */
export interface OrderArrivalItem {
  karat: string;
  warna: string;
  size: string;
  berat: string;
  pcs: number; // Number of pieces delivered in this arrival
}

/**
 * Order Arrival - tracks delivery of order items
 */
export interface OrderArrival {
  id: string;
  orderId: string;
  orderPONumber: string;
  shippingId?: string; // Optional link to specific OrderShipping entry
  createdDate: number; // Arrival date
  createdBy: string; // JB user who recorded the arrival
  items: OrderArrivalItem[]; // Items delivered in this arrival
  editHistory?: OrderArrivalEditHistory[];
}

/**
 * Order Revision - tracks changes made to an order
 */
export interface OrderRevision {
  revisionNumber: number;
  timestamp: number;
  updatedBy: string;
  revisionNotes?: string; // Notes from supplier/JB explaining the changes
  salesRowDecisions?: Record<string, "accept" | "reject">; // Row-level decisions made by Sales
  changes: {
    // Order-phase fields
    kategoriBarang?: string;
    jenisProduk?: string;
    namaProduk?: string;
    namaBasic?: string;
    detailItems?: DetailBarangItem[];
    photoId?: string;
    waktuKirim?: string;
    // Request-phase fields (tracked during early lifecycle)
    pabrik?: EntityReference | string;
    namaPelanggan?: EntityReference | string;
    notes?: string;
    customerExpectation?: string;
  };
  previousValues: {
    // Order-phase fields
    kategoriBarang?: string;
    jenisProduk?: string;
    namaProduk?: string;
    namaBasic?: string;
    detailItems?: DetailBarangItem[];
    photoId?: string;
    waktuKirim?: string;
    // Request-phase fields
    pabrik?: EntityReference | string;
    namaPelanggan?: EntityReference | string;
    notes?: string;
    customerExpectation?: string;
  };
}

/**
 * Order interface - represents an order created by JB and sent to suppliers
 *
 * An Order is created when JB decides to order items from a supplier.
 * It references the original Request and contains the items to be ordered.
 */
export interface Order {
  // Core identification
  id: string;
  PONumber: string; // Purchase Order Number: SA{BranchCode}{SupplierInitials}{YYYYMMDD}{SequentialNumber}

  // Link to original request (self-referential after merge; kept for compatibility)
  requestNo?: string;
  requestId?: string;

  // Customer and sales information
  sales?: string; // Sales person username
  atasNama?: string; // Customer name (string form, for order phase)
  namaPelanggan?: EntityReference | string; // Customer ref (request phase; derive atasNama from this)
  assignedSalesUsername?: string; // Set when a Sales Internal user created the request on behalf of a sales person
  notes?: string; // Free-text product notes

  // Timestamps and user tracking
  timestamp?: number; // Alias for createdDate (request phase compatibility)
  createdDate: number;
  createdBy: string;
  updatedDate?: number;
  updatedBy?: string;

  // JB user who wrote the order (empty string until JB writes it)
  jbId: string;

  // Stockist who reviewed the request (request phase)
  stockistId?: string;

  // Branch where order was created
  branchCode?: BranchCode;

  // Supplier/Factory reference (string | EntityReference for request-phase compatibility)
  pabrik: EntityReference | string;

  // Product information
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  namaBarang?: string; // Display name of the product (computed)

  // Delivery and expectations
  waktuKirim: string;
  customerExpectation: string;

  // Order items to be produced
  detailItems: DetailBarangItem[];

  // Media
  photoId?: string;
  fotoBarangBase64?: string; // Legacy base64 image support

  // Status tracking
  status: OrderStatus;

  // View tracking
  viewedBy?: string[]; // Array of usernames who have viewed this order

  // Revision history
  revisionHistory?: OrderRevision[];

  // Revision notes from supplier/JB (latest revision)
  revisionNotes?: string;

  // Rejection reason
  rejectionReason?: string;

  // Dual approval tracking for revisions
  jbApproved?: boolean;
  salesApproved?: boolean;
}

/**
 * Helper type for creating a new order from a request
 */
export interface CreateOrderFromRequest {
  requestId: string;
  requestNo?: string;
  jbId: string;
  pabrik: EntityReference;
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  waktuKirim: string;
  customerExpectation: string;
  detailItems: DetailBarangItem[];
  photoId?: string;
}
