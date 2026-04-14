import { Fragment } from "react";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import { getBranchName, getFullNameFromUsername } from "@/app/utils/user-data";
import type { BranchCode } from "@/app/utils/user-data";

export type ProductHeaderAttributeKey =
  | "poNumber"
  | "branch"
  | "stockist"
  | "customerName"
  | "supplier"
  | "customerExpectation"
  | "eta"
  | "status"
  | "created"
  | "sales"
  | "createdBy"
  | "updated"
  | "updatedBy";

// Canonical display order — callers only control which keys are included
const ATTRIBUTE_ORDER: ProductHeaderAttributeKey[] = [
  "poNumber",
  "branch",
  "stockist",
  "customerName",
  "supplier",
  "customerExpectation",
  "eta",
  "status",
  "created",
  "sales",
  "createdBy",
  "updated",
  "updatedBy",
];

// Statuses that indicate the item is still just a request, not yet an order
const REQUEST_ONLY_STATUSES = new Set(["Open", "JB Verifying"]);

interface ProductHeaderProps {
  imageSrc: string;
  imageAlt: string;
  title: string;

  /** Which attributes to include — component enforces canonical ordering */
  visibleAttributes: ProductHeaderAttributeKey[];

  // Attribute data
  status?: string;
  poNumber?: string;
  /** Sales person username (resolved to full name, shown as "Sales") */
  salesUsername?: string;
  /** JB creator username (resolved to full name, shown as "JB") */
  createdByUsername?: string;
  branchCode?: BranchCode | string;
  stockistUsername?: string;
  /** Pre-resolved display name for customer */
  customerName?: string;
  /** Pre-resolved display name for supplier */
  supplier?: string;
  /** Pre-resolved display label for customer expectation */
  customerExpectation?: string;
  /** ISO date string — formatted internally */
  eta?: string;
  /** Unix timestamp — formatted internally */
  created?: number;
  /** Unix timestamp — formatted internally with time */
  updated?: number;
  updatedByUsername?: string;

  /** Callback for the "Original Request" button shown on actual orders */
  onOriginalRequest?: () => void;
  /** Whether a related request exists to link to */
  hasRelatedRequest?: boolean;
}

export function ProductHeader({
  imageSrc,
  imageAlt,
  title,
  visibleAttributes,
  status,
  poNumber,
  salesUsername,
  createdByUsername,
  branchCode,
  stockistUsername,
  customerName,
  supplier,
  customerExpectation,
  eta,
  created,
  updated,
  updatedByUsername,
  onOriginalRequest,
  hasRelatedRequest,
}: ProductHeaderProps) {
  const userRole =
    sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole") ||
    "sales";

  // Show "Original Request" only when status is past the request stage
  const isActualOrder = !!status && !REQUEST_ONLY_STATUSES.has(status);
  const showOriginalRequest =
    isActualOrder &&
    !!hasRelatedRequest &&
    !!onOriginalRequest &&
    userRole !== "supplier";

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestampWithTime = (ts?: number) => {
    if (!ts) return "";
    const date = new Date(ts);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    const s = date.getSeconds().toString().padStart(2, "0");
    return `${dateStr} ${h}:${m}:${s}`;
  };

  type AttrRow = { label: string; value: React.ReactNode; show: boolean };

  const attrDefs: Record<ProductHeaderAttributeKey, AttrRow> = {
    poNumber: {
      label: "PO Number",
      value: (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-medium font-mono">{poNumber}</span>
          {showOriginalRequest && (
            <button
              onClick={onOriginalRequest}
              className="text-xs text-blue-600 underline hover:text-blue-800 font-medium"
            >
              Original Request
            </button>
          )}
        </span>
      ),
      show: !!poNumber,
    },
    branch: {
      label: "Branch",
      value: (
        <span className="font-medium">
          {branchCode ? getBranchName(branchCode as BranchCode) : ""}
        </span>
      ),
      show: !!branchCode,
    },
    stockist: {
      label: "Stockist",
      value: (
        <span className="font-medium">
          {stockistUsername ? getFullNameFromUsername(stockistUsername) : ""}
        </span>
      ),
      show: !!stockistUsername,
    },
    customerName: {
      label: "Customer Name",
      value: <span className="font-medium">{customerName}</span>,
      show: !!customerName,
    },
    supplier: {
      label: "Supplier",
      value: <span className="font-medium">{supplier}</span>,
      show: !!supplier,
    },
    customerExpectation: {
      label: "Customer Expectation",
      value: <span className="font-medium">{customerExpectation}</span>,
      show: !!customerExpectation,
    },
    eta: {
      label: "ETA",
      value: formatDate(eta),
      show: true,
    },
    status: {
      label: "Status",
      value: (
        <span
          className={`inline-block text-xs ${getStatusBadgeClasses(status || "")} px-2 py-1 rounded-full font-medium w-fit`}
        >
          {status}
        </span>
      ),
      show: !!status,
    },
    created: {
      label: "Created",
      value: formatTimestamp(created),
      show: !!created,
    },
    sales: {
      label: "Sales",
      value: (
        <span className="font-medium">
          {salesUsername ? getFullNameFromUsername(salesUsername) : ""}
        </span>
      ),
      show: !!salesUsername,
    },
    createdBy: {
      label: "JB",
      value: (
        <span className="font-bold">
          {createdByUsername ? getFullNameFromUsername(createdByUsername) : ""}
        </span>
      ),
      show: !!createdByUsername,
    },
    updated: {
      label: "Updated",
      value: formatTimestampWithTime(updated),
      show: !!updated,
    },
    updatedBy: {
      label: "Updated By",
      value: (
        <span className="font-medium">
          {updatedByUsername ? getFullNameFromUsername(updatedByUsername) : ""}
        </span>
      ),
      show: !!updatedByUsername,
    },
  };

  const visibleSet = new Set(visibleAttributes);
  const rows = ATTRIBUTE_ORDER.filter((key) => visibleSet.has(key))
    .map((key) => attrDefs[key])
    .filter((row) => row.show);

  return (
    <div className="flex gap-4">
      <div className="w-32 h-32 shrink-0 border rounded-lg overflow-hidden bg-gray-50">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <div className="grid grid-cols-[minmax(160px,auto)_auto_1fr] gap-x-3 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-sm text-gray-700 mb-2 sm:mb-3">
          {rows.map((row, i) => (
            <Fragment key={i}>
              <span className="text-gray-600">{row.label}</span>
              <span>:</span>
              <span>{row.value}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
