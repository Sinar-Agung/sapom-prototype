/**
 * ProductDetailsTable Component
 * 
 * A comprehensive, reusable table component for displaying product/order details
 * across different contexts in the application.
 * 
 * Use Cases:
 * 1. Product Details in requests menu
 * 2. Order Items in order details
 * 3. Request Items (Original) in order details
 * 4. Detail Barang in order details revision history
 * 5. Product details in Order menu (show items)
 */

import { DetailBarangItem } from "@/app/types/request";
import { AvailablePcsInput } from "./available-pcs-input";
import { Card } from "./card";

export interface ProductDetailsTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  sticky?: boolean;
  headerClassName?: string;
}

export interface ProductDetailsTableProps {
  /** Array of detail items to display */
  items: DetailBarangItem[];
  
  /** Table title */
  title?: string;
  
  /** Display mode */
  mode?: "readonly" | "with-available-pcs" | "with-ordered-pcs" | "with-changes";
  
  /** Show JB waiting columns (Ordered Pcs) */
  isJBWaiting?: boolean;
  
  /** Callback for available pcs changes */
  onAvailablePcsChange?: (itemId: string, value: string) => void;
  
  /** Helper function to get kadar color classes */
  getKadarColor: (kadar: string) => string;
  
  /** Helper function to get warna color classes */
  getWarnaColor: (warna: string) => string;
  
  /** Helper function to get warna label */
  getWarnaLabel?: (warna: string) => string;
  
  /** Helper function to get ukuran label/display */
  getUkuranLabel: (ukuran: string) => string;
  
  /** Previous items for comparison (for change detection) */
  previousItems?: DetailBarangItem[];
  
  /** Indices of new items (for highlighting) */
  newItemIndices?: number[];
  
  /** Show as collapsible card (mobile-first) */
  collapsible?: boolean;
  
  /** Custom columns configuration */
  customColumns?: ProductDetailsTableColumn[];
  
  /** Show card wrapper (default: true for desktop) */
  showCardWrapper?: boolean;
  
  /** Maximum height for scrollable table */
  maxHeight?: string;
  
  /** Additional CSS classes for table wrapper */
  className?: string;
  
  /** Show row numbers */
  showRowNumbers?: boolean;
  
  /** Highlight changed fields */
  highlightChanges?: boolean;
  
  /** Custom empty state message */
  emptyMessage?: string;
}

export function ProductDetailsTable({
  items,
  title = "Product Details",
  mode = "readonly",
  isJBWaiting = false,
  onAvailablePcsChange,
  getKadarColor,
  getWarnaColor,
  getWarnaLabel,
  getUkuranLabel,
  previousItems,
  newItemIndices = [],
  collapsible = false,
  customColumns,
  showCardWrapper = true,
  maxHeight = "600px",
  className = "",
  showRowNumbers = true,
  highlightChanges = false,
  emptyMessage = "No items to display",
}: ProductDetailsTableProps) {
  
  // Helper to display warna label
  const displayWarnaLabel = (warna: string) => {
    if (getWarnaLabel) {
      return getWarnaLabel(warna);
    }
    return warna.toUpperCase();
  };

  // Check if item is new
  const isNewItem = (index: number) => {
    return newItemIndices.includes(index);
  };

  // Check if field changed
  const isFieldChanged = (index: number, field: keyof DetailBarangItem) => {
    if (!highlightChanges || !previousItems || !previousItems[index]) {
      return false;
    }
    return items[index][field] !== previousItems[index][field];
  };

  // Get highlight classes for changed fields
  const getFieldHighlightClass = (index: number, field: keyof DetailBarangItem) => {
    if (isNewItem(index)) {
      return "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50";
    }
    if (isFieldChanged(index, field)) {
      return "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50";
    }
    return "border";
  };

  // Get row highlight class
  const getRowHighlightClass = (index: number) => {
    if (isNewItem(index)) {
      return "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50";
    }
    return "";
  };

  // Default columns configuration
  const defaultColumns: ProductDetailsTableColumn[] = [
    ...(showRowNumbers ? [{ key: "number", label: "#", align: "center" as const, width: "50px" }] : []),
    { key: "kadar", label: "Kadar", align: "left" as const },
    { key: "warna", label: "Warna", align: "left" as const },
    { key: "ukuran", label: "Ukuran", align: "left" as const },
    { key: "berat", label: "Berat (gr)", align: "left" as const },
    { key: "pcs", label: mode === "with-available-pcs" ? "Requested Pcs" : "Pcs", align: "left" as const },
    ...(isJBWaiting ? [{ key: "orderPcs", label: "Ordered Pcs", align: "center" as const, headerClassName: "bg-amber-50" }] : []),
    ...(mode === "with-available-pcs" ? [{ key: "availablePcs", label: "Available Pcs", align: "left" as const }] : []),
  ];

  const columns = customColumns || defaultColumns;

  // Empty state
  if (!items || items.length === 0) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  // Table content
  const tableContent = (
    <div className={`overflow-auto`} style={{ maxHeight }}>
      <table className="w-full text-sm border-collapse border">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 font-medium border bg-gray-100 ${
                  col.align === "center" ? "text-center" : 
                  col.align === "right" ? "text-right" : "text-left"
                } ${col.headerClassName || ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const kadarColor = getKadarColor(item.kadar.toLowerCase());
            const warnaColor = getWarnaColor(item.warna.toLowerCase());
            const ukuranLabel = getUkuranLabel(item.ukuran);
            const rowHighlight = getRowHighlightClass(index);

            return (
              <tr key={item.id || index} className={`hover:bg-gray-50 ${rowHighlight}`}>
                {columns.map((col) => {
                  // Row number
                  if (col.key === "number") {
                    return (
                      <td key={col.key} className="px-3 py-2 border text-center">
                        {index + 1}
                      </td>
                    );
                  }

                  // Kadar
                  if (col.key === "kadar") {
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${highlightChanges && !isNewItem(index) ? getFieldHighlightClass(index, "kadar") : "border"}`}
                      >
                        <span
                          className={`inline-block px-2 py-1 rounded font-medium ${kadarColor}`}
                        >
                          {item.kadar.toUpperCase()}
                        </span>
                      </td>
                    );
                  }

                  // Warna
                  if (col.key === "warna") {
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${highlightChanges && !isNewItem(index) ? getFieldHighlightClass(index, "warna") : "border"}`}
                      >
                        <span
                          className={`inline-block px-2 py-1 rounded font-medium ${warnaColor}`}
                        >
                          {displayWarnaLabel(item.warna)}
                        </span>
                      </td>
                    );
                  }

                  // Ukuran
                  if (col.key === "ukuran") {
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${highlightChanges && !isNewItem(index) ? getFieldHighlightClass(index, "ukuran") : "border"}`}
                      >
                        {ukuranLabel || "-"}
                      </td>
                    );
                  }

                  // Berat
                  if (col.key === "berat") {
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${highlightChanges && !isNewItem(index) ? getFieldHighlightClass(index, "berat") : "border"}`}
                      >
                        {item.berat || "-"}
                      </td>
                    );
                  }

                  // Pcs
                  if (col.key === "pcs") {
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 border font-semibold ${
                          col.align === "center" ? "text-center" : ""
                        } ${highlightChanges && !isNewItem(index) ? getFieldHighlightClass(index, "pcs") : ""}`}
                      >
                        {item.pcs}
                      </td>
                    );
                  }

                  // Order Pcs (JB waiting)
                  if (col.key === "orderPcs") {
                    return (
                      <td
                        key={col.key}
                        className="px-3 py-2 border font-semibold text-amber-700 text-center bg-amber-50"
                      >
                        {item.orderPcs || "-"}
                      </td>
                    );
                  }

                  // Available Pcs
                  if (col.key === "availablePcs") {
                    return (
                      <td key={col.key} className="px-3 py-2 border">
                        {mode === "with-available-pcs" ? (
                          <div className="w-24">
                            <AvailablePcsInput
                              value={item.availablePcs || ""}
                              onChange={(value) =>
                                onAvailablePcsChange?.(item.id, value)
                              }
                              requestedPcs={item.pcs}
                            />
                          </div>
                        ) : (
                          item.availablePcs || "-"
                        )}
                      </td>
                    );
                  }

                  return null;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Desktop View
  const desktopView = (
    <>
      {showCardWrapper ? (
        <Card className={`p-4 hidden md:block ${className}`}>
          {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
          {tableContent}
        </Card>
      ) : (
        <div className={`hidden md:block ${className}`}>
          {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
          {tableContent}
        </div>
      )}
    </>
  );

  // Mobile View (Cards)
  const mobileView = (
    <div className={`md:hidden space-y-3 ${className}`}>
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      {items.map((item, index) => {
        const kadarColor = getKadarColor(item.kadar.toLowerCase());
        const warnaColor = getWarnaColor(item.warna.toLowerCase());
        const ukuranLabel = getUkuranLabel(item.ukuran);
        const isNew = isNewItem(index);

        return (
          <Card
            key={item.id || index}
            className={`p-4 ${isNew ? "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50" : ""}`}
          >
            <div className="space-y-2 text-sm">
              {showRowNumbers && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Item #{index + 1}</span>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <div className={`flex-1 ${kadarColor} rounded px-3 py-2 text-center`}>
                  <div className="text-xs text-gray-600 mb-1">Kadar</div>
                  <div className="font-semibold">{item.kadar.toUpperCase()}</div>
                </div>
                <div className={`flex-1 ${warnaColor} rounded px-3 py-2 text-center`}>
                  <div className="text-xs text-gray-600 mb-1">Warna</div>
                  <div className="font-semibold">{displayWarnaLabel(item.warna)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Ukuran:</span>
                  <p className="font-medium">{ukuranLabel || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Berat:</span>
                  <p className="font-medium">{item.berat || "-"} gr</p>
                </div>
                <div>
                  <span className="text-gray-500">
                    {mode === "with-available-pcs" ? "Requested" : "Pcs"}:
                  </span>
                  <p className="font-medium">{item.pcs}</p>
                </div>
                {isJBWaiting && (
                  <div>
                    <span className="text-gray-500">Ordered:</span>
                    <p className="font-medium text-amber-700">{item.orderPcs || "-"}</p>
                  </div>
                )}
                {mode === "with-available-pcs" && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-1">Available Pcs:</span>
                    <AvailablePcsInput
                      value={item.availablePcs || ""}
                      onChange={(value) => onAvailablePcsChange?.(item.id, value)}
                      requestedPcs={item.pcs}
                    />
                  </div>
                )}
                {mode !== "with-available-pcs" && item.availablePcs && (
                  <div>
                    <span className="text-gray-500">Available:</span>
                    <p className="font-medium">{item.availablePcs}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      {desktopView}
      {mobileView}
    </>
  );
}

/**
 * Compact version for inline display (e.g., in revision history)
 */
export function ProductDetailsTableCompact({
  items,
  title,
  getKadarColor,
  getWarnaColor,
  getWarnaLabel,
  getUkuranLabel,
  previousItems,
  highlightChanges = false,
  showTitle = true,
}: {
  items: DetailBarangItem[];
  title?: string;
  getKadarColor: (kadar: string) => string;
  getWarnaColor: (warna: string) => string;
  getWarnaLabel?: (warna: string) => string;
  getUkuranLabel: (ukuran: string) => string;
  previousItems?: DetailBarangItem[];
  highlightChanges?: boolean;
  showTitle?: boolean;
}) {
  const displayWarnaLabel = (warna: string) => {
    if (getWarnaLabel) {
      return getWarnaLabel(warna);
    }
    return warna.toUpperCase();
  };

  const isNewItem = (index: number) => {
    return !previousItems || index >= (previousItems?.length || 0);
  };

  const isFieldChanged = (index: number, field: keyof DetailBarangItem) => {
    if (!highlightChanges || !previousItems || !previousItems[index]) {
      return false;
    }
    return items[index][field] !== previousItems[index][field];
  };

  const getFieldHighlightClass = (index: number, field: keyof DetailBarangItem) => {
    if (isNewItem(index)) {
      return "";
    }
    if (isFieldChanged(index, field)) {
      return "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50";
    }
    return "border";
  };

  const getRowHighlightClass = (index: number) => {
    if (isNewItem(index)) {
      return "border-4 border-red-500 animate-pulse shadow-lg shadow-red-500/50";
    }
    return "";
  };

  return (
    <div className="mt-4">
      {showTitle && (
        <p className="font-medium text-gray-700 text-xs mb-2">
          {title || `Product Details (${items.length} items)`}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Kadar</th>
              <th className="border px-2 py-1 text-left">Warna</th>
              <th className="border px-2 py-1 text-left">Ukuran</th>
              <th className="border px-2 py-1 text-right">Berat</th>
              <th className="border px-2 py-1 text-right">Pcs</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const rowHighlight = getRowHighlightClass(idx);
              return (
                <tr key={idx} className={rowHighlight}>
                  <td
                    className={`px-2 py-1 font-medium ${getKadarColor(item.kadar)} ${highlightChanges && !isNewItem(idx) ? getFieldHighlightClass(idx, "kadar") : "border"}`}
                  >
                    {item.kadar}
                  </td>
                  <td
                    className={`px-2 py-1 ${getWarnaColor(item.warna)} ${highlightChanges && !isNewItem(idx) ? getFieldHighlightClass(idx, "warna") : "border"}`}
                  >
                    {displayWarnaLabel(item.warna)}
                  </td>
                  <td
                    className={`px-2 py-1 ${highlightChanges && !isNewItem(idx) ? getFieldHighlightClass(idx, "ukuran") : "border"}`}
                  >
                    {getUkuranLabel(item.ukuran)}
                  </td>
                  <td
                    className={`px-2 py-1 text-right ${highlightChanges && !isNewItem(idx) ? getFieldHighlightClass(idx, "berat") : "border"}`}
                  >
                    {item.berat}
                  </td>
                  <td
                    className={`px-2 py-1 text-right ${highlightChanges && !isNewItem(idx) ? getFieldHighlightClass(idx, "pcs") : "border"}`}
                  >
                    {item.pcs}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
