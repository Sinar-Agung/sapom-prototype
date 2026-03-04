# Complete Authentication Integration Guide

## Complete Example: Login → Dashboard → API Call → Logout

### Step 1: App Component with Auth State

```typescript
// src/app/App.tsx
import { useState, useEffect } from "react";
import { Login } from "./components/login";
import { Dashboard } from "./pages/dashboard";
import { isAuthenticated } from "@/utils/cookie-helper";
import { logout } from "@/api/auth";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const authStatus = isAuthenticated();
    setIsLoggedIn(authStatus);
    setIsLoading(false);

    console.log(`🔐 Auth check: ${authStatus ? "Logged in" : "Not logged in"}`);
  }, []);

  const handleLogin = (username: string, password: string) => {
    console.log(`✅ User logged in: ${username}`);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    console.log("🚪 Logging out...");
    await logout();
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {!isLoggedIn ? (
        <Login
          onLogin={handleLogin}
          onRegister={() => console.log("Register page")}
        />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </>
  );
}
```

---

### Step 2: Login Component (Already Implemented)

```typescript
// src/app/components/login.tsx
import { authenticateWithAPI } from "@/api/auth-hybrid";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface LoginProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => void;
  onRegister: () => void;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate inputs
      if (!username.trim()) {
        setError(t("auth.errorUsernameEmpty"));
        setIsLoading(false);
        return;
      }

      if (!password.trim()) {
        setError(t("auth.errorPasswordEmpty"));
        setIsLoading(false);
        return;
      }

      // Authenticate user (with API fallback to mock)
      // Token is automatically saved to cookies in the API response
      const result = await authenticateWithAPI(username, password);

      if (!result.success) {
        setError(result.message || t("auth.errorInvalidCredentials"));
        setIsLoading(false);
        return;
      }

      // Successfully authenticated
      // Token is now in cookies, ready for authenticated API calls
      onLogin(username, password, rememberMe);
    } catch (err) {
      console.error("Authentication error:", err);
      setError(t("auth.errorInvalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-amber-600">SAPOM</h1>
          <p className="text-gray-600 mt-2">Supply Chain Management</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            {t("auth.welcomeBack")}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor="rememberMe" className="text-sm">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onRegister}
                className="text-amber-600 hover:underline font-semibold"
              >
                Register
              </button>
            </p>
          </div>
        </div>

        {/* Test Credentials Info (Development Only) */}
        {(import.meta as any).env.VITE_ENABLE_MOCK_MODE && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">📝 Test Accounts:</p>
            <ul className="text-blue-800 space-y-1 text-xs">
              <li>• Sales: sales001 / password123</li>
              <li>• Stockist: stockist001 / password123</li>
              <li>• JB: jb001 / password123</li>
              <li>• Supplier: supplier001 / password123</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 3: Dashboard Component with API Calls

```typescript
// src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { getUserInfo } from "@/utils/cookie-helper";
import type { Order } from "@/app/types/order";

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getUserInfo();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Token is automatically included in headers by axios interceptor
      const response = await apiClient.get<{ orders: Order[] }>("/orders");

      setOrders(response.data.orders);
      console.log(`✅ Fetched ${response.data.orders.length} orders`);
    } catch (error: any) {
      if (error.status === 401) {
        // Token expired or invalid
        console.error("⚠️ Token expired, please login again");
        onLogout();
      } else {
        setError(error.message || "Failed to load orders");
        console.error("Error fetching orders:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome, {user?.fullName} ({user?.accountType})
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {orders.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-semibold">Completed</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {orders.filter((o) => o.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">My Orders</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border-t border-red-200 text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found. Create your first order!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {order.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:underline">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
```

---

### Step 4: Protected Routes (Optional)

```typescript
// src/app/components/protected-route.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/utils/cookie-helper";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage in router
import { BrowserRouter, Routes, Route } from "react-router-dom";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Complete Token Flow with Debugging

### Before Login - No Token
```typescript
// DevTools Console
import { isAuthenticated, getToken } from "@/utils/cookie-helper";

console.log(isAuthenticated());  // false
console.log(getToken());         // undefined
console.log(getToken());         // null
```

### After Login - Token Present
```typescript
console.log(isAuthenticated());  // true
console.log(getToken());         // "eyJhbGciOiJIUzI1NiIs..."

// Check cookies
// Application → Cookies → authToken: "eyJhbGciOiJIUzI1NiIs..."
```

### API Call with Token
```typescript
// Network tab shows:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

const response = await apiClient.get("/orders");
// Headers automatically include: Authorization: Bearer <token>
```

### After Logout - Token Cleared
```typescript
await logout();

console.log(isAuthenticated());  // false
console.log(getToken());         // undefined
// Cookie removed from browser
```

---

## Error Handling Examples

### Handle 401 (Token Expired)

```typescript
try {
  const response = await apiClient.get("/orders");
} catch (error: any) {
  if (error.status === 401) {
    // Token expired or invalid
    removeToken();
    navigate("/login");
  }
}
```

### Handle Network Errors

```typescript
try {
  const response = await apiClient.get("/orders");
} catch (error: any) {
  if (error.status === 0) {
    // Network error - API server not running
    setError("Cannot connect to server. Make sure API is running.");
  } else if (error.status === 500) {
    // Server error
    setError("Server error. Please try again later.");
  } else {
    setError(error.message);
  }
}
```

### Handle Registration Errors

```typescript
try {
  const response = await apiClient.post("/auth/register", {
    username,
    password,
    fullName,
    email,
    accountType,
  });
} catch (error: any) {
  if (error.status === 409) {
    // Username already exists
    setError("Username already taken");
  } else if (error.status === 400) {
    // Missing required fields
    setError("Please fill in all required fields");
  } else {
    setError("Registration failed");
  }
}
```

---

## Testing Checklist

- [ ] Login with test account → Token saved to cookies
- [ ] Refresh page → Still logged in (token persists)
- [ ] Make API call → Authorization header includes token
- [ ] Invalid credentials → Error message displayed
- [ ] Logout → Token removed from cookies
- [ ] After logout → Redirected to login page
- [ ] Protected route → Redirects to login if not authenticated
- [ ] Token expiration → Auto-redirect to login on 401

---

## Deployment Checklist

- [ ] Update `VITE_API_URL` to production API endpoint
- [ ] Set `VITE_ENABLE_MOCK_MODE=false`
- [ ] Change JWT secret key in backend
- [ ] Enable HTTPS for secure cookies
- [ ] Build frontend: `npm run build`
- [ ] Deploy backend: Point to production API
- [ ] Test login flow on production
- [ ] Test token refresh/expiry mechanism
