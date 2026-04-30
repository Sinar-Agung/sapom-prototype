# Changelog

All notable changes to the SAPOM (Sales And Production Order Management) prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[Unreleased\]

### Changed

**Order Creation Terminology Updates**

- Updated `order-form.tsx` UI labels and messages from "request" to "order": save button text, confirmation dialogs, toast messages, and comments
- Updated `App.tsx` form titles: "Create Request" → "Create Order", "Edit Request" → "Edit Order", "Create New Request" → "Create New Order"
- Updated `request-form-header.tsx` notes placeholder text to reference "order" instead of "request"
- Renamed notification helper functions for clarity: `notifyRequestCreated` → `notifyOrderCreated`, `notifyRequestUpdated` → `notifyOrderUpdated`
- Updated all function calls and imports across `order-form.tsx`, `request-form.tsx`, and `mock-data.ts` to use the new function names

---

## \[feat/request-order-merge\] — 2026-04-28 (patch)

### Changed

**Code Formatting — Prettier Pass**

- Formatter rewrote single-line ternary expressions and inline array literals into multi-line style across 11 files; no logic or behaviour changed
- Files: `eta-calendar.tsx`, `jb-home.tsx`, `my-requests.tsx`, `order-arrival.tsx`, `order-card.tsx`, `order-details.tsx`, `order-edit-form.tsx`, `request-form.tsx`, `supplier-home.tsx`, `unified-orders.tsx`, `request-number.ts`

---

## \[feat/request-order-merge\] — 2026-04-28

### Changed

**Unified Request + Order Entity Model**

Requests and Orders are now a single entity throughout the entire lifecycle. When Sales (or Sales Internal) creates a "request", it is immediately stored as an `Order` with status `"Open"` — there is no longer a separate `Request` entity or a `"requests"` localStorage key.

**Type System**

- `Order` in `types/order.ts` is the canonical entity class for all lifecycle stages
- `OrderStatus` extended with request-phase values: `"Open"`, `"JB Verifying"`, `"Requested to JB"`, `"Request Expired"`
- `Order` interface extended with request-phase fields: `namaPelanggan?: EntityReference | string`, `timestamp?: number`, `stockistId?: string`; `pabrik` widened to `EntityReference | string`
- `DetailBarangItem` and `EntityReference` moved from `request.ts` into `order.ts` (fixes circular import)
- `types/request.ts` replaced with thin re-export file: `Request = Order`, `RequestRevision = OrderRevision` — all existing code importing `Request` continues to compile without changes
- `types/index.ts` exports updated to reflect the new structure
- Updated: `src/app/types/order.ts`, `src/app/types/request.ts`, `src/app/types/index.ts`

**Storage — Single `"orders"` Key**

- All components and utilities previously reading/writing `localStorage["requests"]` now use `localStorage["orders"]`
- `request-number.ts` generates both `requestNo` and `PONumber` from the unified `"orders"` array
- `mock-data.ts` populates a single `"orders"` store; request-phase and order-phase scenarios are merged into one array (`[...newRequests, ...newOrders]`)
- Updated: `src/app/utils/request-number.ts`, `src/app/utils/mock-data.ts`

**`request-form.tsx` — Creates Orders Directly**

- On submit, builds a full `Order` object (status `"Open"`) with all required fields: `PONumber`, `jbId: ""`, `sales`, `atasNama`, `timestamp`, `createdDate`
- Saves to `localStorage["orders"]`

**`write-order.tsx` — In-Place Update**

- `handleCreateOrderStatus()` no longer creates a new Order entity
- Finds the existing Order by `request.id` in `"orders"`, updates it in-place: sets `jbId = currentUser`, `status = "New Order"`, `waktuKirim`, `detailItems` with order pcs, `atasNama`
- Eliminates entity duplication and the previously dangling `"Ordered"` status on the request

**`order-details.tsx` — `relatedRequest` Simplified**

- `relatedRequest` state is now set directly to the current order (since the order IS the original request)
- Removed the previous `useEffect` that searched `localStorage["requests"]` by `order.requestId`

**`jb-requests.tsx` — Load Filter**

- `loadOrders()` now filters to request-phase statuses only (`["Requested to JB", "Request Expired", "New Order"]`) from the unified `"orders"` store
- `"Ordered"` tab filter updated to `"New Order"` (the status used after JB writes)

**`notification-helper.ts` — `checkAndExpireRequests`**

- Reads exclusively from `"orders"`
- Skips expiry for entries not in request-phase: checks `REQUEST_PHASE_STATUSES` set (`"Open"`, `"JB Verifying"`, `"Requested to JB"`) instead of previously comparing against a separate ordered-ids set from `"orders"`

**`jb-home.tsx` — Status Fixes**

- Completed count filter updated from non-existent `"Done"` / `"Ready Stock Marketing"` / `"Stock Unavailable"` to `"Completed"` / `"Closed"` / `"Confirmed by JB"`
- Added missing `Order` type import

**`eta-calendar.tsx` — Status + Type Fixes**

- `"Ordered"` filter replaced with `"New Order"`
- `pabrik` access updated to handle `string | EntityReference` union safely

**`pabrik` Union Type — Multi-File Fix**

- `order-arrival.tsx`, `order-card.tsx`, `order-details.tsx`, `order-edit-form.tsx`, `unified-orders.tsx`, `supplier-home.tsx`: all `pabrik.name` / `pabrik.id` accesses guarded with `typeof pabrik === 'string'` checks

**`jb-inbound.tsx`**

- Added missing `OrderStatus` import

**Bulk Storage Key Updates (sed)**

- 16 files had `localStorage.getItem("requests")` / `localStorage.setItem("requests", …)` replaced with `"orders"`:
  `App.tsx`, `eta-calendar.tsx`, `jb-requests.tsx`, `my-orders.tsx`, `my-requests.tsx`, `notifications.tsx`, `order-details.tsx`, `order-edit-form.tsx`, `order-form.tsx`, `request-details.tsx`, `sales-home.tsx`, `stockist-home.tsx`, `unified-orders.tsx`, `verify-stock.tsx`

---

### Changed

**`user-data.ts` — Credential Comment Reformatted**

- Credential reference tables in the top-of-file JSDoc comment reformatted for readability: section dividers, aligned columns, passwords grouped at section heading
- Supplier section expanded to document all 70 accounts (10 generic + 60 kadar/branch-restricted sub-accounts) with naming-pattern legend and full lookup grid
- No runtime behaviour changed
- Updated: `src/app/utils/user-data.ts`

---

### Added

**Order Details — Duplicate Button for Sales / Sales Internal**

- Sales and Sales Internal users now see a sticky "Duplicate" action button at the bottom of `OrderDetails`
- `App.tsx` passes `onDuplicate` to `OrderDetails` when the current role is `sales` or `salesInternal`
- `atasNama` restriction removed from `handleDuplicateOrder` in `my-requests.tsx` — atas nama sales can now duplicate orders
- Updated: `order-details.tsx`, `App.tsx`, `my-requests.tsx`

**Order Details — Sales Internal Awareness**

- `OrderDetails` resolves `salesInternal` from `sessionStorage`/`localStorage` and maps it to `"sales"` for all review-gating logic (approve/reject supplier changes)
- Related-request info panel now shows "Sales Int." label and a separate "A/N Sales" row when the request was created by a Sales Internal user; "Atas Nama" / "Customer Name" field label is contextualised to "Customer" for Sales Internal
- Updated: `order-details.tsx`

**Revision Review — Notifications on Approval**

- When a revision is fully approved by both parties, `notifyOrderChangeApproved` is fired from `OrderDetails`
- When Sales submits a revision review (awaiting JB), `notifyPendingJBReview` is sent to JB users
- Updated: `order-details.tsx`, `notification-helper.ts`

**New Notification Event Types**

- `order_unable_to_fulfill` — fired when Supplier marks an order as Unable to Fulfill; renders with red icon and badge in the Notifications page
- `order_pending_jb_review` — fired when Sales submits a revision review that still needs JB approval; renders with orange icon and badge
- Updated: `notification.ts`, `notifications.tsx`, `notification-helper.ts`

**Notifications — Human-Readable Event Labels**

- Explicit label mappings added for `request_created` → "New Request", `order_written` → "Order Created", `order_change_requested` → "Pending Sales Review", `order_pending_jb_review` → "Pending JB Review", `order_change_approved` → "Order Revised", `order_revised` → "Order Revised"
- Updated: `notifications.tsx`

**Notification Helper — Sales-Specific Order Filtering**

- `getNotificationsForUser` now filters out order notifications for sales users whose username matches neither `order.sales` nor `order.assignedSalesUsername`, preventing cross-user order noise
- Updated: `notification-helper.ts`

**Notification Helper — `buildOrderSalesLines` Utility**

- Internal helper `buildOrderSalesLines(order)` generates consistent "Sales Int. / A/N Sales" or "Sales" lines for notification message bodies when the order's sales user is a Sales Internal account
- Updated: `notification-helper.ts`

**Notification Helper — Deduplication**

- `saveNotification` now deduplicates by `(eventType, entityId, triggeredBy)` before prepending the new notification, preventing duplicate entries on repeated actions
- Updated: `notification-helper.ts`

**Write Order — `assignedSalesUsername` Propagated to Order**

- `assignedSalesUsername` from the source request is now copied onto the newly created order in `WriteOrder`, ensuring atas nama sales attribution is preserved through the order lifecycle
- Updated: `write-order.tsx`

**Use Case Diagram — V2 Draw.io**

- `guidelines/use-case-diagram.drawio` added: complete V2 actor-use-case diagram with virtual/composite actor nodes (`All Users`, `Internal Users`, `Sales and AE`, `JB + Supplier`), 56 use cases, colour-coded swim-lane groupings, hierarchy edges, and a legend
- Updated: `guidelines/use-case-diagram.drawio` (new)

### Changed

**Notifications — Removed "Mark All as Read" Button**

- The "Mark all as read" button in the Notifications page toolbar has been removed
- Updated: `notifications.tsx`

**Login — Removed Register Link**

- The "Don't have an account? Register here" link has been removed from the Login form
- Updated: `login.tsx`

**Orders Page — Active Tab & Status Filter Persisted**

- Active tab and status filter selection are now saved to `sessionStorage` and restored on re-mount, matching the existing sort/search persistence behaviour
- Updated: `unified-orders.tsx`

**Request Form — Mixed-Kadar Split Dialog Triggers on Duplicate**

- The mixed-kadar split confirmation dialog now fires for both `create` and `duplicate` modes (previously only on `create`)
- Updated: `request-form.tsx`

**Product Header — Label Shortening**

- "Sales Internal" label shortened to "Sales Int." for compact display
- "Atas Nama Sales" label shortened to "A/N Sales"
- "Customer Name" label shortened to "Customer"
- Status badge now renders via `getStatusLabel()` for human-readable text instead of the raw status value
- Updated: `ui/product-header.tsx`

### Removed

**Write Order — Order-Created Notification Removed**

- `notifyOrderCreated` call removed from `WriteOrder`; order creation no longer fires a standalone notification (downstream events such as `order_written` are handled by the notification helper)
- Updated: `write-order.tsx`

---

### Added

**Sales Internal Role**

- New `salesInternal` account type added — users with this role create requests on behalf of a regular sales person (`assignedSalesUsername`)
- `App.tsx` recognises `salesInternal` throughout: page title, default page routing, navigation fallbacks, and request detail / edit routing
- `App.tsx` shows an indigo `Users` icon for Sales Internal in the role badge
- ETA Calendar now accepts `supplier` as a third role and passes `supplierId` to filter visible orders; edit/cancel/duplicate callbacks are gated by role
- Updated: `App.tsx`, `user-data.ts`, `navigation.tsx`, `my-orders.tsx`

**Request Form — Atas Nama Dropdown for Sales Internal**

- When logged in as Sales Internal, the request form header shows an "Atas Nama" dropdown listing all sales users in the same branch
- Selected `atasNamaUsername` is saved as `assignedSalesUsername` on the request
- Updated: `request-form.tsx`, `request-form-header.tsx`, `request.ts`

**Request Auto-Split — Confirmation Dialog**

- Creating a request with items spanning both Kadar Muda (6k/8k/9k) and Kadar Tua (16k/17k/24k) prompts a confirmation dialog before splitting into two requests
- On confirmation the two requests are saved and a toast is shown; the user is returned to My Requests highlighting the first new request
- `assignedSalesUsername` is propagated to both split requests when set
- Updated: `request-form.tsx`

**Kadar Filter — Orders Page & Notifications Page**

- "All Kadar" multi-select filter added to the Orders page filter bar (visible for JB and Supplier roles)
- Supplier's branch and kadar filters are pre-populated from their `SupplierUser.branches` / `.kadar` attributes on mount
- Same kadar and branch pre-population applied to the Notifications page for supplier accounts
- Notifications page now additionally filters by kadar and branch using maps built from `localStorage` orders/requests
- `applySearchTypeFilter` helper replaced by `applyAllFilters` which includes kadar and branch filters for accurate per-tab badge counts
- Updated: `filter-sort-controls.tsx`, `unified-orders.tsx`, `notifications.tsx`

**Order Card — Image Lightbox**

- Clicking the product thumbnail on an order card opens a full-screen lightbox overlay; a `ZoomIn` hover indicator appears on the image
- "View Full Image" option added to the card's overflow menu
- Updated: `order-card.tsx`

**Product Header — Image Lightbox**

- Clicking the product thumbnail in `ProductHeader` (used in request and order detail views) opens a full-screen lightbox overlay
- Updated: `ui/product-header.tsx`

**Product Header — Atas Nama Sales Row**

- `ProductHeader` accepts `assignedSalesUsername` and `notes` props; the "Sales" label changes to "Sales Internal" when the creator is a Sales Internal user, and a new "Atas Nama Sales" row is shown below it
- Updated: `ui/product-header.tsx`, `request-details.tsx`, `request.ts`, `order.ts`

**Order Details — QR Print Button for Supplier**

- A `Printer` icon button next to the PO Number triggers QR code printing via the new `qr-print.ts` utility (supplier role only)
- Updated: `order-details.tsx`, `qr-print.ts` (new)

**Order Details — Arrival Row Lock / Unlock**

- Arrival items rows that are already fulfilled (received ≥ shipped) are shown as locked with a green quantity; a pencil icon unlocks the field for correction
- A "Match to shipped" (`ChevronsRight`) button appears on unlocked rows to autofill the shipped quantity
- JB cannot record new arrivals on terminal-status orders (Closed, Cancelled, Unable to Fulfill)
- Updated: `order-details.tsx`

**Order Arrival — Confirmation Dialog**

- Clicking "Record Arrival" now opens a confirmation dialog before submitting
- Arrival history cards now show a "Shipment" linked badge with shipped vs received totals; rows with received ≥ shipped are highlighted green
- Updated: `order-arrival.tsx`

**JB Inbound Search — Received Column & Row Lock**

- Inbound search table now shows a "Received" column with colour-coded values (green = fulfilled, red = under-received)
- Fulfilled rows are locked by default with a pencil icon to unlock for correction; the "Match" button is hidden when locked
- Shipments whose parent order is `Closed` are excluded from results
- Inbound search term persists across sessions via `sessionStorage`
- Updated: `jb-inbound-search.tsx`

**JB Inbound — Branch Filtering**

- JB Inbound page now filters orders to the JB user's own branch; tab counts (Waiting / Partial / Delivered) are derived from the branch-filtered set
- Simplified order card markup (removed unused status badge and "View Details" button from waiting/partial/delivered lists)
- Updated: `jb-inbound.tsx`

**Revision History Panel — Deleted Row Display**

- Items present in a previous revision but removed in the current revision are now shown with a red strikethrough in the revision history table
- Updated: `ui/revision-history-panel.tsx`

**Request Details — Rejection Reason Dropdown**

- Stockist rejection dialog now uses a predefined dropdown (Spec not available, Supplier cannot fulfill, Price exceeds budget, ETA too long, Duplicate request, Customer cancelled, Incomplete information, Other) with an "Other" free-text fallback
- Updated: `request-details.tsx`

**User Data — Expanded Supplier & Sales Internal Accounts**

- Added per-branch, per-kadar supplier sub-accounts for SB Gold, CRM, and Lotus Gold (18 new accounts)
- All existing users and the new `SALES_INTERNAL_USERS` list are merged into the unified user directory
- `getUserRole` return type updated to include `"salesInternal"`
- Updated: `user-data.ts`

### Changed

**Status Display — "Ordered" Renamed to "New Order"**

- The status value `"Ordered"` now displays as `"New Order"` everywhere via the new `getStatusLabel()` helper exported from `status-colors.ts`
- `getStatusLabel` is called in: `order-card.tsx`, `order-arrival.tsx`, `order-details.tsx`, `request-details.tsx`, `jb-inbound-search.tsx`
- Updated: `status-colors.ts`, `order-card.tsx`, `order-arrival.tsx`, `order-details.tsx`, `request-details.tsx`, `jb-inbound-search.tsx`

**Order Card — Mobile Product Type Abbreviation**

- On small screens the Jenis Produk label is abbreviated to initials (e.g. "Gelang Kaku" → "G K") to save horizontal space
- Updated: `order-card.tsx`

**Order Card — Product Notes Display**

- If an order has a `notes` field, it is rendered in italics below the product name on the card
- Updated: `order-card.tsx`

**Orders Page — Kadar Filter Applied to Requests Tab**

- Kadar filter now also applies to the requests (Internal) tab in addition to orders
- Kadar and branch option lists are alphabetically sorted
- Updated: `unified-orders.tsx`

**My Orders — Persistent Sort & Filter State**

- Sort field, sort direction, and PO number filter are now persisted to `sessionStorage` and restored on re-mount
- Updated: `my-orders.tsx`

**Notifications — Sort Direction Persisted**

- Notifications page sort direction (asc/desc) is now saved to `sessionStorage` and restored on re-mount
- Updated: `notifications.tsx`

**Notifications — Notes Field Reads from Correct Store**

- "Notes" tooltip on notification cards now correctly reads from `localStorage("requests")` for request notifications and `localStorage("orders")` for order notifications (previously always read from orders)
- Updated: `notifications.tsx`

**Notifications — Product Type Abbreviation on Mobile**

- The "Product Type" change field in notification cards is abbreviated to initials on small screens, matching the order card behaviour
- Updated: `notifications.tsx`

**Request Form — `requestNo` Sequence Strip Trailing Dot**

- Sequence parser in `form-helpers.ts` strips a trailing dot from a parsed part (e.g. `"11."` → `"11"`) to avoid malformed request numbers
- Updated: `request-form/form-helpers.tsx`

**Search Filters — Trim Whitespace Before Matching**

- Text search in Orders page and Notifications page trims whitespace before lowercasing, preventing false negatives from leading/trailing spaces
- Updated: `unified-orders.tsx`, `notifications.tsx`

### Removed

- Deleted `available-pcs-demo.tsx` (unused demo component)
- Deleted `ui/product-details-table.tsx` (replaced by `ProductHeader`)
- Deleted `ui/textarea-with-check.tsx` (unused component)
- Deleted `utils/mock-data-old.ts` and `utils/mock-data.old.bak` (stale backup files)

### Added

**Atas Nama Sales — Full Request Visibility & Read-Only Access**

- Sales users set as `assignedSalesUsername` on a request can now see those requests across all statuses in My Requests, not just their own
- `requestNoFiltered` already filtered correctly; `totalVisibleRequests` counter now also counts `assignedSalesUsername === currentUser` so the request badge is accurate
- `renderOrderCard` detects `isAtasNama` and suppresses Edit, Cancel, and Duplicate buttons — atas nama sales can view only
- Updated: `my-requests.tsx`

**Atas Nama Sales — Full Notification Coverage**

- `getNotificationsForUser` now lets atas nama sales through the sales notification filter by checking `relatedRequest?.assignedSalesUsername === username`, covering all notification types (`request_created`, `request_status_changed`, `request_rejected`, `request_cancelled`, `request_updated`, etc.)
- `notifyRequestCreated`: `assignedSalesUsername` added to `specificTargets` so the atas nama user receives the creation notification
- `notifyRequestStatusChanged`: `assignedSalesUsername` pushed into `specificTargets` for all status transitions, including the special "Ordered" branch which uses its own `salesTargets` array
- Updated: `notification-helper.ts`

**Notifications Page — Filter-Aware Tab Counts & Displaying Label**

- Tab badges (All, Unread, Expiring, Archived) now reflect the count after applying search text and type filter, matching the behaviour of the Orders page
- "Displaying" label in the filter bar now shows the count of items in the current tab after all filters are applied (previously always showed the total unfiltered count)
- Introduced `applySearchTypeFilter` helper to compute per-tab filtered counts without duplicating logic
- Updated: `notifications.tsx`

**Supplier Notes Info Icon in "Your Submitted Changes" Panel**

- The "Change" column in the supplier's "Your Submitted Changes" table now shows a blue `Info` icon when a row has supplier notes attached
- Clicking the icon opens the same tooltip overlay already used in the "Proposed Supplier Change" panel
- Updated: `order-details.tsx`

**Supplier Notes Column Hidden in Request Creation / Edit Form**

- The "Supplier Notes" column is no longer shown in the detail items table when creating or editing a request (only suppliers should see it)
- Added `hideSupplierNotes` prop to `DetailItemsDisplay`; `DetailItemsSection` passes `hideSupplierNotes={!isSupplier}`
- Column header, table cells, `colSpan` adjustment, and mobile card field are all conditionally rendered
- Updated: `detail-items-display.tsx`, `detail-items-section.tsx`

### Changed

**Orders Page — Status / Branch Filter Options Use "All" Tab Dataset**

- Available statuses and branches offered in the filter dropdowns are now derived from the full post-search dataset (`searchFiltered`) rather than the currently active tab
- Items are shown as disabled (not hidden) when not present in the user's data, ensuring consistent option visibility across tab switches
- Updated: `unified-orders.tsx`

**Orders Page — Supplier "Rejected" Tab Removed; Closed Tab Expanded**

- Removed the "Rejected" tab from the supplier's Orders page
- Supplier's "Closed" tab now includes orders with status Closed, Rejected, Cancelled, or Unable to Fulfill
- JB's "Closed" tab now includes Cancelled orders
- Updated: `unified-orders.tsx`

- Shipment IDs now follow `<PONumber>S<Seq>` format (e.g. `SA2504A01S00`, `SA2504A01S01`)
- Arrival IDs now follow `<PONumber>R<Seq>` format (e.g. `SA2504A01R00`), with an independent counter per order
- Sequence is 2-character base-36 (`0–9A–Z`), supporting up to 1296 unique IDs per order
- Arrival card header now displays the full structured ID directly
- Updated: `order-details.tsx`, `jb-inbound-search.tsx`

**Close Order Notification**

- When JB closes an order, a notification is now sent to Sales, all JBs in the same branch, and the Supplier
- Uses existing `notifyOrderClosed` helper; target audience expanded from `["supplier"]` to `["jb", "supplier", "sales"]`
- Updated: `order-details.tsx`, `notification-helper.ts`

**Order Items Table — Visual Status Indicators**

- Shipped column: single green ✓ when Shipped ≥ Ordered
- Received column: single green ✓ when Received ≥ Shipped; double green ✓✓ when Received ≥ Ordered
- Row highlight: `bg-green-50` when Shipped ≥ Ordered; `bg-green-100` when Received ≥ Ordered
- Applied to both the supplier view and the sales/JB view of the Order Items table
- Updated: `order-details.tsx`

### Changed

**Fully Delivered Notification — Body Format Aligned**

- Message body now matches the standard format used by all other order notifications: `Supplier / ETA / Sales / Items`
- Previously was non-standard: `Supplier / Sales / "All items fully delivered"`
- Updated: `notification-helper.ts`

**Supplier Action Buttons — Request Change Hidden After Revision**

The "Request Change" button no longer appears once an order has any revision history

Prevents suppliers from requesting further changes on already-revised orders

Updated: `order-details.tsx`

"Supplier's change" and "Sales's choice" are now two separate columns in the Item Changes table

Sales's choice column shows **✓ Approved** or **✕ Rejected** badge per row while reviewing and after submission

Sales can see their row-level decisions (green/red badges) even after submitting their review (status = "Pending JB Review")

JB sees both the full supplier proposal and Sales's decision for every row

**Supplier Action Buttons — Confirmation Dialogs**

- Clicking Start Production, Mark Stock Ready, Request Change, or Unable to Fulfill now opens a confirmation dialog before executing the action

### Changed

**Revision Review — Status Rename: "Viewed" → "Supplier Viewed"**

- Order status `"Viewed"` renamed to `"Supplier Viewed"` across all components, mock data, and status color mappings
- Updated: `order.ts`, `status-colors.ts`, `mock-data.ts`, `supplier-home.tsx`, `jb-inbound-search.tsx`, `unified-orders.tsx`, `order-details.tsx`

**Revision Review — Sales-Rejected Rows Preserved for JB**

- When Sales rejects a New or Updated row, the row is kept visible for JB with a red strikethrough instead of being silently removed
- Sales-rejected rows show the supplier's proposed values with strikethrough; no accept/reject buttons shown to JB for those rows
- `salesRowDecisions` field added to `OrderRevision` type; populated when Sales submits their revision review

### Changed

**Unified Card Component — OrderCard replaces RequestCard**

- Migrated all views (unified-orders, my-orders, my-requests, jb-requests) to use `OrderCard` exclusively
- `RequestCard` is no longer imported anywhere; `OrderCard` now handles both Request and Order display
- Added `requestToOrder()` adapter function to convert Request data for OrderCard consumption
- OrderCard now includes: Sales name field, Branch display, Rejection reason for rejected items
- Cancel/Edit buttons are now purely status-based (not tab-dependent), ensuring consistent behavior
- Duplicate button now available on all tabs (Internal, Closed) for Sales users
- Added `rejectionReason` field to Order type
- See Details button uses Eye icon; JB gets "Write Order" text variant

### Added

**ETA Calendar View for Sales & JB**

- New `eta-calendar.tsx` component showing a monthly calendar with ETA/expiry date indicators
- Each date cell shows request count (orange badge) and order count (blue badge)
- Clicking a date reveals a detail panel listing all requests/orders with their product names and status
- Sales sees own requests/orders; JB sees all
- Added "Calendar" nav item (CalendarDays icon) to both JB and Sales navigation
- Wired up `eta-calendar` route in `App.tsx`
- Updated: `eta-calendar.tsx` (new), `navigation.tsx`, `App.tsx`

### Changed

**Tabs — Folder-Tab Styling**

- Active tab now renders as a folder tab (white background, rounded top corners, bottom border hidden) instead of a simple underline
- Inactive tabs show subtle hover background
- Updated: `tabs.tsx`

**Notification Cards — Simplified Layout**

- Removed the entire "Changes" section (field diffs and "Days to ETA" countdown) from all notification cards
- Renamed entity label from "Request:" / "Order:" to "PO Number:" for all notification types
- Updated: `notifications.tsx`

**Request Details — Layout Unified with Order Details**

- Switched from 2-column (fields left, image right) to image-left, fields-right layout matching order-details
- Info fields now use `grid-cols-5` colon-separated layout
- Updated: `request-details.tsx`

**Card Layouts — Unified Grid System**

- All card and detail views now use `grid-cols-[minmax(160px,auto)_auto_1fr]` with colon in its own column
- Applied consistently across `order-card.tsx`, `request-card.tsx`, `order-details.tsx`, `request-details.tsx`
- Order cards now show "Updated" relative time above image

**Request Form — UI Improvements**

- Swapped Save/Cancel button order in save confirmation dialog
- Detail item input: added Reset button, fixed textarea borders
- Updated: `request-form.tsx`, `detail-item-input.tsx`, `detail-items-section.tsx`

**Order Edit Form — Button Order Fix**

- Swapped Save/Cancel button order to match other forms
- Updated: `order-edit-form.tsx`

**Theme — Input Border Fix**

- Changed `--input` CSS variable from `transparent` to `#d1d5db` so form input borders are visible
- Updated: `theme.css`

### Fixed

**Notifications —** `**isRefreshing**` **ReferenceError**: Declared missing state variable

- `isRefreshing` was used in JSX and a refresh handler but was never declared via `useState`
- Added `const [isRefreshing, setIsRefreshing] = useState(false)` to the component
- Updated: `notifications.tsx`

### Changed

**Request Details — Header Layout Matches Order Details**: Unified header style across detail pages

- Replaced 2-column grid (info left, image right) with the same layout as `order-details`: image `w-32 h-32` on the left, info grid on the right
- Info fields now use `grid grid-cols-5 gap-x-3` rows with `Label : Value` format, consistent with order-details
- Fields shown: Request No (blue mono), Created, Sales, Branch, Stockist, Customer, Supplier, Expectation, ETA, Status (badge), Updated, Updated By
- Updated: `request-details.tsx`

**unified-orders — "All" Tab Uses OrderCard for Requests**: Consistent card style in all tabs

- For `sales`, `jb`, and `personal` roles in the "All" tab, requests now render as `<OrderCard>` via `requestToOrder()` adapter (matching internal and closed tab behaviour)
- Cancel, Edit, and See Detail callbacks wired per existing role/status rules
- Updated: `unified-orders.tsx`

**unified-orders — "Closed" Tab Uses OrderCard for Rejected/Cancelled/Expired Requests**

- Requests with status `"Rejected"`, `"Cancelled"`, or `"Request Expired"` in the Closed tab render as `<OrderCard>` for `sales` and `jb` roles
- No Cancel or Edit buttons (terminal statuses); only `onSeeDetail` is wired
- Updated: `unified-orders.tsx`

### Changed

**Order Details Page — Fully Merged into Single Card**: Header, Order Items, and Revision History combined

- Header info, Order Items (`DetailItemsTable`), Revision History, and Request Revision History all inside one `<Card className="p-4 mb-4">`
- Each section separated by `border-t pt-4 mt-4` dividers (replaced per-section Cards)
- Supplier Revision Review (Change Pending Approval) remains its own orange-tinted card between header and items
- All action buttons (Supplier: Start Production, Mark Stock Ready, Request Change, Unable to Fulfill, Submit Shipping) moved to **below** the merged card
- Updated: `order-details.tsx`

**OrderCard — Show Items Button Moved to First Position**

- Show Items / Hide Items toggle button is now the leftmost button in the action row
- Previously appeared after Cancel and Edit buttons
- Updated: `order-card.tsx`

**OrderCard — Request No / PO Number Visibility**

- Request No now shown whenever `order.requestNo` is present (removed role + status restriction)
- PO Number continues to show whenever `order.PONumber` is present
- Both fields are purely availability-based; no role or status gating
- Updated: `order-card.tsx`

**unified-orders — Closed Tab Uses OrderCard for Rejected/Cancelled/Expired Requests**

- For `sales` and `jb` roles in the Closed tab, requests with status `"Rejected"`, `"Cancelled"`, or `"Request Expired"` now render as `<OrderCard>` (via `requestToOrder()` adapter) instead of `<RequestCard>`
- No Cancel or Edit buttons shown (terminal statuses); only `onSeeDetail` is wired
- Updated: `unified-orders.tsx`

### Added

**"Ordered" Tab in My Requests**: New tab for Sales and Stockist roles

- Filters requests with status `"Ordered"` into a dedicated tab
- Displays unseen count badge (red) on tab
- Positioned between "Assigned" and "Done" tabs with indigo styling
- Updated: `my-requests.tsx`

**Reusable Product Details Table Components**: New shared table components

- `ProductDetailsTable`: Full-featured table with modes `readonly`, `with-available-pcs`, `with-ordered-pcs`, `with-changes`
- `ProductDetailsTableCompact`: Compact version for nested/inline use (e.g., revision history)
- Supports responsive layout (desktop table ↔ mobile cards), sticky headers, change highlighting, row numbers
- Located: `src/app/components/product-details-table.tsx`

### Changed

**Order Details Page — Combined into Single Card**: Merged four separate cards into one

- Order Information, Order Items, Related Request Details, and Revision History now live inside one `<Card>`
- Sections separated by `border-t` dividers for visual clarity
- Updated: `order-details.tsx`

**Order Details — Order Info Layout**: Aligned info fields to match order-card style

- Replaced `space-y-1` paragraph list with `grid grid-cols-[auto_1fr]` per row
- Labels right-aligned (`justify-self-end pr-1`) with consistent `gap-x-3` to values
- Updated: `order-details.tsx`

**Order Details — Revision History Improvements**:

- Removed "Initial Version" entry — only actual revisions are shown
- Revisions now displayed newest-first (`[...revisionHistory].reverse()`)
- Added **Supplier** and **Customer Name** fields inside each revision entry (after Basic Name / Nama Produk)
- Expand/collapse key changed from array index to `revision.revisionNumber` (stable across reorder)
- Updated: `order-details.tsx`

**Order Details — Request Items Table**: Replaced inline table markup with `ProductDetailsTableCompact`

- Reduced ~170 lines of manual table markup to a single component call
- Updated: `order-details.tsx`

**OrderCard Layout Refactoring**: Consistent info grid layout for My Orders

- Removed date display above product image; image now starts at top
- All info fields (PO Number, Updated, Created, ETA, JB, Sales, Customer Name, Supplier) merged into one `grid grid-cols-1` with `grid-cols-[auto_1fr]` per row
- Labels right-aligned with `justify-self-end` to minimize gap to values (`gap-x-3`)
- Supplier displayed as `Badge` component with pabrik color
- Updated: `order-card.tsx`

**RequestCard Layout Refactoring**: Unified info grid layout for My Requests

- Replaced individual `<p>` tags with `grid grid-cols-[auto_1fr] gap-x-3` layout
- All fields (Request No, Created, Sales, Stockist, Customer Name, Supplier, ETA) in one grid
- Supplier displayed as `Badge` component consistent with order-card
- Updated: `request-card.tsx`

**Order Details — Order Items Table**: Replaced `DetailItemsTable` with `ProductDetailsTable`

- Uses `showCardWrapper={false}` (embedded inside combined card), `showRowNumbers={true}`
- Updated: `order-details.tsx`

### Added

**Order Revision History — Chronological Display**: Latest revision now shown at top, initial version at bottom

- Revision entries rendered in reverse chronological order (newest → oldest)
- Initial Version pinned to bottom using `order-last` CSS class in flex column
- Applied to both Order Revision History and Request Revision History timelines
- "Latest" badge now correctly marks the first rendered entry (most recent)
- Updated: `order-details.tsx`

### Changed

**Change Pending Approval — Supplier Proposed Changes Moved Up**: Proposed changes now displayed immediately after order header

- Supplier Proposed Changes card rendered right after the order info card for faster access
- Order Items table hidden when order status is "Change Pending Approval" (use proposed changes diff instead)
- Approval badges, ETA diff, supplier notes, photo comparison, and item diff tables remain intact
- Updated: `order-details.tsx`

**Revision Approval — Stay on Page After Both Approve**: Users remain on order details after full approval

- Removed auto-redirect (`setTimeout(() => onBack(), 500)`) when both Sales & JB approve
- Success toast still shown; users navigate back on their own
- Updated: `order-details.tsx`

**Tab Configuration — Order Revised Moved to Negotiation Tab**: All users now see "Order Revised" orders under Negotiation

- Moved `"Order Revised"` status from Finalized to Negotiation tab for `sales` role
- Moved `"Order Revised"` status from Finalized to In Negotiation tab for `jb` role
- Supplier role already had `"Order Revised"` in Negotiation (no change needed)
- Updated: `unified-orders.tsx`

### Added

**Dual Approval System for Order Revisions**: Two-stage approval process for order changes

- Added `jbApproved` and `salesApproved` boolean flags to Order type
- Both JB and Sales must approve before status changes to "Order Revised"
- Individual approval tracking: Shows "Waiting for \[JB/Sales\] approval" message
- Full approval: Automatically changes status to "Order Revised" when both approve
- Implemented in: `order.ts`, `order-edit-form.tsx`, `App.tsx`

**Order Revision Navigation Improvements**: Enhanced navigation after supplier change requests

- Supplier automatically returns to "In Review" tab after requesting changes
- Smooth transition from order details back to order list
- Updated: `order-details.tsx`, `App.tsx`

**Visual Indicator for New Detail Items in Revisions**: Red border highlight for newly added items

- New detail items in revision history show red pulsing border and shadow
- CSS classes: `border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50`
- Detects new items by comparing with previous revision's detail items array
- Applied to: `order-details.tsx` revision history table

### Changed

**JB Order Review Permissions**: Restricted JB actions based on order status

- **Change Requested Status**: JB cannot update order (no Update Order button)
- **Revised - Internal Review Status**: JB can only review (approve) - no cancel option
- JB review mode shows only "Back" and "Approve Revision" buttons
- Removed cancel/reject capability for JB role
- Updated: `jb-order.tsx`, `order-edit-form.tsx`, `App.tsx`

**Revision Notes Requirement**: Made revision notes mandatory for order updates

- Revision notes field changed from optional to required
- Added red asterisk (\*) indicator and "Required" label
- Validation prevents submission without notes
- Error toast: "Revision notes are required"
- Updated: `order-edit-form.tsx`

**Order Status Flow**: Standardized status progression for revisions

- All order updates (Supplier/JB) now set status to "Revised - Internal Review"
- Reset approval flags (`jbApproved: false`, `salesApproved: false`) on each revision
- Status changes to "Order Revised" only after dual approval
- Updated: `order-edit-form.tsx`

**Product Detail Styling**: Simplified kadar (karat) display colors

- **Input Detail Barang**: Changed kadar backgrounds (6K-24K) from colored to white with black text
- **Product Details Table**: Removed colored backgrounds for kadar, now white with black text
- Affected kadar values: 6K, 8K, 9K, 16K, 17K, 24K
- Updated: `form-helpers.tsx`, `detail-items-table.tsx`

### Fixed

- **Order Edit Navigation**: Fixed supplier navigation after order updates
  - Supplier now returns to "In Review" tab after submitting changes
  - Proper tab state management for different user roles
  - Updated: `App.tsx`

### Added

**Docker Containerization**: Complete production and development containerization setup

- Created multi-stage `Dockerfile` for optimized production build (~25MB final image)
- Created `Dockerfile.dev` for development environment with hot reload
- Added `docker-compose.yml` with profiles for dev/prod environment separation
- Added `nginx.conf` with SPA routing, gzip compression, caching, and security headers
- Added `.dockerignore` for build context optimization
- Added `.env.example` template for environment configuration
- **Helper Scripts**:
  - `docker.sh`: Linux/Mac helper with 16 commands (build, run, logs, shell, clean, health, status)
  - `docker.bat`: Windows helper with same functionality
  - `Makefile`: Automation targets with colored output and help system
- **Documentation**:
  - `README.Docker.md`: Comprehensive guide (320+ lines) covering quick start, commands, troubleshooting, CI/CD
  - `QUICKSTART.md`: Quick reference guide for getting started in under 5 minutes
- **Features**:
  - Production: nginx:alpine serving optimized build on port 8080
  - Development: Vite dev server with volume mounts on port 5173
  - Health checks for production containers
  - Cross-platform support (Linux/Mac/Windows)
  - CI/CD ready structure

**Order Management Consolidated Tabs**: Standardized tab interface across all user roles

- Consolidated 13 individual status tabs into 6 logical groups matching supplier view
- **Tab Structure** (Sales, JB, Supplier):
  - **All**: Shows all orders with total count
  - **Incoming**: Groups "Incoming", "Approved - Pending SO", "Forwarded to Supplier"
  - **In Review**: Groups "In Review", "Change Requested", "Revised - Internal Review"
  - **Production**: Groups "Order Revised", "Waktu Kirim Confirmed", "Production in Progress", "Production Completed"
  - **Rejected**: Shows rejected orders
  - **Delivered**: Shows delivered orders
- Updated filtered count calculations to group related statuses
- Simplified filter logic using status arrays for each tab
- Applied to: `sales-orders.tsx`, `jb-order.tsx`, `supplier-orders.tsx`
- Badge counts reflect unseen orders in each consolidated group

### Changed

**Supplier Change Request Workflow**: Improved change request handling

- **Supplier**: "Request Change" button now changes status to "Change Requested" without opening form
- **Supplier**: "Update Order" button appears in order list when status is "Change Requested"
- **JB**: "Update Order" button shown based on order status (not tab-based)
- Order status change happens immediately without navigation
- Updated components: `order-details.tsx`, `supplier-orders.tsx`, `jb-order.tsx`, `order-card.tsx`

## \[Unreleased\] – 2026-03-27

### Added

**Unified Order/Request View**: All roles now use a single `UnifiedOrders` component for listing and managing orders and requests, replacing `sales-orders.tsx` and `supplier-orders.tsx`.

- Added `src/app/components/unified-orders.tsx` with role-based tab logic, lazy loading, and interleaved request/order display
- All order and request lists now support search, sort, and infinite scroll
- Tab structure and status grouping are now consistent across roles

### Changed

**Order Status Renaming and Flow**

- Renamed status `New` → `New Order` throughout the codebase
- Renamed `Change Requested` → `Change Pending Approval` for supplier-initiated changes
- Added new status: `Shipping` for supplier-dispatched orders
- Updated status color mapping and tab logic for new statuses
- Updated mock data and migration logic to reflect new statuses

**Mock Data Improvements**

- Mock orders now include revision history and new statuses
- Added `populateMockData()` utility for quickly generating 15 requests and 15 orders with realistic data
- Existing localStorage data is migrated to new status names and structure on load

### Removed

- Deleted legacy `sales-orders.tsx` and `supplier-orders.tsx` components (now replaced by `unified-orders.tsx`)

**Sales Review Mode for Revised Orders**: Enhanced approval workflow with mandatory cancel reason

- Sales users see approve/cancel buttons for "Revised - Internal Review" status
- **Cancel Action** now requires mandatory reason/note via dialog
  - Added cancel dialog with textarea for reason input
  - Validation prevents cancel without reason
  - Reason stored with order when canceled
- **Approve Action** processes revision as before
- Updated `sales-orders.tsx` to show `onReviewRevision` callback for "Revised - Internal Review"
- Updated `order-details.tsx` with Dialog, Label, Textarea components for cancel workflow
- Added state management for `showCancelDialog` and `cancelReason`

### Added

**Order Tabs Translations**: Added i18n support for order filtering tabs

- Added `orderTabs` section to both en.json and id.json locales
- Translations for: All, Incoming, In Review, Production, Rejected, Delivered
- Supports future order filtering functionality

**Sales Question Management System**: Complete question/inquiry management for sales users

- Created new `sales-questions.tsx` component with two-tab interface
- **Pending Questions tab**: Shows unanswered questions with create and edit capabilities
- **Answered Questions tab**: Displays answered questions with timestamps and responses
- Integrated question form (`question-form.tsx`) with edit mode support
- Questions stored in localStorage with unique IDs and timestamps
- Automatic navigation after create/update operations
- Added "Questions" menu item to sales navigation

**Notification Card Enhancements**: Product thumbnails and role-based filtering

- Added product thumbnail images to notification cards (positioned on the left)
- Implemented `getThumbnailImage()` helper function supporting:
  - Basic products: Shows nama basic image from mapping
  - Model products: Shows uploaded product photo via photoId
- Added sales-specific notification filtering: Sales users now only see notifications for requests they created
- Filter implemented in `filterNotificationsByRole()` in notification-helper.ts

**Role-Based Order Update Workflow**: Multi-role approval system for order revisions

- **Supplier/JB Update Flow**:
  - "Request Change" button now navigates to order edit form via `onUpdateOrder` callback
  - Can edit product images (change/delete), product details, and ETA (waktuKirim)
  - Submit changes → Status set to "Revised - Internal Review"
  - Notifications sent to JB and Sales for review
- **Sales Review Flow**:
  - Views order updates in read-only mode
  - Cannot edit images, details, or ETA (all editing UI hidden)
  - Can only Approve or Reject changes
  - Mandatory cancellation reason required when rejecting
  - Approve → Status set to "Order Revised"
  - Reject → Status set to "Rejected" with reason stored
- **Implementation Details**:
  - Added `userRole` prop to OrderEditForm for permission control
  - Added `onUpdateOrder` callback chain: App → SupplierOrders → OrderDetails
  - Conditional rendering for ETA field (editable Input vs read-only text)
  - Conditional action buttons based on role (Edit/Submit vs Approve/Reject)
  - Sales review interface with cancel reason textarea and action buttons
- **DetailItemsDisplay Component Updates**:
  - Made `onEdit` and `onDelete` props optional
  - Conditionally hides action buttons and "Aksi" column when props undefined
  - Supports read-only view for sales role (no edit/delete capability on detail items)

**Request Cards "New" Badge System**: Visual indicators for unseen requests with mark-as-viewed tracking

- Added animated "New" badge to request cards (matching order cards pattern)
- Badge appears for requests not yet viewed by current user
- Added `viewedBy` property to Request type for tracking viewed status
- Implemented mark-as-viewed functionality across all request views:
  - **Sales**: Badge removed on show items, see details, or duplicate actions
  - **Stockist**: Badge removed on verify stock, show items, or see details actions
  - **JB**: Badge removed on show items or see details actions
- Red badge counters on all tabs now reflect actual unseen request counts
- Badge counts dynamically update when requests are marked as viewed
- Applied to my-requests.tsx (Sales & Stockist) and jb-requests.tsx (JB) components

**Project Documentation**:

- Created comprehensive project lifecycle breakdown document (PROJECT_BREAKDOWN.csv)
- Created Indonesian version of project breakdown (PROJECT_BREAKDOWN_ID.csv)
- Documented 432 tasks across all SDLC phases:
  - Design phase (71 tasks, ~450 hours)
  - Development phase (175 tasks, ~850 hours)
  - Testing phase (101 tasks, ~500 hours)
  - Bug Fix phase (11 batches, ~216 hours)
  - UAT phase (30 tasks, ~228 hours)
  - Deployment phase (44 tasks, ~300+ hours)
- Each task includes: ID, name, description, dependencies, estimated hours, user role, priority, and status
- Organized by Phase > Category > Module hierarchy
- Reflects current implementation status (frontend mostly completed, backend not started)

Standardized notification message format across all notification types

Supplier now receives their own order change request notifications

Sales users now receive order created notifications with standardized format

### Fixed

**Request Form Validation**:

- Fixed request form validation logic for Basic vs Model products
- Corrected `isFormValid` calculation to properly check jenisProduk for Basic products
- Fixed `isSubmitButtonDisabled` logic to match validation requirements
- Basic products now correctly require: kategoriBarang, jenisProduk, and namaBasic
- Model products now correctly require: kategoriBarang and fotoBarang (namaProduk optional)

**Verify Stock Page**:

- Available PCs now correctly load previously saved draft values from localStorage
- Fixed stuck "Saving changes..." toast that persisted after navigation
- Changed references from `order` to `request` for consistency

**Notifications**:

- Fixed `formatDate is not defined` error in order creation notifications
- Added missing formatDate helper function in notifyOrderCreated
- Removed unused creatorName variable

**Notification Messages**:

- Order Created notifications now show standardized fields for all users (JB, supplier, sales):
  - Supplier name
  - ETA date
  - Sales person
  - Item count
- Supplier receives notification when they request order changes (same as JB)

### Changed

**Navigation**:

- Temporarily disabled "Questions/Inquiry" navigation items for Sales and Stockist roles
- Navigation items commented out pending feature completion
- Updated English locale terminology from "Questions" to "Inquiry"

**Profile Icon**:

- Reduced default size to icon-only mode (16px when collapsed, 24px when expanded)
- Icon no longer blocks UI elements underneath
- Removed `md:block` to ensure icon-only behavior on all devices by default
- Users can click to expand for full profile information

**Notification Title Format**:

- Standardized all notification titles to: "Product Name" or "Product Name for Customer"
- Conditionally shows customer name only when it exists
- Removed redundant prefixes from titles (e.g., "Order Change Requested:")
- Applied to 15+ notification types across the system

**Detail Barang Table Styling**:

- Kadar column: Background color now fills entire cell (not just badge)
- Warna column: Background color now fills entire cell (not just badge)
- Matches styling consistency with Input Detail Barang & Order Items tables

### Refactored

- **Request Component Naming and Structure**: Major refactoring to improve code clarity and eliminate duplication
  - **Renamed Order → Request in Request-related code**:
    - Renamed folder: `order-form/` → `request-form/`
    - Renamed files: `order-form.tsx` → `request-form.tsx`, `order-form-header.tsx` → `request-form-header.tsx`
    - Renamed components: `OrderForm` → `RequestForm`, `OrderFormHeader` → `RequestFormHeader`
    - Updated props: `order: Request` → `request: Request` throughout Request-handling components
    - Updated callback names: `onVerifyStock` → `onViewRequestDetails` for clarity
    - Fixed all property accesses in `request-details.tsx` and `write-order.tsx`
  - **Consolidated Request Detail pages**:
    - Renamed: `verify-stock.tsx` → `request-details.tsx`
    - Renamed components: `VerifyStock` → `RequestDetails`, `VerifyStockProps` → `RequestDetailsProps`
    - Updated page route: `"verify-stock"` → `"request-details"`
    - Single file now serves all three roles (JB, Stockist, Sales) using mode prop
  - **Created shared detail items component**:
    - New `DetailItemsTable` component (`ui/detail-items-table.tsx`, 237 lines)
    - Supports two modes: `"readonly"` and `"with-available-pcs"`
    - Handles both desktop table and mobile card views internally
    - Integrated into `request-details.tsx` (replaced ~190 lines of inline code)
    - Integrated into `order-details.tsx` for "Order Items" section (replaced ~45 lines)
    - Eliminated significant code duplication while maintaining all functionality
    - Preserves color coding, responsive design, and different display modes

### Fixed

- **Order Form Mobile View**: Fixed title visibility issue in collapsible "Input Detail Barang" form
  - Title and chevron icon now remain visible when form is collapsed on mobile
  - Removed conditional hiding from wrapper div to ensure header is always accessible
  - Internal collapsible div handles form field visibility independently

### Changed

- **Notification System**: Improved notification organization and filtering
  - Expiring request notifications now only appear in "Expiring Requests" tab (excluded from "Unread" tab)
  - Updated unread filter to exclude `request_expiring` event type for cleaner notification separation
  - Unread count badge now accurately reflects only non-expiring unread notifications

### Added

- **Notification Archives**: Automatic archiving system for old notifications
  - Added "Archived" tab to notifications page for notifications older than 30 days
  - Archive icon imported from lucide-react for visual consistency
  - Archived notifications display with muted gray styling (opacity-75, gray borders)
  - Automatic 30-day threshold filter separates active from archived notifications
  - Archived count badge shows number of archived notifications
  - All non-archived tabs (All, Unread, Expiring) automatically exclude archived notifications

### Added - Internationalization (i18n) Support

#### Core Infrastructure

**i18n Configuration** (`src/i18n.ts`)

- Integrated `i18next` and `react-i18next` libraries (v25.8.13 and v16.5.4)
- Implemented language detection and persistence via localStorage
- Configured English (en) and Indonesian (id) language support
- Added automatic language initialization on app startup

**Translation Files** (`src/locales/`)

- Created comprehensive English translation file (`en.json`) with 180+ translation keys
- Created comprehensive Indonesian translation file (`id.json`) with matching coverage
- Organized translations into logical sections: common, auth, navigation, settings, order, form, dialog, sortOptions, tabs, action, status, productType, color, size, customerExpectation

#### User Type System

- **User Data Types** (`src/app/utils/user-data.ts`)
  - Added `LanguageCode` type definition ('en' | 'id')
  - Extended all user interfaces (`SalesUser`, `StockistUser`, `JBUser`, `SupplierUser`) with optional `language` property

#### Language Management

**Main Application** (`src/app/App.tsx`)

- Added language state management with localStorage persistence
- Implemented `handleLanguageChange` function for app-wide language updates
- Modified `handleLogin` to load user's saved language preference automatically
- Updated user profile storage to include language preference

**Settings Component** (`src/app/components/settings.tsx`)

- Added language preference selector with dropdown UI
- Integrated Languages icon from Lucide React
- Implemented real-time language switching without page reload
- Internationalized all settings page content

#### Internationalized Components

- **Navigation Component** - All menu labels translate dynamically based on user role
- **Login Component** - Form labels, placeholders, error messages fully translated
- **My Orders/Requests Component** - Page titles, tab labels, empty states, sort options
- **Other Pages** - JB Requests, JB Orders, Sales Orders, Supplier Orders, Notifications
- **Cards** - Request cards and Order cards with translated labels and actions
- **Forms** - Order forms, edit forms, detail inputs with internationalized fields
- **Dialogs** - Verify Stock, Write Order, Order Details with translated content

#### Language Persistence Strategy

- Language preference stored in three locations:
  1.  `localStorage` with key `userLanguage` (immediate access)
  2.  User profile object in session storage (session persistence)
  3.  User data structure (long-term storage)

#### Supported Languages

- **English (en)** - Default language
- **Indonesian (id)** - Full translation coverage (180+ keys)

#### Dependencies

- Installed `i18next@25.8.13`
- Installed `react-i18next@16.5.4`

### Changed

- **Order Status Refactoring**: Updated order status names and workflow throughout the application
  - Renamed "Revision Confirmed" to "Order Revised" across all components
  - "Order Revised" now represents sales-approved revisions (previously "Revision Confirmed")
  - Updated status references in order.ts, sales-orders.tsx, jb-order.tsx, supplier-orders.tsx
- **Tab Organization**: Restructured order tabs for better workflow visibility
  - Added "All" tab at the beginning of all order pages (JB, Sales, Supplier)
  - Reordered tabs to follow logical workflow: All → New → Viewed → Change Requested → Revised - Internal Review → Order Revised → Stock Ready → In Production → Unable to Fulfill → Cancelled
  - Updated default active tab to "All" for all order pages
  - All tab displays all orders regardless of status
- **Sales Order Workflow**: Updated action terminology and behavior
  - Changed action buttons from "Confirm/Reject" to "Approve/Cancel Order"
  - Updated dialog titles and messages to match new terminology
  - "Approve" action changes order status to "Order Revised"
  - "Cancel Order" action adds order to "Rejected" status with required reason
  - Sales can only view orders from their own requests (matching sales attribute)
  - Sales can view order details page with Approve/Cancel Order action buttons

### Added

**Order Status Refactoring**: Updated order status names throughout the application for improved clarity

- Renamed "Request Change" to "Change Requested" across all components
- Renamed "Order Revised" to "Revised - Internal Review" to reflect sales review workflow
- Updated status references in 10 files: order.ts, jb-order.tsx, sales-orders.tsx, order-card.tsx, order-details.tsx, supplier-orders.tsx, order-edit-form.tsx, notification-helper.ts, supplier-home.tsx, mock-data.ts
- Updated tab names, filters, counts, and color coding to match new status names

**Sales Order Review Workflow**: Implemented comprehensive review process for revised orders

- Added three new statuses: "Revised - Internal Review", "Order Revised", "Rejected"
- Sales can now review revised orders with Approve/Cancel Order actions
- Added confirmation dialog with reason input (required for cancellation, optional for approval)
- New tabs in Sales Orders page: "All", "Revised - Internal Review", "Order Revised", "Rejected"
- Sales users can only see orders where their username matches the order's sales attribute
- Clicking on orders navigates to detailed Order Details page for review

**Mock Notification Data**: Comprehensive mock notifications for testing the notification system

- Added 50 total mock notifications (28 request-type, 22 order-type)
- Request notifications cover complete workflow: creation → viewing → approval/rejection → conversion to order
- Order notifications track: creation → supplier viewing → updates/revisions → status changes → delivery
- Notifications include proper timestamps, user attribution, target audiences, and metadata
- All notifications consistent with existing mock orders and requests data
- Added `generateMockNotifications()` function to create realistic notification data
- Added `initializeMockNotifications()` function to initialize notifications in localStorage
- Added `resetMockNotifications()` function to reset notification data
- Integrated notification initialization in App.tsx on startup

Notification system for when sales update or cancel a request, with role-based targeting for stockists, sales, and JB users.

Personalized notification messages: when the subject is the current user, the notification card says "You request/order XXXX ..." for all event types.

Notification for stockist status updates: Stock Unavailable, Ready Stock Marketing, and Assigned to JB, with correct audience targeting.

Visual color coding for notification types (created, updated, cancelled, status changed, etc).

### Fixed

- Stockists now always receive cancellation and status change notifications, even if the request is no longer Open.
- All notification cards now consistently show personalized "You ..." messages for the acting user.

### Changed

- Improved notification filtering logic for stockists to always show important status changes.
- Generalized notification message override for all event types.

---

## \[0.5.2\] - 2026-02-13

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

## \[0.5.1\] - 2026-02-13

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

## \[0.5.0\] - 2026-02-13

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

## \[0.4.0\] - 2026-02-13

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

## \[0.3.0\] - 2026-02-11

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

## \[0.2.0\] - 2026-02-11

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
- **\[BREAKING\]** Renamed all `Order` interfaces to `Request` throughout the codebase to better reflect that these represent requests from cross-divisional staff, not actual orders
- **\[BREAKING\]** localStorage key `"orders"` now stores Order objects (JB-to-supplier orders), while Request objects are stored in `"requests"`
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

## \[0.1.0\] - Initial Release

### Added

- Initial prototype of SAPOM system
- User authentication and role-based access (Sales, Stockist, JB)
- Request creation and management workflow
- Stock verification functionality
- Request card component with expandable details
- Status tracking and updates
- Mock data generation for testing
