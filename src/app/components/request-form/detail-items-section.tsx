import { DetailItemInput } from "./detail-item-input";
import { DetailItemsDisplay } from "./detail-items-display";
import {
  getKadarColor,
  getUkuranDisplay,
  getWarnaColor,
  getWarnaLabel,
} from "./form-helpers";
import type { DetailItemsHookReturn } from "./use-detail-items";

interface DetailItemsSectionProps {
  /** Return value of useDetailItems hook. */
  state: DetailItemsHookReturn;
  kategoriBarang: string;
  jenisProduk: string;
  /**
   * When false, an overlay is shown over the section indicating the user
   * must complete required header fields first. Defaults to true.
   */
  canShowDetailInput?: boolean;
  /** Custom message shown inside the overlay. */
  overlayHint?: string;
  /**
   * When false, the input form is hidden (e.g. for read-only roles like
   * Sales in the Update Order screen). Defaults to true.
   */
  showInput?: boolean;
  /**
   * Additional disabled state for all controls in the section
   * (e.g. when a confirmation dialog is open). Defaults to false.
   */
  isDisabled?: boolean;
  /** Show the Copy button on each row. Defaults to false. */
  showCopy?: boolean;
  /** Called when a row's notes icon is clicked. x/y are viewport coordinates. */
  onNotesClick?: (itemId: string, x: number, y: number) => void;
}

/**
 * Reusable "Input Detail Barang" section.
 *
 * Combines a sticky input form (`DetailItemInput`) and an animated,
 * scrollable items table (`DetailItemsDisplay`) with an optional overlay
 * guard.  All state is managed by the `useDetailItems` hook – pass its
 * return value as the `state` prop.
 */
export function DetailItemsSection({
  state,
  kategoriBarang,
  jenisProduk,
  canShowDetailInput = true,
  overlayHint,
  showInput = true,
  isDisabled = false,
  showCopy = true,
  onNotesClick,
}: DetailItemsSectionProps) {
  const {
    detailInput,
    editingDetailId,
    sortedItems,
    newlyAddedIds,
    animatingIds,
    relocatingIds,
    isInputFormExpanded,
    isAddButtonDisabled,
    rowRefs,
    cardRefs,
    tbodyRef,
    setDetailInput,
    setIsInputFormExpanded,
    handleAdd,
    handleEdit,
    handleCopy,
    handleCancelEdit,
    handleDelete,
    handleRowClick,
  } = state;

  const effectiveDisabled = isDisabled || !canShowDetailInput;

  return (
    <div className="relative">
      {/* Overlay guard when required header fields are not yet filled */}
      {!canShowDetailInput && (
        <div className="absolute inset-0 bg-gray-400/30 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-md">
          <div className="bg-white/90 px-6 py-4 rounded-lg shadow-lg text-center max-w-md">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Please complete the header data first
            </p>
            {overlayHint && (
              <p className="text-xs text-gray-600">{overlayHint}</p>
            )}
          </div>
        </div>
      )}

      {/* Sticky input form */}
      {showInput && (
        <div className="sticky top-0 z-10 bg-white">
          <DetailItemInput
            detailInput={detailInput}
            onDetailInputChange={setDetailInput}
            kategoriBarang={kategoriBarang}
            jenisProduk={jenisProduk}
            editingDetailId={editingDetailId}
            isDisabled={effectiveDisabled}
            isAddButtonDisabled={isAddButtonDisabled}
            onAdd={handleAdd}
            onReset={() => setDetailInput({ kadar: "", warna: "", ukuran: "", ukuranCustom: "", berat: "", pcs: "", notes: "" })}
            onCancel={handleCancelEdit}
            isExpanded={isInputFormExpanded}
            onToggleExpanded={() =>
              setIsInputFormExpanded(!isInputFormExpanded)
            }
          />
        </div>
      )}

      {/* Scrollable items display */}
      <DetailItemsDisplay
        items={sortedItems}
        newlyAddedIds={newlyAddedIds}
        animatingIds={animatingIds}
        relocatingIds={relocatingIds}
        editingDetailId={editingDetailId}
        onRowClick={handleRowClick}
        onEdit={showInput ? handleEdit : undefined}
        onCopy={showCopy ? handleCopy : undefined}
        onDelete={showInput ? handleDelete : undefined}
        onNotesClick={onNotesClick ?? (() => {})}
        rowRefs={rowRefs}
        cardRefs={cardRefs}
        tbodyRef={tbodyRef}
        getKadarColor={getKadarColor}
        getWarnaColor={getWarnaColor}
        getWarnaLabel={getWarnaLabel}
        getUkuranDisplay={getUkuranDisplay}
        isInputFormExpanded={isInputFormExpanded}
      />
    </div>
  );
}
