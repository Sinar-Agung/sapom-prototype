import { Button } from "@/app/components/ui/button";
import { Combobox } from "@/app/components/ui/combobox";
import { DatePicker } from "@/app/components/ui/date-picker";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  ATAS_NAMA_OPTIONS,
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
} from "@/app/data/order-data";
import { useImage } from "@/app/utils/image-storage";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";

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

export interface FormData {
  pabrik: { id: string; name: string };
  kategoriBarang: string;
  jenisProduk: string;
  namaProduk: string;
  namaBasic: string;
  fotoBarang: File | null;
  namaPelanggan: { id: string; name: string };
  waktuKirim: Date | undefined;
  customerExpectation: string;
  notes?: string;
}

interface RequestFormHeaderProps {
  formData: FormData;
  onFormDataChange: (formData: FormData) => void;
  onKategoriBarangChange: (value: string) => void;
  onJenisProdukChange: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fileInputKey: number;
  onFileInputKeyChange: (key: number) => void;
  existingPhotoId?: string | null;
  onExistingPhotoClear?: () => void;
}

export function RequestFormHeader({
  formData,
  onFormDataChange,
  onKategoriBarangChange,
  onJenisProdukChange,
  fileInputRef,
  fileInputKey,
  onFileInputKeyChange,
  existingPhotoId,
  onExistingPhotoClear,
}: RequestFormHeaderProps) {
  const existingPhotoData = useImage(existingPhotoId);
  // Helper function to calculate ETA based on Customer Expectation
  const calculateETA = (action: string): Date | undefined => {
    if (!action) return undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (action === "ready-marketing") {
      return new Date(today);
    } else if (action === "ready-pabrik") {
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return weekFromNow;
    } else if (action === "order-pabrik") {
      const fourWeeks = new Date(today);
      fourWeeks.setDate(fourWeeks.getDate() + 28);
      return fourWeeks;
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-4 gap-y-3">
        {/* Pabrik/Supplier */}
        <Label htmlFor="pabrik" className="text-xs md:pt-2">
          Pabrik/Supplier <span className="text-red-500">*</span>
        </Label>
        <Combobox
          value={formData.pabrik.id}
          onValueChange={(value) => {
            const selectedPabrik = PABRIK_OPTIONS.find(
              (p) => p.value === value,
            );
            onFormDataChange({
              ...formData,
              pabrik: selectedPabrik
                ? { id: selectedPabrik.value, name: selectedPabrik.label }
                : { id: "", name: "" },
            });
          }}
          options={PABRIK_OPTIONS}
          placeholder="Select supplier..."
          searchPlaceholder="Search supplier..."
          emptyText="Supplier not found."
          allowCustomValue={false}
        />

        {/* Customer Name */}
        <Label htmlFor="namaPelanggan" className="text-xs md:pt-2">
          Customer Name
        </Label>
        <Combobox
          value={formData.namaPelanggan.id || formData.namaPelanggan.name}
          onValueChange={(value) => {
            const selectedNama = ATAS_NAMA_OPTIONS.find(
              (n) => n.value === value,
            );
            onFormDataChange({
              ...formData,
              namaPelanggan: selectedNama
                ? { id: selectedNama.value, name: selectedNama.label }
                : { id: "", name: value },
            });
          }}
          options={ATAS_NAMA_OPTIONS}
          placeholder="Select or type name..."
          searchPlaceholder="Search name..."
          emptyText="Name not found."
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
            onFormDataChange({
              ...formData,
              customerExpectation: value,
              waktuKirim: newETA || formData.waktuKirim,
            });
          }}
          options={CUSTOMER_EXPECTATION_OPTIONS}
          placeholder="Select action..."
          searchPlaceholder="Search action..."
          emptyText="Action not found."
          allowCustomValue={false}
        />

        {/* Delivery Time (ETA) */}
        <Label htmlFor="waktuKirim" className="text-xs md:pt-2">
          Delivery Time (ETA) <span className="text-red-500">*</span>
        </Label>
        <DatePicker
          value={formData.waktuKirim}
          onValueChange={(date) =>
            onFormDataChange({ ...formData, waktuKirim: date })
          }
          placeholder="Select ETA date..."
          className="w-full"
          minDate={(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
          })()}
          disabled={formData.customerExpectation === "ready-marketing"}
        />

        {/* Product Category */}
        <Label className="text-xs md:pt-2">
          Product Category <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.kategoriBarang}
          onValueChange={onKategoriBarangChange}
          className="flex items-center space-x-3"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem
              value="basic"
              id="basic-header"
              className="h-3 w-3"
            />
            <Label htmlFor="basic-header" className="font-normal text-xs">
              Basic Product
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem
              value="model"
              id="model-header"
              className="h-3 w-3"
            />
            <Label htmlFor="model-header" className="font-normal text-xs">
              Model Product
            </Label>
          </div>
        </RadioGroup>

        {/* Product Type */}
        <Label htmlFor="jenisProduk" className="text-xs md:pt-2">
          Product Type{formData.kategoriBarang === "basic" ? " " : ""}
          {formData.kategoriBarang === "basic" && (
            <span className="text-red-500">*</span>
          )}
        </Label>
        <Combobox
          value={formData.jenisProduk}
          onValueChange={onJenisProdukChange}
          options={JENIS_PRODUK_OPTIONS}
          placeholder="Select type..."
          searchPlaceholder="Search product type..."
          emptyText="Type not found."
          allowCustomValue={false}
        />

        {/* Notes */}
        <Label htmlFor="requestNotes" className="text-xs md:pt-2">
          Notes
        </Label>
        <textarea
          id="requestNotes"
          value={formData.notes || ""}
          onChange={(e) =>
            onFormDataChange({ ...formData, notes: e.target.value })
          }
          placeholder="Optional notes about this request..."
          rows={2}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />

        {/* Conditional: Nama Basic (only for Barang Basic) OR Nama Model (for Barang Model) */}
        {formData.kategoriBarang === "basic" ? (
          <>
            <Label htmlFor="namaBasic" className="text-xs md:pt-2">
              Basic Name <span className="text-red-500">*</span>
            </Label>
            <Combobox
              value={formData.namaBasic}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  namaBasic: value,
                })
              }
              options={NAMA_BASIC_OPTIONS}
              placeholder="Select or type basic name..."
              searchPlaceholder="Search basic name..."
              emptyText="Basic name not found."
            />
          </>
        ) : (
          <>
            <Label htmlFor="namaProdukHeader" className="text-xs md:pt-2">
              Model Name
            </Label>
            <Combobox
              value={formData.namaProduk}
              onValueChange={(value) =>
                onFormDataChange({
                  ...formData,
                  namaProduk: value,
                })
              }
              options={filteredNamaProdukOptions}
              placeholder="Select or type model name..."
              searchPlaceholder="Search model..."
              emptyText="Model not found."
            />
          </>
        )}

        {/* Conditional: Foto Barang - Show preview for Basic, show uploader+preview for Model */}
        {formData.kategoriBarang === "basic" && formData.namaBasic ? (
          <>
            <Label className="text-xs md:pt-2">Product Photo</Label>
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
              Product Photo <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <Input
                id="fotoBarang"
                type="file"
                accept="image/*"
                capture="environment"
                className="h-9 sm:h-8 text-sm"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onFormDataChange({
                      ...formData,
                      fotoBarang: e.target.files[0],
                    });
                  }
                }}
                ref={fileInputRef}
                key={fileInputKey}
              />
              {(formData.fotoBarang || existingPhotoId) &&
                (() => {
                  const imgSrc = formData.fotoBarang
                    ? URL.createObjectURL(formData.fotoBarang)
                    : existingPhotoData;
                  return imgSrc ? (
                    <div className="border rounded-md p-2 bg-gray-50 relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-7 px-2 rounded z-10 text-xs"
                        onClick={() => {
                          onFormDataChange({ ...formData, fotoBarang: null });
                          onFileInputKeyChange(fileInputKey + 1);
                          if (!formData.fotoBarang && onExistingPhotoClear) {
                            onExistingPhotoClear();
                          }
                        }}
                      >
                        Remove
                      </Button>
                      <img
                        src={imgSrc}
                        alt="Preview"
                        className="w-full sm:w-48 h-48 object-cover rounded"
                      />
                    </div>
                  ) : null;
                })()}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
