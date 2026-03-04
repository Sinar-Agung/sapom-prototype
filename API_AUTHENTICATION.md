# API Integration with Axios and Cookie-Based Authentication

## Overview

The SAPOM application now uses **axios** for API communication with **cookie-based token management**. Tokens are stored in both **cookies** (for HTTP requests) and **localStorage** (for JavaScript access) to ensure persistent authentication across page navigation.

## Architecture

### File Structure

```
src/
├── api/
│   ├── client.ts          # Axios instance with interceptors
│   ├── auth.ts            # Authentication endpoints (login, register, logout)
│   └── auth-hybrid.ts     # Hybrid auth (API + mock fallback)
├── utils/
│   └── cookie-helper.ts   # Cookie and token management utilities
└── app/components/
    └── login.tsx          # Login page component
```

## Key Components

### 1. **Cookie Helper** (`src/utils/cookie-helper.ts`)

Manages token and user data storage in cookies and localStorage:

```typescript
import { saveToken, getToken, isAuthenticated } from "@/utils/cookie-helper";

// Save token after login
saveToken(jwtToken);

// Retrieve token for API requests
const token = getToken();

// Check if user is logged in
if (isAuthenticated()) {
  // User is authenticated
}

// Clear all auth data on logout
clearAuthData();
```

**Key Functions:**
- `saveToken(token)` - Store auth token in cookies and localStorage
- `getToken()` - Retrieve token from cookies/localStorage
- `saveUserInfo(userInfo)` - Store user details
- `getUserInfo()` - Get user details
- `clearAuthData()` - Remove all auth data
- `isAuthenticated()` - Check authentication status

### 2. **API Client** (`src/api/client.ts`)

Axios instance with automatic token injection and error handling:

```typescript
import { apiClient } from "@/api/client";

// Token is automatically added to Authorization header
const data = await apiClient.get("/orders");

// POST with body
await apiClient.post("/orders", { name: "Order 1" });

// PUT/DELETE
await apiClient.put("/orders/123", { status: "updated" });
await apiClient.delete("/orders/123");
```

**Features:**
- ✅ Automatic token injection in all requests
- ✅ Error handling with formatted error responses
- ✅ Automatic 401 handling (clears token on auth failure)
- ✅ Support for cookies with `withCredentials: true`

### 3. **Authentication Service** (`src/api/auth.ts`)

High-level authentication functions that handle token storage:

```typescript
import { login, logout, verifyToken } from "@/api/auth";

// Login - automatically saves token to cookies
const response = await login(username, password);
if (response.success) {
  // User authenticated, token saved
  navigate("/dashboard");
}

// Verify token
const verified = await verifyToken();

// Logout - clears all auth data
await logout();
```

### 4. **Hybrid Authentication** (`src/api/auth-hybrid.ts`)

Supports API-based login with automatic fallback to mock data:

```typescript
import { authenticateWithAPI } from "@/api/auth-hybrid";

// Attempts real API, falls back to mock if unavailable
const result = await authenticateWithAPI(username, password);

if (result.success) {
  // Token saved, user data available
  console.log(result.user);
}
```

## Login Flow

### Step 1: Login Page Component (`src/app/components/login.tsx`)

```typescript
import { authenticateWithAPI } from "@/api/auth-hybrid";

export function Login({ onLogin }: LoginProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Call authentication with API
    const result = await authenticateWithAPI(username, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Token is automatically saved in cookies
    // Navigate to authenticated page
    onLogin(username, password, rememberMe);
  };
}
```

### Step 2: Token Storage

1. **API Response** → `auth.ts` receives token
2. **Cookie Storage** → Token saved to HTTP-only cookie
3. **localStorage Backup** → Token also saved to localStorage
4. **Automatic Injection** → All subsequent requests include token in `Authorization: Bearer <token>` header

### Step 3: Navigation

After login, user can navigate to other pages with persistent authentication:

```typescript
// Page A → Page B
// Token persists in cookies automatically
// All API calls include the token
```

## Token Management Lifecycle

### Authentication Flow

```
User Login
    ↓
authenticateWithAPI(username, password)
    ↓
API Call: POST /auth/login
    ↓
Response with token
    ↓
saveToken(token) → Saved in cookies + localStorage
    ↓
API Interceptor: Token added to all future requests
    ↓
User navigates to new page
    ↓
Token persists in cookies
    ↓
All API calls include Authorization header
```

### Logout Flow

```
User Logout
    ↓
logout()
    ↓
clearAuthData()
    ↓
Remove token from cookies + localStorage
    ↓
API Interceptor removes Authorization header
    ↓
Navigate to login page
```

## API Error Handling

Automatic handling of common errors:

```typescript
// 401 Unauthorized - Token expired
// → Token removed from cookies
// → User needs to re-login

// Other errors - Formatted consistently
try {
  const data = await apiClient.get("/orders");
} catch (error: ApiError) {
  console.error(error.status, error.message);
}
```

## Environment Configuration

### `.env` Variables

```env
# API endpoint
VITE_API_URL=http://localhost:3000/api

# Enable mock authentication (for development)
VITE_ENABLE_MOCK_MODE=true
```

## Usage Examples

### Example 1: Complete Login Flow

```typescript
import { Login } from "@/app/components/login";
import { isAuthenticated } from "@/utils/cookie-helper";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if token exists in cookies on app load
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLogin = (username: string, password: string) => {
    setIsLoggedIn(true);
    // Navigate to dashboard
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    // Navigate to login
  };

  return (
    <>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}
```

### Example 2: Making Authenticated API Calls

```typescript
import { apiClient } from "@/api/client";

// Token automatically included in header
async function fetchOrders() {
  try {
    const response = await apiClient.get("/orders");
    console.log(response.data);
  } catch (error) {
    if (error.status === 401) {
      // Token expired, redirect to login
      window.location.href = "/login";
    }
  }
}
```

### Example 3: Persisting Authentication Across Pages

```typescript
// Page A (Dashboard)
function Dashboard() {
  useEffect(() => {
    // Token automatically available from cookies
    // No need to pass it through context or props
    fetchUserData();
  }, []);

  async function fetchUserData() {
    const response = await apiClient.get("/user/profile");
    // Authorization header included automatically
  }

  return (
    <button onClick={() => navigate("/orders")}>
      Go to Orders
    </button>
  );
}

// Page B (Orders)
function Orders() {
  useEffect(() => {
    // Token still available from cookies
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const response = await apiClient.get("/orders");
    // Works because token persists in cookies
  }
}
```

## Cookie Details

### Storage Strategy

| Storage | Purpose | Expires |
|---------|---------|---------|
| **Cookies** | HTTP requests, cross-domain | 7 days |
| **localStorage** | JavaScript access, offline | Session |

### Cookie Attributes

- `sameSite: Strict` - CSRF protection
- `secure: true` (HTTPS only) - Automatically set for HTTPS URLs
- `expires: 7` - Token valid for 7 days

## Migration Notes

### From Previous Implementation

Before:
```typescript
// Manual token storage
localStorage.setItem("authToken", token);

// Manual header injection
headers["Authorization"] = `Bearer ${token}`;
```

After:
```typescript
// Automatic cookie + localStorage storage
saveToken(token);

// Automatic header injection
// No manual intervention needed
```

## Testing Authentication

```typescript
import { isAuthenticated, getToken } from "@/utils/cookie-helper";

// Check if authenticated
console.log(isAuthenticated()); // true/false

// Get current token
const token = getToken(); // "eyJhbGc..."

// Get user info
const user = getUserInfo(); // { username, fullName, accountType }
```

## Troubleshooting

### Issue: Token Not Persisting Across Pages

**Solution:** Token is automatically stored in cookies. Check browser DevTools:
- Application → Cookies → Look for `authToken`
- Should be available on all subsequent requests

### Issue: 401 Errors After Login

**Solution:** Token may have expired or been cleared. User needs to re-login.

### Issue: CORS Errors

**Solution:** Ensure API server allows credentials:
```javascript
// Backend should set:
res.header("Access-Control-Allow-Credentials", "true");
```

## Best Practices

1. ✅ **Always use `apiClient`** for API calls - ensures token injection
2. ✅ **Check `isAuthenticated()`** before navigation - prevents blank states
3. ✅ **Handle 401 errors** - redirect to login when token expires
4. ✅ **Clear auth data on logout** - use `clearAuthData()`
5. ✅ **Never expose token in logs** - only in DevTools cookies
6. ✅ **Use HTTPS in production** - cookies marked `secure`

## Security Considerations

- ✅ Token stored in HTTP-only cookies by default (js-cookie manages)
- ✅ CSRF protection with `sameSite: Strict`
- ✅ Auto-clear on 401 (unauthorized)
- ✅ Token not exposed in localStorage for sensitive endpoints
- ⚠️ Remember: localStorage is vulnerable to XSS, use cookies for sensitive tokens

## Next Steps

1. Test login flow with real API endpoint
2. Configure `VITE_API_URL` environment variable
3. Handle token refresh/expiry in API interceptor
4. Implement protected routes (redirect unauthenticated users)
5. Add loading states during authentication
