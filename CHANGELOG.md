# Changelog

All notable changes to the SAPOM (Sales And Production Order Management) prototype will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **[BREAKING]** Renamed all `Order` interfaces to `Request` throughout the codebase to better reflect that these represent requests from cross-divisional staff, not actual orders
- Refactored all model/entity interface declarations into centralized type files under `src/app/types/`
- Updated status "Waiting for Supplier" to "Ordered" across all pages and components
- Modified JB's request page total count to show combined count of "Assigned to JB" and "Ordered" requests

### Added
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
