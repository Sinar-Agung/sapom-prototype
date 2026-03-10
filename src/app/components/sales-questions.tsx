import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { CheckCircle2, Image as ImageIcon, Plus, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

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

interface SalesQuestionsProps {
  onCreateNew?: () => void;
  onEditQuestion?: (question: Question) => void;
}

export function SalesQuestions({
  onCreateNew,
  onEditQuestion,
}: SalesQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "answered">(() => {
    const saved = sessionStorage.getItem("salesQuestionsActiveTab");
    return (saved as "pending" | "answered") || "pending";
  });

  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("salesQuestionsActiveTab", activeTab);
  }, [activeTab]);

  const loadQuestions = () => {
    const savedQuestions = localStorage.getItem("questions");
    if (savedQuestions) {
      const parsedQuestions: Question[] = JSON.parse(savedQuestions);
      // Filter only questions created by current user
      const myQuestions = parsedQuestions.filter(
        (q) => q.createdBy === currentUser
      );
      setQuestions(myQuestions);
    }
  };

  const pendingQuestions = questions.filter((q) => q.status === "pending");
  const answeredQuestions = questions.filter((q) => q.status === "answered");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const renderQuestionCard = (question: Question) => {
    const canEdit = question.status === "pending";

    return (
      <Card key={question.id} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {question.namaBarang && (
                <h3 className="font-semibold text-lg">{question.namaBarang}</h3>
              )}
              {!question.namaBarang && (
                <h3 className="font-semibold text-lg text-gray-500">
                  Pertanyaan #{question.id.split("-")[1]}
                </h3>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(question.createdDate)}
            </p>
            {question.pabrik.name && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Pabrik:</span> {question.pabrik.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {question.status === "answered" && question.answer ? (
              <Badge
                className={
                  question.answer.available
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }
              >
                {question.answer.available ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Ada
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Tidak Ada
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="default">Belum Dijawab</Badge>
            )}
          </div>
        </div>

        {/* Kadar and Warna */}
        {(question.kadar || question.warna) && (
          <div className="flex gap-2 mb-3">
            {question.kadar && (
              <Badge className={getKadarColor(question.kadar)}>
                {question.kadar.toUpperCase()}
              </Badge>
            )}
            {question.warna && (
              <Badge className={getWarnaColor(question.warna)}>
                {question.warna.toUpperCase()}
              </Badge>
            )}
          </div>
        )}

        {/* Notes */}
        {question.notes && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {question.notes}
          </p>
        )}

        {/* Images Preview */}
        {question.images.length > 0 && (
          <div className="flex gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {question.images.length} gambar dilampirkan
            </span>
          </div>
        )}

        {/* Answer Info */}
        {question.status === "answered" && question.answer && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">
              Dijawab oleh {question.answer.answeredBy} pada{" "}
              {formatDate(question.answer.answeredDate)}
            </p>
          </div>
        )}

        {/* Edit Button */}
        {canEdit && onEditQuestion && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditQuestion(question)}
              className="w-full"
            >
              Edit Pertanyaan
            </Button>
          </div>
        )}

        {/* Cannot Edit Info */}
        {!canEdit && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 text-center">
              Pertanyaan tidak dapat diedit setelah dijawab
            </p>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pertanyaan Saya</h1>
          <p className="text-sm text-gray-600 mt-1">
            Kelola pertanyaan Anda kepada supplier
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Buat Pertanyaan Baru
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "answered")} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">
            Belum Dijawab ({pendingQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="answered" className="flex-1">
            Sudah Dijawab ({answeredQuestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Questions */}
        <TabsContent value="pending" className="mt-4">
          {pendingQuestions.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">
                  Belum ada pertanyaan yang belum dijawab
                </p>
                <p className="text-sm">
                  Buat pertanyaan baru untuk menanyakan ketersediaan barang kepada supplier
                </p>
                <Button onClick={onCreateNew} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Buat Pertanyaan Baru
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingQuestions.map((question) => renderQuestionCard(question))}
            </div>
          )}
        </TabsContent>

        {/* Answered Questions */}
        <TabsContent value="answered" className="mt-4">
          {answeredQuestions.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">
                  Belum ada pertanyaan yang sudah dijawab
                </p>
                <p className="text-sm">
                  Pertanyaan yang sudah dijawab oleh stockist akan muncul di sini
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {answeredQuestions.map((question) => renderQuestionCard(question))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
