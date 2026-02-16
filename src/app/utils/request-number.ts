/**
 * Request Number Generator
 * Generates unique request numbers in the format: RPO-YYYYMMDD-####
 */

import { Request } from "../types/request";

/**
 * Generate a unique request number
 * Format: RPO-YYYYMMDD-XXXX
 * Example: RPO-20260215-0001
 */
export function generateRequestNo(): string {
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Get existing requests from localStorage
  const existingRequests = localStorage.getItem("requests");
  const requests: Request[] = existingRequests
    ? JSON.parse(existingRequests)
    : [];

  // Find all request numbers for today
  const todayPrefix = `RPO-${dateStr}-`;
  const todayRequests = requests
    .filter((r) => r.requestNo?.startsWith(todayPrefix))
    .map((r) => {
      const parts = r.requestNo?.split("-");
      return parts && parts.length === 3 ? parseInt(parts[2], 10) : 0;
    })
    .filter((num) => !isNaN(num));

  // Find the highest number for today
  const maxNumber = todayRequests.length > 0 ? Math.max(...todayRequests) : 0;

  // Generate next sequential number (4 digits, zero-padded)
  const nextNumber = String(maxNumber + 1).padStart(4, "0");

  return `RPO-${dateStr}-${nextNumber}`;
}
