import { NewBadge } from "@/app/components/new-badge";
import { Button } from "@/app/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRef } from "react";

export interface DetailBarangItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  notes?: string;
}

interface DetailItemsDisplayProps {
  items: DetailBarangItem[];
  newlyAddedIds: Set<string>;
  animatingIds: Set<string>;
  relocatingIds: Set<string>;
  editingDetailId: string | null;
  onRowClick: (id: string) => void;
  onEdit: (item: DetailBarangItem) => void;
  onDelete: (id: string) => void;
  onNotesClick: (itemId: string, x: number, y: number) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  tbodyRef: React.RefObject<HTMLTableSectionElement>;
  getKadarColor: (kadar: string) => string;
  getWarnaColor: (warna: string) => string;
  getWarnaLabel: (warna: string) => string;
  getUkuranDisplay: (ukuran: string) => { value: string; showUnit: boolean };
}

export function DetailItemsDisplay({
  items,
  newlyAddedIds,
  animatingIds,
  relocatingIds,
  editingDetailId,
  onRowClick,
  onEdit,
  onDelete,
  onNotesClick,
  rowRefs,
  cardRefs,
  tbodyRef,
  getKadarColor,
  getWarnaColor,
  getWarnaLabel,
  getUkuranDisplay,
}: DetailItemsDisplayProps) {
  const tableScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-h-[250px] overflow-auto" ref={tableScrollRef}>
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3 pr-1">
        {items.length === 0 ? (
          <div className="border rounded-lg p-4 text-center text-gray-500 text-sm">
            Belum ada data. Silakan tambahkan detail barang.
          </div>
        ) : (
          items.map((item, index) => {
            const ukuranDisplay = getUkuranDisplay(item.ukuran);
            const isNewlyAdded = newlyAddedIds.has(item.id);
            const isAnimating = animatingIds.has(item.id);
            const isRelocating = relocatingIds.has(item.id);
            const isEditing = editingDetailId === item.id;

            return (
              <div key={item.id} className="relative">
                {/* New Badge */}
                {isNewlyAdded && (
                  <div className="absolute -top-2 left-0 z-10">
                    <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border border-amber-500/30">
                      New
                    </div>
                  </div>
                )}

                {/* Card element */}
                <div
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(item.id, el);
                    } else {
                      cardRefs.current.delete(item.id);
                    }
                  }}
                  onClick={() => onRowClick(item.id)}
                  style={{
                    willChange: isRelocating ? "transform" : "auto",
                  }}
                  className={`border rounded-lg bg-white shadow-sm overflow-hidden flex cursor-pointer relative ${
                    isEditing
                      ? "editing-pulse"
                      : isAnimating
                        ? "glint-animation"
                        : isNewlyAdded
                          ? "golden-shimmer"
                          : ""
                  }`}
                >
                  {/* Left column: Kadar (top) and Warna (bottom) */}
                  <div className="flex flex-col w-16">
                    <div
                      className={`flex-1 ${getKadarColor(item.kadar)} flex items-center justify-center px-1`}
                    >
                      <span className="font-bold text-xs text-center">
                        {item.kadar.toUpperCase()}
                      </span>
                    </div>
                    <div
                      className={`flex-1 ${getWarnaColor(item.warna)} flex items-center justify-center px-1`}
                    >
                      <span className="font-semibold text-[10px] text-center leading-tight">
                        {getWarnaLabel(item.warna)}
                      </span>
                    </div>
                  </div>

                  {/* Middle content */}
                  <div className="flex-1 px-3 py-3 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">
                          Ukuran:
                        </span>
                        <span className="ml-1">
                          {ukuranDisplay.showUnit
                            ? `${ukuranDisplay.value} cm`
                            : ukuranDisplay.value}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">
                          Berat:
                        </span>
                        <span className="ml-1">{item.berat} gr</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Pcs:</span>
                        <span className="ml-1">{item.pcs}</span>
                      </div>
                      {item.notes && (
                        <div className="col-span-2">
                          <span className="font-medium text-gray-500">
                            Notes:
                          </span>
                          <span className="ml-1 break-words whitespace-pre-wrap">
                            {item.notes}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border p-2 text-left bg-gray-100">#</th>
              <th className="border p-2 text-left bg-gray-100">Kadar</th>
              <th className="border p-2 text-left bg-gray-100">Warna</th>
              <th className="border p-2 text-left bg-gray-100">Ukuran</th>
              <th className="border p-2 text-left bg-gray-100">Berat</th>
              <th className="border p-2 text-left bg-gray-100">Pcs</th>
              <th className="border p-2 text-left w-[200px] min-w-[200px] max-w-[200px] bg-gray-100">
                Notes
              </th>
              <th className="border p-2 text-center bg-gray-100">Aksi</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="border p-4 text-center text-gray-500"
                >
                  No data yet. Please add product details.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const ukuranDisplay = getUkuranDisplay(item.ukuran);
                const isNewlyAdded = newlyAddedIds.has(item.id);
                const isAnimating = animatingIds.has(item.id);
                const isRelocating = relocatingIds.has(item.id);
                const isEditing = editingDetailId === item.id;

                return (
                  <tr
                    key={item.id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(item.id, el);
                      } else {
                        rowRefs.current.delete(item.id);
                      }
                    }}
                    onClick={() => onRowClick(item.id)}
                    className={`${
                      isEditing
                        ? "editing-pulse"
                        : isAnimating
                          ? "glint-animation"
                          : isNewlyAdded
                            ? "golden-shimmer"
                            : "hover:bg-gray-50"
                    } cursor-pointer`}
                  >
                    <td className="border p-2 text-center relative">
                      {isNewlyAdded && (
                        <div className="absolute -top-1 -left-1">
                          <NewBadge className="w-8 h-8" />
                        </div>
                      )}
                      {index + 1}
                    </td>
                    <td className={`border p-2 ${getKadarColor(item.kadar)}`}>
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
                    <td className="border p-2">{item.berat}</td>
                    <td className="border p-2">{item.pcs}</td>
                    <td className="border p-2 w-[200px] min-w-[200px] max-w-[200px]">
                      <div
                        className={`truncate ${item.notes ? "cursor-pointer hover:text-gray-700" : ""}`}
                        onClick={(e) => {
                          if (item.notes) {
                            e.stopPropagation();
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            onNotesClick(item.id, rect.left, rect.bottom + 5);
                          }
                        }}
                        title={item.notes ? "Click to view full notes" : ""}
                      >
                        {item.notes || "-"}
                      </div>
                    </td>
                    <td className="border p-2 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
