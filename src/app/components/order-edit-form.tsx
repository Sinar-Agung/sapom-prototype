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
import { DatePicker } from "@/app/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order, OrderRevision } from "@/app/types/order";
import { Request } from "@/app/types/request";
import { storeImage } from "@/app/utils/image-storage";
import {
  notifyOrderChangeApproved,
  notifyOrderRevised,
  notifyOrderStatusChanged,
} from "@/app/utils/notification-helper";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { DetailBarangItem } from "./request-form/detail-items-display";
import { DetailItemsSection } from "./request-form/detail-items-section";
import { useDetailItems } from "./request-form/use-detail-items";

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

interface OrderEditFormProps {
  order: Order;
  onBack: () => void;
  onSave: () => void;
  userRole?: "sales" | "stockist" | "jb" | "supplier";
}

export function OrderEditForm({
  order,
  onBack,
  onSave,
  userRole: propUserRole,
}: OrderEditFormProps) {
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  const userRole =
    propUserRole ||
    ((sessionStorage.getItem("userRole") ||
      localStorage.getItem("userRole") ||
      "sales") as "sales" | "stockist" | "jb" | "supplier");

  const [formData, setFormData] = useState({
    kategoriBarang: order.kategoriBarang,
    jenisProduk: order.jenisProduk,
    namaProduk: order.namaProduk,
    namaBasic: order.namaBasic,
    fotoBarang: null as File | null,
    photoId: order.photoId || "",
    currentImageData: order.photoId ? "" : "",
    waktuKirim: order.waktuKirim ? new Date(order.waktuKirim) : undefined,
    revisionNotes: order.revisionNotes || "",
  });

  const detailItemsState = useDetailItems({
    initialItems: order.detailItems || [],
    kategoriBarang: formData.kategoriBarang,
    jenisProduk: formData.jenisProduk,
  });
  // Convenience alias so the rest of the component can still use detailItems directly
  const detailItems = detailItemsState.items;

  // Soft-delete state for product detail rows
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(
    new Set(),
  );
  const handleToggleSoftDelete = (id: string) => {
    setMarkedForDeletion((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  // Items that will actually be saved (excludes soft-deleted rows)
  const finalDetailItems = detailItems.filter(
    (item) => !markedForDeletion.has(item.id),
  );
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
  const [revisionNotesError, setRevisionNotesError] = useState(false);
  const revisionNotesRef = useRef<HTMLTextAreaElement>(null);
  const [relatedRequest, setRelatedRequest] = useState<Request | null>(null);

  useEffect(() => {
    if (order.requestId) {
      const saved = localStorage.getItem("requests");
      if (saved) {
        const requests: Request[] = JSON.parse(saved);
        const req = requests.find((r) => r.id === order.requestId);
        if (req) setRelatedRequest(req);
      }
    }
  }, [order.requestId]);

  // Detect if any values have changed from the original order
  const hasChanges = useMemo(() => {
    const originalEta = order.waktuKirim
      ? new Date(order.waktuKirim).toDateString()
      : "";
    const currentEta = formData.waktuKirim
      ? formData.waktuKirim.toDateString()
      : "";
    if (originalEta !== currentEta) return true;

    if (formData.photoId !== (order.photoId || "")) return true;

    const normalizeItems = (items: DetailBarangItem[]) =>
      [...items]
        .map(
          ({ kadar, warna, ukuran, berat, pcs }) =>
            `${kadar}|${warna}|${ukuran}|${berat}|${pcs}`,
        )
        .sort()
        .join(";");
    if (normalizeItems(detailItems) !== normalizeItems(order.detailItems || []))
      return true;

    return false;
  }, [formData.waktuKirim, formData.photoId, detailItems, order]);

  // Load initial image from IndexedDB
  useEffect(() => {
    if (order.photoId) {
      import("@/app/utils/image-storage").then(({ getImage }) => {
        getImage(order.photoId!).then((data) => {
          if (data) {
            setFormData((prev) => ({ ...prev, currentImageData: data }));
          }
        });
      });
    }
  }, [order.photoId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        const newPhotoId = await storeImage(imageData);
        setFormData((prev) => ({
          ...prev,
          fotoBarang: file,
          photoId: newPhotoId,
          currentImageData: imageData,
        }));
        toast.success("Image updated successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setShowCameraPreview(true);
      setCapturedImage(null);

      // Wait for dialog to render, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
      // Fallback to file input
      fileInputCameraRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraPreview(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
      }
    }
  };

  const confirmPhoto = async () => {
    if (capturedImage) {
      const newPhotoId = await storeImage(capturedImage);
      setFormData((prev) => ({
        ...prev,
        photoId: newPhotoId,
        currentImageData: capturedImage,
      }));
      stopCamera();
      toast.success("Photo captured successfully");
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleTakePhotoClick = () => {
    startCamera();
  };

  const handleValidateAndConfirm = () => {
    // Sales role - should not reach here as they have different buttons
    if (userRole === "sales") {
      toast.error("Sales users cannot edit orders directly");
      return;
    }

    // Validation
    if (!formData.kategoriBarang || !formData.jenisProduk) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (finalDetailItems.length === 0) {
      toast.error("Please add at least one detail item");
      return;
    }

    if (
      (userRole === "supplier" || userRole === "jb") &&
      !formData.revisionNotes.trim()
    ) {
      setRevisionNotesError(true);
      revisionNotesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      revisionNotesRef.current?.focus();
      return;
    }

    setShowSubmitConfirmDialog(true);
  };

  const handleSubmit = () => {
    // Get existing orders
    const ordersString = localStorage.getItem("orders");
    const orders: Order[] = ordersString ? JSON.parse(ordersString) : [];

    // Find the order to update
    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex === -1) {
      toast.error("Order not found");
      return;
    }

    const existingOrder = orders[orderIndex];

    // Create revision record
    const revision: OrderRevision = {
      revisionNumber: (existingOrder.revisionHistory?.length || 0) + 1,
      timestamp: Date.now(),
      updatedBy: currentUser,
      revisionNotes: formData.revisionNotes,
      changes: {
        kategoriBarang: formData.kategoriBarang,
        jenisProduk: formData.jenisProduk,
        namaProduk: formData.namaProduk,
        namaBasic: formData.namaBasic,
        detailItems: finalDetailItems,
        photoId: formData.photoId,
        waktuKirim: formData.waktuKirim?.toISOString() || order.waktuKirim,
      },
      previousValues: {
        kategoriBarang: existingOrder.kategoriBarang,
        jenisProduk: existingOrder.jenisProduk,
        namaProduk: existingOrder.namaProduk,
        namaBasic: existingOrder.namaBasic,
        detailItems: existingOrder.detailItems,
        photoId: existingOrder.photoId,
        waktuKirim: existingOrder.waktuKirim,
      },
    };

    // Supplier revisions go to Pending Sales Review; JB/Sales revisions are applied directly
    const newStatus =
      userRole === "supplier" ? "Pending Sales Review" : "Order Revised";

    const updatedOrder: Order = {
      ...existingOrder,
      kategoriBarang: formData.kategoriBarang,
      jenisProduk: formData.jenisProduk,
      namaProduk: formData.namaProduk,
      namaBasic: formData.namaBasic,
      detailItems: finalDetailItems,
      photoId: formData.photoId,
      waktuKirim: formData.waktuKirim?.toISOString() || order.waktuKirim,
      revisionNotes: formData.revisionNotes,
      updatedDate: Date.now(),
      updatedBy: currentUser,
      revisionHistory: [...(existingOrder.revisionHistory || []), revision],
      status: newStatus as any,
      jbApproved: false,
      salesApproved: false,
    };

    orders[orderIndex] = updatedOrder;
    localStorage.setItem("orders", JSON.stringify(orders));

    // Notify relevant parties based on who submitted the revision
    if (userRole === "supplier") {
      notifyOrderStatusChanged(
        updatedOrder,
        existingOrder.status,
        "Pending Sales Review",
        currentUser,
        "supplier",
      );
    } else if (updatedOrder.sales) {
      notifyOrderRevised(updatedOrder, currentUser);
    }

    toast.success("Order updated successfully");
    onSave();
  };

  const handleApproveRevision = () => {
    const ordersString = localStorage.getItem("orders");
    const orders: Order[] = ordersString ? JSON.parse(ordersString) : [];

    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex === -1) {
      toast.error("Order not found");
      return;
    }

    const currentOrder = orders[orderIndex];

    // Mark approval based on user role
    if (userRole === "jb") {
      currentOrder.jbApproved = true;
    } else if (userRole === "sales") {
      currentOrder.salesApproved = true;
    }

    // If both JB and Sales have approved, change status to Order Revised
    if (currentOrder.jbApproved && currentOrder.salesApproved) {
      currentOrder.status = "Order Revised";
      notifyOrderChangeApproved(
        currentOrder,
        currentUser,
        userRole as "sales" | "jb",
        true,
      );
      toast.success(
        "Order revision fully approved - Status changed to Order Revised",
      );
    } else {
      notifyOrderChangeApproved(
        currentOrder,
        currentUser,
        userRole as "sales" | "jb",
        false,
      );
      toast.success(
        `Order approved by ${userRole.toUpperCase()} - Waiting for ${userRole === "jb" ? "Sales" : "JB"} approval`,
      );
    }

    currentOrder.updatedDate = Date.now();
    currentOrder.updatedBy = currentUser;

    localStorage.setItem("orders", JSON.stringify(orders));
    onSave();
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    const ordersString = localStorage.getItem("orders");
    const orders: Order[] = ordersString ? JSON.parse(ordersString) : [];

    const orderIndex = orders.findIndex((o) => o.id === order.id);
    if (orderIndex === -1) {
      toast.error("Order not found");
      return;
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      status: "Rejected",
      updatedDate: Date.now(),
      updatedBy: currentUser,
      // Store cancel reason in a notes field or metadata
    };

    localStorage.setItem("orders", JSON.stringify(orders));
    toast.success("Order revision rejected: " + cancelReason);
    onSave();
  };

  const pabrikLabel = getLabelFromValue(
    [
      { value: "king-halim", label: "King Halim" },
      { value: "ubs-gold", label: "UBS Gold" },
      { value: "lestari-gold", label: "Lestari Gold" },
      { value: "yt-gold", label: "YT Gold" },
      { value: "mt-gold", label: "MT Gold" },
      { value: "hwt", label: "HWT" },
      { value: "ayu", label: "Ayu" },
      { value: "sb-gold", label: "SB Gold" },
      { value: "crm", label: "CRM" },
      { value: "lts-gold", label: "Lotus Gold" },
    ],
    order.pabrik.id,
  );

  return (
    <div className="min-h-screen pb-20 md:pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-2 mb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Update Order</h1>
          <p className="text-sm text-gray-600 font-mono font-semibold">
            {order.PONumber}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Read-only Information */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4">Order Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600 font-bold text-base">
                Pabrik/Supplier
              </Label>
              <p className="font-medium mt-1">{pabrikLabel}</p>
            </div>
            <div>
              <Label className="text-gray-600 font-bold text-base">
                Customer Name
              </Label>
              <p className="font-medium mt-1">{order.pabrik.name}</p>
            </div>
            <div>
              <Label className="text-gray-600 font-bold text-base">
                Customer Expectation
              </Label>
              <p className="font-medium mt-1">
                {getLabelFromValue(
                  CUSTOMER_EXPECTATION_OPTIONS,
                  order.customerExpectation,
                ) || "-"}
              </p>
            </div>
            <div>
              <Label className="text-gray-600 font-bold text-base">
                Delivery Time (ETA)
              </Label>
              {userRole === "supplier" || userRole === "jb" ? (
                <DatePicker
                  value={formData.waktuKirim}
                  onValueChange={(date) =>
                    setFormData({ ...formData, waktuKirim: date })
                  }
                  placeholder="Select ETA date..."
                  className="w-full mt-1"
                  minDate={(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return today;
                  })()}
                />
              ) : (
                <p className="font-medium mt-1">
                  {formData.waktuKirim
                    ? formData.waktuKirim.toLocaleDateString("id-ID")
                    : "-"}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Editable Product Information */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-4 gap-y-3">
            {/* Product Category - Read Only */}
            <Label className="text-gray-600 font-bold text-base">
              Product Category
            </Label>
            <p className="font-medium mt-1">
              {formData.kategoriBarang === "basic"
                ? "Basic Product"
                : "Model Product"}
            </p>

            {/* Product Type - Read Only */}
            <Label className="text-gray-600 font-bold text-base">
              Product Type
            </Label>
            <p className="font-medium mt-1">
              {getLabelFromValue(JENIS_PRODUK_OPTIONS, formData.jenisProduk) ||
                "-"}
            </p>

            {/* Basic Name or Model Name- Read Only */}
            {formData.kategoriBarang === "basic" ? (
              <>
                <Label className="text-gray-600 font-bold text-base">
                  Basic Name
                </Label>
                <p className="font-medium mt-1">
                  {getLabelFromValue(NAMA_BASIC_OPTIONS, formData.namaBasic) ||
                    "-"}
                </p>
              </>
            ) : (
              <>
                <Label className="text-gray-600 font-bold text-base">
                  Model Name
                </Label>
                <p className="font-medium mt-1">
                  {getLabelFromValue(
                    NAMA_PRODUK_OPTIONS,
                    formData.namaProduk,
                  ) || "-"}
                </p>
              </>
            )}

            {/* Sales Request Notes - Read Only */}
            {relatedRequest?.notes && (
              <>
                <Label className="text-gray-600 font-bold text-base">
                  Sales Notes
                </Label>
                <p className="font-medium mt-1 text-gray-700 whitespace-pre-wrap">
                  {relatedRequest.notes}
                </p>
              </>
            )}

            {/* Conditional: Product Photo - Show preview for Basic, show uploader+preview for Model */}
            {formData.kategoriBarang === "basic" && formData.namaBasic ? (
              <>
                <Label className="text-gray-600 font-bold text-base">
                  Product Photo
                </Label>
                {userRole !== "sales" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="border rounded-md p-2 bg-gray-50 relative cursor-pointer group hover:bg-gray-100 transition-colors">
                        <img
                          src={
                            formData.currentImageData ||
                            NAMA_BASIC_IMAGES[formData.namaBasic]
                          }
                          alt={formData.namaBasic}
                          className="w-full sm:w-48 h-48 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => fileInputGalleryRef.current?.click()}
                      >
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Choose from Gallery
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleTakePhotoClick}>
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="border rounded-md p-2 bg-gray-50">
                    <img
                      src={
                        formData.currentImageData ||
                        NAMA_BASIC_IMAGES[formData.namaBasic]
                      }
                      alt={formData.namaBasic}
                      className="w-full sm:w-48 h-48 object-cover rounded"
                    />
                  </div>
                )}
              </>
            ) : formData.kategoriBarang === "model" ? (
              <>
                <Label htmlFor="fotoBarang" className="text-xs md:pt-2">
                  Foto Barang{" "}
                  {!formData.photoId && <span className="text-red-500">*</span>}
                </Label>
                <div className="space-y-2">
                  {formData.currentImageData ? (
                    <div className="relative inline-block">
                      {userRole !== "sales" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer group relative">
                              <img
                                src={formData.currentImageData}
                                alt="Preview"
                                className="w-full sm:w-48 h-48 object-cover rounded border"
                              />
                              <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Camera className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                fileInputGalleryRef.current?.click()
                              }
                            >
                              <ImagePlus className="w-4 h-4 mr-2" />
                              Choose from Gallery
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleTakePhotoClick}>
                              <Camera className="w-4 h-4 mr-2" />
                              Take Photo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <img
                          src={formData.currentImageData}
                          alt="Preview"
                          className="w-full sm:w-48 h-48 object-cover rounded border"
                        />
                      )}
                    </div>
                  ) : userRole !== "sales" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-9 sm:h-8 text-sm"
                        >
                          <ImagePlus className="w-4 h-4 mr-2" />
                          Choose Photo
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                          onClick={() => fileInputGalleryRef.current?.click()}
                        >
                          <ImagePlus className="w-4 h-4 mr-2" />
                          Choose from Gallery
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleTakePhotoClick}>
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </>
            ) : null}

            {/* Hidden file inputs - always available for both Basic and Model */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              key="gallery-input"
              ref={fileInputGalleryRef}
              onChange={handlePhotoChange}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              key="camera-input"
              ref={fileInputCameraRef}
              onChange={handlePhotoChange}
            />
          </div>
        </Card>

        {/* Detail Items */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Product Details</h2>
          <DetailItemsSection
            state={detailItemsState}
            kategoriBarang={formData.kategoriBarang}
            jenisProduk={formData.jenisProduk}
            showInput={userRole !== "sales"}
            markedForDeletion={markedForDeletion}
            onToggleDelete={
              userRole !== "sales" ? handleToggleSoftDelete : undefined
            }
          />
        </Card>

        {/* Revision Notes */}
        {(userRole === "supplier" || userRole === "jb") && (
          <Card className="p-4">
            <Label
              htmlFor="revisionNotes"
              className="text-gray-600 font-bold text-base"
            >
              Revision Notes <span className="text-red-500">*</span>{" "}
              <span className="text-sm text-gray-500">
                (Required - visible to JB and Sales)
              </span>
            </Label>
            <Textarea
              id="revisionNotes"
              ref={revisionNotesRef}
              value={formData.revisionNotes}
              onChange={(e) => {
                setFormData({ ...formData, revisionNotes: e.target.value });
                if (revisionNotesError) setRevisionNotesError(false);
              }}
              placeholder="Add notes about changes made to this order (required)..."
              rows={3}
              className={`mt-1${revisionNotesError ? " border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
            {revisionNotesError && (
              <p className="text-red-500 text-xs mt-1">
                Revision notes are required before submitting.
              </p>
            )}
          </Card>
        )}

        {/* Revision Summary for Sales */}
        {userRole === "sales" &&
          order.revisionHistory &&
          order.revisionHistory.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">
                Revision Details
              </h3>
              <div className="space-y-3 text-sm">
                {(() => {
                  const latestRevision =
                    order.revisionHistory[order.revisionHistory.length - 1];
                  const etaChanged =
                    latestRevision.previousValues.waktuKirim !==
                    latestRevision.changes.waktuKirim;

                  return (
                    <>
                      {etaChanged && (
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="font-semibold text-gray-700 mb-1">
                            ETA Changed:
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 line-through">
                              {latestRevision.previousValues.waktuKirim
                                ? new Date(
                                    latestRevision.previousValues.waktuKirim,
                                  ).toLocaleDateString("id-ID")
                                : "-"}
                            </span>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-600 font-semibold">
                              {latestRevision.changes.waktuKirim
                                ? new Date(
                                    latestRevision.changes.waktuKirim,
                                  ).toLocaleDateString("id-ID")
                                : "-"}
                            </span>
                          </div>
                        </div>
                      )}

                      {latestRevision.revisionNotes && (
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="font-semibold text-gray-700 mb-1">
                            Notes from {latestRevision.updatedBy}:
                          </p>
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {latestRevision.revisionNotes}
                          </p>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-gray-600">
                          <span className="font-semibold">Last updated:</span>{" "}
                          {new Date(latestRevision.timestamp).toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          )}

        {/* Action Buttons */}
        {userRole === "sales" ? (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4">Review Order Changes</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">
                  Cancellation Reason{" "}
                  <span className="text-sm text-gray-500">
                    (Required if rejecting)
                  </span>
                </Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason if you reject this order revision..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button variant="destructive" onClick={handleCancelOrder}>
                  Reject Changes
                </Button>
                <Button
                  onClick={handleApproveRevision}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve Changes
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button
              onClick={handleValidateAndConfirm}
              disabled={
                !hasChanges ||
                (formData.kategoriBarang === "model" && !formData.photoId)
              }
            >
              Submit Changes
            </Button>
          </div>
        )}
      </div>

      {/* Camera Preview Dialog */}
      <Dialog open={showCameraPreview} onOpenChange={stopCamera}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!capturedImage ? (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ maxHeight: "60vh" }}
                />
              </div>
            ) : (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto"
                  style={{ maxHeight: "60vh" }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {!capturedImage ? (
              <>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
                <Button onClick={capturePhoto}>
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={retakePhoto}>
                  Retake
                </Button>
                <Button onClick={confirmPhoto}>Confirm</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Changes Confirmation Dialog */}
      <AlertDialog
        open={showSubmitConfirmDialog}
        onOpenChange={setShowSubmitConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Proposed Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your proposed changes will be sent to Sales and JB for review. The
              order status will be set to <strong>Pending Sales Review</strong>{" "}
              until Sales has reviewed, reject your changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
