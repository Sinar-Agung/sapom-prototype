/**
 * Core type definitions for the SAPOM (Sales And Production Order Management) system
 * These interfaces define the data structures used throughout the application
 *
 * NOTE: After the request-order merge, Request is a type alias for Order.
 * All entities (both "requests" and "orders") are stored as Order objects
 * in the "orders" localStorage key. The Request alias is kept for backward
 * compatibility with existing component code.
 */

import type { Order, OrderRevision } from "./order";

// Re-export DetailBarangItem and EntityReference so existing imports keep working
export type { DetailBarangItem, EntityReference } from "./order";

/**
 * Request is now an alias for Order.
 * When Sales/Sales Internal creates a "request" it is an Order with status "Open".
 */
export type Request = Order;

/**
 * RequestRevision is now an alias for OrderRevision.
 */
export type RequestRevision = OrderRevision;

/**
 * Minimal Request interface for components that only need basic fields
 * Used primarily in detail-items-table component
 */
export interface MinimalRequest {
  customerExpectation?: string;
  detailItems: Order["detailItems"];
}

/**
 * Photo metadata for product images
 */
export interface Photo {
  id: string;
  name: string;
  description: string;
  category: string;
}
