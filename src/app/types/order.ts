/**
 * Order type definitions for the SAPOM system
 * Orders are created by JB users from Requests and sent to suppliers
 */

import { DetailBarangItem, EntityReference } from "./request";

/**
 * Order Status enum
 * Represents the lifecycle of an order in the supplier workflow
 */
export type OrderStatus =
  | "New" // Order created by JB, not yet viewed by supplier
  | "Viewed" // Supplier has viewed the order details
  | "Revised - Internal Review" // JB has revised the order, awaiting sales review
  | "Revision Confirmed" // Sales confirmed the revision
  | "Rejected" // Sales rejected the revision
  | "Change Requested" // Supplier needs changes/clarification
  | "In Production" // Supplier has started production
  | "Stock Ready" // Order is ready for pickup/delivery
  | "Partially Delivered" // Order has partial deliveries
  | "Fully Delivered" // Order fully delivered to JB
  | "Unable to Fulfill" // Supplier cannot fulfill the order
  | "Completed" // Order fulfilled and delivered
  | "Confirmed by JB" // Order delivery confirmed by JB
  | "Cancelled"; // Order was cancelled

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
  createdDate: number; // Arrival date
  createdBy: string; // JB user who recorded the arrival
  items: OrderArrivalItem[]; // Items delivered in this arrival
}

/**
 * Order Revision - tracks changes made to an order
 */
export interface OrderRevision {
  revisionNumber: number;
  timestamp: number;
  updatedBy: string;
  changes: {
    kategoriBarang?: string;
    jenisProduk?: string;
    namaProduk?: string;
    namaBasic?: string;
    detailItems?: DetailBarangItem[];
    photoId?: string;
  };
  previousValues: {
    kategoriBarang?: string;
    jenisProduk?: string;
    namaProduk?: string;
    namaBasic?: string;
    detailItems?: DetailBarangItem[];
    photoId?: string;
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

  // Link to original request
  requestNo?: string;
  requestId?: string;

  // Customer and sales information (from request)
  sales?: string; // Sales person username (from request createdBy)
  atasNama?: string; // Customer name (from request namaPelanggan)

  // Timestamps and user tracking
  createdDate: number;
  createdBy: string;
  updatedDate?: number;
  updatedBy?: string;

  // JB user who created the order
  jbId: string;

  // Supplier/Factory reference
  pabrik: EntityReference;

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

  // Revision history
  revisionHistory?: OrderRevision[];
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
