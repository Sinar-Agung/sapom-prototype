# API Integration Guide

This directory contains the API client and service layer for the SAPOM application.

## Project Structure

```
src/api/
├── client.ts          # Base HTTP client for all API requests
├── auth.ts            # Authentication endpoints and functions
├── auth-hybrid.ts     # Hybrid auth (API + mock fallback)
└── README.md          # This file
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Enable mock mode (set to true to use mock data instead of API)
VITE_ENABLE_MOCK_MODE=true
```

#### Configuration Options

- `VITE_API_URL`: Base URL for the API server. Default: `http://localhost:3000/api`
- `VITE_ENABLE_MOCK_MODE`: When `true`, authentication uses mock data from `src/app/utils/user-data.ts`. When `false`, it attempts API calls with no fallback.

## API Client Usage

### Basic Usage

The `ApiClient` class provides methods for making HTTP requests:

```typescript
import { apiClient } from "@/api/client";

// GET request
const data = await apiClient.get<UserData>("/users/123");

// POST request
const response = await apiClient.post<LoginResponse>("/auth/login", {
  username: "user",
  password: "pass"
});

// PUT request
await apiClient.put("/users/123", { fullName: "New Name" });

// DELETE request
await apiClient.delete("/users/123");
```

### Error Handling

The client throws `ApiError` objects on failed requests:

```typescript
import { apiClient, ApiError } from "@/api/client";

try {
  const data = await apiClient.get("/users/123");
} catch (error) {
  const apiError = error as ApiError;
  console.error(`Status: ${apiError.status}`);
  console.error(`Message: ${apiError.message}`);
  console.error(`Data:`, apiError.data);
}
```

## Authentication

### Using the Hybrid Auth Service

The `auth-hybrid.ts` module provides intelligent authentication that automatically falls back to mock data:

```typescript
import { authenticateWithAPI } from "@/api/auth-hybrid";

const result = await authenticateWithAPI(username, password);

if (result.success) {
  console.log("User:", result.user);
} else {
  console.error("Error:", result.message);
}
```

### Direct API Authentication

For API-only authentication without mock fallback:

```typescript
import { login, logout, verifyToken } from "@/api/auth";

// Login
const response = await login(username, password);
if (response.success) {
  // Token is automatically stored in localStorage
  console.log("Current user:", response.user);
}

// Verify token validity
const verification = await verifyToken();

// Logout
await logout();
```

### Checking Authentication Status

Utility functions from `auth.ts`:

```typescript
import { 
  isAuthenticated, 
  getCurrentUser, 
  getUserRole 
} from "@/api/auth";

if (isAuthenticated()) {
  console.log("User is logged in");
  console.log("Current user:", getCurrentUser());
  console.log("Role:", getUserRole());
}
```

## Login Component Integration

The login component (`src/app/components/login.tsx`) uses the hybrid auth service:

```typescript
import { authenticateWithAPI } from "@/api/auth-hybrid";

const result = await authenticateWithAPI(username, password);

if (result.success) {
  onLogin(username, password, rememberMe);
} else {
  setError(result.message);
}
```

## Backend API Specification

### Login Endpoint

**POST** `/auth/login`

Request:
```json
{
  "username": "string",
  "password": "string"
}
```

Response (Success - 200):
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "fullName": "User Full Name",
    "accountType": "sales|stockist|jb|supplier",
    "email": "user@example.com",
    "branchCode": "JKT|BDG|SBY",
    "language": "en|id"
  }
}
```

Response (Failure - 401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Logout Endpoint

**POST** `/auth/logout`

Request: Empty body

Response (Success - 200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Verify Token Endpoint

**GET** `/auth/verify`

Headers:
```
Authorization: Bearer <token>
```

Response (Success - 200):
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "username",
    "fullName": "User Full Name",
    "accountType": "sales|stockist|jb|supplier"
  }
}
```

### Register Endpoint

**POST** `/auth/register`

Request:
```json
{
  "username": "string",
  "password": "string",
  "fullName": "string",
  "email": "string",
  "accountType": "sales|stockist|jb|supplier",
  "branchCode": "string (optional)"
}
```

Response (Success - 201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "user_id"
}
```

## Development Workflow

### Testing with Mock Data

1. Ensure `VITE_ENABLE_MOCK_MODE=true` in `.env`
2. The app will use mock user data from `src/app/utils/user-data.ts`
3. Test credentials:
   - Sales: `budi` / `sales123`
   - Stockist: `ekmw` / `stock123`
   - JB: `hend` / `jb123`
   - Supplier: `kh` / `123`

### Testing with Real API

1. Set `VITE_ENABLE_MOCK_MODE=false` in `.env`
2. Ensure API server is running at `VITE_API_URL`
3. No fallback to mock data will occur

### Debugging

Enable debug logging:

```typescript
// In your component or service
console.log("🔐 Attempting API authentication...");
const result = await authenticateWithAPI(username, password);
console.log("✅ Authentication result:", result);
```

## Adding New API Endpoints

1. Create new service module in `src/api/` (e.g., `orders.ts`)
2. Use `apiClient` for requests:

```typescript
// src/api/orders.ts
import { apiClient } from "./client";

export async function getOrders() {
  return apiClient.get("/orders");
}

export async function createOrder(orderData: any) {
  return apiClient.post("/orders", orderData);
}
```

3. Use in components:

```typescript
import { getOrders } from "@/api/orders";

const orders = await getOrders();
```

## Token Management

Auth tokens are automatically stored in localStorage with the key `authToken`. The API client includes the token in request headers:

```typescript
Authorization: Bearer <token>
```

Token is cleared on logout via `logout()` function.
