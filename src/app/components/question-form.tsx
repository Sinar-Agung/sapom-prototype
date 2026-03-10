import { KADAR_OPTIONS, PABRIK_OPTIONS, WARNA_OPTIONS } from "@/app/data/order-data";
import { Image, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
}

interface Question {
  id: string;
  createdDate: number;
  createdBy: string;
  pabrik: { id: string; name: string };
  namaBarang: string;
  kadar: string;
  warna: string;
  notes: string;
  images: string[];
  status: "pending" | "answered";
  answer?: {
    available: boolean;
    answeredBy: string;
    answeredDate: number;
  };
}

interface QuestionFormProps {
  onSaveComplete?: () => void;
  initialQuestion?: Question;
}

export function QuestionForm({ onSaveComplete, initialQuestion }: QuestionFormProps) {
  const isEditMode = !!initialQuestion;
  const isAnswered = initialQuestion?.status === "answered";

  const [formData, setFormData] = useState<QuestionFormData>({
    pabrik: initialQuestion?.pabrik || { id: "", name: "" },
    namaBarang: initialQuestion?.namaBarang || "",
    kadar: initialQuestion?.kadar || "",
    warna: initialQuestion?.warna || "",
    notes: initialQuestion?.notes || "",
    images: initialQuestion?.images || [],
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
      formData.images.length > 0;

    if (!hasData) {
      toast.error("Please fill in at least one field");
      return;
    }

    // Don't allow editing answered questions
    if (isAnswered) {
      toast.error("Cannot edit an answered question");
      return;
    }

    // Save question to localStorage
    const savedQuestions = localStorage.getItem("questions");
    const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

    if (isEditMode && initialQuestion) {
      // Update existing question
      const questionIndex = questions.findIndex((q: Question) => q.id === initialQuestion.id);
      if (questionIndex !== -1) {
        questions[questionIndex] = {
          ...questions[questionIndex],
          pabrik: formData.pabrik,
          namaBarang: formData.namaBarang,
          kadar: formData.kadar,
          warna: formData.warna,
          notes: formData.notes,
          images: formData.images,
        };
        toast.success("Question updated successfully!");
      }
    } else {
      // Create new question
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
        status: "pending", // pending, answered
      };
      questions.push(newQuestion);
      toast.success("Question submitted successfully!");
    }

    localStorage.setItem("questions", JSON.stringify(questions));

    // Reset form if not in edit mode
    if (!isEditMode) {
      setFormData({
        pabrik: { id: "", name: "" },
        namaBarang: "",
        kadar: "",
        warna: "",
        notes: "",
        images: [],
      });
    }

    // Call callback for navigation
    if (onSaveComplete) {
      onSaveComplete();
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
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Edit Pertanyaan" : "Pertanyaan Baru"}
        </h2>
        {isAnswered && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Perhatian:</strong> Pertanyaan ini sudah dijawab dan tidak dapat diedit.
            </p>
          </div>
        )}
        <p className="text-gray-600 mb-6">
          {isEditMode
            ? "Edit informasi pertanyaan Anda."
            : "Kirim pertanyaan Anda kepada supplier dengan melampirkan informasi produk, gambar, dan catatan."}
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
              disabled={isAnswered}
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
              disabled={isAnswered}
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
                disabled={isAnswered}
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
                disabled={isAnswered}
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
              {formData.images.length < 5 && !isAnswered && (
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
                      {!isAnswered && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
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
              disabled={isAnswered}
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
                isAnswered ||
                (!formData.pabrik.id &&
                !formData.namaBarang.trim() &&
                !formData.kadar &&
                !formData.warna &&
                !formData.notes.trim() &&
                formData.images.length === 0)
              }
            >
              {isEditMode ? "Simpan Perubahan" : "Kirim Pertanyaan"}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1"
              disabled={
                isAnswered ||
                (!formData.pabrik.id &&
                !formData.namaBarang &&
                !formData.kadar &&
                !formData.warna &&
                !formData.notes &&
                formData.images.length === 0)
              }
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Catatan:</strong> Semua field bersifat opsional. Isi minimal satu field untuk {isEditMode ? "mengupdate" : "mengirim"} pertanyaan. {!isEditMode && "Pertanyaan Anda akan dikirim langsung ke supplier yang dipilih."}
        </p>
      </Card>
    </div>
  );
}
