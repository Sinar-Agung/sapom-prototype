/**
 * Cookie Helper - Utilities for managing authentication tokens in cookies
 */

import Cookies from "js-cookie";

const TOKEN_KEY = "authToken";
const USER_KEY = "userInfo";
const ROLE_KEY = "userRole";

// Cookie options (expires in 7 days)
const COOKIE_OPTIONS = {
  expires: 7,
  secure: (import.meta as any).env.VITE_API_URL?.startsWith("https"),
  sameSite: "Strict" as const,
};

/**
 * Save authentication token to cookie
 */
export function saveToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
  localStorage.setItem(TOKEN_KEY, token); // Also save to localStorage as backup
}

/**
 * Get authentication token from cookie or localStorage
 */
export function getToken(): string | undefined {
  // Try cookie first
  const cookieToken = Cookies.get(TOKEN_KEY);
  if (cookieToken) {
    return cookieToken;
  }
  // Fall back to localStorage
  return localStorage.getItem(TOKEN_KEY) || undefined;
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Save user info to cookie
 */
export function saveUserInfo(userInfo: any): void {
  const userString = JSON.stringify(userInfo);
  Cookies.set(USER_KEY, userString, COOKIE_OPTIONS);
  localStorage.setItem(USER_KEY, userString);
}

/**
 * Get user info from cookie
 */
export function getUserInfo(): any | null {
  const userCookie = Cookies.get(USER_KEY);
  if (userCookie) {
    try {
      return JSON.parse(userCookie);
    } catch {
      return null;
    }
  }
  // Fall back to localStorage
  const userStorage = localStorage.getItem(USER_KEY);
  if (userStorage) {
    try {
      return JSON.parse(userStorage);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save user role to cookie
 */
export function saveUserRole(role: string): void {
  Cookies.set(ROLE_KEY, role, COOKIE_OPTIONS);
  localStorage.setItem(ROLE_KEY, role);
}

/**
 * Get user role from cookie
 */
export function getUserRole(): string | undefined {
  const roleCookie = Cookies.get(ROLE_KEY);
  if (roleCookie) {
    return roleCookie;
  }
  return localStorage.getItem(ROLE_KEY) || undefined;
}

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  removeToken();
  Cookies.remove(USER_KEY);
  Cookies.remove(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
