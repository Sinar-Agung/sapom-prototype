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
  | "Viewed by Supplier" // Supplier has viewed the order details
  | "Confirmed" // Supplier confirmed they can fulfill the order
  | "In Production" // Order is being produced
  | "Ready for Pickup" // Order ready for delivery/pickup
  | "Completed" // Order fulfilled and delivered
  | "Cancelled"; // Order was cancelled

/**
 * Order interface - represents an order created by JB and sent to suppliers
 *
 * An Order is created when JB decides to order items from a supplier.
 * It references the original Request and contains the items to be ordered.
 */
export interface Order {
  // Core identification
  id: string;

  // Link to original request
  requestNo?: string;
  requestId?: string;

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

  // Delivery and expectations
  waktuKirim: string;
  customerExpectation: string;

  // Order items to be produced
  detailItems: DetailBarangItem[];

  // Media
  fotoBarangBase64?: string;
  photoId?: string;

  // Status tracking
  status: OrderStatus;
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
  fotoBarangBase64?: string;
  photoId?: string;
}
