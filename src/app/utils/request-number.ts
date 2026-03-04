/**
 * Request Number Generator
 * Generates unique request numbers in the format: RSABYYMDDXX
 * Where:
 * - RSA: Fixed prefix
 * - B: Branch code (A=Jakarta, B=Bandung, C=Surabaya)
 * - YY: Two-digit year (e.g., 26 for 2026)
 * - M: Month in hexadecimal (1-C, where C=12)
 * - DD: Two-digit zero-padded day
 * - XX: Two-character hexatrigesimal counter (base 36: 0-9, A-Z)
 * 
 * Example: RSAA2613205 = Jakarta, 2026, January, 31st, 5th request
 */

import { Request } from "../types/request";
import type { BranchCode } from "./user-data";

/**
 * Get branch letter from branch code
 */
function getBranchLetter(branchCode?: BranchCode): string {
  if (!branchCode) return "A"; // Default to Jakarta
  switch (branchCode) {
    case "JKT":
      return "A";
    case "BDG":
      return "B";
    case "SBY":
      return "C";
    default:
      return "A";
  }
}

/**
 * Generate a unique request number
 * Format: RSABYYMDDXX
 * Example: RSAA26131A5
 */
export function generateRequestNo(branchCode?: BranchCode): string {
  // Get current date components
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits (e.g., "26")
  const month = now.getMonth() + 1; // 1-12
  const monthHex = month.toString(16).toUpperCase(); // Convert to hex (1-C)
  const day = String(now.getDate()).padStart(2, "0"); // Zero-padded day (01-31)
  
  // Get branch letter
  const branchLetter = getBranchLetter(branchCode);
  
  // Create date key for counter
  const dateKey = `${year}${monthHex}${day}`;
  
  // Get existing requests from localStorage
  const existingRequests = localStorage.getItem("requests");
  const requests: Request[] = existingRequests
    ? JSON.parse(existingRequests)
    : [];

  // Find all request numbers for today with this branch
  const todayPrefix = `RSA${branchLetter}${dateKey}`;
  const todayRequests = requests
    .filter((r) => r.requestNo?.startsWith(todayPrefix))
    .map((r) => {
      // Extract the last 2 characters (hexatrigesimal counter)
      const requestNo = r.requestNo || "";
      const counterStr = requestNo.slice(-2);
      return parseInt(counterStr, 36); // Parse as base 36
    })
    .filter((num) => !isNaN(num));

  // Find the highest number for today
  const maxNumber = todayRequests.length > 0 ? Math.max(...todayRequests) : -1;

  // Generate next sequential number in base 36 (2 characters)
  const nextNumber = (maxNumber + 1).toString(36).toUpperCase().padStart(2, "0");

  return `RSA${branchLetter}${dateKey}${nextNumber}`;
}
