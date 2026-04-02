/**
 * Request / PO Number Generator
 * Both request numbers and PO numbers share the same format and number space.
 * Format: SA<B><YY><M><D><N>
 *   SA  – constant prefix
 *   B   – branch letter (A=Jakarta, B=Bandung, C=Surabaya)
 *   YY  – 2-digit year (e.g. 26 for 2026)
 *   M   – 1-char month (1–9, A=10, B=11, C=12)
 *   D   – 1-char day   (1–9, A=10…S=28, T=29, U=30, V=31)
 *   N   – 2-char base-36 sequence (00–ZZ)
 *
 * Example: SAA261T00 = Jakarta, 2026, January, 29th, 1st number
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
 * Generate a unique request number (same format and number space as PO numbers).
 * Looks at both existing requests and existing orders to find the next sequence.
 */
export function generateRequestNo(branchCode?: BranchCode): string {
  const requests: Request[] = JSON.parse(
    localStorage.getItem("requests") ?? "[]",
  );
  const orders: { PONumber: string }[] = JSON.parse(
    localStorage.getItem("orders") ?? "[]",
  );

  const existingNumbers = [
    ...requests.map((r) => r.requestNo ?? ""),
    ...orders.map((o) => o.PONumber ?? ""),
  ].filter(Boolean);

  return generatePONumber(branchCode, new Date(), existingNumbers);
}

/**
 * Encode a day of month (1–31) as a single character:
 * 1–9  → '1'–'9'
 * 10–28 → 'A'–'S'
 * 29   → 'T', 30 → 'U', 31 → 'V'
 */
function encodeDayChar(day: number): string {
  if (day >= 1 && day <= 9) return String(day);
  // day 10 → char code of 'A' (65), day 28 → 'S' (83)
  return String.fromCharCode(55 + day); // 55 + 10 = 65 = 'A'
}

/**
 * Generate a PO Number.
 * Format: SA<B><YY><M><D><N>
 *   SA  – constant prefix
 *   B   – branch letter (A=Jakarta, B=Bandung, C=Surabaya)
 *   YY  – 2-digit year (e.g. 26 for 2026)
 *   M   – 1-char month (1–9, A=10, B=11, C=12)
 *   D   – 1-char day   (1–9, A=10…S=28, T=29, U=30, V=31)
 *   N   – 2-char base-36 sequence (00–ZZ, incrementing per branch+date)
 *
 * @param branchCode branch code of the ordering JB
 * @param atDate optional Date to use instead of now (useful for mock data generation)
 * @param existingPONumbers list of already-used PO numbers to determine sequence
 */
export function generatePONumber(
  branchCode?: BranchCode,
  atDate?: Date,
  existingPONumbers: string[] = [],
): string {
  const now = atDate ?? new Date();
  const branchLetter = getBranchLetter(branchCode);
  const year = String(now.getFullYear()).slice(-2);
  const month = now.getMonth() + 1;
  const monthChar = month <= 9 ? String(month) : String.fromCharCode(55 + month); // A=10,B=11,C=12
  const dayChar = encodeDayChar(now.getDate());

  const prefix = `SA${branchLetter}${year}${monthChar}${dayChar}`;

  // Find highest existing sequence for this prefix
  const usedSequences = existingPONumbers
    .filter((po) => po.startsWith(prefix))
    .map((po) => {
      const seq = po.slice(prefix.length);
      return parseInt(seq, 36);
    })
    .filter((n) => !isNaN(n));

  const maxSeq = usedSequences.length > 0 ? Math.max(...usedSequences) : 0;
  const nextSeq = (maxSeq + 1).toString(36).toUpperCase().padStart(2, "0");

  return `${prefix}${nextSeq}`;
}
