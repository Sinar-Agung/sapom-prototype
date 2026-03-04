# QuickStart: API & Authentication

## Installation ✅

```bash
pnpm add axios js-cookie
pnpm add -D @types/js-cookie
```

## Login Page Implementation

```typescript
import { authenticateWithAPI } from "@/api/auth-hybrid";

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Call API with fallback to mock
    const result = await authenticateWithAPI(username, password);

    if (!result.success) {
      setError(result.message || "Login failed");
      return;
    }

    // Token automatically saved to cookies
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

## Making API Calls

```typescript
import { apiClient } from "@/api/client";

// GET request (token included automatically)
const orders = await apiClient.get("/orders");

// POST request
const newOrder = await apiClient.post("/orders", {
  name: "Order 1",
  quantity: 10,
});

// PUT request
await apiClient.put("/orders/123", { status: "shipped" });

// DELETE request
await apiClient.delete("/orders/123");
```

## Token Management

```typescript
import { 
  getToken, 
  isAuthenticated, 
  clearAuthData,
  getUserInfo,
  saveToken 
} from "@/utils/cookie-helper";

// Check if logged in
if (isAuthenticated()) {
  console.log("User is authenticated");
}

// Get current token
const token = getToken();

// Get user info
const user = getUserInfo();
console.log(user.username, user.accountType);

// Logout
clearAuthData();
```

## Navigation Pattern

```typescript
export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth on app load (token persists in cookies)
    setIsAuthenticated(isAuthenticated());
  }, []);

  return (
    <>
      {isAuthenticated ? <Dashboard /> : <Login onLogin={() => setIsAuthenticated(true)} />}
    </>
  );
}
```

## Environment Setup

Create `.env` file:

```env
# API endpoint
VITE_API_URL=http://localhost:3000/api

# Enable mock auth for development
VITE_ENABLE_MOCK_MODE=true
```

## Common Patterns

### Protected Route

```typescript
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

// Usage
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Logout Button

```typescript
async function LogoutButton() {
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Error Handling

```typescript
try {
  const data = await apiClient.get("/orders");
} catch (error: any) {
  if (error.status === 401) {
    // Token expired
    clearAuthData();
    navigate("/login");
  } else {
    console.error(error.message);
  }
}
```

## Token Flow

```
Login Page
  ↓
authenticateWithAPI()
  ↓
API returns token
  ↓
saveToken(token) → Cookies + localStorage
  ↓
User navigates to Dashboard
  ↓
All API calls include token automatically
  ↓
Dashboard fetches data with authorization
```

## Verify Setup

Open browser DevTools:

1. **Check Cookies:**
   - Application → Cookies → Look for `authToken`

2. **Check API Headers:**
   - Network tab → Any API call → Headers → `Authorization: Bearer <token>`

3. **Check localStorage:**
   - Application → localStorage → Look for `authToken`

## Debugging

```typescript
// Log current auth state
console.log("Is authenticated:", isAuthenticated());
console.log("Current token:", getToken());
console.log("User info:", getUserInfo());

// Log network requests
// Open DevTools Network tab → Filter by XHR
```

## Files Overview

| File | Purpose |
|------|---------|
| `src/utils/cookie-helper.ts` | Token & cookie management |
| `src/api/client.ts` | Axios instance + interceptors |
| `src/api/auth.ts` | Login/logout endpoints |
| `src/api/auth-hybrid.ts` | API + mock fallback |
| `src/app/components/login.tsx` | Login UI component |

---

**Note:** Token persists in cookies across page navigation automatically. No need to pass token through props or context!
