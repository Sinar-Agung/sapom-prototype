/**
 * Authentication API Endpoints
 * Handles user login, registration, and session management
 */

import { apiClient, ApiError } from "./client";
import {
  saveToken,
  saveUserInfo,
  saveUserRole,
  clearAuthData,
  getToken,
  isAuthenticated as checkAuthenticated,
} from "@/utils/cookie-helper";

const API_NAME_APP = (import.meta as any).env.VITE_APP_NAME;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
    accountType: "sales" | "stockist" | "jb" | "supplier";
    email: string;
    branchCode?: string;
    language?: string;
  };
  message?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  accountType: "sales" | "stockist" | "jb" | "supplier";
  branchCode?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  user?: any;
  message?: string;
}

/**
 * Authenticate user with credentials
 * Saves token to both cookies and localStorage
 * @param username - User's username
 * @param password - User's password
 * @returns Login response with token and user info
 */
export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>("/authentication/login", {
      username,
      password,
      appName: API_NAME_APP,
    });

    // Store token in cookie and localStorage if provided
    if (response.data.accessToken) {
      saveToken(response.data.accessToken);
    }

    // Store user info in cookie and localStorage
    if (response.data.user) {
      saveUserInfo(response.data.user);
      saveUserRole(response.data.user.accountType);
      localStorage.setItem("currentUser", response.data.user.username);
    }

    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw {
      success: false,
      message: apiError.message || "Login failed",
    };
  }
}

/**
 * Register a new user
 * @param data - Registration data
 * @returns Registration response
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>(
      "/authentication/register",
      data,
    );
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw {
      success: false,
      message: apiError.message || "Registration failed",
    };
  }
}

/**
 * Verify current auth token
 * @returns Verification response with current user info
 */
export async function verifyToken(): Promise<VerifyTokenResponse> {
  try {
    const response = await apiClient.get<VerifyTokenResponse>("/authentication/verify");
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: "Token verification failed",
    };
  }
}

/**
 * Logout user
 * Clears token from cookies and localStorage
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } catch {
    // Ignore logout errors
  } finally {
    // Clear all auth data from cookies and localStorage
    clearAuthData();
    localStorage.removeItem("currentUser");
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return checkAuthenticated();
}

/**
 * Get current user from storage
 */
export function getCurrentUser(): string | null {
  return localStorage.getItem("currentUser");
}

/**
 * Get user role from storage
 */
export function getUserRole(): string | null {
  return getToken() ? localStorage.getItem("userRole") : null;
}

/**
 * Get current auth token
 */
export function getAuthToken(): string | undefined {
  return getToken();
}
