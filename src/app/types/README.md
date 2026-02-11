# Type Definitions

This directory contains centralized type definitions for the SAPOM (Sales And Production Order Management) system.

## Files

### `request.ts`

Contains the core type definitions for requests (formerly called "orders"):

- **`DetailBarangItem`**: Represents individual jewelry item specifications with properties like kadar, warna, ukuran, berat, pcs, etc.
- **`EntityReference`**: A reusable type for entities with id and name (used for pabrik and namaPelanggan)
- **`Photo`**: Photo metadata for product images
- **`Request`**: Main request interface with all possible attributes (superset)
- **`MinimalRequest`**: Simplified request interface for components that only need basic fields

### `index.ts`

Central export point for all types. Import from here for convenience:

```typescript
import { Request, DetailBarangItem, EntityReference } from "@/app/types";
```

## Usage

### In Components

```typescript
import { Request } from "@/app/types/request";
// or
import { Request } from "@/app/types";

interface MyComponentProps {
  request: Request;
}
```

### Request Interface

The `Request` interface is a comprehensive superset that includes all known attributes across the application:

```typescript
interface Request {
  // Core identification
  id: string;
  timestamp: number;
  requestNo?: string;

  // User tracking
  createdBy?: string;
  updatedDate?: number;
  updatedBy?: string;
  stockistId?: string;

  // References (can be object or string for compatibility)
  pabrik: EntityReference | string;
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

  // Status
  status: string;
}
```

## Migration Notes

All interface definitions have been moved from individual component files to this centralized location. This provides:

1. **Single source of truth**: All type definitions in one place
2. **Consistency**: Ensures all components use the same type definitions
3. **Maintainability**: Easier to update and extend types
4. **Type safety**: Better TypeScript support and IDE autocomplete
5. **Documentation**: Comprehensive JSDoc comments for all interfaces

## Component Updates

The following components have been updated to use centralized types:

- `jb-requests.tsx`
- `my-orders.tsx`
- `request-card.tsx`
- `write-order.tsx`
- `verify-stock.tsx`
- `detail-items-table.tsx`
- `stockist-home.tsx`
- `jb-home.tsx`
- `mock-data.ts`
