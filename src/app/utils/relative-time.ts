/**
 * Formats a timestamp into a human-readable relative time string.
 * Examples: "2s ago", "1m ago", "4h ago", "5d ago", "2w ago", "8mths ago", "1y 2mths ago"
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "";

  const now = Date.now();
  const diffMs = now - timestamp;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44); // average days per month
  const years = Math.floor(days / 365.25);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 14) {
    return `${days}d ago`;
  }
  if (days < 60) {
    return `${weeks}w ago`;
  }
  if (months < 12) {
    return `${months}mths ago`;
  }

  const remainingMonths = months - years * 12;
  if (remainingMonths > 0) {
    return `${years}y ${remainingMonths}mths ago`;
  }
  return `${years}y ago`;
}
