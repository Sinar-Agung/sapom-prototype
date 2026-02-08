import { NewBadge } from "@/app/components/new-badge";
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
import { Combobox } from "@/app/components/ui/combobox";
import { DatePicker } from "@/app/components/ui/date-picker";
import { Input } from "@/app/components/ui/input";
import { InputWithCheck } from "@/app/components/ui/input-with-check";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  KADAR_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
  UKURAN_KALUNG_OPTIONS,
  WARNA_OPTIONS,
} from "@/app/data/order-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import {
  Hash,
  Palette,
  Percent,
  RotateCcw,
  Ruler,
  StickyNote,
  Trash2,
  Weight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Image mapping for Nama Basic
const NAMA_BASIC_IMAGES: Record<string, string> = {
  "italy-santa": italySanta,
  "italy-kaca": italyKaca,
  "italy-bambu": italyBambu,
  "kalung-flexi": kalungFlexi,
  "sunny-vanessa": sunnyVanessa,
  "hollow-fancy-nori": hollowFancyNori,
  milano: milano,
  tambang: tambang,
  casteli: casteli,
};

interface DetailBarangItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  notes?: string;
}

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

  // Parse berat values (e.g., "2, 4, 7-9" => [2, 4, 7, 8, 9])
  const parseBerat = (beratInput: string): string[] => {
    const result: string[] = [];
    const parts = beratInput.split(",").map((p) => p.trim());

    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            result.push(i.toString());
          }
        }
      } else if (part) {
        result.push(part);
      }
    });

    return result;
  };

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

  // Get Kadar background color
  const getKadarColor = (kadar: string) => {
    const colors: Record<string, string> = {
      "6k": "bg-green-500 text-white",
      "8k": "bg-blue-500 text-white",
      "9k": "bg-blue-700 text-white",
      "16k": "bg-orange-500 text-white",
      "17k": "bg-pink-500 text-white",
      "24k": "bg-red-500 text-white",
    };
    return colors[kadar.toLowerCase()] || "bg-gray-500 text-white";
  };

  // Get Warna background color
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

  // Get Warna display label
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

  // Get Ukuran display label - show description for predefined values, number+cm for custom values
  const getUkuranDisplay = (ukuran: string) => {
    const labels: Record<string, string> = {
      a: "Anak",
      n: "Normal",
      p: "Panjang",
      t: "Tanggung",
    };

    // Check if it's a predefined value
    const label = labels[ukuran.toLowerCase()];
    if (label) {
      return { value: label, showUnit: false };
    }

    // Otherwise it's a custom numeric value
    return { value: ukuran, showUnit: true };
  };

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

  // Filter Nama Produk options based on selected Jenis Produk
  const filteredNamaProdukOptions = formData.jenisProduk
    ? NAMA_PRODUK_OPTIONS.filter((option) =>
        option.value
          .toLowerCase()
          .startsWith(formData.jenisProduk.toLowerCase()),
      )
    : NAMA_PRODUK_OPTIONS;

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

    // Get existing orders from session storage
    const existingOrders = sessionStorage.getItem("orders");
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
        detailItems: detailItems,
        fotoBarangBase64: fotoBarangBase64,
        status: "Open", // Default status for new orders
      };

      // Add new order
      orders.push(order);

      // Store the last saved order ID
      setLastSavedOrderId(orderId);
    }

    // Save back to session storage
    sessionStorage.setItem("orders", JSON.stringify(orders));

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
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-4 gap-y-3">
            {/* Pabrik/Supplier */}
            <Label htmlFor="pabrik" className="text-xs md:pt-2">
              Pabrik/Supplier
            </Label>
            <Combobox
              value={formData.pabrik.id}
              onValueChange={(value) => {
                const selectedPabrik = PABRIK_OPTIONS.find(
                  (p) => p.value === value,
                );
                setFormData({
                  ...formData,
                  pabrik: selectedPabrik
                    ? {
                        id: selectedPabrik.value,
                        name: selectedPabrik.label,
                      }
                    : { id: "", name: "" },
                });
              }}
              options={PABRIK_OPTIONS}
              placeholder="Pilih pabrik..."
              searchPlaceholder="Cari pabrik..."
              emptyText="Pabrik tidak ditemukan."
              allowCustomValue={false}
            />

            {/* Atas Nama */}
            <Label htmlFor="namaPelanggan" className="text-xs md:pt-2">
              Atas Nama
            </Label>
            <Combobox
              value={formData.namaPelanggan.id || formData.namaPelanggan.name}
              onValueChange={(value) => {
                const selectedNama = ATAS_NAMA_OPTIONS.find(
                  (n) => n.value === value,
                );
                setFormData({
                  ...formData,
                  namaPelanggan: selectedNama
                    ? {
                        id: selectedNama.value,
                        name: selectedNama.label,
                      }
                    : { id: "", name: value },
                });
              }}
              options={ATAS_NAMA_OPTIONS}
              placeholder="Pilih atau ketik nama..."
              searchPlaceholder="Cari nama..."
              emptyText="Nama tidak ditemukan."
              autoOpenOnFocus={false}
              allowCustomValue={true}
            />

            {/* Customer Expectation */}
            <Label htmlFor="customerExpectation" className="text-xs md:pt-2">
              Customer Expectation
            </Label>
            <Combobox
              value={formData.customerExpectation}
              onValueChange={(value) => {
                const newETA = calculateETA(value);
                setFormData({
                  ...formData,
                  customerExpectation: value,
                  waktuKirim: newETA || formData.waktuKirim,
                });
              }}
              options={CUSTOMER_EXPECTATION_OPTIONS}
              placeholder="Pilih tindakan..."
              searchPlaceholder="Cari tindakan..."
              emptyText="Tindakan tidak ditemukan."
              allowCustomValue={false}
            />

            {/* Waktu Kirim (ETA) */}
            <Label htmlFor="waktuKirim" className="text-xs md:pt-2">
              Waktu Kirim (ETA)
            </Label>
            <DatePicker
              value={formData.waktuKirim}
              onValueChange={(date) =>
                setFormData({ ...formData, waktuKirim: date })
              }
              placeholder="Pilih tanggal ETA..."
              className="w-full"
              minDate={(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today;
              })()}
              disabled={formData.customerExpectation === "ready-marketing"}
            />

            {/* Kategori Barang */}
            <Label className="text-xs md:pt-2">Kategori Barang</Label>
            <RadioGroup
              value={formData.kategoriBarang}
              onValueChange={handleKategoriBarangChange}
              className="flex items-center space-x-3"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem
                  value="basic"
                  id="basic-header"
                  className="h-3 w-3"
                />
                <Label htmlFor="basic-header" className="font-normal text-xs">
                  Barang Basic
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem
                  value="model"
                  id="model-header"
                  className="h-3 w-3"
                />
                <Label htmlFor="model-header" className="font-normal text-xs">
                  Barang Model
                </Label>
              </div>
            </RadioGroup>

            {/* Jenis Produk */}
            <Label htmlFor="jenisProduk" className="text-xs md:pt-2">
              Jenis Produk
            </Label>
            <Combobox
              value={formData.jenisProduk}
              onValueChange={handleJenisProdukChange}
              options={JENIS_PRODUK_OPTIONS}
              placeholder="Pilih jenis..."
              searchPlaceholder="Cari jenis produk..."
              emptyText="Jenis tidak ditemukan."
              allowCustomValue={false}
            />

            {/* Conditional: Nama Basic (only for Barang Basic) OR Nama Model (for Barang Model) */}
            {formData.kategoriBarang === "basic" ? (
              <>
                <Label htmlFor="namaBasic" className="text-xs md:pt-2">
                  Nama Basic
                </Label>
                <Combobox
                  value={formData.namaBasic}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      namaBasic: value,
                    })
                  }
                  options={NAMA_BASIC_OPTIONS}
                  placeholder="Pilih atau ketik nama basic..."
                  searchPlaceholder="Cari nama basic..."
                  emptyText="Nama basic tidak ditemukan."
                />
              </>
            ) : (
              <>
                <Label htmlFor="namaProdukHeader" className="text-xs md:pt-2">
                  Nama Model
                </Label>
                <Combobox
                  value={formData.namaProduk}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      namaProduk: value,
                    })
                  }
                  options={filteredNamaProdukOptions}
                  placeholder="Pilih atau ketik nama model..."
                  searchPlaceholder="Cari model..."
                  emptyText="Model tidak ditemukan."
                />
              </>
            )}

            {/* Conditional: Foto Barang - Show preview for Basic, show uploader+preview for Model */}
            {formData.kategoriBarang === "basic" && formData.namaBasic ? (
              <>
                <Label className="text-xs md:pt-2">Foto Barang</Label>
                <div className="border rounded-md p-2 bg-gray-50">
                  <img
                    src={NAMA_BASIC_IMAGES[formData.namaBasic]}
                    alt={formData.namaBasic}
                    className="w-full sm:w-48 h-48 object-cover rounded"
                  />
                </div>
              </>
            ) : formData.kategoriBarang === "model" ? (
              <>
                <Label htmlFor="fotoBarang" className="text-xs md:pt-2">
                  Foto Barang <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  <Input
                    id="fotoBarang"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="h-9 sm:h-8 text-sm"
                    onChange={(e) => {
                      // Only update if user actually selected a file
                      if (e.target.files && e.target.files.length > 0) {
                        setFormData({
                          ...formData,
                          fotoBarang: e.target.files[0],
                        });
                      }
                      // If user cancels (files is null or empty), keep the previous image
                    }}
                    ref={fileInputRef}
                    key={fileInputKey}
                  />
                  {formData.fotoBarang && (
                    <div className="border rounded-md p-2 bg-gray-50 relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-7 px-2 rounded z-10 text-xs"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            fotoBarang: null,
                          });
                          setFileInputKey((prevKey) => prevKey + 1);
                        }}
                      >
                        Remove
                      </Button>
                      <img
                        src={URL.createObjectURL(formData.fotoBarang)}
                        alt="Preview"
                        className="w-full sm:w-48 h-48 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

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
          <div className="bg-white sticky top-0 z-10 pb-3 border-b mb-3">
            <h3 className="text-sm font-medium mb-2">Input Detail Barang</h3>

            {/* Compact Input Row - Allow wrapping */}
            <div className="flex flex-wrap gap-2">
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
                  {formData.kategoriBarang === "model" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Combobox
                  value={detailInput.kadar}
                  onValueChange={(value) =>
                    setDetailInput({
                      ...detailInput,
                      kadar: value,
                    })
                  }
                  options={KADAR_OPTIONS}
                  placeholder="Kadar"
                  searchPlaceholder="Cari kadar..."
                  emptyText="Kadar tidak ditemukan."
                  allowCustomValue={false}
                  className="w-full"
                  disabled={isDetailInputDisabled}
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
                  {formData.kategoriBarang === "model" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Combobox
                  value={detailInput.warna}
                  onValueChange={(value) =>
                    setDetailInput({
                      ...detailInput,
                      warna: value,
                    })
                  }
                  options={WARNA_OPTIONS}
                  placeholder="Warna"
                  searchPlaceholder="Cari warna..."
                  emptyText="Warna tidak ditemukan."
                  allowCustomValue={false}
                  className="w-full"
                  disabled={isDetailInputDisabled}
                />
              </div>

              {/* Conditional Ukuran based on Jenis Produk */}
              {formData.jenisProduk === "gelang-rantai" ? (
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
                      setDetailInput({
                        ...detailInput,
                        ukuran: e.target.value,
                      })
                    }
                    placeholder="0"
                    disabled={isDetailInputDisabled}
                  />
                </div>
              ) : formData.jenisProduk === "kalung" ? (
                <div className="w-[140px]">
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
                        setDetailInput({
                          ...detailInput,
                          ukuran: value,
                        })
                      }
                      options={UKURAN_KALUNG_OPTIONS}
                      placeholder="Ukuran"
                      searchPlaceholder="Cari ukuran..."
                      emptyText="Ukuran tidak ditemukan."
                      allowCustomValue={false}
                      className="w-full"
                      disabled={isDetailInputDisabled}
                    />
                    {detailInput.ukuran === "other" && (
                      <InputWithCheck
                        type="number"
                        step="0.01"
                        className="h-9 sm:h-8 text-sm w-16"
                        value={detailInput.ukuranCustom}
                        onChange={(e) =>
                          setDetailInput({
                            ...detailInput,
                            ukuranCustom: e.target.value,
                          })
                        }
                        placeholder="cm"
                        disabled={isDetailInputDisabled}
                      />
                    )}
                  </div>
                </div>
              ) : formData.jenisProduk === "gelang-kaku" ? (
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
                      setDetailInput({
                        ...detailInput,
                        ukuran: e.target.value,
                      })
                    }
                    placeholder="0"
                    disabled={isDetailInputDisabled}
                  />
                </div>
              ) : formData.jenisProduk === "cincin" ? (
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
                      setDetailInput({
                        ...detailInput,
                        ukuran: e.target.value,
                      })
                    }
                    placeholder="0"
                    disabled={isDetailInputDisabled}
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
                  {formData.kategoriBarang === "basic" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <InputWithCheck
                  id="berat"
                  type="text"
                  className="h-9 sm:h-8 text-sm w-full"
                  value={detailInput.berat}
                  onChange={(e) =>
                    setDetailInput({
                      ...detailInput,
                      berat: e.target.value,
                    })
                  }
                  placeholder="2, 4, 7-9"
                  disabled={isDetailInputDisabled}
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
                  {formData.kategoriBarang === "model" && (
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
                      setDetailInput({
                        ...detailInput,
                        pcs: value,
                      });
                    }
                  }}
                  placeholder="0"
                  disabled={isDetailInputDisabled}
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
                  onChange={(e) =>
                    setDetailInput({
                      ...detailInput,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Optional notes..."
                  disabled={isDetailInputDisabled}
                />
              </div>

              {/* Add/Update and Cancel Buttons */}
              <div className="w-full sm:w-auto sm:flex sm:items-end gap-2">
                {editingDetailId && (
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-8 w-full sm:w-auto px-4"
                    disabled={isDetailInputDisabled}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleAddDetail}
                  size="sm"
                  className="h-9 sm:h-8 w-full sm:w-auto px-4"
                  disabled={isAddButtonDisabled || isDetailInputDisabled}
                >
                  {editingDetailId ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable Detail Items Container - Shows ~5 rows before scrolling */}
          <div className="max-h-[250px] overflow-auto" ref={tableScrollRef}>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3 pr-1">
              {sortedDetailItems.length === 0 ? (
                <div className="border rounded-lg p-4 text-center text-gray-500 text-sm">
                  Belum ada data. Silakan tambahkan detail barang.
                </div>
              ) : (
                sortedDetailItems.map((item, index) => {
                  const ukuranDisplay = getUkuranDisplay(item.ukuran);
                  const isNewlyAdded = newlyAddedIds.has(item.id);
                  const isAnimating = animatingIds.has(item.id);
                  const isRelocating = relocatingIds.has(item.id);
                  const isEditing = editingDetailId === item.id;

                  return (
                    // Wrapper div to contain both badge and card as siblings
                    <div key={item.id} className="relative">
                      {/* New Badge - Positioned above the card, half outside */}
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
                        onClick={() => handleRowClick(item.id)}
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
                          {/* Kadar - Top left corner */}
                          <div
                            className={`flex-1 ${getKadarColor(item.kadar)} flex items-center justify-center px-1`}
                          >
                            <span className="font-bold text-xs text-center">
                              {item.kadar.toUpperCase()}
                            </span>
                          </div>

                          {/* Warna - Bottom left corner */}
                          <div
                            className={`flex-1 ${getWarnaColor(item.warna)} flex items-center justify-center px-1`}
                          >
                            <span className="font-semibold text-[10px] text-center leading-tight">
                              {getWarnaLabel(item.warna)}
                            </span>
                          </div>
                        </div>

                        {/* Middle content - Ukuran, Berat, Pcs, Notes */}
                        <div className="flex-1 px-3 py-3 flex flex-col gap-3">
                          <div className="flex items-start gap-8">
                            <div className="flex flex-col">
                              <div className="text-[10px] text-gray-500 mb-1 h-4">
                                Ukuran
                              </div>
                              {item.ukuran ? (
                                <div className="flex items-baseline gap-1">
                                  <span className="font-bold text-xl">
                                    {ukuranDisplay.value}
                                  </span>
                                  {ukuranDisplay.showUnit && (
                                    <span className="text-xs text-gray-600">
                                      cm
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">-</div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="text-[10px] text-gray-500 mb-1 h-4">
                                Berat
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-xl">
                                  {item.berat}
                                </span>
                                <span className="text-xs text-gray-600">
                                  gr
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="text-[10px] text-gray-500 mb-1 h-4">
                                Pcs
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-xl">
                                  {item.pcs}
                                </span>
                                <span className="text-xs text-gray-600">
                                  pcs
                                </span>
                              </div>
                            </div>
                          </div>
                          {item.notes && (
                            <div className="text-xs text-gray-600 border-t pt-2">
                              <span className="font-medium">Notes:</span>{" "}
                              <span
                                className="inline-block max-w-[200px] truncate align-bottom cursor-pointer hover:text-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setShowingNotesTooltip({
                                    itemId: item.id,
                                    x: rect.left,
                                    y: rect.bottom + 5,
                                  });
                                }}
                                title="Click to view full notes"
                              >
                                {item.notes}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right side action buttons */}
                        <div className="flex flex-col border-l">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDetail(item);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-1/2 px-3 text-xs whitespace-nowrap rounded-none border-b hover:bg-gray-100"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDetail(item.id);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-1/2 px-3 text-xs rounded-none hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* End card element */}
                      </div>
                      {/* End wrapper div */}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse border text-xs">
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
                  {sortedDetailItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border p-4 text-center text-gray-500"
                      >
                        Belum ada data. Silakan tambahkan detail barang.
                      </td>
                    </tr>
                  ) : (
                    sortedDetailItems.map((item, index) => {
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
                          onClick={() => handleRowClick(item.id)}
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
                          <td
                            className={`border p-2 ${getKadarColor(item.kadar)}`}
                          >
                            {item.kadar.toUpperCase()}
                          </td>
                          <td
                            className={`border p-2 ${getWarnaColor(item.warna)}`}
                          >
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
                                  setShowingNotesTooltip({
                                    itemId: item.id,
                                    x: rect.left,
                                    y: rect.bottom + 5,
                                  });
                                }
                              }}
                              title={
                                item.notes ? "Click to view full notes" : ""
                              }
                            >
                              {item.notes || "-"}
                            </div>
                          </td>
                          <td className="border p-2 text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDetail(item);
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
                                  handleDeleteDetail(item.id);
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
