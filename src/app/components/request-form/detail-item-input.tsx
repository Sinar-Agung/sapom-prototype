import { Button } from "@/app/components/ui/button";
import { Combobox } from "@/app/components/ui/combobox";
import { InputWithCheck } from "@/app/components/ui/input-with-check";
import { Label } from "@/app/components/ui/label";
import {
  KADAR_OPTIONS,
  UKURAN_KALUNG_OPTIONS,
  WARNA_OPTIONS,
} from "@/app/data/order-data";
import {
  ChevronDown,
  ChevronUp,
  Hash,
  Palette,
  Percent,
  Ruler,
  StickyNote,
  Weight,
} from "lucide-react";

export interface DetailInput {
  kadar: string;
  warna: string;
  ukuran: string;
  ukuranCustom: string;
  berat: string;
  pcs: string;
  notes?: string;
}

interface DetailItemInputProps {
  detailInput: DetailInput;
  onDetailInputChange: (detailInput: DetailInput) => void;
  kategoriBarang: string;
  jenisProduk: string;
  editingDetailId: string | null;
  isDisabled: boolean;
  isAddButtonDisabled: boolean;
  onAdd: () => void;
  onReset: () => void;
  onCancel: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export function DetailItemInput({
  detailInput,
  onDetailInputChange,
  kategoriBarang,
  jenisProduk,
  editingDetailId,
  isDisabled,
  isAddButtonDisabled,
  onAdd,
  onReset,
  onCancel,
  isExpanded = true,
  onToggleExpanded,
}: DetailItemInputProps) {
  return (
    <div className="bg-white sticky top-0 z-10 pb-2 sm:pb-3 border-b mb-2 sm:mb-3">
      {/* Title with Toggle Button (Mobile Only) - Always visible */}
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        {onToggleExpanded && (
          <button
            onClick={onToggleExpanded}
            className="sm:hidden p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle input form"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
        <h3 className="text-xs sm:text-sm font-medium">Input Detail Barang</h3>
      </div>

      {/* Form Fields - Collapsible on Mobile */}
      <div className={`${isExpanded ? "block" : "hidden"} sm:block`}>
        {/* Compact Input Row - Allow wrapping */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* Kadar */}
          <div className="w-[110px]" id="kadar-field-container">
            <Label
              htmlFor="kadar"
              className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
            >
              <div className="flex items-center">
                <Percent className="h-3 w-3 text-amber-600" />
              </div>
              Kadar{" "}
              {kategoriBarang === "model" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Combobox
              value={detailInput.kadar}
              onValueChange={(value) =>
                onDetailInputChange({
                  ...detailInput,
                  kadar: value,
                })
              }
              options={KADAR_OPTIONS}
              placeholder="Kadar"
              searchPlaceholder="Search purity..."
              emptyText="Purity not found."
              allowCustomValue={false}
              className="w-full"
              disabled={isDisabled}
            />
          </div>

          {/* Warna */}
          <div className="w-[168px]">
            <Label
              htmlFor="warna"
              className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
            >
              <Palette className="h-3 w-3 text-purple-600" />
              Warna{" "}
              {kategoriBarang === "model" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <Combobox
              value={detailInput.warna}
              onValueChange={(value) =>
                onDetailInputChange({
                  ...detailInput,
                  warna: value,
                })
              }
              options={WARNA_OPTIONS}
              placeholder="Warna"
              searchPlaceholder="Search color..."
              emptyText="Color not found."
              allowCustomValue={false}
              className="w-full"
              disabled={isDisabled}
            />
          </div>

          {/* Conditional Ukuran based on Jenis Produk */}
          {jenisProduk === "gelang-rantai" ? (
            <div className="w-[100px]">
              <Label
                htmlFor="ukuran"
                className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
              >
                <Ruler className="h-3 w-3 text-blue-600" />
                Ukuran (cm)
              </Label>
              <InputWithCheck
                id="ukuran"
                type="number"
                step="0.01"
                className="h-9 sm:h-8 text-sm w-full"
                value={detailInput.ukuran}
                onChange={(e) =>
                  onDetailInputChange({
                    ...detailInput,
                    ukuran: e.target.value,
                  })
                }
                placeholder="0"
                disabled={isDisabled}
              />
            </div>
          ) : jenisProduk === "kalung" ? (
            <div className="flex-shrink-0">
              <Label
                htmlFor="ukuran"
                className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
              >
                <Ruler className="h-3 w-3 text-blue-600" />
                Ukuran
              </Label>
              <div className="flex items-center gap-1">
                <Combobox
                  value={detailInput.ukuran}
                  onValueChange={(value) =>
                    onDetailInputChange({
                      ...detailInput,
                      ukuran: value,
                    })
                  }
                  options={UKURAN_KALUNG_OPTIONS}
                  placeholder="Ukuran"
                  searchPlaceholder="Search size..."
                  emptyText="Size not found."
                  allowCustomValue={false}
                  className="w-[150px]"
                  disabled={isDisabled}
                />
                {detailInput.ukuran === "other" && (
                  <InputWithCheck
                    type="number"
                    step="0.01"
                    className="h-9 sm:h-8 text-sm w-[100px]"
                    value={detailInput.ukuranCustom}
                    onChange={(e) =>
                      onDetailInputChange({
                        ...detailInput,
                        ukuranCustom: e.target.value,
                      })
                    }
                    placeholder="cm"
                    disabled={isDisabled}
                  />
                )}
              </div>
            </div>
          ) : jenisProduk === "gelang-kaku" ? (
            <div className="w-[100px]">
              <Label
                htmlFor="ukuran"
                className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
              >
                <Ruler className="h-3 w-3 text-blue-600" />
                Ukuran (cm)
              </Label>
              <InputWithCheck
                id="ukuran"
                type="number"
                step="0.01"
                className="h-9 sm:h-8 text-sm w-full"
                value={detailInput.ukuran}
                onChange={(e) =>
                  onDetailInputChange({
                    ...detailInput,
                    ukuran: e.target.value,
                  })
                }
                placeholder="0"
                disabled={isDisabled}
              />
            </div>
          ) : jenisProduk === "cincin" ? (
            <div className="w-[200px]">
              <Label
                htmlFor="ukuran"
                className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
              >
                <Ruler className="h-3 w-3 text-blue-600" />
                Ukuran (cm)
              </Label>
              <InputWithCheck
                id="ukuran"
                type="number"
                step="0.01"
                className="h-9 sm:h-8 text-sm w-full"
                value={detailInput.ukuran}
                onChange={(e) =>
                  onDetailInputChange({
                    ...detailInput,
                    ukuran: e.target.value,
                  })
                }
                placeholder="0"
                disabled={isDisabled}
              />
            </div>
          ) : null}

          {/* Berat */}
          <div className="w-[120px]">
            <Label
              htmlFor="berat"
              className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
            >
              <Weight className="h-3 w-3 text-slate-600" />
              Berat (gr){" "}
              {kategoriBarang === "basic" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <InputWithCheck
              id="berat"
              type="text"
              className="h-9 sm:h-8 text-sm w-full"
              value={detailInput.berat}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers, commas, dashes, and spaces (no decimal points)
                if (value === "" || /^[0-9,\-\s]+$/.test(value)) {
                  onDetailInputChange({
                    ...detailInput,
                    berat: value,
                  });
                }
              }}
              placeholder="2, 4, 7-9"
              disabled={isDisabled}
            />
          </div>

          {/* Pcs */}
          <div className="w-[100px]">
            <Label
              htmlFor="pcs"
              className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
            >
              <Hash className="h-3 w-3 text-green-600" />
              Pcs{" "}
              {kategoriBarang === "model" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <InputWithCheck
              id="pcs"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="h-9 sm:h-8 text-sm w-full"
              value={detailInput.pcs}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow non-negative integers
                if (value === "" || /^[0-9]+$/.test(value)) {
                  onDetailInputChange({
                    ...detailInput,
                    pcs: value,
                  });
                }
              }}
              placeholder="0"
              disabled={isDisabled}
            />
          </div>

          {/* Notes */}
          <div className="w-[150px]">
            <Label
              htmlFor="notes"
              className="text-[10px] text-gray-600 mb-0.5 flex items-center gap-1"
            >
              <StickyNote className="h-3 w-3 text-yellow-600" />
              Notes
            </Label>
            <InputWithCheck
              id="notes"
              type="text"
              className="h-9 sm:h-8 text-sm w-full"
              value={detailInput.notes}
              maxLength={50}
              onChange={(e) =>
                onDetailInputChange({
                  ...detailInput,
                  notes: e.target.value,
                })
              }
              placeholder="Optional notes..."
              disabled={isDisabled}
            />
          </div>

          {/* Add/Update and Cancel Buttons */}
          <div className="w-full sm:w-auto flex items-end gap-1.5 sm:gap-2">
            {editingDetailId && (
              <Button
                onClick={onCancel}
                size="sm"
                variant="outline"
                className="h-8 flex-1 sm:flex-initial sm:w-auto px-3 sm:px-4 text-xs sm:text-sm"
                disabled={isDisabled}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={onAdd}
              size="sm"
              className="h-8 flex-1 sm:flex-initial sm:w-auto px-3 sm:px-4 text-xs sm:text-sm"
              disabled={isAddButtonDisabled || isDisabled}
            >
              {editingDetailId ? "Update" : "Add"}
            </Button>
            {!editingDetailId &&
              (detailInput.kadar ||
                detailInput.warna ||
                detailInput.ukuran ||
                detailInput.berat ||
                detailInput.pcs ||
                detailInput.notes) && (
                <Button
                  onClick={onReset}
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 sm:flex-initial sm:w-auto px-3 sm:px-4 text-xs sm:text-sm text-gray-600"
                  disabled={isDisabled}
                >
                  Reset
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
