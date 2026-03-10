import { KADAR_OPTIONS, PABRIK_OPTIONS, WARNA_OPTIONS } from "@/app/data/order-data";
import type { QuestionItem } from "@/app/types/question";
import { Image, Plus, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Combobox } from "./ui/combobox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

interface QuestionFormData {
  pabrik: { id: string; name: string };
  namaBarang: string;
  kadar: string;
  warna: string;
  notes: string;
  images: string[]; // Base64 encoded images
  items: QuestionItem[];
}

interface QuestionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  inline?: boolean;
}

export function QuestionForm({ onSuccess, onCancel, inline = false }: QuestionFormProps = {}) {
  const [formData, setFormData] = useState<QuestionFormData>({
    pabrik: { id: "", name: "" },
    namaBarang: "",
    kadar: "",
    warna: "",
    notes: "",
    images: [],
    items: [],
  });

  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  const handlePabrikChange = (value: string) => {
    const selectedPabrik = PABRIK_OPTIONS.find((p) => p.value === value);
    if (selectedPabrik) {
      setFormData({
        ...formData,
        pabrik: { id: selectedPabrik.value, name: selectedPabrik.label },
      });
    }
  };

  const handleAddItem = () => {
    const newItem: QuestionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      kadar: "",
      warna: "",
      ukuran: "",
      berat: "",
      pcs: "",
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id),
    });
  };

  const handleItemChange = (
    id: string,
    field: keyof QuestionItem,
    value: string
  ) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

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

  const getWarnaColor = (warna: string) => {
    const colors: Record<string, string> = {
      rg: "bg-rose-300 text-gray-800",
      ap: "bg-gray-200 text-gray-800",
      kn: "bg-yellow-400 text-gray-800",
      ks: "bg-yellow-300 text-gray-800",
    };
    return colors[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Limit to 5 images
    if (formData.images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64String],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    // Validation - check if at least one field is filled
    const hasData = 
      formData.pabrik.id ||
      formData.namaBarang.trim() ||
      formData.kadar ||
      formData.warna ||
      formData.notes.trim() ||
      formData.images.length > 0 ||
      formData.items.length > 0;

    if (!hasData) {
      toast.error("Please fill in at least one field");
      return;
    }

    // Validate items if any
    if (formData.items.length > 0) {
      const hasIncompleteItem = formData.items.some(
        (item) =>
          !item.kadar || !item.warna || !item.ukuran || !item.berat || !item.pcs
      );
      if (hasIncompleteItem) {
        toast.error("Please complete all item details");
        return;
      }
    }

    // Save question to localStorage
    const savedQuestions = localStorage.getItem("questions");
    const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

    const newQuestion = {
      id: `question-${Date.now()}`,
      createdDate: Date.now(),
      createdBy: currentUser,
      pabrik: formData.pabrik,
      namaBarang: formData.namaBarang,
      kadar: formData.kadar,
      warna: formData.warna,
      notes: formData.notes,
      images: formData.images,
      items: formData.items.length > 0 ? formData.items : undefined,
      status: "pending", // pending, answered
    };

    questions.push(newQuestion);
    localStorage.setItem("questions", JSON.stringify(questions));

    toast.success("Question submitted successfully!");

    // Reset form
    setFormData({
      pabrik: { id: "", name: "" },
      namaBarang: "",
      kadar: "",
      warna: "",
      notes: "",
      images: [],
      items: [],
    });

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClear = () => {
    setFormData({
      pabrik: { id: "", name: "" },
      namaBarang: "",
      kadar: "",
      warna: "",
      notes: "",
      images: [],
      items: [],
    });
  };

  const formContent = (
    <>
      <h2 className="text-2xl font-bold mb-6">Pertanyaan</h2>
      <p className="text-gray-600 mb-6">
        Kirim pertanyaan Anda kepada supplier dengan melampirkan informasi produk, gambar, dan catatan.
      </p>

      <div className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <Label htmlFor="pabrik" className="mb-2 block">
              Pabrik/Supplier
            </Label>
            <Select
              value={formData.pabrik.id}
              onValueChange={handlePabrikChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Pabrik" />
              </SelectTrigger>
              <SelectContent>
                {PABRIK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nama Barang */}
          <div>
            <Label htmlFor="namaBarang" className="mb-2 block">
              Nama Barang
            </Label>
            <Input
              id="namaBarang"
              value={formData.namaBarang}
              onChange={(e) =>
                setFormData({ ...formData, namaBarang: e.target.value })
              }
              placeholder="Masukkan nama barang"
            />
          </div>

          {/* Kadar and Warna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kadar */}
            <div>
              <Label htmlFor="kadar" className="mb-2 block">
                Kadar
              </Label>
              <Combobox
                value={formData.kadar}
                onValueChange={(value) =>
                  setFormData({ ...formData, kadar: value })
                }
                options={KADAR_OPTIONS}
                placeholder="Pilih Kadar"
                searchPlaceholder="Search purity..."
                emptyMessage="Purity not found."
                allowCustomValue={false}
                className="w-full"
              />
            </div>

            {/* Warna */}
            <div>
              <Label htmlFor="warna" className="mb-2 block">
                Warna
              </Label>
              <Combobox
                value={formData.warna}
                onValueChange={(value) =>
                  setFormData({ ...formData, warna: value })
                }
                options={WARNA_OPTIONS}
                placeholder="Pilih Warna"
                searchPlaceholder="Search color..."
                emptyMessage="Color not found."
                allowCustomValue={false}
                className="w-full"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="mb-2 block">
              Upload Gambar
              <span className="text-sm text-gray-500 ml-2">
                (Maximum 5 images, max 5MB each)
              </span>
            </Label>

            <div className="space-y-4">
              {/* Upload Button */}
              {formData.images.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click to upload images
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              )}

              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                    >
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center text-gray-400">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Detail Barang (Opsional)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Item
              </Button>
            </div>

            {formData.items.length > 0 && (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <Card key={item.id} className="p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-semibold text-sm">Item {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Kadar */}
                      <div>
                        <Label className="mb-1 block text-xs">
                          Kadar <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                          value={item.kadar}
                          onValueChange={(value) =>
                            handleItemChange(item.id, "kadar", value)
                          }
                          options={KADAR_OPTIONS}
                          placeholder="Pilih"
                          searchPlaceholder="Search..."
                          emptyMessage="Not found."
                          allowCustomValue={false}
                          className="w-full"
                        />
                      </div>

                      {/* Warna */}
                      <div>
                        <Label className="mb-1 block text-xs">
                          Warna <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                          value={item.warna}
                          onValueChange={(value) =>
                            handleItemChange(item.id, "warna", value)
                          }
                          options={WARNA_OPTIONS}
                          placeholder="Pilih"
                          searchPlaceholder="Search..."
                          emptyMessage="Not found."
                          allowCustomValue={false}
                          className="w-full"
                        />
                      </div>

                      {/* Ukuran */}
                      <div>
                        <Label className="mb-1 block text-xs">
                          Ukuran <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={item.ukuran}
                          onChange={(e) =>
                            handleItemChange(item.id, "ukuran", e.target.value)
                          }
                          placeholder="e.g., 10"
                        />
                      </div>

                      {/* Berat */}
                      <div>
                        <Label className="mb-1 block text-xs">
                          Berat (gram) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.berat}
                          onChange={(e) =>
                            handleItemChange(item.id, "berat", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      {/* Pcs */}
                      <div>
                        <Label className="mb-1 block text-xs">
                          Pcs <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={item.pcs}
                          onChange={(e) =>
                            handleItemChange(item.id, "pcs", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Preview badges */}
                    {item.kadar && item.warna && (
                      <div className="flex gap-2 mt-3">
                        <Badge className={getKadarColor(item.kadar)}>
                          {item.kadar.toUpperCase()}
                        </Badge>
                        <Badge className={getWarnaColor(item.warna)}>
                          {item.warna.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {formData.items.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">
                  Belum ada detail barang. Klik "Tambah Item" untuk menambahkan.
                </p>
              </div>
            )}
          </div>

          {/* Notes/Question */}
          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Catatan
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Tulis catatan Anda di sini..."
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.notes.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={
                !formData.pabrik.id &&
                !formData.namaBarang.trim() &&
                !formData.kadar &&
                !formData.warna &&
                !formData.notes.trim() &&
                formData.images.length === 0 &&
                formData.items.length === 0
              }
            >
              {inline ? "Simpan" : "Kirim Pertanyaan"}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1"
              disabled={
                !formData.pabrik.id &&
                !formData.namaBarang &&
                !formData.kadar &&
                !formData.warna &&
                !formData.notes &&
                formData.images.length === 0 &&
                formData.items.length === 0
              }
            >
              Clear
            </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="secondary"
                className="flex-1"
              >
                Batal
              </Button>
            )}
          </div>
        </div>

        {!inline && (
          <Card className="p-4 bg-blue-50 border-blue-200 mt-6">
            <p className="text-sm text-blue-900">
              <strong>Catatan:</strong> Semua field bersifat opsional. Isi minimal satu field untuk mengirim pertanyaan. Pertanyaan Anda akan dikirim langsung ke supplier yang dipilih.
            </p>
          </Card>
        )}
    </>
  );

  if (inline) {
    return (
      <div className="p-6">
        {formContent}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <Card className="p-6">
        {formContent}
      </Card>
    </div>
  );
}
