import {
  ATAS_NAMA_OPTIONS,
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  PABRIK_OPTIONS,
} from "@/app/data/order-data";
import { Request } from "@/app/types/request";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import { CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";

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

interface JBHomeProps {
  onNavigateToTab?: (tab: string) => void;
  onSeeDetail?: (order: Request, currentTab: string) => void;
}

export function JBHome({ onNavigateToTab, onSeeDetail }: JBHomeProps) {
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [recentAssigned, setRecentAssigned] = useState<Request[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";
  const fullName = getFullNameFromUsername(currentUser);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const orders: Request[] = JSON.parse(savedOrders);

      // Get 5 most recently created requests
      const recent = [...orders]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      setRecentRequests(recent);

      // Get 5 most recently assigned to JB
      const assigned = orders
        .filter((o) => o.status === "Requested to JB")
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      setRecentAssigned(assigned);

      // Calculate counts
      setOpenCount(orders.filter((o) => o.status === "Open").length);
      setAssignedCount(
        orders.filter((o) => o.status === "Requested to JB").length,
      );
      setCompletedCount(
        orders.filter(
          (o) =>
            o.status === "Done" ||
            o.status === "Ready Stock Marketing" ||
            o.status === "Stock Unavailable",
        ).length,
      );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderImage = (order: Order) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return italySanta;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Welcome, {fullName}</h1>
        <p className="text-gray-600">Your dashboard overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.("assigned")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned to JB</p>
              <p className="text-2xl font-bold">{assignedCount}</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.("done")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Latest Assigned to JB */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Latest Assigned to JB</h2>
        <div className="space-y-3">
          {recentAssigned.length > 0 ? (
            recentAssigned.map((order) => {
              const jenisProdukLabel = getLabelFromValue(
                JENIS_PRODUK_OPTIONS,
                order.jenisProduk,
              );
              const productNameLabel =
                order.kategoriBarang === "basic"
                  ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
                  : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);
              const pabrikLabel =
                typeof order.pabrik === "string"
                  ? getLabelFromValue(PABRIK_OPTIONS, order.pabrik)
                  : order.pabrik?.name ||
                    getLabelFromValue(PABRIK_OPTIONS, order.pabrik?.id || "");
              const atasNamaLabel =
                typeof order.namaPelanggan === "string"
                  ? getLabelFromValue(ATAS_NAMA_OPTIONS, order.namaPelanggan)
                  : order.namaPelanggan?.name ||
                    getLabelFromValue(
                      ATAS_NAMA_OPTIONS,
                      order.namaPelanggan?.id || "",
                    );

              return (
                <Card
                  key={order.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSeeDetail?.(order, "assigned")}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      <img
                        src={getOrderImage(order)}
                        alt={productNameLabel}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm">
                            {jenisProdukLabel} {productNameLabel}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {pabrikLabel} • {atasNamaLabel}
                          </p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          {formatTimestamp(order.timestamp)}
                        </span>
                        <span className="text-gray-500">
                          {order.detailItems.length} item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="text-center py-4 text-gray-500">
              No assigned requests yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
