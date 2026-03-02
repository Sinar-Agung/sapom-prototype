import { DetailBarangItem } from "@/app/types/request";
import { AvailablePcsInput } from "./available-pcs-input";
import { Card } from "./card";

interface DetailItemsTableProps {
  items: DetailBarangItem[];
  mode?: "readonly" | "with-available-pcs";
  isJBWaiting?: boolean;
  onAvailablePcsChange?: (itemId: string, value: string) => void;
  getKadarColor: (kadar: string) => string;
  getWarnaColor: (warna: string) => string;
  getWarnaLabel?: (warna: string) => string;
  getUkuranLabel: (ukuran: string) => string;
  title?: string;
}

export function DetailItemsTable({
  items,
  mode = "readonly",
  isJBWaiting = false,
  onAvailablePcsChange,
  getKadarColor,
  getWarnaColor,
  getWarnaLabel,
  getUkuranLabel,
  title = "Detail Barang",
}: DetailItemsTableProps) {
  const displayWarnaLabel = (warna: string) => {
    if (getWarnaLabel) {
      return getWarnaLabel(warna);
    }
    return warna.toUpperCase();
  };

  return (
    <>
      {/* Desktop View (Table) */}
      <Card className="p-4 hidden md:block">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-sm border-collapse border">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  #
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Kadar
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Warna
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Ukuran
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  Berat (gr)
                </th>
                <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                  {mode === "with-available-pcs" ? "Requested Pcs" : "Pcs"}
                </th>
                {isJBWaiting && (
                  <th className="px-3 py-2 text-left font-medium border bg-amber-50">
                    Ordered Pcs
                  </th>
                )}
                {mode === "with-available-pcs" && (
                  <th className="px-3 py-2 text-left font-medium border bg-gray-100">
                    Available Pcs
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const kadarColor = getKadarColor(item.kadar.toLowerCase());
                const warnaColor = getWarnaColor(item.warna.toLowerCase());
                const ukuranLabel = getUkuranLabel(item.ukuran);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 border">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${kadarColor}`}
                      >
                        {item.kadar.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 border">
                      <span
                        className={`inline-block px-2 py-1 rounded font-medium ${warnaColor}`}
                      >
                        {displayWarnaLabel(item.warna)}
                      </span>
                    </td>
                    <td className="px-3 py-2 border">{ukuranLabel || "-"}</td>
                    <td className="px-3 py-2 border">{item.berat || "-"}</td>
                    <td className="px-3 py-2 border font-semibold text-center">
                      {item.pcs}
                    </td>
                    {isJBWaiting && (
                      <td className="px-3 py-2 border font-semibold text-amber-700 text-center bg-amber-50">
                        {item.orderPcs || "-"}
                      </td>
                    )}
                    {mode === "with-available-pcs" && (
                      <td className="px-3 py-2 border">
                        <div className="w-24">
                          <AvailablePcsInput
                            value={item.availablePcs || ""}
                            onChange={(value) =>
                              onAvailablePcsChange?.(item.id, value)
                            }
                            requestedPcs={item.pcs}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        {items.map((item, index) => {
          const kadarColor = getKadarColor(item.kadar.toLowerCase());
          const warnaColor = getWarnaColor(item.warna.toLowerCase());
          const ukuranLabel = getUkuranLabel(item.ukuran);

          return (
            <Card key={item.id} className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Item #{index + 1}</span>
                </div>

                <div className="flex gap-2 mb-3">
                  <div
                    className={`flex-1 ${kadarColor} rounded px-3 py-2 text-center`}
                  >
                    <div className="text-[10px] opacity-80">Kadar</div>
                    <div className="font-bold text-sm">
                      {item.kadar.toUpperCase()}
                    </div>
                  </div>
                  <div
                    className={`flex-1 ${warnaColor} rounded px-3 py-2 text-center`}
                  >
                    <div className="text-[10px] opacity-80">Warna</div>
                    <div className="font-semibold text-sm">
                      {displayWarnaLabel(item.warna)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Ukuran:</span>
                    <span className="ml-2 font-medium">
                      {ukuranLabel || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Berat:</span>
                    <span className="ml-2 font-medium">
                      {item.berat || "-"} gr
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {mode === "with-available-pcs" ? "Requested" : "Pcs"}:
                    </span>
                    <span className="ml-2 font-medium">{item.pcs}</span>
                  </div>
                  {isJBWaiting && (
                    <div>
                      <span className="text-gray-500">Ordered:</span>
                      <span className="ml-2 font-semibold text-amber-700">
                        {item.orderPcs || "-"}
                      </span>
                    </div>
                  )}
                  {mode === "with-available-pcs" && (
                    <div className="col-span-2">
                      <span className="text-gray-500 block mb-1">
                        Available Pcs:
                      </span>
                      <AvailablePcsInput
                        value={item.availablePcs || ""}
                        onChange={(value) =>
                          onAvailablePcsChange?.(item.id, value)
                        }
                        requestedPcs={item.pcs}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
