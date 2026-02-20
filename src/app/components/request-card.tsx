import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import { Request } from "@/app/types/request";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
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
import { CheckCircle, Copy, Edit, Eye, Trash2 } from "lucide-react";
import { DetailItemsTable } from "./detail-items-table";
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

interface RequestCardProps {
  order: Request;
  userRole?: "sales" | "stockist" | "jb";
  showSalesName?: boolean;
  activeTab?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEditOrder?: (order: Request) => void;
  onDuplicateOrder?: (order: Request) => void;
  onCancelOrder?: (orderId: string) => void;
  onVerifyStock?: (order: Request, tab: string) => void;
  onSeeDetail?: (order: Request, tab: string) => void;
}

export function RequestCard({
  order,
  userRole = "jb",
  showSalesName = false,
  activeTab = "",
  isExpanded = false,
  onToggleExpand,
  onEditOrder,
  onDuplicateOrder,
  onCancelOrder,
  onVerifyStock,
  onSeeDetail,
}: RequestCardProps) {
  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimestampWithTime = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}:${seconds}`;
    return `${dateStr}, ${timeStr}`;
  };

  const getOrderImage = (order: Request) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return italySanta;
  };

  const getPabrikColor = (pabrikName: string) => {
    const colors: Record<string, string> = {
      Santa: "bg-purple-100 text-purple-800",
      Semar: "bg-blue-100 text-blue-800",
      UBS: "bg-emerald-100 text-emerald-800",
      Phoenix: "bg-orange-100 text-orange-800",
      Rajawali: "bg-red-100 text-red-800",
      King: "bg-amber-100 text-amber-800",
      Lotus: "bg-pink-100 text-pink-800",
      Cemerlang: "bg-teal-100 text-teal-800",
      Antam: "bg-indigo-100 text-indigo-800",
    };

    for (const [key, color] of Object.entries(colors)) {
      if (pabrikName.includes(key)) {
        return color;
      }
    }
    return "bg-gray-100 text-gray-800";
  };

  const jenisProdukLabel = getLabelFromValue(
    JENIS_PRODUK_OPTIONS,
    order.jenisProduk,
  );
  const productNameLabel =
    order.kategoriBarang === "basic"
      ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
      : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

  // Display pabrik name directly from object with safety check - ensure string type
  const pabrikLabel: string =
    typeof order.pabrik === "string"
      ? order.pabrik
      : order.pabrik?.name || "Unknown Pabrik";

  // Display atas nama directly from object with safety check - ensure string type
  const atasNamaLabel: string =
    typeof order.namaPelanggan === "string"
      ? order.namaPelanggan
      : order.namaPelanggan?.name || "";

  return (
    <Card className="p-3 sm:p-4 relative">
      {/* Top Right - Status (Desktop only) */}
      <div className="hidden sm:block absolute top-4 right-4">
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
        >
          {order.status || "Open"}
        </span>
      </div>

      <div className="flex gap-2 sm:gap-4">
        {/* Left Side - Updated Date and Image */}
        <div className="flex flex-col w-20 sm:w-36 md:w-44 lg:w-48 shrink-0">
          {/* Updated Date at top */}
          <div className="mb-1 sm:mb-2">
            <div className="text-[9px] sm:text-xs text-gray-500 mb-0.5">
              Updated
            </div>
            <div className="text-[11px] sm:text-sm font-semibold">
              {formatTimestampWithTime(order.updatedDate || order.timestamp) ||
                "-"}
            </div>
          </div>

          {/* Product Image */}
          <div className="w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={getOrderImage(order)}
              alt={productNameLabel}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Side - Order Details */}
        <div className="flex-1 min-w-0">
          {/* Jenis Barang + Nama with Category Badge + Status (Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs sm:text-base leading-tight">
                {jenisProdukLabel} {productNameLabel}
              </h3>
              <span
                className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded shrink-0 ${
                  order.kategoriBarang === "basic"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {order.kategoriBarang === "basic" ? "Basic" : "Model"}
              </span>
              {/* Status pill - Mobile only */}
              <span
                className={`sm:hidden text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
              >
                {order.status || "Open"}
              </span>
            </div>
          </div>

          {/* Request No */}
          {order.requestNo && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500">Request No: </span>
              <span className="font-mono">{order.requestNo}</span>
            </p>
          )}

          {/* Created Date */}
          <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
            <span className="text-gray-500">Created: </span>
            {formatTimestamp(order.timestamp) || "-"}
          </p>

          {/* Sales Name (show for stockist and jb roles) */}
          {(userRole === "stockist" || userRole === "jb") &&
            order.createdBy && (
              <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
                <span className="text-gray-500 hidden sm:inline">Sales: </span>
                {getFullNameFromUsername(order.createdBy || "")}
              </p>
            )}

          {/* Sales Name (only show for sales if flag is set) */}
          {userRole === "sales" && showSalesName && order.createdBy && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500 hidden sm:inline">Sales: </span>
              {getFullNameFromUsername(order.createdBy || "")}
            </p>
          )}

          {/* Stockist Name (show for sales and jb roles when stockist is assigned) */}
          {(userRole === "sales" || userRole === "jb") && order.stockistId && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500 hidden sm:inline">Stockist: </span>
              {getFullNameFromUsername(order.stockistId || "")}
            </p>
          )}

          {/* Atas Nama */}
          {order.namaPelanggan && order.namaPelanggan.name && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500 hidden sm:inline">
                Atas Nama:{" "}
              </span>
              {atasNamaLabel}
            </p>
          )}

          {/* Pabrik with color badge */}
          <div className="mb-0.5 sm:mb-1">
            <span className="text-[11px] sm:text-sm text-gray-500 hidden sm:inline">
              Pabrik:{" "}
            </span>
            <span
              className={`text-[11px] sm:text-sm font-medium px-2 py-0.5 rounded ${getPabrikColor(pabrikLabel)}`}
            >
              {pabrikLabel}
            </span>
          </div>

          {/* ETA beneath Pabrik - smaller text */}
          <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
            <span className="text-gray-500 hidden sm:inline">ETA: </span>
            {formatDate(order.waktuKirim) || "-"}
          </p>

          {/* Action Buttons */}
          {(onToggleExpand ||
            onEditOrder ||
            onDuplicateOrder ||
            onCancelOrder ||
            onVerifyStock ||
            onSeeDetail) && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
              {/* Show/Hide Items Button */}
              {onToggleExpand && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleExpand}
                  className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                >
                  {isExpanded ? (
                    <>
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Hide Items</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Show Items</span>
                    </>
                  )}
                </Button>
              )}

              {/* Sales actions */}
              {userRole === "sales" && (
                <>
                  {/* Only show Cancel and Edit buttons in Open tab */}
                  {activeTab === "open" && (
                    <>
                      {onCancelOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelOrder(order.id)}
                          className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      )}
                      {onEditOrder && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditOrder(order)}
                          className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                        >
                          <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      )}
                    </>
                  )}
                  {/* Duplicate button visible except in Cancelled tab */}
                  {activeTab !== "cancelled" && onDuplicateOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateOrder(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Duplicate</span>
                    </Button>
                  )}
                  {/* View Detail button in Cancelled tab */}
                  {activeTab === "cancelled" && onSeeDetail && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSeeDetail(order, activeTab)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">View Detail</span>
                    </Button>
                  )}
                </>
              )}

              {/* Stockist actions */}
              {userRole === "stockist" &&
                onVerifyStock &&
                (order.status === "Open" ||
                  order.status === "Stockist Processing" ||
                  order.status === "In Progress") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerifyStock(order, activeTab)}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Verify Stock</span>
                  </Button>
                )}

              {/* See Detail button - show in done, cancelled, assigned tabs, and in-progress for sales */}
              {(activeTab === "done" ||
                activeTab === "cancelled" ||
                activeTab === "assigned" ||
                (activeTab === "in-progress" && userRole === "sales") ||
                activeTab === "waiting") &&
                onSeeDetail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSeeDetail(order, activeTab)}
                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">
                      {userRole === "jb" && activeTab === "assigned"
                        ? "Write Order"
                        : "See Details"}
                    </span>
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && <DetailItemsTable order={order} userRole={userRole} />}
    </Card>
  );
}
