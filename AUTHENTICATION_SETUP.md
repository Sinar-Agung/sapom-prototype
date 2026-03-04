# API & Authentication Complete Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies ✅
```bash
pnpm install
```

All required dependencies are already in package.json:
- `express` - Backend server
- `cors` - Cross-origin requests
- `jsonwebtoken` - JWT token generation
- `cookie-parser` - Cookie parsing
- `axios` - Frontend HTTP client
- `js-cookie` - Cookie management

### 2. Start the Mock API Server

In one terminal:
```bash
npm run api
```

Output:
```
🚀 Mock API Server running on http://localhost:3000

📝 Test Credentials:
  Username: sales001 | Password: password123 (Sales)
  Username: stockist001 | Password: password123 (Stockist)
  Username: jb001 | Password: password123 (JB)
  Username: supplier001 | Password: password123 (Supplier)
```

### 3. Start the Frontend App

In another terminal:
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Test Login

1. Open http://localhost:5173
2. Go to Login page
3. Enter credentials: `sales001` / `password123`
4. Login button sends request to API
5. Token saved to cookies automatically
6. Redirected to dashboard

---

## Architecture Overview

```
┌──────────────┐
│  Login Page  │
│  (React)     │
└──────┬───────┘
       │ authenticateWithAPI()
       │
       ▼
┌──────────────────────────┐
│   API Interceptors       │
│ - Add token to header    │
│ - Handle errors          │
│ - Manage 401 responses   │
└──────┬───────────────────┘
       │ Axios request
       │
       ▼
┌──────────────────────────┐
│  Mock API Server         │
│  (Node.js/Express)       │
│ - Auth endpoints         │
│ - Protected endpoints    │
│ - JWT validation         │
└──────┬───────────────────┘
       │ Response + JWT
       │
       ▼
┌──────────────────────────┐
│  Cookie Storage          │
│ - authToken (cookie)     │
│ - userInfo (localStorage)│
│ - userRole (localStorage)│
└──────────────────────────┘
```

---

## API Endpoints Reference

### Authentication Endpoints

#### 1. POST `/api/auth/login`
Login with username and password.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sales001",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "sales001",
    "fullName": "John Sales",
    "accountType": "sales",
    "email": "sales@sapom.com",
    "branchCode": "BR001"
  }
}
```

**What happens:**
- ✅ Token validated
- ✅ Token set in httpOnly cookie
- ✅ User data returned
- ✅ Frontend saves token to cookies

---

#### 2. POST `/api/auth/register`
Register a new user.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "fullName": "New User",
    "email": "newuser@sapom.com",
    "accountType": "sales",
    "branchCode": "BR001"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "5"
}
```

---

#### 3. GET `/api/auth/verify`
Verify current token and get user information.

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Cookie: authToken=eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "1",
    "username": "sales001",
    "fullName": "John Sales",
    "accountType": "sales",
    "email": "sales@sapom.com"
  }
}
```

---

#### 4. POST `/api/auth/logout`
Clear authentication and logout user.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Protected Endpoints Example

#### GET `/api/orders`
Get user's orders (requires valid token).

**Request:**
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "1",
      "name": "Order 1",
      "status": "pending",
      "createdBy": "sales001"
    }
  ]
}
```

---

## Frontend Implementation

### 1. Use Login Component

```tsx
import { Login } from "@/app/components/login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      {!isLoggedIn ? (
        <Login 
          onLogin={() => setIsLoggedIn(true)}
          onRegister={() => console.log("Register")}
        />
      ) : (
        <Dashboard onLogout={() => setIsLoggedIn(false)} />
      )}
    </>
  );
}
```

### 2. Make API Calls

```tsx
import { apiClient } from "@/api/client";
import { isAuthenticated } from "@/utils/cookie-helper";

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Fetch orders (token included automatically)
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const response = await apiClient.get("/orders");
      setOrders(response.data.orders);
    } catch (error) {
      if (error.status === 401) {
        // Token expired, redirect to login
        navigate("/login");
      }
    }
  }

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>{order.name}</div>
      ))}
    </div>
  );
}
```

### 3. Token Management

```tsx
import { 
  getToken, 
  isAuthenticated, 
  clearAuthData,
  getUserInfo 
} from "@/utils/cookie-helper";

// Check authentication status
if (isAuthenticated()) {
  // User is logged in
  const user = getUserInfo();
  console.log(user.username, user.accountType);
}

// Get token for manual use
const token = getToken();

// Logout
clearAuthData();
```

---

## Token Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PROCESS                        │
└─────────────────────────────────────────────────────────┘

User enters credentials
        ↓
authenticateWithAPI(username, password)
        ↓
API Call: POST /api/auth/login
        ↓
Server validates credentials
        ↓
Server generates JWT token
        ↓
Server sets token in httpOnly cookie
        ↓
Response sent with token in body
        ↓
Frontend: saveToken(token)
        ↓
Token saved to:
  - Browser cookies (httpOnly)
  - localStorage (backup)
        ↓
        ├─ User navigated to Dashboard
        ├─ Navigation bar shows user name
        └─ All future API calls include token

┌─────────────────────────────────────────────────────────┐
│                API CALL WITH TOKEN                      │
└─────────────────────────────────────────────────────────┘

Frontend calls: apiClient.get("/orders")
        ↓
Request interceptor runs:
  - Retrieves token from cookies
  - Adds header: Authorization: Bearer <token>
        ↓
Axios sends GET /api/orders with header
        ↓
Server middleware verifies token
        ↓
Token valid → Process request
Token invalid → Return 401
        ↓
Response returned to frontend
        ↓
Response interceptor runs:
  - Check for 401 (token expired)
  - Auto-clear token on 401
        ↓
Response data returned to component

┌─────────────────────────────────────────────────────────┐
│                  LOGOUT PROCESS                         │
└─────────────────────────────────────────────────────────┘

User clicks Logout button
        ↓
clearAuthData()
        ↓
Token removed from:
  - Browser cookies
  - localStorage
        ↓
User redirected to /login
        ↓
All future API calls rejected (no token)
```

---

## File Structure

```
sapom-prototype/
├── mock-api-server.js          # Backend server
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance
│   │   ├── auth.ts             # Auth endpoints
│   │   └── auth-hybrid.ts      # API + mock fallback
│   ├── utils/
│   │   └── cookie-helper.ts    # Token management
│   └── app/components/
│       └── login.tsx           # Login UI
├── package.json                # Dependencies
└── .env                        # Environment config
```

---

## Environment Variables

Create `.env` file in project root:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Mock Mode (for development without real API)
VITE_ENABLE_MOCK_MODE=false

# App Configuration
VITE_APP_NAME=SAPOM
VITE_APP_VERSION=1.0.0
```

---

## Running Both Servers

### Option 1: Two Terminals (Recommended for Learning)

**Terminal 1 - API Server:**
```bash
npm run api
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Single Terminal (Requires concurrently)

```bash
npm run api:dev
```

This runs:
- Frontend (Vite): http://localhost:5173
- API Server: http://localhost:3000

---

## Testing the Authentication

### Test 1: Login Flow

1. Open DevTools (F12)
2. Go to Application → Cookies
3. Open login page
4. Enter `sales001` / `password123`
5. Click Login
6. Watch cookie `authToken` appear
7. Check Network tab → See Authorization header in all requests

### Test 2: Protected Endpoint

Open DevTools Console:
```typescript
// This will fail without token
fetch('http://localhost:3000/api/orders')
  .then(r => r.json())
  .then(d => console.log(d))
// → {"success": false, "message": "Unauthorized"}

// This will work (using apiClient)
import { apiClient } from '@/api/client';
apiClient.get('/orders')
  .then(d => console.log(d))
// → {"success": true, "orders": [...]}
```

### Test 3: Token Expiration

1. Add this to debug:
```typescript
import { removeToken } from '@/utils/cookie-helper';

// Simulate token expiration
removeToken();
```

2. Try to make API call
3. Should be redirected to login (if error handling implemented)

---

## Common Issues & Solutions

### Issue: CORS Error
**Problem:** `Access-Control-Allow-Origin` error

**Solution:**
- Make sure API server is running on `localhost:3000`
- Check `VITE_API_URL` is set correctly
- CORS is already configured in mock-api-server.js

### Issue: Token Not Persisting
**Problem:** Token disappears after page reload

**Solution:**
- Cookies are stored automatically
- Check Application → Cookies for `authToken`
- Check browser's cookie settings (not blocking cookies)

### Issue: 401 Unauthorized
**Problem:** API returns 401 even with valid token

**Solution:**
- Token might have expired (7 day expiration)
- Clear cookies and login again
- Check token format: `Authorization: Bearer <token>`

---

## Production Deployment

Before deploying to production:

1. **Change SECRET_KEY in mock-api-server.js**
   ```javascript
   const SECRET_KEY = "your-production-secret-key";
   ```

2. **Enable Secure Cookies**
   ```javascript
   secure: true, // HTTPS only
   sameSite: 'strict'
   ```

3. **Update VITE_API_URL**
   ```env
   VITE_API_URL=https://api.sapom.com
   ```

4. **Disable Mock Mode**
   ```env
   VITE_ENABLE_MOCK_MODE=false
   ```

5. **Build Frontend**
   ```bash
   npm run build
   ```

---

## Next Steps

1. ✅ Test login with provided credentials
2. ✅ Create user account via registration
3. ✅ Verify token persists across pages
4. ✅ Test API endpoints with token
5. ✅ Implement protected routes
6. ✅ Add logout functionality
7. ✅ Connect to real backend API
