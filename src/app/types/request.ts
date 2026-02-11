/**
 * Core type definitions for the SAPOM (Sales And Production Order Management) system
 * These interfaces define the data structures used throughout the application
 */

/**
 * Represents a detail item in a request (detail barang)
 * Contains specifications for individual jewelry items
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
}

/**
 * Entity reference with ID and name
 * Used for factory (pabrik) and customer (pelanggan) references
 */
export interface EntityReference {
  id: string;
  name: string;
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

/**
 * Main Request interface - comprehensive definition with all possible attributes
 * Represents a request from cross-divisional staff for jewelry products
 *
 * This is a superset interface that encompasses all known attributes across the application.
 * Individual components may only use a subset of these properties.
 */
export interface Request {
  // Core identification
  id: string;
  timestamp: number;
  requestNo?: string;

  // User tracking
  createdBy?: string;
  updatedDate?: number;
  updatedBy?: string;
  stockistId?: string;

  // Factory reference - can be object or string for compatibility
  pabrik: EntityReference | string;

  // Customer reference - can be object or string for compatibility
  namaPelanggan: EntityReference | string;

  // Product information
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;

  // Delivery and expectations
  waktuKirim: string;
  customerExpectation: string;

  // Detail items
  detailItems: DetailBarangItem[];

  // Media
  fotoBarangBase64?: string;
  photoId?: string;

  // Status tracking
  status: string;
}

/**
 * Minimal Request interface for components that only need basic fields
 * Used primarily in detail-items-table component
 */
export interface MinimalRequest {
  customerExpectation?: string;
  detailItems: DetailBarangItem[];
}
