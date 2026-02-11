# Changelog

All notable changes to the SAPOM (Sales And Production Order Management) prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Order Management System**: Complete workflow for JB users to create and manage orders sent to suppliers
  - Created `src/app/types/order.ts` with comprehensive Order type definitions and OrderStatus enum
  - Created `OrderCard` component for displaying orders with consistent styling matching RequestCard
  - Created `OrderDetails` component for viewing detailed order information with styled items table
  - Updated `src/app/types/index.ts` to export Order types
  - Updated `src/app/types/README.md` with Order type documentation and Request-to-Order workflow
  - Added Order creation functionality in Write Order page that maps orderPcs to pcs field
  - Added Orders page (`jb-order.tsx`) with status tabs: New, In Progress, Completed
  - Added navigation routing for order details view in `App.tsx`
  - Updated Navigation component to use "Orders" label for JB role
  - Added 8+ "Requested to JB" mock requests in `mock-data.ts` for testing Order creation workflow
- **localStorage Refactoring**: Separated storage for Requests and Orders
  - Updated all components to use `localStorage.getItem("requests")` for Request objects
  - Updated all components to use `localStorage.setItem("requests")` for Request storage
  - Reserved `localStorage "orders"` key specifically for Order objects created by JB users
- Updated type exports in `src/app/types/index.ts` to include Order, OrderStatus, and CreateOrderFromRequest

### Changed

- **[BREAKING]** Renamed all `Order` interfaces to `Request` throughout the codebase to better reflect that these represent requests from cross-divisional staff, not actual orders
- **[BREAKING]** localStorage key `"orders"` now stores Order objects (JB-to-supplier orders), while Request objects are stored in `"requests"`
- Refactored all model/entity interface declarations into centralized type files under `src/app/types/`
- Updated status "Waiting for Supplier" to "Ordered" across all pages and components
- Modified JB's request page total count to show combined count of "Assigned to JB" and "Ordered" requests
- Updated Navigation menu item from "Order" to "Orders" for JB role
- Enhanced Write Order page to create Order objects in localStorage when "Create Order" is clicked

### Added (Previous)

- Created `src/app/types/request.ts` with comprehensive type definitions:
  - `DetailBarangItem` - Individual jewelry item specifications
  - `EntityReference` - Reusable type for entities with id/name
  - `Photo` - Photo metadata
  - `Request` - Comprehensive superset interface with all known attributes
  - `MinimalRequest` - Simplified interface for basic use cases
- Created `src/app/types/index.ts` as central export point for all types
- Created `src/app/types/README.md` with comprehensive documentation for type system
- Added JSDoc comments to all interfaces for better IDE support and documentation

### Removed

- Removed "Done" tab from JB's request page
- Removed duplicate interface declarations from individual component files:
  - `jb-requests.tsx`
  - `my-orders.tsx`
  - `request-card.tsx`
  - `write-order.tsx`
  - `verify-stock.tsx`
  - `detail-items-table.tsx`
  - `stockist-home.tsx`
  - `jb-home.tsx`
  - `mock-data.ts`

### Improved

- Better TypeScript type safety with centralized type definitions
- Improved maintainability with single source of truth for data models
- Enhanced IDE autocomplete and IntelliSense support
- More consistent naming conventions throughout the application

## [0.1.0] - Initial Release

### Added

- Initial prototype of SAPOM system
- User authentication and role-based access (Sales, Stockist, JB)
- Request creation and management workflow
- Stock verification functionality
- Request card component with expandable details
- Status tracking and updates
- Mock data generation for testing
