import { useEffect, useRef, useState } from "react";
import type { DetailInput } from "./detail-item-input";
import type { DetailBarangItem } from "./detail-items-display";
import { parseBerat } from "./form-helpers";

const EMPTY_INPUT: DetailInput = {
  kadar: "",
  warna: "",
  ukuran: "",
  ukuranCustom: "",
  berat: "",
  pcs: "",
  notes: "",
};

interface UseDetailItemsOptions {
  initialItems?: DetailBarangItem[];
  kategoriBarang: string;
  jenisProduk: string;
  /** Extra condition to block the Add button (e.g. photo not yet uploaded). */
  additionalDisabledForAdd?: boolean;
}

export interface DetailItemsHookReturn {
  items: DetailBarangItem[];
  detailInput: DetailInput;
  editingDetailId: string | null;
  newlyAddedIds: Set<string>;
  animatingIds: Set<string>;
  relocatingIds: Set<string>;
  sortedItems: DetailBarangItem[];
  isInputFormExpanded: boolean;
  isAddButtonDisabled: boolean;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  tbodyRef: React.RefObject<HTMLTableSectionElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  setDetailInput: (input: DetailInput) => void;
  setIsInputFormExpanded: (expanded: boolean) => void;
  handleAdd: () => void;
  handleEdit: (item: DetailBarangItem) => void;
  handleCopy: (item: DetailBarangItem) => void;
  handleCancelEdit: () => void;
  handleDelete: (id: string) => void;
  handleRowClick: (id: string) => void;
  /** Reset all internal state (call when kategoriBarang/jenisProduk changes). */
  resetAll: (newItems?: DetailBarangItem[]) => void;
}

export function useDetailItems({
  initialItems = [],
  kategoriBarang,
  jenisProduk,
  additionalDisabledForAdd = false,
}: UseDetailItemsOptions): DetailItemsHookReturn {
  const [detailInput, setDetailInput] = useState<DetailInput>(EMPTY_INPUT);
  const [items, setItems] = useState<DetailBarangItem[]>(initialItems);
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [relocatingIds, setRelocatingIds] = useState<Set<string>>(new Set());
  const [sortedItems, setSortedItems] = useState<DetailBarangItem[]>([]);
  const [isInputFormExpanded, setIsInputFormExpanded] = useState(true);

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousNewlyAddedIds = useRef<Set<string>>(new Set());

  // ─── Sort helper ──────────────────────────────────────────────────────────
  const sortItems = (arr: DetailBarangItem[]): DetailBarangItem[] =>
    [...arr].sort((a, b) => {
      const ka = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
      const kb = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
      if (ka !== kb) return ka - kb;
      if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
      if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
      return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
    });

  // ─── Update sortedItems whenever items / animation state changes ──────────
  useEffect(() => {
    if (editingDetailId) {
      const editingItem = items.find((i) => i.id === editingDetailId);
      const nonEditing = sortItems(
        items.filter((i) => i.id !== editingDetailId),
      );
      setSortedItems(
        editingItem ? [editingItem, ...nonEditing] : sortItems(items),
      );
    } else if (animatingIds.size > 0) {
      const animating = items.filter((i) => animatingIds.has(i.id));
      const rest = sortItems(items.filter((i) => !animatingIds.has(i.id)));
      setSortedItems([...animating, ...rest]);
    } else {
      setSortedItems(sortItems(items));
    }
  }, [items, animatingIds, editingDetailId]);

  // ─── FLIP animation when new items are added ──────────────────────────────
  useEffect(() => {
    const hasNewItems = Array.from(newlyAddedIds).some(
      (id) => !previousNewlyAddedIds.current.has(id),
    );
    previousNewlyAddedIds.current = new Set(newlyAddedIds);

    if (newlyAddedIds.size === 0 || !hasNewItems) return;

    const idsToAnimate = new Set(newlyAddedIds);
    setAnimatingIds(idsToAnimate);

    const timer = setTimeout(() => {
      setRelocatingIds(idsToAnimate);

      const scrollContainer = containerRef.current;
      const scrollTop = scrollContainer?.scrollTop ?? 0;

      // FIRST: measure current (animated top) positions
      const firstPositions = new Map<string, DOMRect>();
      idsToAnimate.forEach((id) => {
        const el = getVisibleElement(id, rowRefs, cardRefs);
        if (el) firstPositions.set(id, el.getBoundingClientRect());
      });

      // Transition to sorted order
      setAnimatingIds(new Set());

      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (scrollContainer) scrollContainer.scrollTop = scrollTop;

            const lastPositions = new Map<string, DOMRect>();
            idsToAnimate.forEach((id) => {
              const el = getVisibleElement(id, rowRefs, cardRefs);
              if (el) lastPositions.set(id, el.getBoundingClientRect());
            });

            const hasAll = Array.from(idsToAnimate).every(
              (id) => firstPositions.has(id) && lastPositions.has(id),
            );
            if (!hasAll) {
              setRelocatingIds(new Set());
              return;
            }

            // INVERT
            idsToAnimate.forEach((id) => {
              const el = getVisibleElement(id, rowRefs, cardRefs);
              const first = firstPositions.get(id);
              const last = lastPositions.get(id);
              if (el && first && last) {
                const deltaY = first.top - last.top;
                el.style.transform = `translateY(${deltaY}px)`;
                el.style.transition = "none";
                el.offsetHeight; // force reflow
              }
            });

            // PLAY
            requestAnimationFrame(() => {
              idsToAnimate.forEach((id) => {
                const el = getVisibleElement(id, rowRefs, cardRefs);
                if (el) {
                  el.style.transition =
                    "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
                  el.style.transform = "translateY(0)";
                  setTimeout(() => {
                    if (el.style) {
                      el.style.transition = "";
                      el.style.transform = "";
                    }
                  }, 950);
                }
              });
              setTimeout(() => setRelocatingIds(new Set()), 950);
            });
          }),
        ),
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [newlyAddedIds]);

  // ─── Scroll to top on new items / editing ─────────────────────────────────
  useEffect(() => {
    if (newlyAddedIds.size > 0 && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [newlyAddedIds]);

  useEffect(() => {
    if (editingDetailId && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingDetailId]);

  // ─── isAddButtonDisabled ───────────────────────────────────────────────────
  const ukuranRequired = [
    "gelang-rantai",
    "kalung",
    "gelang-kaku",
    "cincin",
  ].includes(jenisProduk);

  const isAddButtonDisabled =
    additionalDisabledForAdd ||
    !detailInput.kadar ||
    !detailInput.warna ||
    !detailInput.pcs ||
    (kategoriBarang === "basic" && !detailInput.berat) ||
    (kategoriBarang === "basic" && ukuranRequired && !detailInput.ukuran) ||
    (detailInput.ukuran === "other" && !detailInput.ukuranCustom);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (kategoriBarang === "basic" && !detailInput.berat.trim()) {
      alert("Weight is mandatory for Basic Products");
      return;
    }

    const beratValues = detailInput.berat
      ? parseBerat(detailInput.berat)
      : [""];
    const finalUkuran =
      detailInput.ukuran === "other"
        ? detailInput.ukuranCustom
        : detailInput.ukuran;

    if (editingDetailId) {
      const updated = items.map((item) =>
        item.id === editingDetailId
          ? {
              ...item,
              kadar: detailInput.kadar,
              warna: detailInput.warna,
              ukuran: finalUkuran,
              berat: detailInput.berat,
              pcs: detailInput.pcs,
              notes: detailInput.notes,
            }
          : item,
      );
      previousNewlyAddedIds.current = new Set();
      setItems(updated);
      setNewlyAddedIds(new Set([editingDetailId]));
      setEditingDetailId(null);
    } else {
      const updatedItems = [...items];
      const newIds = new Set<string>();

      beratValues.forEach((berat) => {
        const existingIdx = updatedItems.findIndex(
          (item) =>
            item.kadar === detailInput.kadar &&
            item.warna === detailInput.warna &&
            item.ukuran === finalUkuran &&
            item.berat === berat,
        );

        if (existingIdx !== -1) {
          const existing = updatedItems[existingIdx];
          updatedItems[existingIdx] = {
            ...existing,
            pcs: (
              parseInt(existing.pcs) + parseInt(detailInput.pcs)
            ).toString(),
            notes: [existing.notes, detailInput.notes]
              .filter(Boolean)
              .join(", "),
          };
          newIds.add(existing.id);
        } else {
          const newId = `${Date.now()}-${Math.random()}`;
          updatedItems.push({
            id: newId,
            kadar: detailInput.kadar,
            warna: detailInput.warna,
            ukuran: finalUkuran,
            berat,
            pcs: detailInput.pcs,
            notes: detailInput.notes,
          });
          newIds.add(newId);
        }
      });

      const onlyUpdatedExisting = Array.from(newIds).every((id) =>
        items.some((i) => i.id === id),
      );
      if (onlyUpdatedExisting && newIds.size > 0) {
        previousNewlyAddedIds.current = new Set();
      }

      setNewlyAddedIds(newIds);
      setItems(updatedItems);
      // Keep kadar/warna/ukuran for quick entry; only clear berat/pcs/notes
      setDetailInput({ ...detailInput, berat: "", pcs: "", notes: "" });
    }
  };

  const handleEdit = (item: DetailBarangItem) => {
    setDetailInput({
      kadar: item.kadar,
      warna: item.warna,
      ukuran: item.ukuran,
      ukuranCustom: "",
      berat: item.berat,
      pcs: item.pcs,
      notes: item.notes ?? "",
    });
    setEditingDetailId(item.id);
    setIsInputFormExpanded(true);
    setNewlyAddedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(item.id);
      return updated;
    });
    setTimeout(() => {
      const kadarBtn = document
        .getElementById("kadar-field-container")
        ?.querySelector('button[role="combobox"]') as HTMLButtonElement | null;
      kadarBtn?.focus();
    }, 100);
  };

  const handleCopy = (item: DetailBarangItem) => {
    setDetailInput({
      kadar: item.kadar,
      warna: item.warna,
      ukuran: item.ukuran,
      ukuranCustom: "",
      berat: item.berat,
      pcs: item.pcs,
      notes: item.notes ?? "",
    });
    setIsInputFormExpanded(true);
    setTimeout(() => {
      const kadarBtn = document
        .getElementById("kadar-field-container")
        ?.querySelector('button[role="combobox"]') as HTMLButtonElement | null;
      kadarBtn?.focus();
    }, 100);
  };

  const handleCancelEdit = () => {
    if (!editingDetailId) return;

    const el = getVisibleElement(editingDetailId, rowRefs, cardRefs);
    if (el) {
      const firstPosition = el.getBoundingClientRect();
      setEditingDetailId(null);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const lastPosition = el.getBoundingClientRect();
            const deltaY = firstPosition.top - lastPosition.top;
            if (Math.abs(deltaY) > 1) {
              el.style.transform = `translateY(${deltaY}px)`;
              el.style.transition = "none";
              el.offsetHeight;
              el.style.transition =
                "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
              el.style.transform = "translateY(0)";
              const cleanup = () => {
                if (el.style) {
                  el.style.transition = "";
                  el.style.transform = "";
                }
                el.removeEventListener("transitionend", cleanup);
              };
              el.addEventListener("transitionend", cleanup);
            }
          }),
        ),
      );
    } else {
      setEditingDetailId(null);
    }

    setDetailInput(EMPTY_INPUT);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setNewlyAddedIds((prev) => new Set([...prev].filter((x) => x !== id)));
    if (editingDetailId === id) {
      setEditingDetailId(null);
      setDetailInput(EMPTY_INPUT);
    }
  };

  const handleRowClick = (id: string) => {
    if (animatingIds.has(id) || relocatingIds.has(id)) return;
    setNewlyAddedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  const resetAll = (newItems: DetailBarangItem[] = []) => {
    setItems(newItems);
    setDetailInput(EMPTY_INPUT);
    setEditingDetailId(null);
    setNewlyAddedIds(new Set());
    setAnimatingIds(new Set());
    setRelocatingIds(new Set());
    previousNewlyAddedIds.current = new Set();
  };

  return {
    items,
    detailInput,
    editingDetailId,
    newlyAddedIds,
    animatingIds,
    relocatingIds,
    sortedItems,
    isInputFormExpanded,
    isAddButtonDisabled,
    rowRefs,
    cardRefs,
    tbodyRef,
    containerRef,
    setDetailInput,
    setIsInputFormExpanded,
    handleAdd,
    handleEdit,
    handleCopy,
    handleCancelEdit,
    handleDelete,
    handleRowClick,
    resetAll,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getVisibleElement(
  id: string,
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>,
  cardRefs: React.MutableRefObject<Map<string, HTMLDivElement>>,
): HTMLElement | null {
  const card = cardRefs.current.get(id);
  if (card && card.getBoundingClientRect().height > 0) return card;
  const row = rowRefs.current.get(id);
  if (row && row.getBoundingClientRect().height > 0) return row;
  return null;
}
