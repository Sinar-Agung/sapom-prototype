import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export function StockistQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "answered">("pending");

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
      const parsedQuestions = JSON.parse(savedQuestions);
      setQuestions(parsedQuestions);
    }
  };

  const handleAnswerQuestion = (available: boolean) => {
    if (!selectedQuestion) return;

    const updatedQuestions = questions.map((q) =>
      q.id === selectedQuestion.id
        ? {
            ...q,
            status: "answered" as const,
            answer: {
              available,
              answeredBy: currentUser,
              answeredDate: Date.now(),
            },
          }
        : q
    );

    setQuestions(updatedQuestions);
    localStorage.setItem("questions", JSON.stringify(updatedQuestions));
    
    toast.success(
      available
        ? "Pertanyaan dijawab: Barang tersedia"
        : "Pertanyaan dijawab: Barang tidak tersedia"
    );

    setSelectedQuestion(null);
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

            {/* Answer Status */}
            {selectedQuestion.status === "answered" && selectedQuestion.answer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  {selectedQuestion.answer.available ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedQuestion.answer.available
                        ? "Barang Tersedia"
                        : "Barang Tidak Tersedia"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Dijawab oleh: {selectedQuestion.answer.answeredBy} •{" "}
                      {formatDate(selectedQuestion.answer.answeredDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show for pending questions */}
            {selectedQuestion.status === "pending" && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleAnswerQuestion(false)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tidak Ada
                </Button>
                <Button
                  onClick={() => handleAnswerQuestion(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Ada
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
