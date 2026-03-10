import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import type { Question, QuestionItem } from "@/app/types/question";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function StockistQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "answered">("pending");
  const [answerNotes, setAnswerNotes] = useState("");
  const [answerItems, setAnswerItems] = useState<QuestionItem[]>([]);

  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    // Initialize answer items when a question is selected
    if (selectedQuestion && selectedQuestion.items) {
      setAnswerItems(
        selectedQuestion.items.map((item) => ({
          ...item,
          availablePcs: item.availablePcs || "",
        }))
      );
    } else {
      setAnswerItems([]);
    }
    setAnswerNotes("");
  }, [selectedQuestion]);

  const loadQuestions = () => {
    const savedQuestions = localStorage.getItem("questions");
    if (savedQuestions) {
      const parsedQuestions = JSON.parse(savedQuestions);
      setQuestions(parsedQuestions);
    }
  };

  const handleItemAvailableChange = (itemId: string, value: string) => {
    setAnswerItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, availablePcs: value } : item
      )
    );
  };

  const handleAnswerQuestion = () => {
    if (!selectedQuestion) return;

    // Validate that all items have available pcs if there are items
    if (answerItems.length > 0) {
      const hasEmptyPcs = answerItems.some((item) => !item.availablePcs || item.availablePcs.trim() === "");
      if (hasEmptyPcs) {
        toast.error("Mohon isi semua jumlah pcs tersedia");
        return;
      }
    }

    const updatedQuestions = questions.map((q) =>
      q.id === selectedQuestion.id
        ? {
            ...q,
            status: "answered" as const,
            answer: {
              answeredBy: currentUser,
              answeredDate: Date.now(),
              notes: answerNotes,
              items: answerItems.length > 0 ? answerItems : undefined,
            },
          }
        : q
    );

    setQuestions(updatedQuestions);
    localStorage.setItem("questions", JSON.stringify(updatedQuestions));
    
    toast.success("Pertanyaan berhasil dijawab");

    setSelectedQuestion(null);
    setAnswerNotes("");
    setAnswerItems([]);
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

  if (selectedQuestion) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedQuestion(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Detail Pertanyaan</h2>
              <p className="text-sm text-gray-500 mt-1">
                Dari: {selectedQuestion.createdBy} • {formatDate(selectedQuestion.createdDate)}
              </p>
            </div>
            <Badge
              variant={selectedQuestion.status === "pending" ? "default" : "secondary"}
            >
              {selectedQuestion.status === "pending" ? "Belum Dijawab" : "Sudah Dijawab"}
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Pabrik/Supplier */}
            {selectedQuestion.pabrik.name && (
              <div>
                <Label className="mb-2 block text-gray-600">Pabrik/Supplier</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  {selectedQuestion.pabrik.name}
                </div>
              </div>
            )}

            {/* Nama Barang */}
            {selectedQuestion.namaBarang && (
              <div>
                <Label className="mb-2 block text-gray-600">Nama Barang</Label>
                <Input
                  value={selectedQuestion.namaBarang}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            )}

            {/* Kadar and Warna */}
            {(selectedQuestion.kadar || selectedQuestion.warna) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kadar */}
                {selectedQuestion.kadar && (
                  <div>
                    <Label className="mb-2 block text-gray-600">Kadar</Label>
                    <div className="flex items-center">
                      <Badge className={getKadarColor(selectedQuestion.kadar)}>
                        {selectedQuestion.kadar.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Warna */}
                {selectedQuestion.warna && (
                  <div>
                    <Label className="mb-2 block text-gray-600">Warna</Label>
                    <div className="flex items-center">
                      <Badge className={getWarnaColor(selectedQuestion.warna)}>
                        {selectedQuestion.warna.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Images */}
            {selectedQuestion.images.length > 0 && (
              <div>
                <Label className="mb-2 block text-gray-600">Gambar</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedQuestion.images.map((image, index) => (
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
                <Label className="mb-2 block text-gray-600">Pertanyaan/Catatan</Label>
                <Textarea
                  value={selectedQuestion.notes}
                  readOnly
                  rows={6}
                  className="resize-none bg-gray-50"
                />
              </div>
            )}

            {/* Items Table - if question has items */}
            {selectedQuestion.items && selectedQuestion.items.length > 0 && (
              <div>
                <Label className="mb-2 block text-gray-600">Detail Barang</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold">Kadar</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold">Warna</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold">Ukuran</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold">Berat</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold">Pcs Diminta</th>
                        {selectedQuestion.status === "answered" && (
                          <th className="px-4 py-2 text-left text-xs font-semibold">Pcs Tersedia</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuestion.items.map((item, index) => {
                        const answeredItem = selectedQuestion.answer?.items?.find(
                          (i) => i.id === item.id
                        );
                        return (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2 text-sm">
                              <Badge className={getKadarColor(item.kadar)} variant="secondary">
                                {item.kadar.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Badge className={getWarnaColor(item.warna)} variant="secondary">
                                {item.warna.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-sm">{item.ukuran}</td>
                            <td className="px-4 py-2 text-sm">{item.berat}g</td>
                            <td className="px-4 py-2 text-sm">{item.pcs} pcs</td>
                            {selectedQuestion.status === "answered" && (
                              <td className="px-4 py-2 text-sm">
                                <span className={`font-semibold ${
                                  answeredItem?.availablePcs === "0" ? "text-red-600" : "text-green-600"
                                }`}>
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

            {/* Answer Status - for answered questions */}
            {selectedQuestion.status === "answered" && selectedQuestion.answer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Sudah Dijawab
                    </p>
                    {selectedQuestion.answer.notes && (
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                        {selectedQuestion.answer.notes}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Dijawab oleh: {selectedQuestion.answer.answeredBy} •{" "}
                      {formatDate(selectedQuestion.answer.answeredDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Form - Only show for pending questions */}
            {selectedQuestion.status === "pending" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Jawaban</h3>
                
                {/* Answer Items - if question has items */}
                {answerItems.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Jumlah Pcs Tersedia</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold">Barang</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold">Diminta</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold">Tersedia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {answerItems.map((item, index) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-4 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge className={getKadarColor(item.kadar)} variant="secondary">
                                    {item.kadar.toUpperCase()}
                                  </Badge>
                                  <Badge className={getWarnaColor(item.warna)} variant="secondary">
                                    {item.warna.toUpperCase()}
                                  </Badge>
                                  <span className="text-gray-600">
                                    {item.ukuran} • {item.berat}g
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold">
                                {item.pcs} pcs
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.availablePcs}
                                  onChange={(e) =>
                                    handleItemAvailableChange(item.id, e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-24"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Answer Notes */}
                <div>
                  <Label htmlFor="answer-notes" className="mb-2 block">
                    Catatan Tambahan (Opsional)
                  </Label>
                  <Textarea
                    id="answer-notes"
                    value={answerNotes}
                    onChange={(e) => setAnswerNotes(e.target.value)}
                    placeholder="Tambahkan catatan tambahan jika diperlukan..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleAnswerQuestion}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Kirim Jawaban
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Pertanyaan dari Sales</h2>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "answered")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending">
              Belum Dijawab ({pendingQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="answered">
              Sudah Dijawab ({answeredQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingQuestions.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Tidak ada pertanyaan yang belum dijawab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingQuestions.map((question) => (
                  <Card
                    key={question.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {question.namaBarang || "Pertanyaan Produk"}
                          </h3>
                          {question.kadar && (
                            <Badge className={getKadarColor(question.kadar)} variant="secondary">
                              {question.kadar.toUpperCase()}
                            </Badge>
                          )}
                          {question.warna && (
                            <Badge className={getWarnaColor(question.warna)} variant="secondary">
                              {question.warna.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Pabrik: {question.pabrik.name || "-"}
                        </p>
                        {question.notes && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {question.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Dari: {question.createdBy}</span>
                          <span>•</span>
                          <span>{formatDate(question.createdDate)}</span>
                          {question.images.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {question.images.length} gambar
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="default">Belum Dijawab</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="answered">
            {answeredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Tidak ada pertanyaan yang sudah dijawab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {answeredQuestions.map((question) => (
                  <Card
                    key={question.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {question.namaBarang || "Pertanyaan Produk"}
                          </h3>
                          {question.kadar && (
                            <Badge className={getKadarColor(question.kadar)} variant="secondary">
                              {question.kadar.toUpperCase()}
                            </Badge>
                          )}
                          {question.warna && (
                            <Badge className={getWarnaColor(question.warna)} variant="secondary">
                              {question.warna.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Pabrik: {question.pabrik.name || "-"}
                        </p>
                        {question.notes && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {question.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>Dari: {question.createdBy}</span>
                          <span>•</span>
                          <span>{formatDate(question.createdDate)}</span>
                          {question.images.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {question.images.length} gambar
                              </span>
                            </>
                          )}
                        </div>
                        {question.answer && (
                          <div className="flex items-center gap-2 mt-2">
                            {question.answer.available ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Tersedia
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                <XCircle className="w-3 h-3 mr-1" />
                                Tidak Tersedia
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">Sudah Dijawab</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
