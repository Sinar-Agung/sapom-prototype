/**
 * Central export point for all type definitions
 * Import types from here for convenience: import { Request, Order, DetailBarangItem } from '@/app/types'
 *
 * NOTE: Request is now a type alias for Order (request-order merge).
 * All entities use the Order type; Request is kept for backward compatibility.
 */

export type {
  DetailBarangItem,
  EntityReference,
  MinimalRequest,
  Photo,
  Request,
  RequestRevision,
} from "./request";

export type {
  CreateOrderFromRequest,
  Order,
  OrderRevision,
  OrderStatus,
} from "./order";
