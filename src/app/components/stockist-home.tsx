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
import { ArrowRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
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

interface StockistHomeProps {
  onNavigateToRequests: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export function StockistHome({
  onNavigateToRequests,
  onNavigateToTab,
}: StockistHomeProps) {
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";
  const fullName = getFullNameFromUsername(currentUser);

  useEffect(() => {
    loadOpenRequests();

    // Add event listener for storage changes to update counts when orders change
    const handleStorageChange = () => {
      loadOpenRequests();
    };
    window.addEventListener("storage", handleStorageChange);

    // Also reload when component becomes visible (for sessionStorage changes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadOpenRequests();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up interval to periodically check for updates
    const interval = setInterval(loadOpenRequests, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const loadOpenRequests = () => {
    const savedOrders = localStorage.getItem("requests");
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders) as Request[];

      // Calculate totals for each status - matching my-orders.tsx logic
      setOpenCount(allOrders.filter((order) => order.status === "Open").length);

      // In Progress includes multiple statuses to match request page
      setInProgressCount(
        allOrders.filter(
          (order) =>
            order.status === "In Progress" ||
            order.status === "Stockist Processing" ||
            order.status === "Requested to JB",
        ).length,
      );

      setDoneCount(allOrders.filter((order) => order.status === "Done").length);

      // Assigned count - requests that have been assigned/completed by stockist
      const assignedStatuses = [
        "Ready Stock Marketing",
        "Requested to JB",
        "Stock Unavailable",
        "Done",
      ];
      setAssignedCount(
        allOrders.filter((order) => assignedStatuses.includes(order.status))
          .length,
      );

      // Filter for Open status and take latest 3
      const openOrders = allOrders
        .filter((order) => order.status === "Open")
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
      setOpenRequests(openOrders);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOrderImage = (order: Request) => {
    if (order.photoId) {
      const storedImage = getImage(order.photoId);
      if (storedImage) return storedImage;
    }
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
        <p className="text-gray-600">Here are the latest open requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.("open")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Requests</p>
              <p className="text-2xl font-bold">{openCount}</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.("in-progress")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateToTab?.("assigned")}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
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
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Done</p>
              <p className="text-2xl font-bold">{doneCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Latest Open Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest Open Requests</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToRequests}
            className="text-blue-600 hover:text-blue-700"
          >
            See All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {openRequests.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg mb-2">No open requests</p>
              <p className="text-sm">New requests will appear here</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {openRequests.map((order) => {
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
                <Card key={order.id} className="p-4">
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
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Open
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          ETA: {formatDate(order.waktuKirim)}
                        </span>
                        <span className="text-gray-500">
                          {order.detailItems.length} item(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
