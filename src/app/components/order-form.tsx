import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DetailItemInput } from "./order-form/detail-item-input";
import {
  DetailItemsDisplay,
  type DetailBarangItem,
} from "./order-form/detail-items-display";
import {
  getKadarColor,
  getUkuranDisplay,
  getWarnaColor,
  getWarnaLabel,
  parseBerat,
} from "./order-form/form-helpers";
import { OrderFormHeader } from "./order-form/order-form-header";

interface OrderFormProps {
  onFormChange?: (hasChanges: boolean) => void;
  initialData?: any;
  mode?: "new" | "edit" | "duplicate";
  onSaveComplete?: () => void;
  formTitle?: string;
}

export function OrderForm(props: OrderFormProps) {
  const {
    onFormChange,
    initialData,
    mode = "new",
    onSaveComplete,
    formTitle = "Form Input Pesanan (Salesman E / I)",
  } = props;

  const [formData, setFormData] = useState({
    pabrik: { id: "", name: "" },
    kategoriBarang: "basic",
    jenisProduk: "",
    namaProduk: "",
    namaBasic: "",
    fotoBarang: null as File | null,
    namaPelanggan: { id: "", name: "" },
    waktuKirim: undefined as Date | undefined,
    customerExpectation: "",
  });

  const [detailInput, setDetailInput] = useState({
    kadar: "",
    warna: "",
    ukuran: "",
    ukuranCustom: "",
    berat: "",
    pcs: "",
    notes: "",
  });

  const [detailItems, setDetailItems] = useState<DetailBarangItem[]>([]);
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [showingNotesTooltip, setShowingNotesTooltip] = useState<{
    itemId: string;
    x: number;
    y: number;
  } | null>(null); // Track which item's notes tooltip is showing and position
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [relocatingIds, setRelocatingIds] = useState<Set<string>>(new Set());
  const [sortedDetailItems, setSortedDetailItems] = useState<
    DetailBarangItem[]
  >([]);

  // Refs to track row elements for FLIP animation
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const previousNewlyAddedIds = useRef<Set<string>>(new Set());
  const previousPositions = useRef<Map<string, DOMRect>>(new Map());

  // State for confirmation dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [lastSavedOrderId, setLastSavedOrderId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    field: "kategoriBarang" | "jenisProduk";
    value: string;
  } | null>(null);

  // Track file input key to force remount when photo is cleared
  const [fileInputKey, setFileInputKey] = useState(0);

  // Ref for file input to manually clear it
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref for scrollable table container
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const handleAddDetail = () => {
    // Validation
    if (formData.kategoriBarang === "basic" && !detailInput.berat.trim()) {
      alert("Berat is mandatory for Barang Basic");
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
      // Update existing item
      const updatedItems = detailItems.map((item) =>
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

      // Sort the items after editing
      updatedItems.sort((a, b) => {
        // First sort by Kadar - extract numeric value
        const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
        const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
        if (kadarA !== kadarB) return kadarA - kadarB;

        // Then by Warna
        if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
        // Then by Ukuran
        if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
        // Finally by Berat
        return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
      });

      setDetailItems(updatedItems);
      // Clear old "New" items and mark the updated item as "New"
      // Force re-animation by clearing the previousNewlyAddedIds ref
      previousNewlyAddedIds.current = new Set();
      setNewlyAddedIds(new Set([editingDetailId]));
      setEditingDetailId(null);
    } else {
      // Add new items or merge with existing ones
      const updatedItems = [...detailItems];

      // Track new IDs for this batch (old "New" items will be cleared)
      const newIds = new Set<string>();

      beratValues.forEach((berat) => {
        // Check if an item with the same kadar, warna, ukuran, and berat exists
        const existingItemIndex = updatedItems.findIndex(
          (item) =>
            item.kadar === detailInput.kadar &&
            item.warna === detailInput.warna &&
            item.ukuran === finalUkuran &&
            item.berat === berat,
        );

        if (existingItemIndex !== -1) {
          // Merge by adding pcs to existing item
          const existingItem = updatedItems[existingItemIndex];
          const combinedNotes = [existingItem.notes, detailInput.notes]
            .filter(Boolean)
            .join(", "); // Separate notes with commas

          updatedItems[existingItemIndex] = {
            ...existingItem,
            pcs: (
              parseInt(existingItem.pcs) + parseInt(detailInput.pcs)
            ).toString(),
            notes: combinedNotes,
          };
          // Mark this existing item as "New" since it was updated
          newIds.add(existingItem.id);
        } else {
          // Add new item
          const newId = `${Date.now()}-${Math.random()}`;
          updatedItems.push({
            id: newId,
            kadar: detailInput.kadar,
            warna: detailInput.warna,
            ukuran: finalUkuran,
            berat: berat,
            pcs: detailInput.pcs,
            notes: detailInput.notes,
          });
          newIds.add(newId);
        }
      });

      // Check if we only updated existing items (no genuinely new items added)
      const onlyUpdatedExisting = Array.from(newIds).every((id) =>
        detailItems.some((item) => item.id === id),
      );

      // Replace old highlights with only the new ones
      // If only existing items were updated, force re-animation
      if (onlyUpdatedExisting && newIds.size > 0) {
        previousNewlyAddedIds.current = new Set();
      }
      setNewlyAddedIds(newIds);

      // Sort the items
      updatedItems.sort((a, b) => {
        // First sort by Kadar - extract numeric value
        const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
        const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
        if (kadarA !== kadarB) return kadarA - kadarB;

        // Then by Warna
        if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
        // Then by Ukuran
        if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
        // Finally by Berat
        return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
      });

      setDetailItems(updatedItems);
    }

    // Don't reset form - keep values for reuse
  };

  const handleEditDetail = (item: DetailBarangItem) => {
    setDetailInput({
      kadar: item.kadar,
      warna: item.warna,
      ukuran: item.ukuran,
      ukuranCustom: "",
      berat: item.berat,
      pcs: item.pcs,
      notes: item.notes,
    });
    setEditingDetailId(item.id);

    // Remove "New" status from the item being edited
    setNewlyAddedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(item.id);
      return updated;
    });

    // Focus on Kadar dropdown after a brief delay to ensure UI updates
    setTimeout(() => {
      const kadarContainer = document.getElementById("kadar-field-container");
      const kadarButton = kadarContainer?.querySelector(
        'button[role="combobox"]',
      ) as HTMLButtonElement;
      if (kadarButton) {
        kadarButton.focus();
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    if (!editingDetailId) return;

    // Trigger FLIP animation for the editing row/card sliding back to sorted position
    const rowElement = rowRefs.current.get(editingDetailId);
    const cardElement = cardRefs.current.get(editingDetailId);

    // Prefer the visible element (card on mobile, row on desktop)
    let element = null;
    if (cardElement) {
      const cardRect = cardElement.getBoundingClientRect();
      if (cardRect.height > 0) {
        element = cardElement; // Card is visible (mobile)
      }
    }
    if (!element && rowElement) {
      const rowRect = rowElement.getBoundingClientRect();
      if (rowRect.height > 0) {
        element = rowElement; // Row is visible (desktop)
      }
    }

    if (element) {
      // Measure FIRST position (current position at top)
      const firstPosition = element.getBoundingClientRect();
      console.log(
        `[CANCEL-EDIT] FIRST position: top=${firstPosition.top}, element=${element.tagName}`,
      );

      // Clear editing state, which will cause re-sort
      setEditingDetailId(null);

      // Use multiple requestAnimationFrame to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const lastPosition = element.getBoundingClientRect();
            console.log(`[CANCEL-EDIT] LAST position: top=${lastPosition.top}`);

            // Calculate delta
            const deltaY = firstPosition.top - lastPosition.top;
            console.log(`[CANCEL-EDIT] deltaY = ${deltaY}px`);

            // Apply FLIP animation if there's movement
            if (Math.abs(deltaY) > 1) {
              // Set initial transform (where it was)
              element.style.transform = `translateY(${deltaY}px)`;
              element.style.transition = "none";

              // Force reflow
              element.offsetHeight;

              // Animate to final position
              element.style.transition =
                "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
              element.style.transform = "translateY(0)";

              // Clean up after animation
              const cleanup = () => {
                if (element.style) {
                  element.style.transition = "";
                  element.style.transform = "";
                }
                element.removeEventListener("transitionend", cleanup);
              };
              element.addEventListener("transitionend", cleanup);
            }
          });
        });
      });
    } else {
      // No element found, just clear state
      console.warn("[CANCEL-EDIT] No visible element found");
      setEditingDetailId(null);
    }

    // Clear form
    setDetailInput({
      kadar: "",
      warna: "",
      ukuran: "",
      ukuranCustom: "",
      berat: "",
      pcs: "",
      notes: "",
    });
  };

  const handleDeleteDetail = (id: string) => {
    setDetailItems(detailItems.filter((item) => item.id !== id));
    setNewlyAddedIds(
      (prev) => new Set([...prev].filter((itemId) => itemId !== id)),
    );
  };

  // Remove "new" status from clicked row
  const handleRowClick = (id: string) => {
    // Don't allow row clicks during animation
    if (animatingIds.has(id) || relocatingIds.has(id)) {
      return; // Ignore clicks while animating
    }

    // Only remove from newlyAddedIds to stop the golden shimmer
    // This would only apply after animation completes
    setNewlyAddedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  // Check if Ukuran is required based on jenisProduk
  const ukuranRequired = [
    "gelang-rantai",
    "kalung",
    "gelang-kaku",
    "cincin",
  ].includes(formData.jenisProduk);

  // Check if Add button should be disabled
  const isAddButtonDisabled =
    !detailInput.kadar ||
    !detailInput.warna ||
    !detailInput.pcs ||
    // Berat is mandatory only for Barang Basic
    (formData.kategoriBarang === "basic" && !detailInput.berat) ||
    // Foto Barang is mandatory for Barang Model
    (formData.kategoriBarang === "model" && !formData.fotoBarang) ||
    // Ukuran is required only for Barang Basic when jenis produk requires it
    (formData.kategoriBarang === "basic" &&
      ukuranRequired &&
      !detailInput.ukuran) ||
    (detailInput.ukuran === "other" && !detailInput.ukuranCustom);

  // Handle Kategori Barang change with confirmation
  const handleKategoriBarangChange = (value: string) => {
    if (detailItems.length > 0 && value !== formData.kategoriBarang) {
      setPendingChange({ field: "kategoriBarang", value });
      setShowResetDialog(true);
    } else if (value !== formData.kategoriBarang) {
      // No detail items, but still need to clear category-specific fields and detail inputs
      setFormData({
        ...formData,
        kategoriBarang: value,
        jenisProduk: "",
        namaBasic: "",
        namaProduk: "",
        fotoBarang: null,
      });
      // Clear all detail input fields
      setDetailInput({
        kadar: "",
        warna: "",
        ukuran: "",
        ukuranCustom: "",
        berat: "",
        pcs: "",
        notes: "",
      });
    }
  };

  // Handle Jenis Produk change with confirmation
  const handleJenisProdukChange = (value: string) => {
    if (detailItems.length > 0 && value !== formData.jenisProduk) {
      setPendingChange({ field: "jenisProduk", value });
      setShowResetDialog(true);
    } else {
      // Reset nama basic/model and foto barang when jenis produk changes
      setFormData({
        ...formData,
        jenisProduk: value,
        namaBasic: "",
        namaProduk: "",
        fotoBarang: null,
      });
    }
  };

  // Confirm the change and reset detail items
  const handleConfirmChange = () => {
    if (pendingChange) {
      const updates: any = {
        [pendingChange.field]: pendingChange.value,
      };

      // If changing Kategori Barang, also reset Jenis Produk, Nama Basic/Model and Foto Barang
      if (pendingChange.field === "kategoriBarang") {
        updates.jenisProduk = "";
        updates.namaBasic = "";
        updates.namaProduk = "";
        updates.fotoBarang = null;
      }

      setFormData({ ...formData, ...updates });
      setDetailItems([]);
      setDetailInput({
        kadar: "",
        warna: "",
        ukuran: "",
        ukuranCustom: "",
        berat: "",
        pcs: "",
        notes: "",
      });
      setEditingDetailId(null);
      setNewlyAddedIds(new Set());
      setAnimatingIds(new Set());
      setRelocatingIds(new Set());
    }
    setShowResetDialog(false);
    setPendingChange(null);
  };

  // Cancel the change
  const handleCancelChange = () => {
    setShowResetDialog(false);
    setPendingChange(null);
  };

  // Check if all required header fields are filled to show Input Detail Barang
  const canShowDetailInput =
    formData.pabrik.id &&
    formData.waktuKirim &&
    formData.kategoriBarang &&
    formData.jenisProduk &&
    (formData.kategoriBarang === "basic"
      ? formData.namaBasic // For Basic, namaBasic must be filled (shows auto image)
      : formData.fotoBarang); // For Model, only fotoBarang is required (namaProduk is optional)

  // Disable all detail input controls when dialogs are open or when form is not ready
  const isDetailInputDisabled =
    !canShowDetailInput || showResetDialog || showNewOrderDialog;

  // Check if Simpan Pesanan button should be disabled
  const isSimpanDisabled =
    !formData.pabrik.id ||
    !formData.waktuKirim ||
    !formData.kategoriBarang ||
    !formData.jenisProduk ||
    (formData.kategoriBarang === "basic"
      ? !formData.namaBasic
      : !formData.fotoBarang) ||
    detailItems.length === 0;

  // Reset entire form
  const handleResetForm = () => {
    setFormData({
      pabrik: { id: "", name: "" },
      kategoriBarang: "basic",
      jenisProduk: "",
      namaProduk: "",
      namaBasic: "",
      fotoBarang: null,
      namaPelanggan: { id: "", name: "" },
      waktuKirim: undefined,
      customerExpectation: "",
    });
    setDetailInput({
      kadar: "",
      warna: "",
      ukuran: "",
      ukuranCustom: "",
      berat: "",
      pcs: "",
      notes: "",
    });
    setDetailItems([]);
    setEditingDetailId(null);
    setNewlyAddedIds(new Set());
    setAnimatingIds(new Set());
    setRelocatingIds(new Set());
  };

  // Notify parent when form changes
  useEffect(() => {
    if (onFormChange) {
      const hasValues = !!(
        formData.pabrik.id ||
        formData.namaPelanggan.id ||
        formData.waktuKirim ||
        formData.customerExpectation ||
        formData.jenisProduk ||
        formData.namaProduk ||
        formData.namaBasic ||
        formData.fotoBarang ||
        detailItems.length > 0
      );
      onFormChange(hasValues);
    }
  }, [formData, detailItems, onFormChange]);

  // Helper function to calculate ETA based on Customer Expectation
  const calculateETA = (action: string): Date | undefined => {
    if (!action) return undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (action === "ready-marketing") {
      // Set to today
      return new Date(today);
    } else if (action === "ready-pabrik") {
      // Set to a week from now
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return weekFromNow;
    } else if (action === "order-pabrik") {
      // Set to next month (same day next month)
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    }
    return undefined;
  };

  // Handle animation and sorting of detail items with FLIP
  useEffect(() => {
    // Check if items were actually ADDED (not just removed)
    const hasNewItems = Array.from(newlyAddedIds).some(
      (id) => !previousNewlyAddedIds.current.has(id),
    );

    // Update the ref for next comparison
    previousNewlyAddedIds.current = new Set(newlyAddedIds);

    // Only animate if items were actually added
    if (newlyAddedIds.size > 0 && hasNewItems) {
      // Capture the IDs that will be animated
      const idsToAnimate = new Set(newlyAddedIds);

      // First, set animating state to show items at top
      setAnimatingIds(idsToAnimate);

      // After 2 seconds, trigger FLIP animation to relocate to sorted position
      const timer = setTimeout(() => {
        console.log("[FLIP] Starting FLIP animation after 2s delay");
        // Use captured IDs, not current newlyAddedIds state
        setRelocatingIds(idsToAnimate);

        // Lock scroll position during animation
        const scrollContainer = tableScrollRef.current;
        const scrollTop = scrollContainer?.scrollTop || 0;
        console.log(`[FLIP] Locking scroll at position: ${scrollTop}`);

        // STEP 1: Measure FIRST positions in current layout (items at top)
        const firstPositions = new Map<string, DOMRect>();
        idsToAnimate.forEach((id) => {
          const rowElement = rowRefs.current.get(id);
          const cardElement = cardRefs.current.get(id);

          // Prefer the visible element (card on mobile, row on desktop)
          let element = null;
          if (cardElement) {
            const cardRect = cardElement.getBoundingClientRect();
            if (cardRect.height > 0) {
              element = cardElement; // Card is visible (mobile)
            }
          }
          if (!element && rowElement) {
            const rowRect = rowElement.getBoundingClientRect();
            if (rowRect.height > 0) {
              element = rowElement; // Row is visible (desktop)
            }
          }

          console.log(
            `[FLIP-START] Measuring item ${id}: rowElement=${!!rowElement}, cardElement=${!!cardElement}, using=${element?.tagName}`,
          );
          if (element) {
            const rect = element.getBoundingClientRect();
            firstPositions.set(id, rect);
            console.log(
              `[FLIP-START] Item ${id} FIRST position: top=${rect.top}, height=${rect.height}`,
            );
          } else {
            console.warn(
              `[FLIP-START] No visible element found for item ${id}`,
            );
          }
        });

        // STEP 2: Clear animatingIds to trigger React re-render with sorted order
        // This will cause the useEffect at line 813 to run and update sortedDetailItems
        setAnimatingIds(new Set());

        // STEP 3: After React updates the DOM, measure LAST positions and animate
        // Use multiple requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Restore scroll position after DOM update
              if (scrollContainer) {
                scrollContainer.scrollTop = scrollTop;
                console.log(`[FLIP] Restored scroll to: ${scrollTop}`);
              }

              console.log("[FLIP] Measuring LAST positions after DOM update");
              // Measure LAST positions in sorted layout
              const lastPositions = new Map<string, DOMRect>();
              idsToAnimate.forEach((id) => {
                const rowElement = rowRefs.current.get(id);
                const cardElement = cardRefs.current.get(id);

                // Prefer the visible element (card on mobile, row on desktop)
                let element = null;
                if (cardElement) {
                  const cardRect = cardElement.getBoundingClientRect();
                  if (cardRect.height > 0) {
                    element = cardElement; // Card is visible (mobile)
                  }
                }
                if (!element && rowElement) {
                  const rowRect = rowElement.getBoundingClientRect();
                  if (rowRect.height > 0) {
                    element = rowElement; // Row is visible (desktop)
                  }
                }

                console.log(
                  `[FLIP-LAST] Item ${id}: rowElement=${!!rowElement}, cardElement=${!!cardElement}, using=${element?.tagName}`,
                );
                if (element) {
                  const rect = element.getBoundingClientRect();
                  lastPositions.set(id, rect);
                  console.log(
                    `[FLIP-LAST] Item ${id} LAST position: top=${rect.top}, height=${rect.height}`,
                  );
                } else {
                  console.warn(
                    `[FLIP-LAST] No element found for item ${id} - refs may not be updated yet`,
                  );
                }
              });

              // Only proceed if we have valid positions for all items
              const hasAllPositions = Array.from(idsToAnimate).every(
                (id) => firstPositions.has(id) && lastPositions.has(id),
              );

              if (!hasAllPositions) {
                console.error(
                  "[FLIP] Missing positions for some items, aborting animation",
                );
                setRelocatingIds(new Set());
                return;
              }

              // STEP 4: Apply inverse transforms to lock visual position at old location
              idsToAnimate.forEach((id) => {
                const rowElement = rowRefs.current.get(id);
                const cardElement = cardRefs.current.get(id);

                // Prefer the visible element (card on mobile, row on desktop)
                let element = null;
                if (cardElement) {
                  const cardRect = cardElement.getBoundingClientRect();
                  if (cardRect.height > 0) {
                    element = cardElement; // Card is visible (mobile)
                  }
                }
                if (!element && rowElement) {
                  const rowRect = rowElement.getBoundingClientRect();
                  if (rowRect.height > 0) {
                    element = rowElement; // Row is visible (desktop)
                  }
                }

                const firstRect = firstPositions.get(id);
                const lastRect = lastPositions.get(id);

                if (element && firstRect && lastRect) {
                  // I - INVERT: Calculate difference
                  const deltaY = firstRect.top - lastRect.top;

                  console.log(
                    `[FLIP] Item ${id}: deltaY = ${deltaY}px, element type: ${element.tagName}`,
                  );

                  // Apply reverse transform immediately (keeps visual position)
                  element.style.transform = `translateY(${deltaY}px)`;
                  element.style.transition = "none";

                  // Force reflow
                  element.offsetHeight;
                }
              });

              // STEP 5: Animate to natural position (sorted location)
              requestAnimationFrame(() => {
                idsToAnimate.forEach((id) => {
                  const rowElement = rowRefs.current.get(id);
                  const cardElement = cardRefs.current.get(id);

                  // Prefer the visible element (card on mobile, row on desktop)
                  let element = null;
                  if (cardElement) {
                    const cardRect = cardElement.getBoundingClientRect();
                    if (cardRect.height > 0) {
                      element = cardElement; // Card is visible (mobile)
                    }
                  }
                  if (!element && rowElement) {
                    const rowRect = rowElement.getBoundingClientRect();
                    if (rowRect.height > 0) {
                      element = rowElement; // Row is visible (desktop)
                    }
                  }

                  if (element) {
                    console.log(
                      `[FLIP-PLAY] Animating item ${id} to natural position`,
                    );
                    // P - PLAY: Animate to natural position (0)
                    element.style.transition =
                      "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
                    element.style.transform = "translateY(0)";

                    // Clean up after animation
                    setTimeout(() => {
                      if (element.style) {
                        element.style.transition = "";
                        element.style.transform = "";
                      }
                    }, 950);
                  }
                });

                // Clear relocatingIds after animation completes
                setTimeout(() => {
                  setRelocatingIds(new Set());
                }, 950);
              });
            });
          });
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [newlyAddedIds]);

  // Update sorted items based on animation state
  useEffect(() => {
    const sortItems = (items: DetailBarangItem[]) => {
      return [...items].sort((a, b) => {
        // First sort by Kadar - extract numeric value
        const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
        const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
        if (kadarA !== kadarB) return kadarA - kadarB;

        // Then by Warna
        if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);

        // Then by Ukuran
        if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);

        // Finally by Berat
        return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
      });
    };

    if (editingDetailId) {
      // Show editing item at top with pulsing outline
      const editingItem = detailItems.find(
        (item) => item.id === editingDetailId,
      );
      const nonEditingItems = sortItems(
        detailItems.filter((item) => item.id !== editingDetailId),
      );
      setSortedDetailItems(
        editingItem
          ? [editingItem, ...nonEditingItems]
          : sortItems(detailItems),
      );
    } else if (animatingIds.size > 0) {
      // Step 1: Show new items at top with glint animation
      const animatingItems = detailItems.filter((item) =>
        animatingIds.has(item.id),
      );
      const nonAnimatingItems = sortItems(
        detailItems.filter((item) => !animatingIds.has(item.id)),
      );
      setSortedDetailItems([...animatingItems, ...nonAnimatingItems]);
    } else {
      // Step 2 or normal state: show all items sorted (FLIP animation handles repositioning)
      setSortedDetailItems(sortItems(detailItems));
    }
  }, [detailItems, animatingIds, editingDetailId]);

  // Scroll to top when new items are added
  useEffect(() => {
    if (newlyAddedIds.size > 0 && tableScrollRef.current) {
      // Scroll to top to show the animating items
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [newlyAddedIds]);

  // Scroll to top when editing an item
  useEffect(() => {
    if (editingDetailId && tableScrollRef.current) {
      // Scroll to top to show the editing item
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [editingDetailId]);

  // Save order to session storage
  const handleSaveOrder = async () => {
    // Convert image to base64 if it's a Model with uploaded photo
    let fotoBarangBase64 = "";
    if (formData.kategoriBarang === "model" && formData.fotoBarang) {
      const reader = new FileReader();
      fotoBarangBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(formData.fotoBarang!);
      });
    } else if (mode === "edit" && initialData?.fotoBarangBase64) {
      // Keep existing base64 image when editing
      fotoBarangBase64 = initialData.fotoBarangBase64;
    }

    // Get existing orders from local storage
    const existingOrders = localStorage.getItem("orders");
    const orders = existingOrders ? JSON.parse(existingOrders) : [];

    if (mode === "edit" && initialData?.id) {
      // Update existing order
      const orderIndex = orders.findIndex((o: any) => o.id === initialData.id);
      if (orderIndex !== -1) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          pabrik: formData.pabrik,
          kategoriBarang: formData.kategoriBarang,
          jenisProduk: formData.jenisProduk,
          namaProduk: formData.namaProduk,
          namaBasic: formData.namaBasic,
          namaPelanggan: formData.namaPelanggan,
          waktuKirim: formData.waktuKirim?.toISOString() || "",
          customerExpectation: formData.customerExpectation,
          detailItems: detailItems,
          fotoBarangBase64: fotoBarangBase64,
          // Keep existing id, timestamp, and status
        };
      }
    } else {
      // Create new order (for "new" and "duplicate" modes)
      const orderId = `order-${Date.now()}`;
      const order = {
        id: orderId,
        timestamp: Date.now(),
        createdBy:
          sessionStorage.getItem("username") ||
          localStorage.getItem("username") ||
          "",
        pabrik: formData.pabrik,
        kategoriBarang: formData.kategoriBarang,
        jenisProduk: formData.jenisProduk,
        namaProduk: formData.namaProduk,
        namaBasic: formData.namaBasic,
        namaPelanggan: formData.namaPelanggan,
        waktuKirim: formData.waktuKirim?.toISOString() || "",
        customerExpectation: formData.customerExpectation,
        detailItems: detailItems.map((item) => ({ ...item, orderPcs: "0" })),
        fotoBarangBase64: fotoBarangBase64,
        status: "Open", // Default status for new orders
      };

      // Add new order
      orders.push(order);

      // Store the last saved order ID
      setLastSavedOrderId(orderId);
    }

    // Save back to local storage
    localStorage.setItem("orders", JSON.stringify(orders));

    // Show dialog asking if user wants to create new order with same values
    setShowNewOrderDialog(true);

    // Call onSaveComplete if provided
    if (onSaveComplete) {
      onSaveComplete();
    }
  };

  // Handle adding another order
  const handleAddAnother = () => {
    // Keep all current values including detail items
    // Only reset the editing state
    setEditingDetailId(null);
    setShowNewOrderDialog(false);
  };

  // Handle viewing My Requests
  const handleViewMyRequests = () => {
    // Store the last saved order ID in sessionStorage for highlighting
    if (lastSavedOrderId) {
      sessionStorage.setItem("highlightOrderId", lastSavedOrderId);
    }
    setShowNewOrderDialog(false);
    // Navigate to My Requests page
    window.location.href = "/my-requests";
  };

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData && mode !== "new") {
      setFormData({
        pabrik: initialData.pabrik,
        kategoriBarang: initialData.kategoriBarang,
        jenisProduk: initialData.jenisProduk,
        namaProduk: initialData.namaProduk,
        namaBasic: initialData.namaBasic,
        fotoBarang: null, // Reset fotoBarang as it's not stored in initialData
        namaPelanggan: initialData.namaPelanggan,
        waktuKirim: initialData.waktuKirim
          ? new Date(initialData.waktuKirim)
          : undefined,
        customerExpectation: initialData.customerExpectation,
      });
      setDetailItems(initialData.detailItems);
    }
  }, [initialData, mode]);

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <Card className="p-3 sm:p-4">
        {/* Header with Title and Reset Button */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl">{formTitle}</h1>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-8 flex items-center gap-1.5"
            onClick={handleResetForm}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Form</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>

        {/* Header Section */}
        <OrderFormHeader
          formData={formData}
          onFormDataChange={setFormData}
          onKategoriBarangChange={handleKategoriBarangChange}
          onJenisProdukChange={handleJenisProdukChange}
          fileInputRef={fileInputRef}
          fileInputKey={fileInputKey}
          onFileInputKeyChange={setFileInputKey}
        />

        {/* Input Detail Barang Section */}
        <div className="border-t pt-4 mb-4 relative">
          {/* Overlay when required fields are not filled */}
          {!canShowDetailInput && (
            <div className="absolute inset-0 bg-gray-400/30 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-md">
              <div className="bg-white/90 px-6 py-4 rounded-lg shadow-lg text-center max-w-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Lengkapi data header terlebih dahulu
                </p>
                <p className="text-xs text-gray-600">
                  Isi: Pabrik, Waktu Kirim, Kategori Barang, Jenis Produk,
                  {formData.kategoriBarang === "basic"
                    ? " Nama Basic"
                    : " Foto Barang"}
                </p>
              </div>
            </div>
          )}

          {/* Sticky Input Form */}
          <DetailItemInput
            detailInput={detailInput}
            onDetailInputChange={setDetailInput}
            kategoriBarang={formData.kategoriBarang}
            jenisProduk={formData.jenisProduk}
            editingDetailId={editingDetailId}
            isDisabled={isDetailInputDisabled}
            isAddButtonDisabled={isAddButtonDisabled}
            onAdd={handleAddDetail}
            onCancel={handleCancelEdit}
          />

          {/* Scrollable Detail Items Container - Shows ~5 rows before scrolling */}
          <DetailItemsDisplay
            items={sortedDetailItems}
            newlyAddedIds={newlyAddedIds}
            animatingIds={animatingIds}
            relocatingIds={relocatingIds}
            editingDetailId={editingDetailId}
            onRowClick={handleRowClick}
            onEdit={handleEditDetail}
            onDelete={handleDeleteDetail}
            onNotesClick={(itemId, x, y) =>
              setShowingNotesTooltip({ itemId, x, y })
            }
            rowRefs={rowRefs}
            cardRefs={cardRefs}
            tbodyRef={tbodyRef}
            getKadarColor={getKadarColor}
            getWarnaColor={getWarnaColor}
            getWarnaLabel={getWarnaLabel}
            getUkuranDisplay={getUkuranDisplay}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button
            size="sm"
            className="h-9 sm:h-8 w-full sm:w-auto"
            disabled={isSimpanDisabled}
            onClick={handleSaveOrder}
          >
            Simpan Pesanan
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Peringatan</AlertDialogTitle>
            <AlertDialogDescription>
              Mengubah kategori barang atau jenis produk akan menghapus semua
              detail barang yang telah ditambahkan. Apakah Anda yakin ingin
              melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Order Confirmation Dialog */}
      <AlertDialog
        open={showNewOrderDialog}
        onOpenChange={setShowNewOrderDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pesanan Tersimpan</AlertDialogTitle>
            <AlertDialogDescription>
              Pesanan Anda telah berhasil disimpan. Apa yang ingin Anda lakukan
              selanjutnya?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleViewMyRequests}>
              View My Requests
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAddAnother}>
              Add Another
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notes Tooltip */}
      {showingNotesTooltip && (
        <>
          {/* Invisible overlay to close tooltip when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowingNotesTooltip(null)}
          />
          {/* Tooltip box */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 max-w-sm"
            style={{
              left: `${showingNotesTooltip.x}px`,
              top: `${showingNotesTooltip.y}px`,
              transform: "translateY(0)",
            }}
          >
            <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {detailItems.find(
                (item) => item.id === showingNotesTooltip.itemId,
              )?.notes || ""}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
