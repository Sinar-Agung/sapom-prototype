import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Combobox } from "@/app/components/ui/combobox";
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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order, OrderRevision } from "@/app/types/order";
import { getImage, storeImage } from "@/app/utils/image-storage";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { ArrowLeft, Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DetailItemInput } from "./order-form/detail-item-input";
import {
  DetailBarangItem,
  DetailItemsDisplay,
} from "./order-form/detail-items-display";
import {
  getKadarColor,
  getUkuranDisplay,
  getWarnaColor,
  getWarnaLabel,
  parseBerat,
} from "./order-form/form-helpers";

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
}

export function OrderEditForm({ order, onBack, onSave }: OrderEditFormProps) {
  const [formData, setFormData] = useState({
    kategoriBarang: order.kategoriBarang,
    jenisProduk: order.jenisProduk,
    namaProduk: order.namaProduk,
    namaBasic: order.namaBasic,
    fotoBarang: null as File | null,
    photoId: order.photoId || "",
    currentImageData: order.photoId ? getImage(order.photoId) : "",
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

  const [detailItems, setDetailItems] = useState<DetailBarangItem[]>(
    order.detailItems || [],
  );
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [animatingIds] = useState<Set<string>>(new Set());
  const [relocatingIds] = useState<Set<string>>(new Set());
  const [sortedDetailItems, setSortedDetailItems] = useState<
    DetailBarangItem[]
  >([]);

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";

  // Sort detail items whenever they change
  useEffect(() => {
    const sorted = [...detailItems].sort((a, b) => {
      const kadarA = parseInt(a.kadar.replace(/[^0-9]/g, "")) || 0;
      const kadarB = parseInt(b.kadar.replace(/[^0-9]/g, "")) || 0;
      if (kadarA !== kadarB) return kadarA - kadarB;
      if (a.warna !== b.warna) return a.warna.localeCompare(b.warna);
      if (a.ukuran !== b.ukuran) return a.ukuran.localeCompare(b.ukuran);
      return parseFloat(a.berat || "0") - parseFloat(b.berat || "0");
    });
    setSortedDetailItems(sorted);
  }, [detailItems]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        const newPhotoId = storeImage(imageData);
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

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      fotoBarang: null,
      photoId: "",
      currentImageData: "",
    }));
    setFileInputKey((prev) => prev + 1);
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

  const confirmPhoto = () => {
    if (capturedImage) {
      const newPhotoId = storeImage(capturedImage);
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

  const handleAddDetail = () => {
    if (formData.kategoriBarang === "basic" && !detailInput.berat.trim()) {
      toast.error("Berat is mandatory for Barang Basic");
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
      setDetailItems(updatedItems);
      setEditingDetailId(null);
      setNewlyAddedIds(new Set([editingDetailId]));
    } else {
      const updatedItems = [...detailItems];
      const newIds = new Set<string>();

      beratValues.forEach((berat) => {
        const existingItemIndex = updatedItems.findIndex(
          (item) =>
            item.kadar === detailInput.kadar &&
            item.warna === detailInput.warna &&
            item.ukuran === finalUkuran &&
            item.berat === berat,
        );

        if (existingItemIndex !== -1) {
          const existingItem = updatedItems[existingItemIndex];
          const combinedNotes = [existingItem.notes, detailInput.notes]
            .filter(Boolean)
            .join(", ");

          updatedItems[existingItemIndex] = {
            ...existingItem,
            pcs: (
              parseInt(existingItem.pcs) + parseInt(detailInput.pcs)
            ).toString(),
            notes: combinedNotes,
          };
          newIds.add(existingItem.id);
        } else {
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

      setDetailItems(updatedItems);
      setNewlyAddedIds(newIds);
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

  const handleEditDetail = (item: DetailBarangItem) => {
    setDetailInput({
      kadar: item.kadar,
      warna: item.warna,
      ukuran: item.ukuran,
      ukuranCustom: "",
      berat: item.berat || "",
      pcs: item.pcs,
      notes: item.notes || "",
    });
    setEditingDetailId(item.id);
  };

  const handleDeleteDetail = (id: string) => {
    setDetailItems(detailItems.filter((item) => item.id !== id));
    if (editingDetailId === id) {
      setEditingDetailId(null);
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

  const handleRowClick = (_id: string) => {
    // Optional: handle row click if needed
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.kategoriBarang || !formData.jenisProduk) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (detailItems.length === 0) {
      toast.error("Please add at least one detail item");
      return;
    }

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
      changes: {
        kategoriBarang: formData.kategoriBarang,
        jenisProduk: formData.jenisProduk,
        namaProduk: formData.namaProduk,
        namaBasic: formData.namaBasic,
        detailItems: detailItems,
        photoId: formData.photoId,
      },
      previousValues: {
        kategoriBarang: existingOrder.kategoriBarang,
        jenisProduk: existingOrder.jenisProduk,
        namaProduk: existingOrder.namaProduk,
        namaBasic: existingOrder.namaBasic,
        detailItems: existingOrder.detailItems,
        photoId: existingOrder.photoId,
      },
    };

    // Update the order
    const updatedOrder: Order = {
      ...existingOrder,
      kategoriBarang: formData.kategoriBarang,
      jenisProduk: formData.jenisProduk,
      namaProduk: formData.namaProduk,
      namaBasic: formData.namaBasic,
      detailItems: detailItems,
      photoId: formData.photoId,
      updatedDate: Date.now(),
      updatedBy: currentUser,
      revisionHistory: [...(existingOrder.revisionHistory || []), revision],
      status: "Viewed", // Change status back to Viewed after update
    };

    orders[orderIndex] = updatedOrder;
    localStorage.setItem("orders", JSON.stringify(orders));

    toast.success("Order updated successfully");
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
      <div className="flex items-center gap-3 mb-4">
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
                Atas Nama
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
                Waktu Kirim (ETA)
              </Label>
              <p className="font-medium mt-1">
                {new Date(order.waktuKirim).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        </Card>

        {/* Editable Product Information */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-4 gap-y-3">
            {/* Kategori Barang */}
            <Label className="text-xs md:pt-2">Kategori Barang</Label>
            <RadioGroup
              value={formData.kategoriBarang}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, kategoriBarang: value }))
              }
              className="flex items-center space-x-3"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem
                  value="basic"
                  id="basic-edit"
                  className="h-3 w-3"
                />
                <Label htmlFor="basic-edit" className="font-normal text-xs">
                  Barang Basic
                </Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem
                  value="model"
                  id="model-edit"
                  className="h-3 w-3"
                />
                <Label htmlFor="model-edit" className="font-normal text-xs">
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
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, jenisProduk: value }))
              }
              options={JENIS_PRODUK_OPTIONS}
              placeholder="Pilih jenis..."
              searchPlaceholder="Cari jenis produk..."
              emptyMessage="Jenis tidak ditemukan."
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
                    setFormData((prev) => ({ ...prev, namaBasic: value }))
                  }
                  options={NAMA_BASIC_OPTIONS}
                  placeholder="Pilih atau ketik nama basic..."
                  searchPlaceholder="Cari nama basic..."
                  emptyMessage="Nama basic tidak ditemukan."
                />
              </>
            ) : (
              <>
                <Label htmlFor="namaProduk" className="text-xs md:pt-2">
                  Nama Model
                </Label>
                <Combobox
                  value={formData.namaProduk}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, namaProduk: value }))
                  }
                  options={NAMA_PRODUK_OPTIONS.filter((option) =>
                    option.value
                      .toLowerCase()
                      .startsWith(formData.jenisProduk.toLowerCase()),
                  )}
                  placeholder="Pilih atau ketik nama model..."
                  searchPlaceholder="Cari model..."
                  emptyMessage="Model tidak ditemukan."
                />
              </>
            )}

            {/* Conditional: Foto Barang - Show preview for Basic, show uploader+preview for Model */}
            {formData.kategoriBarang === "basic" && formData.namaBasic ? (
              <>
                <Label className="text-xs md:pt-2">Foto Barang</Label>
                <div className="border rounded-md p-2 bg-gray-50 relative">
                  <img
                    src={
                      formData.currentImageData ||
                      NAMA_BASIC_IMAGES[formData.namaBasic]
                    }
                    alt={formData.namaBasic}
                    className="w-full sm:w-48 h-48 object-cover rounded"
                  />
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 bg-white/90 hover:bg-white shadow-md"
                        >
                          <Camera className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Change Image</span>
                        </Button>
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
                  </div>
                </div>
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
                      <img
                        src={formData.currentImageData}
                        alt="Preview"
                        className="w-full sm:w-48 h-48 object-cover rounded border"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 px-3 bg-white/90 hover:bg-white shadow-md"
                            >
                              <Camera className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">
                                Change Image
                              </span>
                            </Button>
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
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 shadow-md"
                          onClick={handleRemovePhoto}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Input
                      id="fotoBarang"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="h-9 sm:h-8 text-sm"
                      onChange={handlePhotoChange}
                    />
                  )}
                </div>
              </>
            ) : null}

            {/* Hidden file inputs - always available for both Basic and Model */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              key={`gallery-${fileInputKey}`}
              ref={fileInputGalleryRef}
              onChange={handlePhotoChange}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              key={`camera-${fileInputKey}`}
              ref={fileInputCameraRef}
              onChange={handlePhotoChange}
            />
          </div>
        </Card>

        {/* Detail Items */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Detail Barang</h2>

          <DetailItemInput
            kategoriBarang={formData.kategoriBarang}
            jenisProduk={formData.jenisProduk}
            detailInput={detailInput}
            onDetailInputChange={setDetailInput}
            onAdd={handleAddDetail}
            editingDetailId={editingDetailId}
            isDisabled={false}
            isAddButtonDisabled={false}
            onCancel={() => {
              setEditingDetailId(null);
              setDetailInput({
                kadar: "",
                warna: "",
                ukuran: "",
                ukuranCustom: "",
                berat: "",
                pcs: "",
                notes: "",
              });
            }}
          />

          <div className="mt-4">
            <DetailItemsDisplay
              items={sortedDetailItems}
              animatingIds={animatingIds}
              relocatingIds={relocatingIds}
              editingDetailId={editingDetailId}
              onRowClick={handleRowClick}
              onNotesClick={() => {}}
              rowRefs={rowRefs}
              cardRefs={cardRefs}
              tbodyRef={tbodyRef}
              getKadarColor={getKadarColor}
              getWarnaColor={getWarnaColor}
              getWarnaLabel={getWarnaLabel}
              getUkuranDisplay={getUkuranDisplay}
              onEdit={handleEditDetail}
              onDelete={handleDeleteDetail}
              newlyAddedIds={newlyAddedIds}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Changes</Button>
        </div>
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
    </div>
  );
}
