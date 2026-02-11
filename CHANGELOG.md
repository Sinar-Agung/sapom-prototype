# Changelog

All notable changes to the SAPOM (Sales And Production Order Management) prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-02-11

### Added

- **Supplier Portal System**: Complete portal for external supplier users to manage orders
  - Created `SupplierUser` interface with `supplierId`, `supplierName`, and `branchCode: null`
  - Added 10 supplier users with 2-character username initials: kh, ub, le, yt, mt, hw, ay, sa, se, lo
  - Supplier IDs match mock data suppliers: king-halim, ubs-gold, lestari-gold, yt-gold, mt-gold, hwt, ayu, sb-gold, crm, lts-gold
  - All supplier users use password "123" for easy testing
  - Created `SupplierHome` component with comprehensive dashboard:
    - Statistics cards showing new orders, in-progress orders, and completed orders counts
    - Quick action buttons for navigation
    - Recent orders list (5 most recent) with PO numbers and status badges
    - Automatic filtering to show only orders assigned to logged-in supplier's factory
  - Created `SupplierOrders` component with full order management workflow:
    - Three status tabs: New, In Progress, Completed with order counts
    - Order cards with product images, PO numbers, dates, and item counts
    - Status update buttons with workflow: New → Viewed by Supplier → Confirmed → In Production → Ready for Pickup → Completed
    - Order filtering by supplier ID (pabrik.id matching)
    - View Details button integration for detailed order viewing
  - Updated `App.tsx` to support supplier role:
    - Added "supplier" to userRole type union
    - Default page for suppliers set to "home" (not form input)
    - Added SupplierHome and SupplierOrders route handling
    - Browser title updates to "SAPOM (Supplier)" for supplier users
  - Updated `Navigation` component to include supplier navigation items (Home, Orders, Settings)
  - Updated login credentials documentation with all 10 supplier users and their supplier IDs
- **User Profile Session Storage**: Enhanced authentication to store complete user profiles
  - Modified `handleLogin` in App.tsx to store full user object as JSON in sessionStorage/localStorage
  - Added `userProfile` key to both sessionStorage and localStorage based on "Remember Me" option
  - Updated `handleLogout` to clear userProfile from both storage locations
  - Enhanced `getCurrentUserDetails()` helper to prioritize reading from stored profile with username lookup fallback
  - Updated `getSupplierId()` in supplier components to use stored userProfile for reliable supplier ID retrieval
- **Mock Data Updates**: Expanded supplier data for comprehensive testing
  - Added 3 new suppliers to suppliers constant: Lotus Gold (lts-gold), SB Gold (sb-gold), CRM (crm)
  - Total of 10 suppliers matching the 10 supplier user accounts
  - Updated supplier user data to match exact supplier IDs from mock-data.ts

### Changed

- **Supplier Order Storage**: Corrected localStorage key usage for supplier components
  - Updated supplier-home.tsx to read from `localStorage "orders"` (Order objects) instead of "requests"
  - Updated supplier-orders.tsx to read/write from `localStorage "orders"` for proper Order object handling
  - Added debug logging to supplier-orders.tsx for troubleshooting order filtering
- **User Data Management**: Refined supplier ID extraction
  - Enhanced `getSupplierId()` function with userProfile priority check and userDatabase fallback
  - Added error handling for JSON parsing failures in user profile retrieval

### Fixed

- Order filtering for suppliers now correctly reads from "orders" localStorage key where Order objects are stored
- Supplier authentication properly stores and retrieves supplierId for order filtering

## [0.2.0] - 2026-02-11

### Added

- **Branch Code System**: Added branch/location assignment for all users
  - Created `BranchCode` type with three possible values: 'JKT' (Jakarta), 'BDG' (Bandung), 'SBY' (Surabaya)
  - Added `branchCode` field to `SalesUser`, `StockistUser`, and `JBUser` interfaces
  - Updated all mock user data with branch assignments distributed across three locations
  - Added helper functions: `getBranchName()` and `getUsersByBranch()`
  - Updated login credentials documentation to show branch assignments
- **Purchase Order (PO) Number System**: Automatic generation of standardized PO numbers for orders
  - Added `PONumber` field to Order interface with format: SA{BranchCode}{SupplierInitials}{YYYYMMDD}{SequentialNumber}
  - Branch codes: A=Jakarta (JKT), B=Bandung (BDG), C=Surabaya (SBY)
  - Implemented PO number generation in Write Order component with daily sequential counter
  - Daily counter stored in localStorage with automatic reset per date
  - Supplier initials extracted from first 2 characters of pabrik name
  - Added PO number display in OrderCard component with blue styling
  - Added PO number display in OrderDetails component (header and info section)
- **Collapsible Request Details Panel**: Enhanced Order Details page with related request information
  - Added collapsible panel showing full details of the original request that led to the order
  - Panel displays request metadata in 2-column grid (Request No, Created, Sales, Stockist, Atas Nama, Customer Expectation, Status, Updated info)
  - Includes complete request items table with all columns (Kadar, Warna, Ukuran, Berat, Pcs, Available Pcs)
  - Panel defaults to collapsed state with ChevronDown/Up toggle icons
  - Loads related request data from localStorage using order.requestId
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

- **Time Format Standardization**: Updated all time displays across the application to use HH:mm:ss format
  - Updated `formatTimestampWithTime()` in RequestCard component to use manual time formatting
  - Updated `formatTimestampWithTime()` in OrderCard component to use manual time formatting
  - Updated `formatTimestampWithTime()` in VerifyStock component to use manual time formatting
  - Updated `formatTimestampWithTime()` in MyOrders component to use manual time formatting
  - Updated `formatTimestampWithTime()` in OrderDetails component to use manual time formatting
  - Replaced `toLocaleTimeString()` with manual `padStart(2, "0")` formatting for consistency across locales
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
