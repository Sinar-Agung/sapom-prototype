# Changelog

All notable changes to the SAPOM (Sales And Production Order Management) prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Order Status Refactoring**: Updated order status names throughout the application for improved clarity
  - Renamed "Request Change" to "Change Requested" across all components
  - Renamed "Order Revised" to "Revised - Internal Review" to reflect sales review workflow
  - Updated status references in 10 files: order.ts, jb-order.tsx, sales-orders.tsx, order-card.tsx, order-details.tsx, supplier-orders.tsx, order-edit-form.tsx, notification-helper.ts, supplier-home.tsx, mock-data.ts
  - Updated tab names, filters, counts, and color coding to match new status names
- **Sales Order Review Workflow**: Implemented comprehensive review process for revised orders
  - Added three new statuses: "Revised - Internal Review", "Revision Confirmed", "Rejected"
  - Sales can now review revised orders with Confirm/Reject actions
  - Added confirmation dialog with reason input (required for rejection, optional for confirmation)
  - New tabs in Sales Orders page: "Revised - Internal Review", "Revision Confirmed", "Rejected"
  - Sales users can only see orders where their username matches the order's sales attribute
  - Clicking on orders navigates to detailed Order Details page for review

### Added

- **Mock Notification Data**: Comprehensive mock notifications for testing the notification system
  - Added 50 total mock notifications (28 request-type, 22 order-type)
  - Request notifications cover complete workflow: creation → viewing → approval/rejection → conversion to order
  - Order notifications track: creation → supplier viewing → updates/revisions → status changes → delivery
  - Notifications include proper timestamps, user attribution, target audiences, and metadata
  - All notifications consistent with existing mock orders and requests data
  - Added `generateMockNotifications()` function to create realistic notification data
  - Added `initializeMockNotifications()` function to initialize notifications in localStorage
  - Added `resetMockNotifications()` function to reset notification data
  - Integrated notification initialization in App.tsx on startup
- Notification system for when sales update or cancel a request, with role-based targeting for stockists, sales, and JB users.
- Personalized notification messages: when the subject is the current user, the notification card says "You <action> request/order XXXX ..." for all event types.
- Notification for stockist status updates: Stock Unavailable, Ready Stock Marketing, and Assigned to JB, with correct audience targeting.
- Visual color coding for notification types (created, updated, cancelled, status changed, etc).

### Fixed

- Stockists now always receive cancellation and status change notifications, even if the request is no longer Open.
- All notification cards now consistently show personalized "You <action> ..." messages for the acting user.

### Changed

- Improved notification filtering logic for stockists to always show important status changes.
- Generalized notification message override for all event types.

---

## [0.5.2] - 2026-02-13

### Fixed

- **Inbound Order Status Flow**: Corrected order status management in delivery workflow
  - Orders now remain in "Stock Ready" or "In Production" status when deliveries are recorded
  - Delivery progress (waiting/partially delivered/fully delivered) is calculated dynamically based on arrival records
  - Orders stay visible in their respective delivery status tabs (Waiting/Partially Delivered/Fully Delivered)
  - Order status only changes to "Confirmed by JB" when JB explicitly closes the order via "Close Order" button
  - Previously: Order status was automatically changed to "Fully Delivered" or "Partially Delivered" on arrival submission, making orders disappear from tabs
  - Added support for legacy orders with "Partially Delivered" or "Fully Delivered" statuses to maintain backward compatibility

### Changed

- **JB Inbound Component**: Refactored delivery status handling
  - Removed automatic status updates in `handleSubmitArrival` function
  - Simplified order state management - delivery status is now view-only calculation
  - Added legacy status support in filtering and count calculations
  - Orders can only change status through explicit JB action (closing order)

### Technical Improvements

- Cleaner separation of concerns: delivery tracking vs order lifecycle status
- More predictable order flow aligned with business requirements
- Reduced state mutations improving data consistency

## [0.5.1] - 2026-02-13

### Added

- **Drag-to-Scroll Functionality for Tabs**: Interactive drag navigation for tab lists
  - Click and drag horizontally across tabs to scroll left and right
  - Smart drag detection with 5px movement threshold to distinguish between clicks and drags
  - Visual cursor feedback: `cursor-grab` when idle, `cursor-grabbing` while dragging
  - Prevents accidental tab changes during scroll operations
  - 2x scroll speed multiplier for smooth, responsive movement
  - Text selection disabled (`select-none`) during drag to prevent highlighting
  - Mouse leave handling to properly end drag operations when cursor exits tab area
  - Applied to all pages with scrollable tabs: JB Orders, Supplier Orders, JB Inbound, JB Requests

### Changed

- **TabsList Component Interaction Model**: Enhanced user experience
  - Added state tracking for drag operations (isDragging, startX, scrollLeft)
  - Implemented draggedRef to differentiate between clicks and drags
  - Click events prevented when user drags more than threshold distance
  - Maintains all existing auto-centering and scrolling functionality

### Technical Improvements

- Fully self-contained drag logic within TabsList component
- No external dependencies or configuration required
- Works seamlessly with existing auto-centering behavior
- Mobile-friendly interaction pattern

## [0.5.0] - 2026-02-13

### Added

- **Scrollable Tabs with Auto-Centering**: Enhanced tab navigation across all list pages
  - TabsList component (`ui/tabs.tsx`) now supports horizontal scrolling with hidden scrollbar
  - Active tab automatically centers itself when selected for better visibility
  - Auto-centering logic is self-contained within TabsList component using `useEffect` and `useRef`
  - TabsTrigger components now include `data-state` attribute ("active" or "inactive") for query selection
  - Applied to: JB Orders, Supplier Orders, JB Inbound, and JB Requests pages
  - Cursor changes to grab icon to indicate draggable/scrollable behavior
  - Smooth scroll animation when tab becomes active
  - Works with any number of tabs without layout breaking
  - Responsive behavior ensures active tab is always visible

### Changed

- **TabsList Component Architecture**: Refactored for better encapsulation
  - Added context awareness to TabsList to monitor active tab value
  - Scrolling behavior is now declarative and reactive to tab changes
  - Auto-centering triggers on any tab change (click, keyboard, programmatic)
  - Removed grid-based layout in favor of flexible scrollable container
  - Added `data-state` attribute to TabsTrigger for better state management
  - Component is now fully self-contained with no external dependencies for centering logic

### Technical Improvements

- Clean separation of concerns: UI behavior lives in UI component
- Declarative pattern: "when tab changes, center it" vs imperative click handlers
- Works universally across all tab usage without duplication
- Improved maintainability with single source of truth

## [0.4.0] - 2026-02-13

### Added

- **Order Update Workflow**: Complete order revision system with change tracking
  - Created `OrderEditForm` component for JB users to modify existing orders
  - Added `OrderRevision` interface to track all changes with timestamps and user info
  - Order revisions store both new values and previous values for full audit trail
  - Added "Update Order" button in OrderCard for orders with "Request Change" status
  - Integrated update workflow in App.tsx with proper routing and state management
  - Orders automatically revert to "Viewed" status after update submission
- **Supplier Order Management Enhancements**: Improved supplier workflow and status handling
  - Updated OrderStatus type to reflect supplier workflow: New → Viewed → Request Change / Stock Ready / Unable to Fulfill
  - Removed old statuses: "Viewed by Supplier", "Confirmed", "In Production", "Ready for Pickup"
  - Added action buttons in SupplierOrders for status updates: Mark Stock Ready, Request Change, Unable to Fulfill
  - Supplier order details page auto-updates status to "Viewed" when opened from "New" status
  - Updated SupplierHome dashboard to show correct counts based on new status workflow
- **Revision History Display**: Complete order change tracking for JB users
  - Added collapsible Revision History panel in OrderDetails component
  - Shows complete order state at each revision with all field changes
  - Displays initial version with first revision's previous values
  - Each revision shows changed fields side-by-side with product images
  - Detail items table included in each revision for complete transparency
  - Only visible to non-supplier users (hidden from supplier view)
- **Enhanced Filtering and Sorting**: Advanced list management for Requests and Orders
  - JB Requests page:
    - Added Request No filter input with clear (X) button
    - Sort dropdown with 8 criteria: Updated Date, Created Date, ETA, Product Name, Sales, Atas Nama, Pabrik, Request No
    - Ascending/Descending toggle button with arrow icons
    - Filter input width: w-52, sort dropdown width: w-48
    - Dynamic tab counts update based on filtered results
    - Filter and sort controls right-aligned with 6-gap spacing
  - Supplier Orders page:
    - Added Order No filter input with clear (X) button
    - Same 8 sort criteria (with Order No instead of Request No)
    - Ascending/Descending toggle with visual arrow indicators
    - Same layout and styling as JB Requests for consistency
    - Tab counts dynamically reflect filtered results
- **Auto-Refresh Functionality**: Real-time data synchronization across pages
  - Added window focus event listeners to reload data when returning from other pages
  - Added document visibility change listeners for tab switching
  - Implemented in: jb-requests, jb-order, my-orders, supplier-orders
  - Ensures data stays current when navigating between order details and lists
- **Image Storage System Enhancements**: Improved photo management across orders
  - Extended image-storage.ts usage to all order-related components
  - OrderDetails displays latest photo via photoId with getImage()
  - OrderCard shows order photos via photoId with NAMA_BASIC_IMAGES fallback
  - SupplierOrders retrieves photos using getImage(order.photoId)
  - StockistHome updated to use photoId instead of fotoBarangBase64
  - VerifyStock component updated to use photoId for image display
- **JB Order Management Improvements**: Enhanced order tracking and status workflow
  - Updated JB Orders page tabs to match supplier workflow: New, Viewed, Request Change, Stock Ready, Unable to Fulfill
  - Removed old tabs: In Progress, Completed
  - Added grid layout for 5 tabs (grid-cols-5) for better visual balance
  - Updated status badge colors to match new workflow
  - Order cards show JB full name instead of username
  - Orders page supports initialTab prop for returning to correct tab after detail view
- **UI/UX Refinements**: Polished user interface across multiple pages
  - Total request/order count moved below title on left side, parallel with filter controls
  - Sort direction icons swap correctly: arrow down for descending, arrow up for ascending
  - Sort by label without colon for cleaner appearance
  - Filter placeholder fully visible with adjusted input width
  - Consistent spacing and alignment across all list pages

### Changed

- **Order Type Definition Updates**: Streamlined order structure and removed deprecated fields
  - Removed `fotoBarangBase64` field from Order interface completely
  - Removed `fotoBarangBase64` from CreateOrderFromRequest interface
  - All orders now use `photoId` exclusively for image references
  - OrderRevision now tracks photoId changes in revision history
- **Status Workflow Simplification**: Clearer supplier order lifecycle
  - Replaced complex multi-stage workflow with simpler 3-outcome model
  - Supplier can now: view order → mark stock ready OR request changes OR mark unable to fulfill
  - Removed intermediate "Confirmed" and "In Production" statuses
  - Order updates from JB trigger status change back to "Viewed"
- **Component Refactoring**: Improved code organization and reusability
  - OrderCard now accepts `onUpdateOrder` callback for update button functionality
  - OrderDetails enhanced with revision history state management and display logic
  - App.tsx routing updated to handle order-edit page with proper back navigation
  - Added Factory icon import for supplier role indicator

### Fixed

- Missing getImage import in verify-stock component causing undefined function errors
- Image display issues in order cards now properly show photoId-based images
- Tab counts in JB Requests now correctly show filtered counts instead of total counts
- Sort direction indicator now matches actual sort direction (arrow down = descending, arrow up = ascending)
- Filter box width increased to show full placeholder text "Filter by Request No..."
- Order status colors updated throughout supplier components for consistency

### Removed

- Removed all references to `fotoBarangBase64` from Order type definitions
- Removed old supplier order statuses: "Viewed by Supplier", "Confirmed", "In Production", "Ready for Pickup"
- Removed In Progress and Completed tabs from JB Orders page

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
