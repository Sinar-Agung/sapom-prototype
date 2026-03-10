/**
 * Question types for the SAPOM system
 * Used for sales inquiries about product availability
 */

export interface QuestionItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
}

export interface Question {
  id: string;
  createdDate: number;
  createdBy: string;
  pabrik: { id: string; name: string };
  namaBarang: string;
  kadar: string;
  warna: string;
  notes: string;
  images: string[];
  items?: QuestionItem[]; // Optional detail items
  status: "pending" | "answered";
  answer?: {
    answeredBy: string;
    answeredDate: number;
    notes?: string;
    items?: QuestionItem[]; // Items with availablePcs filled by stockist
  };
}
