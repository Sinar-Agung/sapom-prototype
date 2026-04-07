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
import { storeImageDeduped } from "@/app/utils/image-storage";
import {
  notifyRequestCreated,
  notifyRequestUpdated,
} from "@/app/utils/notification-helper";
import { generateRequestNo } from "@/app/utils/request-number";
import { getCurrentUserDetails } from "@/app/utils/user-data";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DetailBarangItem } from "./request-form/detail-items-display";
import { DetailItemsSection } from "./request-form/detail-items-section";
import { RequestFormHeader } from "./request-form/request-form-header";
import { useDetailItems } from "./request-form/use-detail-items";

interface RequestFormProps {
  onFormChange?: (hasChanges: boolean) => void;
  initialData?: any;
  mode?: "new" | "edit" | "duplicate";
  onSaveComplete?: (action: "save" | "saveAndAddMore") => void;
  onNavigateToMyRequests?: () => void;
  onCancel?: () => void;
  formTitle?: string;
}

export function RequestForm(props: RequestFormProps) {
  const {
    onFormChange,
    initialData,
    mode = "new",
    onSaveComplete,
    onNavigateToMyRequests,
    onCancel,
    formTitle = "Create Request",
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
    notes: "",
    notes: "",
  });

  const detailItemsState = useDetailItems({
    initialItems: [],
    kategoriBarang: formData.kategoriBarang,
    jenisProduk: formData.jenisProduk,
  });
  const detailItems = detailItemsState.items;

  const [showingNotesTooltip, setShowingNotesTooltip] = useState<{
    itemId: string;
    x: number;
    y: number;
  } | null>(null); // Track which item's notes tooltip is showing and position

  // State for confirmation dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [lastSavedOrderId, setLastSavedOrderId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{
    field: "kategoriBarang" | "jenisProduk";
    value: string;
  } | null>(null);

  // Track file input key to force remount when photo is cleared
  const [fileInputKey, setFileInputKey] = useState(0);

  // Track stored photo ID for edit mode (when photo is already saved)
  const [existingPhotoId, setExistingPhotoId] = useState<string | null>(null);

  // Ref for file input to manually clear it
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track initial state for change detection when editing
  const initialStateRef = useRef<{
    formData: typeof formData;
    detailItems: DetailBarangItem[];
  } | null>(null);

  // State for cancel confirmation dialog
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false);

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
      setExistingPhotoId(null);
      detailItemsState.resetAll();
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
      setExistingPhotoId(null);
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
      setExistingPhotoId(null);
      detailItemsState.resetAll();
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
    (formData.kategoriBarang === "basic"
      ? formData.jenisProduk && formData.namaBasic // For Basic, jenisProduk and namaBasic are required
      : true); // For Model, photo is not required to enable input (save button is disabled instead)

  // Check if Simpan Pesanan button should be disabled
  const isSimpanDisabled =
    !formData.pabrik.id ||
    !formData.waktuKirim ||
    !formData.kategoriBarang ||
    (formData.kategoriBarang === "basic"
      ? !formData.jenisProduk || !formData.namaBasic
      : !formData.fotoBarang && !existingPhotoId) ||
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
    detailItemsState.resetAll();
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
  }, [formData, detailItemsState.items, onFormChange]);

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
      // Set to 4 weeks (28 days) from now
      const fourWeeks = new Date(today);
      fourWeeks.setDate(fourWeeks.getDate() + 28);
      return fourWeeks;
    }
    return undefined;
  };

  // Save order to session storage
  const handleShowSaveConfirmation = () => {
    setShowSaveConfirmDialog(true);
  };

  const handleSaveOrder = async (action: "save" | "saveAndAddMore") => {
    // Convert image to photoId if it's a Model with uploaded photo
    let photoId: string | undefined;
    if (formData.kategoriBarang === "model" && formData.fotoBarang) {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(formData.fotoBarang!);
      });
      photoId = await storeImageDeduped(base64Data);
    } else if (
      (mode === "edit" || mode === "duplicate") &&
      initialData?.photoId
    ) {
      photoId = initialData.photoId;
    } else if (
      (mode === "edit" || mode === "duplicate") &&
      initialData?.fotoBarangBase64
    ) {
      // Migrate legacy base64 to deduped image store
      photoId = await storeImageDeduped(initialData.fotoBarangBase64);
    }

    // Get existing orders from local storage
    const existingOrders = localStorage.getItem("requests");
    const orders = existingOrders ? JSON.parse(existingOrders) : [];

    if (mode === "edit" && initialData?.id) {
      // Update existing order
      const orderIndex = orders.findIndex((o: any) => o.id === initialData.id);
      if (orderIndex !== -1) {
        // Save old request for change detection
        const oldRequest = { ...orders[orderIndex] };

        // Get current user
        const currentUser =
          sessionStorage.getItem("username") ||
          localStorage.getItem("username") ||
          "";

        // Build revision entry capturing what changed
        const newWaktuKirim = formData.waktuKirim?.toISOString() || "";
        const existingRevisions = oldRequest.revisionHistory || [];
        const revision = {
          revisionNumber: existingRevisions.length + 1,
          timestamp: Date.now(),
          updatedBy: currentUser,
          changes: {
            pabrik: formData.pabrik,
            kategoriBarang: formData.kategoriBarang,
            jenisProduk: formData.jenisProduk,
            namaProduk: formData.namaProduk,
            namaBasic: formData.namaBasic,
            namaPelanggan: formData.namaPelanggan,
            waktuKirim: newWaktuKirim,
            customerExpectation: formData.customerExpectation,
            notes: formData.notes,
            detailItems: detailItems,
            ...(photoId ? { photoId } : {}),
          },
          previousValues: {
            pabrik: oldRequest.pabrik,
            kategoriBarang: oldRequest.kategoriBarang,
            jenisProduk: oldRequest.jenisProduk,
            namaProduk: oldRequest.namaProduk,
            namaBasic: oldRequest.namaBasic,
            namaPelanggan: oldRequest.namaPelanggan,
            waktuKirim: oldRequest.waktuKirim,
            customerExpectation: oldRequest.customerExpectation,
            notes: oldRequest.notes,
            detailItems: oldRequest.detailItems,
            ...(oldRequest.photoId ? { photoId: oldRequest.photoId } : {}),
          },
        };

        // Update the request
        orders[orderIndex] = {
          ...orders[orderIndex],
          pabrik: formData.pabrik,
          kategoriBarang: formData.kategoriBarang,
          jenisProduk: formData.jenisProduk,
          namaProduk: formData.namaProduk,
          namaBasic: formData.namaBasic,
          namaPelanggan: formData.namaPelanggan,
          waktuKirim: newWaktuKirim,
          customerExpectation: formData.customerExpectation,
          notes: formData.notes,
          detailItems: detailItems,
          photoId: photoId,
          fotoBarangBase64: undefined,
          updatedDate: Date.now(),
          updatedBy: currentUser,
          revisionHistory: [...existingRevisions, revision],
          // Keep existing id, timestamp, and status
        };

        // Create notification about the update
        const newRequest = orders[orderIndex];
        if (newRequest.status === "Open") {
          notifyRequestUpdated(oldRequest, newRequest, currentUser);
        }
      }
    } else {
      // Create new order (for "new" and "duplicate" modes)
      const orderId = `order-${Date.now()}`;
      const currentUserDetails = getCurrentUserDetails();
      const order = {
        id: orderId,
        timestamp: Date.now(),
        requestNo: generateRequestNo(currentUserDetails?.branchCode),
        createdBy:
          sessionStorage.getItem("username") ||
          localStorage.getItem("username") ||
          "",
        branchCode: currentUserDetails?.branchCode || undefined,
        pabrik: formData.pabrik,
        kategoriBarang: formData.kategoriBarang,
        jenisProduk: formData.jenisProduk,
        namaProduk: formData.namaProduk,
        namaBasic: formData.namaBasic,
        namaPelanggan: formData.namaPelanggan,
        waktuKirim: formData.waktuKirim?.toISOString() || "",
        customerExpectation: formData.customerExpectation,
        notes: formData.notes || undefined,
        detailItems: detailItems.map((item) => ({ ...item, orderPcs: "0" })),
        photoId: photoId,
        status: "Open", // Default status for new orders
      };

      // Add new order
      orders.push(order);

      // Store the last saved order ID
      setLastSavedOrderId(orderId);
    }

    // Save back to local storage
    localStorage.setItem("requests", JSON.stringify(orders));

    // Create notification for new request (only for new and duplicate modes)
    if (mode !== "edit") {
      const currentUser =
        sessionStorage.getItem("username") ||
        localStorage.getItem("username") ||
        "";
      const savedOrder = orders[orders.length - 1]; // Get the newly added order
      notifyRequestCreated(savedOrder, currentUser);
    }

    // Show success toast
    toast.success("Request saved");

    // Handle different actions
    if (action === "save") {
      // Navigate to My Requests page
      if (lastSavedOrderId && mode !== "edit") {
        sessionStorage.setItem("highlightOrderId", lastSavedOrderId);
      }
      if (onNavigateToMyRequests) {
        onNavigateToMyRequests();
      }
    } else if (action === "saveAndAddMore") {
      // Keep on page with all values intact, just scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Call onSaveComplete if provided
    if (onSaveComplete) {
      onSaveComplete(action);
    }
  };

  // Calculate delivery date from today based on customer expectation
  const calcDeliveryDateFromExpectation = (expectation: string): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectation === "ready-pabrik") {
      const d = new Date(today);
      d.setDate(today.getDate() + 7);
      return d;
    } else if (expectation === "order-pabrik") {
      const d = new Date(today);
      d.setDate(today.getDate() + 28);
      return d;
    }
    return today;
  };

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData && mode !== "new") {
      const initialFormData = {
        pabrik: initialData.pabrik,
        kategoriBarang: initialData.kategoriBarang,
        jenisProduk: initialData.jenisProduk,
        namaProduk: initialData.namaProduk,
        namaBasic: initialData.namaBasic,
        fotoBarang: null, // Reset fotoBarang as it's not stored in initialData
        namaPelanggan:
          typeof initialData.namaPelanggan === "string"
            ? { id: "", name: initialData.namaPelanggan }
            : (initialData.namaPelanggan ?? { id: "", name: "" }),
        waktuKirim:
          mode === "duplicate"
            ? calcDeliveryDateFromExpectation(
                initialData.customerExpectation ?? "",
              )
            : initialData.waktuKirim
              ? new Date(initialData.waktuKirim)
              : undefined,
        customerExpectation: initialData.customerExpectation,
        notes: initialData.notes || "",
      };
      setFormData(initialFormData);
      detailItemsState.resetAll(initialData.detailItems);

      // Restore existing photo ID for edit and duplicate modes so the photo can be displayed
      if ((mode === "edit" || mode === "duplicate") && initialData.photoId) {
        setExistingPhotoId(initialData.photoId);
      } else {
        setExistingPhotoId(null);
      }

      // Store initial state for change detection
      initialStateRef.current = {
        formData: initialFormData,
        detailItems: initialData.detailItems,
      };
    }
  }, [initialData, mode]);

  // Function to detect if there are actual changes from initial state
  const hasFormChanges = (): boolean => {
    if (!initialStateRef.current) return false;

    const initial = initialStateRef.current;

    // Check form data changes
    const formDataChanged =
      formData.pabrik.id !== initial.formData.pabrik.id ||
      formData.pabrik.name !== initial.formData.pabrik.name ||
      formData.kategoriBarang !== initial.formData.kategoriBarang ||
      formData.jenisProduk !== initial.formData.jenisProduk ||
      formData.namaProduk !== initial.formData.namaProduk ||
      formData.namaBasic !== initial.formData.namaBasic ||
      formData.namaPelanggan.id !== initial.formData.namaPelanggan.id ||
      formData.namaPelanggan.name !== initial.formData.namaPelanggan.name ||
      formData.waktuKirim?.getTime() !==
        initial.formData.waktuKirim?.getTime() ||
      formData.customerExpectation !== initial.formData.customerExpectation;

    if (formDataChanged) return true;

    // Check detail items changes
    if (detailItems.length !== initial.detailItems.length) return true;

    // Deep comparison of detail items
    for (let i = 0; i < detailItems.length; i++) {
      const current = detailItems[i];
      const initialItem = initial.detailItems.find(
        (item) => item.id === current.id,
      );

      if (!initialItem) return true; // New item added

      if (
        current.kadar !== initialItem.kadar ||
        current.warna !== initialItem.warna ||
        current.ukuran !== initialItem.ukuran ||
        current.berat !== initialItem.berat ||
        current.pcs !== initialItem.pcs ||
        current.notes !== initialItem.notes
      ) {
        return true;
      }
    }

    return false;
  };

  // Handle cancel with change detection
  const handleCancelClick = () => {
    if (mode === "edit" && hasFormChanges()) {
      setShowCancelConfirmDialog(true);
    } else {
      // No changes, proceed with cancel directly
      if (onCancel) onCancel();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirmDialog(false);
    if (onCancel) onCancel();
  };

  const handleCancelCancelDialog = () => {
    setShowCancelConfirmDialog(false);
  };

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <Card className="p-3 sm:p-4">
        {/* Header with Title and Action Buttons */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelClick}
                className="h-9 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg sm:text-xl">{formTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Header Section */}
        <RequestFormHeader
          formData={formData}
          onFormDataChange={(newFormData) => {
            // Cancel any active row editing when a header field changes
            if (detailItemsState.editingDetailId) {
              detailItemsState.handleCancelEdit();
            }
            setFormData(newFormData);
          }}
          onKategoriBarangChange={handleKategoriBarangChange}
          onJenisProdukChange={handleJenisProdukChange}
          fileInputRef={fileInputRef}
          fileInputKey={fileInputKey}
          onFileInputKeyChange={setFileInputKey}
          existingPhotoId={existingPhotoId}
          onExistingPhotoClear={() => setExistingPhotoId(null)}
        />

        {/* Input Detail Barang Section */}
        <div className="border-t pt-4 mb-4">
          <DetailItemsSection
            state={detailItemsState}
            kategoriBarang={formData.kategoriBarang}
            jenisProduk={formData.jenisProduk}
            canShowDetailInput={!!canShowDetailInput}
            overlayHint={`Fill in: Supplier, Delivery Time, Product Category${formData.kategoriBarang === "basic" ? ", Product Type, Basic Name" : ""}`}
            isDisabled={showResetDialog || showSaveConfirmDialog}
            showCopy
            onNotesClick={(itemId, x, y) =>
              setShowingNotesTooltip({ itemId, x, y })
            }
          />
        </div>

        {/* Submit Buttons */}
        <div className="mt-6 flex gap-1.5 sm:gap-2">
          <Button
            size="sm"
            className="h-8 flex-1 sm:flex-initial sm:w-auto text-xs sm:text-sm px-3 sm:px-4"
            disabled={isSimpanDisabled}
            onClick={handleShowSaveConfirmation}
          >
            Save Request
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 sm:flex-initial sm:w-auto text-xs sm:text-sm px-3 sm:px-4"
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Changing product category or product type will delete all added
              detail items. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog
        open={showSaveConfirmDialog}
        onOpenChange={setShowSaveConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Save</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure the request is correct?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                setShowSaveConfirmDialog(false);
                handleSaveOrder("save");
              }}
            >
              Save
            </Button>
            <AlertDialogCancel
              onClick={() => setShowSaveConfirmDialog(false)}
              className="text-red-600 bg-white border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={showCancelConfirmDialog}
        onOpenChange={setShowCancelConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel? All
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCancelDialog}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Discard Changes
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
