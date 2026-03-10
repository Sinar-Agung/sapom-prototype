import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Textarea } from "@/app/components/ui/textarea";
import type { Question } from "@/app/types/question";
import {
  CheckCircle2,
  Image as ImageIcon,
  MessageSquarePlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { QuestionForm } from "./question-form";

export function SalesQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const savedQuestions = localStorage.getItem("questions");
    if (savedQuestions) {
      const parsedQuestions: Question[] = JSON.parse(savedQuestions);
      // Filter only current user's questions and sort by latest
      const myQuestions = parsedQuestions
        .filter((q) => q.createdBy === currentUser)
        .sort((a, b) => b.createdDate - a.createdDate);
      setQuestions(myQuestions);

      // Auto-select first question if none selected
      if (myQuestions.length > 0 && !selectedQuestion) {
        setSelectedQuestion(myQuestions[0]);
      }
    }
  };

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

  const handleNewQuestion = () => {
    setIsCreatingNew(true);
    setSelectedQuestion(null);
  };

  const handleFormSuccess = () => {
    loadQuestions();
    setIsCreatingNew(false);
  };

  const handleFormCancel = () => {
    setIsCreatingNew(false);
  };

  // Refresh questions when the component regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadQuestions();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto pb-4">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Left Sidebar - Questions List */}
        <Card className="w-full md:w-80 lg:w-96 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Pertanyaan Saya</h2>
              <p className="text-xs text-gray-500">{questions.length} total</p>
            </div>
            <Button size="sm" onClick={handleNewQuestion}>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Baru
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquarePlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    Belum ada pertanyaan
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={handleNewQuestion}
                  >
                    Buat Pertanyaan
                  </Button>
                </div>
              ) : (
                questions.map((question: Question) => (
                  <Card
                    key={question.id}
                    className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                      selectedQuestion?.id === question.id
                        ? "border-blue-500 border-2 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedQuestion(question);
                      setIsCreatingNew(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {question.namaBarang || "Pertanyaan Produk"}
                      </h3>
                      {question.status === "answered" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {question.kadar && (
                        <Badge
                          className={`${getKadarColor(question.kadar)} text-xs`}
                        >
                          {question.kadar.toUpperCase()}
                        </Badge>
                      )}
                      {question.warna && (
                        <Badge
                          className={`${getWarnaColor(question.warna)} text-xs`}
                        >
                          {question.warna.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    {question.pabrik.name && (
                      <p className="text-xs text-gray-600 mb-1">
                        {question.pabrik.name}
                      </p>
                    )}

                    {question.notes && (
                      <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                        {question.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(question.createdDate)}</span>
                      {question.images.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {question.images.length}
                        </span>
                      )}
                    </div>

                    {question.status === "answered" && (
                      <Badge
                        variant="secondary"
                        className="mt-2 text-xs w-full justify-center"
                      >
                        Sudah Dijawab
                      </Badge>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Right Panel - Question Detail */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {isCreatingNew ? (
            <ScrollArea className="flex-1 w-full">
              <QuestionForm 
                inline={true}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </ScrollArea>
          ) : selectedQuestion ? (
            <>
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedQuestion.namaBarang || "Pertanyaan Produk"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(selectedQuestion.createdDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedQuestion.status === "pending"
                        ? "default"
                        : "secondary"
                    }
                    className="text-sm"
                  >
                    {selectedQuestion.status === "pending"
                      ? "Menunggu Jawaban"
                      : "Sudah Dijawab"}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Pabrik/Supplier */}
                  {selectedQuestion.pabrik.name && (
                    <div>
                      <Label className="mb-2 block text-gray-600">
                        Pabrik/Supplier
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        {selectedQuestion.pabrik.name}
                      </div>
                    </div>
                  )}

                  {/* Kadar and Warna */}
                  {(selectedQuestion.kadar || selectedQuestion.warna) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedQuestion.kadar && (
                        <div>
                          <Label className="mb-2 block text-gray-600">
                            Kadar
                          </Label>
                          <Badge
                            className={getKadarColor(selectedQuestion.kadar)}
                          >
                            {selectedQuestion.kadar.toUpperCase()}
                          </Badge>
                        </div>
                      )}

                      {selectedQuestion.warna && (
                        <div>
                          <Label className="mb-2 block text-gray-600">
                            Warna
                          </Label>
                          <Badge
                            className={getWarnaColor(selectedQuestion.warna)}
                          >
                            {selectedQuestion.warna.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items if any */}
                  {selectedQuestion.items && selectedQuestion.items.length > 0 && (
                    <div>
                      <Label className="mb-2 block text-gray-600">
                        Detail Barang
                      </Label>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold">
                                Kadar
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold">
                                Warna
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold">
                                Ukuran
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold">
                                Berat
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold">
                                Pcs Diminta
                              </th>
                              {selectedQuestion.status === "answered" && (
                                <th className="px-4 py-2 text-left text-xs font-semibold">
                                  Pcs Tersedia
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedQuestion.items.map((item: any) => {
                              const answeredItem =
                                selectedQuestion.answer?.items?.find(
                                  (i: any) => i.id === item.id
                                );
                              return (
                                <tr key={item.id} className="border-t">
                                  <td className="px-4 py-2 text-sm">
                                    <Badge
                                      className={getKadarColor(item.kadar)}
                                      variant="secondary"
                                    >
                                      {item.kadar.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <Badge
                                      className={getWarnaColor(item.warna)}
                                      variant="secondary"
                                    >
                                      {item.warna.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {item.ukuran}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {item.berat}g
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {item.pcs} pcs
                                  </td>
                                  {selectedQuestion.status === "answered" && (
                                    <td className="px-4 py-2 text-sm">
                                      <span
                                        className={`font-semibold ${
                                          answeredItem?.availablePcs === "0"
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        {answeredItem?.availablePcs || "0"} pcs
                                      </span>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {selectedQuestion.images.length > 0 && (
                    <div>
                      <Label className="mb-2 block text-gray-600">
                        Gambar
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedQuestion.images.map((image: string, index: number) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                          >
                            <img
                              src={image}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes/Question */}
                  {selectedQuestion.notes && (
                    <div>
                      <Label className="mb-2 block text-gray-600">
                        Pertanyaan/Catatan
                      </Label>
                      <Textarea
                        value={selectedQuestion.notes}
                        readOnly
                        rows={6}
                        className="resize-none bg-gray-50"
                      />
                    </div>
                  )}

                  {/* Answer Section */}
                  {selectedQuestion.status === "answered" &&
                    selectedQuestion.answer && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-2">
                              Jawaban dari Stockist
                            </p>
                            {selectedQuestion.answer.notes && (
                              <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                                {selectedQuestion.answer.notes}
                              </p>
                            )}
                            <p className="text-xs text-gray-600">
                              Dijawab oleh:{" "}
                              {selectedQuestion.answer.answeredBy} •{" "}
                              {formatDate(selectedQuestion.answer.answeredDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageSquarePlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  Pilih pertanyaan dari daftar atau buat pertanyaan baru
                </p>
                <Button onClick={handleNewQuestion}>
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Buat Pertanyaan Baru
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
