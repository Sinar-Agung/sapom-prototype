/**
 * API Client - Axios-based HTTP client for making API requests
 * Handles authentication, token management, and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { getToken, removeToken } from "@/utils/cookie-helper";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

export interface ApiError {
  status: number;
  message: string;
  data?: any;
}

/**
 * Create and configure axios instance with interceptors
 */
function createApiInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Enable sending cookies with requests
  });

  /**
   * Request interceptor - Add token to every request
   */
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  /**
   * Response interceptor - Handle token refresh and errors
   */
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Token saving is handled in auth.ts login function
      return response;
    },
    (error: AxiosError) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        console.warn("⚠️ Authentication failed - clearing auth data");
        removeToken();
        // Redirect to login if needed (can be handled by auth context)
      }

      // Format error response
      const apiError: ApiError = {
        status: error.response?.status || 0,
        message:
          (error.response?.data as any)?.message ||
          error.message ||
          "Unknown error",
        data: error.response?.data,
      };

      return Promise.reject(apiError);
    },
  );

  return instance;
}

// Export singleton instance
export const apiClient = createApiInstance();
