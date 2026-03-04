/**
 * Hybrid Authentication Service
 * Supports both API-based and mock-based authentication
 * Falls back to mock data if API is unavailable
 */

import { login as apiLogin } from "./auth";
import { authenticateUser } from "@/app/utils/user-data";
import { saveToken, saveUserInfo, saveUserRole } from "@/utils/cookie-helper";
import { t } from "i18next";

const ENABLE_MOCK_MODE = false;//(import.meta as any).env.VITE_ENABLE_MOCK_MODE === "true";

export interface AuthResult {
  success: boolean;
  user?: {
    username: string;
    fullName: string;
    accountType: string;
    email: string;
    branchCode?: string;
  };
  message?: string;
}

/**
 * Authenticate user with API, falling back to mock data
 * @param username - User's username
 * @param password - User's password
 * @returns Authentication result
 */
export async function authenticateWithAPI(
  username: string,
  password: string,
): Promise<AuthResult> {
  // If mock mode is enabled, use mock authentication
  if (ENABLE_MOCK_MODE) {
    return authenticateWithMock(username, password);
  }

  try {
    console.log("🔐 Attempting API authentication...");
    const response = await apiLogin(username, password);

    if (response.success && response.user) {
      console.log("✅ API authentication successful");
      // Token is already saved in the login function
      return {
        success: true,
        user: {
          username: response.user.username,
          fullName: response.user.fullName,
          accountType: response.user.accountType,
          email: response.user.email,
          branchCode: response.user.branchCode,
        },
      };
    }

    return {
      success: false,
      message: response.message || "Authentication failed",
    };
  } catch (error) {
    // If API fails, try mock authentication as fallback
    console.warn("⚠️ API authentication failed, attempting mock fallback...");
    console.error(error);

    try {
      return authenticateWithMock(username, password);
    } catch (mockError) {
      return {
        success: false,
        message:
          "Authentication failed - API and mock authentication unavailable",
      };
    }
  }
}

/**
 * Authenticate user with mock data
 * Saves user info and creates a mock token
 * @param username - User's username
 * @param password - User's password
 * @returns Authentication result
 */
function authenticateWithMock(
  username: string,
  password: string,
): Promise<AuthResult> {
  return new Promise((resolve) => {
    try {
      const user = authenticateUser(username, password);

      if (user) {
        console.log("✅ Mock authentication successful");

        // Create a mock token (in production, this would come from API)
        const mockToken = `mock_token_${btoa(`${username}:${Date.now()}`)}`;

        // Save token to cookies
        saveToken(mockToken);

        // Save user info to cookies
        saveUserInfo({
          username: user.username,
          fullName: user.fullName,
          accountType: user.accountType,
          email: user.email,
          branchCode: user.branchCode,
        });

        // Save user role to cookies
        saveUserRole(user.accountType);

        // Also save to localStorage for backward compatibility
        localStorage.setItem("currentUser", username);
        localStorage.setItem("userRole", user.accountType);

        resolve({
          success: true,
          user: {
            username: user.username,
            fullName: user.fullName,
            accountType: user.accountType,
            email: user.email,
            branchCode: user.branchCode || undefined,
          },
        });
      } else {
        resolve({
          success: false,
          message: t("auth.errorInvalidCredentials"),
        });
      }
    } catch (error) {
      console.error("Mock authentication error:", error);
      resolve({
        success: false,
        message: "Authentication error",
      });
    }
  });
}
