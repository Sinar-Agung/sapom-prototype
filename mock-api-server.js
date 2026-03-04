/**
 * Mock API Server for Testing
 * This server handles login/registration with cookie-based token management
 * Run with: node mock-api-server.js
 */

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your-secret-key-change-in-production";

// Rate limiter for auth endpoints (100 requests per 15 minutes per IP)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  })
);

// Mock user database
const MOCK_USERS = {
  sales001: {
    id: "1",
    username: "sales001",
    password: "password123",
    fullName: "John Sales",
    accountType: "sales",
    email: "sales@sapom.com",
    branchCode: "BR001",
  },
  stockist001: {
    id: "2",
    username: "stockist001",
    password: "password123",
    fullName: "Jane Stockist",
    accountType: "stockist",
    email: "stockist@sapom.com",
    branchCode: "BR002",
  },
  jb001: {
    id: "3",
    username: "jb001",
    password: "password123",
    fullName: "Bob JB",
    accountType: "jb",
    email: "jb@sapom.com",
  },
  supplier001: {
    id: "4",
    username: "supplier001",
    password: "password123",
    fullName: "Supplier One",
    accountType: "supplier",
    email: "supplier@sapom.com",
  },
};

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      accountType: user.accountType,
    },
    SECRET_KEY,
    { expiresIn: "7d" }
  );
}

/**
 * Verify JWT token from cookies
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * POST /api/auth/login
 * Login with username and password
 */
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  console.log(`📍 Login attempt: ${username}`);

  // Validate inputs
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  // Find user
  const user = MOCK_USERS[username];

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  // Generate token
  const token = generateToken(user);

  // Set token in cookie (httpOnly for security)
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log(`✅ Login successful: ${username}`);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountType: user.accountType,
      email: user.email,
      branchCode: user.branchCode,
      language: "en",
    },
  });
});

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName, email, accountType, branchCode } =
    req.body;

  console.log(`📝 Registration attempt: ${username}`);

  // Validate inputs
  if (!username || !password || !fullName || !email || !accountType) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  // Check if user already exists
  if (MOCK_USERS[username]) {
    return res.status(409).json({
      success: false,
      message: "Username already exists",
    });
  }

  // Create new user
  const newUserId = Object.keys(MOCK_USERS).length + 1;
  const newUser = {
    id: newUserId.toString(),
    username,
    password,
    fullName,
    accountType,
    email,
    branchCode: branchCode || undefined,
  };

  // Add to mock database
  MOCK_USERS[username] = newUser;

  console.log(`✅ Registration successful: ${username}`);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    userId: newUser.id,
  });
});

/**
 * GET /api/auth/verify
 * Verify current token and return user info
 */
app.get("/api/auth/verify", authRateLimit, (req, res) => {
  // Get token from cookie or Authorization header
  const token =
    req.cookies.authToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const user = MOCK_USERS[decoded.username];

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountType: user.accountType,
      email: user.email,
      branchCode: user.branchCode,
    },
  });
});

/**
 * GET /api/authentication/profile
 * Get current user profile using token
 */
app.get("/api/authentication/profile", authRateLimit, (req, res) => {
  const token =
    req.cookies.authToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const user = MOCK_USERS[decoded.username];

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  console.log(`👤 Profile fetched for: ${decoded.username}`);

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountType: user.accountType,
      email: user.email,
      branchCode: user.branchCode,
      language: "en",
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout and clear cookie
 */
app.post("/api/auth/logout", (req, res) => {
  // Clear the cookie
  res.clearCookie("authToken");

  console.log("🚪 Logout successful");

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * GET /api/orders (Protected example)
 * Requires valid token
 */
app.get("/api/orders", authRateLimit, (req, res) => {
  const token =
    req.cookies.authToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No token",
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }

  // Return mock orders
  return res.json({
    success: true,
    orders: [
      {
        id: "1",
        name: "Order 1",
        status: "pending",
        createdBy: decoded.username,
      },
      {
        id: "2",
        name: "Order 2",
        status: "completed",
        createdBy: decoded.username,
      },
    ],
  });
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "API server is running" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log("\n📝 Test Credentials:");
  console.log("  Username: sales001 | Password: password123 (Sales)");
  console.log("  Username: stockist001 | Password: password123 (Stockist)");
  console.log("  Username: jb001 | Password: password123 (JB)");
  console.log("  Username: supplier001 | Password: password123 (Supplier)");
  console.log("\n✅ API Endpoints:");
  console.log("  POST /api/auth/login - Login with credentials");
  console.log("  POST /api/auth/register - Register new user");
  console.log("  GET /api/auth/verify - Verify token");
  console.log("  GET /api/authentication/profile - Get user profile");
  console.log("  POST /api/auth/logout - Logout");
  console.log("  GET /api/orders - Get orders (protected)");
  console.log("\n");
});

module.exports = app;
