# Authentication Quick Reference Card

## Start Development

```bash
# Terminal 1: Start API Server
npm run api

# Terminal 2: Start Frontend
npm run dev
```

Visit `http://localhost:5173` → Login with `sales001` / `password123`

---

## Key Files

| File | Purpose |
|------|---------|
| `mock-api-server.js` | Backend API (handles login/register) |
| `src/api/client.ts` | Axios HTTP client with interceptors |
| `src/api/auth.ts` | Auth endpoints (login/logout/verify) |
| `src/utils/cookie-helper.ts` | Token management (save/get/clear) |
| `src/app/components/login.tsx` | Login UI component |

---

## API Endpoints (Running on localhost:3000)

```
POST   /api/auth/login      Login
POST   /api/auth/register   Register
GET    /api/auth/verify     Verify token
POST   /api/auth/logout     Logout
GET    /api/orders          Protected endpoint
```

---

## Frontend Code

### Login Component
```tsx
import { authenticateWithAPI } from "@/api/auth-hybrid";

const result = await authenticateWithAPI(username, password);
// ✅ Token automatically saved to cookies
```

### Make API Calls
```tsx
import { apiClient } from "@/api/client";

const response = await apiClient.get("/orders");
// ✅ Token automatically included in headers
```

### Token Management
```tsx
import { isAuthenticated, getToken, clearAuthData } from "@/utils/cookie-helper";

isAuthenticated()    // true/false
getToken()          // "eyJ..."
clearAuthData()     // Remove token on logout
```

---

## Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Sales | sales001 | password123 |
| Stockist | stockist001 | password123 |
| JB | jb001 | password123 |
| Supplier | supplier001 | password123 |

---

## Token Flow

```
Login Page → authenticateWithAPI() 
  ↓
API Server validates credentials
  ↓
Returns JWT token
  ↓
saveToken() → Saved in cookies + localStorage
  ↓
Navigate to Dashboard
  ↓
API calls include Authorization header automatically
  ↓
Logout → clearAuthData()
```

---

## Common Tasks

### Check if User is Logged In
```typescript
if (isAuthenticated()) {
  // Show dashboard
} else {
  // Show login page
}
```

### Get Current User Info
```typescript
const user = getUserInfo();
console.log(user.username, user.accountType);
```

### Login User
```typescript
const result = await authenticateWithAPI(username, password);
if (result.success) {
  navigate("/dashboard");
}
```

### Logout User
```typescript
await logout();
navigate("/login");
```

### Make Protected API Call
```typescript
try {
  const response = await apiClient.get("/orders");
  // Use response.data
} catch (error: any) {
  if (error.status === 401) {
    // Token expired, redirect to login
    await logout();
    navigate("/login");
  }
}
```

---

## Debugging

### DevTools Console
```typescript
// Check authentication status
import { isAuthenticated, getToken, getUserInfo } from "@/utils/cookie-helper";

isAuthenticated()              // true/false
getToken()                     // token string
getUserInfo()                  // { username, fullName, ... }
```

### Check Cookies
1. Open DevTools (F12)
2. Application → Cookies
3. Look for `authToken` cookie
4. Should appear after login, disappear after logout

### Monitor API Requests
1. DevTools Network tab
2. Filter: XHR (XML HTTP Request)
3. Click any API request
4. Headers tab → Look for `Authorization: Bearer <token>`

### API Server Logs
Terminal running `npm run api` shows:
```
📍 Login attempt: sales001
✅ Login successful: sales001
🚪 Logout successful
```

---

## Environment Setup

Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_MODE=true
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS error | Make sure API server running on localhost:3000 |
| Token not persisting | Check DevTools → Application → Cookies |
| 401 errors | Token expired, user needs to login again |
| Page blank after login | Check for JavaScript errors in console |
| API server won't start | Make sure port 3000 is available |

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "sales001",
    "fullName": "John Sales",
    "accountType": "sales",
    "email": "sales@sapom.com"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

## Default Ports

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Server | http://localhost:3000 |
| API Endpoints | http://localhost:3000/api/... |

---

## Important Notes

✅ Token automatically saved to cookies after login  
✅ Token automatically included in all API requests  
✅ Token persists across page navigation  
✅ Token cleared automatically on logout  
✅ 401 errors trigger auto-logout  
✅ Mock API available for testing without backend  

---

## Next: Connecting Real API

1. Update `VITE_API_URL` to your backend endpoint
2. Set `VITE_ENABLE_MOCK_MODE=false`
3. Ensure backend implements same endpoints
4. Test login flow with real credentials
5. Monitor API requests in DevTools

---

## Useful Commands

```bash
npm run api              # Start API server
npm run dev              # Start frontend
npm run api:dev          # Start both (requires concurrently)
npm run build            # Build for production
```

---

📚 Full documentation: [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)  
📝 Integration guide: [AUTHENTICATION_INTEGRATION.md](./AUTHENTICATION_INTEGRATION.md)  
🚀 API details: [API_AUTHENTICATION.md](./API_AUTHENTICATION.md)
