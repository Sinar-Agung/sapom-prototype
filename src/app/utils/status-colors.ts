// Global status color configuration
// This ensures consistent status pill colors across the entire application

export interface StatusConfig {
  bg: string;
  text: string;
  label: string;
}

export const STATUS_COLORS: Record<string, StatusConfig> = {
  // 1. Initiation Phase (Neutral & Cold)
  Open: {
    bg: "bg-[#E2E8F0]",
    text: "text-gray-800",
    label: "Open",
  },
  "Picked up by Stockist": {
    bg: "bg-[#0EA5E9]",
    text: "text-white",
    label: "Picked up by Stockist",
  },
  "Stockist Processing": {
    bg: "bg-[#0EA5E9]",
    text: "text-white",
    label: "Stockist Processing",
  },
  "In Progress": {
    bg: "bg-[#0EA5E9]",
    text: "text-white",
    label: "In Progress",
  },

  // 2. Marketing & Internal Validation
  "Ready Stock Marketing": {
    bg: "bg-[#6366F1]",
    text: "text-white",
    label: "Ready Stock Marketing",
  },
  "Stock Unavailable": {
    bg: "bg-[#EF4444]",
    text: "text-white",
    label: "Stock Unavailable",
  },
  "Unavailable Stock": {
    bg: "bg-[#EF4444]",
    text: "text-white",
    label: "Unavailable Stock",
  },

  // 3. Supplier Request & Transit
  "Requested to JB": {
    bg: "bg-[#06B6D4]",
    text: "text-white",
    label: "Requested to JB",
  },
  Ordered: {
    bg: "bg-[#F59E0B]",
    text: "text-white",
    label: "Ordered",
  },
  "Conveyed to Supplier": {
    bg: "bg-[#FB923C]",
    text: "text-white",
    label: "Conveyed to Supplier",
  },

  // 4. Supplier Action
  "In Production": {
    bg: "bg-[#3B82F6]",
    text: "text-white",
    label: "In Production",
  },
  "Stock Ready by Supplier": {
    bg: "bg-[#14B8A6]",
    text: "text-white",
    label: "Stock Ready by Supplier",
  },
  "Stock Ready": {
    bg: "bg-[#14B8A6]",
    text: "text-white",
    label: "Stock Ready",
  },
  "Ordered to Supplier": {
    bg: "bg-[#8B5CF6]",
    text: "text-white",
    label: "Ordered to Supplier",
  },
  "Unable to Fulfill": {
    bg: "bg-[#7F1D1D]",
    text: "text-white",
    label: "Unable to Fulfill",
  },

  // 5. Fulfillment & Finalization (The Success Track)
  "Partially Sent": {
    bg: "bg-[#84CC16]",
    text: "text-white",
    label: "Partially Sent",
  },
  "Fully Sent": {
    bg: "bg-[#22C55E]",
    text: "text-white",
    label: "Fully Sent",
  },
  "Confirmed by JB": {
    bg: "bg-[#059669]",
    text: "text-white",
    label: "Confirmed by JB",
  },
  Done: {
    bg: "bg-[#059669]",
    text: "text-white",
    label: "Done",
  },
  Cancelled: {
    bg: "bg-[#DC2626]",
    text: "text-white",
    label: "Cancelled",
  },

  // Order-Specific Statuses
  New: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "New",
  },
  Viewed: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Viewed",
  },
  "Change Requested": {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Change Requested",
  },
  "Revised - Internal Review": {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "Revised - Internal Review",
  },
  "Order Revised": {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Order Revised",
  },
  Rejected: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Rejected",
  },
  "Partially Delivered": {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Partially Delivered",
  },
  "Fully Delivered": {
    bg: "bg-lime-100",
    text: "text-lime-800",
    label: "Fully Delivered",
  },
  Completed: {
    bg: "bg-teal-100",
    text: "text-teal-800",
    label: "Completed",
  },
  "Viewed by Supplier": {
    bg: "bg-purple-100",
    text: "text-purple-800",
    label: "Viewed by Supplier",
  },
  Confirmed: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Confirmed",
  },
  "Ready for Pickup": {
    bg: "bg-orange-100",
    text: "text-orange-800",
    label: "Ready for Pickup",
  },
};

// Helper function to get status configuration
export const getStatusConfig = (status: string): StatusConfig => {
  return (
    STATUS_COLORS[status] || {
      bg: "bg-gray-200",
      text: "text-gray-800",
      label: status,
    }
  );
};

// Helper function to get status badge classes
export const getStatusBadgeClasses = (status: string): string => {
  const config = getStatusConfig(status);
  return `${config.bg} ${config.text}`;
};
