import { useEffect, useRef, useState } from "react";
import {
  CUSTOMER_EXPECTATION_OPTIONS,
  getLabelFromValue,
} from "../data/order-data";
import { MinimalRequest } from "../types/request";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface DetailItemsTableProps {
  order: MinimalRequest;
  userRole: "sales" | "stockist" | "jb";
}

export function DetailItemsTable({ order, userRole }: DetailItemsTableProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const noteRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newOverflow = new Set<string>();
    for (const id of Object.keys(noteRefs.current)) {
      const el = noteRefs.current[id];
      if (el && el.scrollWidth > el.clientWidth) newOverflow.add(id);
    }
    setOverflowIds(newOverflow);
  }, [order.detailItems]);

  const getKadarColor = (kadar: string) => {
    // Return empty string to use default table styling (white background, black text)
    return "bg-white text-black";
  };

  const getWarnaColor = (warna: string) => {
    const colors: Record<string, string> = {
      rg: "bg-rose-300 text-gray-800",
      ap: "bg-gray-200 text-gray-800",
      kn: "bg-yellow-400 text-gray-800",
      ks: "bg-yellow-300 text-gray-800",
      "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
      "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
    };
    return colors[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
  };

  const getWarnaLabel = (warna: string) => {
    const labels: Record<string, string> = {
      rg: "RG",
      ap: "AP",
      kn: "KN",
      ks: "KS",
      "2w-ap-rg": "2W (AP & RG)",
      "2w-ap-kn": "2W (AP & KN)",
    };
    return labels[warna.toLowerCase()] || warna.toUpperCase();
  };

  const getUkuranDisplay = (ukuran: string) => {
    // Check if ukuran is a number (which means it's in cm)
    const numValue = parseFloat(ukuran);
    if (!isNaN(numValue)) {
      return { value: ukuran, showUnit: true };
    }
    // Otherwise it's a size like "S", "M", "L"
    return { value: ukuran, showUnit: false };
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-3 bg-white p-3 sm:p-4 rounded-lg border">
      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {order.customerExpectation && (
          <div>
            <span className="text-gray-500">Customer Expectation:</span>
            <p className="font-medium">
              {getLabelFromValue(
                CUSTOMER_EXPECTATION_OPTIONS,
                order.customerExpectation,
              )}
            </p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Total Items:</span>
          <p className="font-medium">{order.detailItems.length} item(s)</p>
        </div>
      </div>

      {/* Detail Items Table */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">Product Details</h4>
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full border-collapse border text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2 text-left bg-gray-100">#</th>
                <th className="border p-2 text-left bg-gray-100">Kadar</th>
                <th className="border p-2 text-left bg-gray-100">Warna</th>
                <th className="border p-2 text-left bg-gray-100">Ukuran</th>
                <th className="border p-2 text-left bg-gray-100">Berat</th>
                <th className="border p-2 text-left bg-gray-100">Pcs</th>
                {userRole === "stockist" && (
                  <th className="border p-2 text-left bg-gray-100">
                    Available Pcs
                  </th>
                )}
                <th className="border p-2 text-left bg-gray-100">Notes</th>
              </tr>
            </thead>
            <tbody>
              {order.detailItems.map((item, index) => {
                const ukuranDisplay = getUkuranDisplay(item.ukuran);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td
                      className={`border p-2 font-medium ${getKadarColor(item.kadar)}`}
                    >
                      {item.kadar.toUpperCase()}
                    </td>
                    <td className={`border p-2 ${getWarnaColor(item.warna)}`}>
                      {getWarnaLabel(item.warna)}
                    </td>
                    <td className="border p-2">
                      {ukuranDisplay.showUnit
                        ? `${ukuranDisplay.value} cm`
                        : ukuranDisplay.value}
                    </td>
                    <td className="border p-2">{item.berat || "-"}</td>
                    <td className="border p-2">{item.pcs}</td>
                    {userRole === "stockist" && (
                      <td className="border p-2">{item.availablePcs || "-"}</td>
                    )}
                    <td className="border p-2 max-w-[150px]">
                      {item.notes ? (
                        <div className="flex items-center gap-1">
                          <span
                            ref={(el) => {
                              noteRefs.current[item.id] = el;
                            }}
                            className="truncate text-xs text-gray-700 max-w-[100px] inline-block"
                          >
                            {item.notes}
                          </span>
                          {overflowIds.has(item.id) && (
                            <Tooltip
                              open={expandedNote === item.id}
                              onOpenChange={(open: boolean) =>
                                setExpandedNote(open ? item.id : null)
                              }
                            >
                              <TooltipTrigger asChild>
                                <button
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium shrink-0 underline"
                                  onClick={() =>
                                    setExpandedNote(
                                      expandedNote === item.id ? null : item.id,
                                    )
                                  }
                                >
                                  more
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[240px] whitespace-pre-wrap break-words text-xs"
                              >
                                {item.notes}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
