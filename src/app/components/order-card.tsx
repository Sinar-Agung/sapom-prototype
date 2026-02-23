import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
import { getImage } from "@/app/utils/image-storage";
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
import { ChevronDown, ChevronRight, ClipboardCheck } from "lucide-react";
import { DetailItemsTable } from "./detail-items-table";
import { NewBadge } from "./new-badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Helper function to get JB full name from username
const getJBFullName = (username: string): string => {
  const userDataString = sessionStorage.getItem("userDatabase");
  if (!userDataString) return username;

  try {
    const users = JSON.parse(userDataString);
    const jbUser = users.find(
      (u: any) => u.accountType === "jb" && u.username === username,
    );
    return jbUser?.fullName || username;
  } catch (e) {
    return username;
  }
};

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

interface OrderCardProps {
  order: Order;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSeeDetail?: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  onReviewRevision?: (order: Order) => void;
  currentUser?: string;
  userRole?: "sales" | "jb" | "supplier" | "stockist";
}

export function OrderCard({
  order,
  isExpanded = false,
  onToggleExpand,
  onSeeDetail,
  onUpdateOrder,
  onReviewRevision,
  currentUser,
  userRole,
}: OrderCardProps) {
  // Check if current user has viewed this order
  const isUnviewed = currentUser && !order.viewedBy?.includes(currentUser);
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

  const getOrderImage = (order: Order) => {
    // Check for latest uploaded photo via photoId
    if (order.photoId) {
      const storedImage = getImage(order.photoId);
      if (storedImage) return storedImage;
    }
    // Fallback to predefined Basic images
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

  const pabrikLabel: string = order.pabrik?.name || "Unknown Supplier";

  // Get revision count
  const revisionCount = order.revisionHistory?.length || 0;

  return (
    <Card className="p-3 sm:p-4 relative">
      {/* Top Right - Status and Revision Badge (Desktop only) */}
      <div className="hidden sm:flex absolute top-4 right-4 gap-2">
        {revisionCount > 0 && (
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700 border border-indigo-300">
            {revisionCount} {revisionCount === 1 ? "Revision" : "Revisions"}
          </span>
        )}
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
        >
          {order.status}
        </span>
        {isUnviewed && (
          <NewBadge className="w-8 h-8 flex-shrink-0 animate-pulse-scale" />
        )}
      </div>

      <div className="flex gap-2 sm:gap-4">
        {/* Left Side - Dates and Image */}
        <div className="flex flex-col w-20 sm:w-36 md:w-44 lg:w-48 shrink-0">
          {/* Dates at top */}
          <div className="mb-1 sm:mb-2">
            {/* Updated Date */}
            <div className="text-[9px] sm:text-xs text-gray-500 mb-0.5">
              Updated
            </div>
            <div className="text-[11px] sm:text-sm font-semibold mb-1">
              {formatTimestampWithTime(
                order.updatedDate || order.createdDate,
              ) || "-"}
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
              {/* Revision count badge - Mobile only */}
              {revisionCount > 0 && (
                <span className="sm:hidden text-[9px] px-1.5 py-0.5 rounded font-medium bg-indigo-100 text-indigo-700 border border-indigo-300">
                  {revisionCount} Rev
                </span>
              )}
              {/* Status pill - Mobile only */}
              <span
                className={`sm:hidden text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
              >
                {order.status}
              </span>
              {/* New badge - Mobile only */}
              {isUnviewed && (
                <NewBadge className="sm:hidden w-6 h-6 flex-shrink-0 animate-pulse-scale" />
              )}
            </div>
          </div>

          {/* PO Number - Prominent display */}
          <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
            <span className="text-gray-500">PO Number: </span>
            <span className="font-mono font-semibold text-blue-700">
              {order.PONumber}
            </span>
          </p>

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
            {formatTimestamp(order.createdDate) || "-"}
          </p>

          {/* JB Name - Hidden for suppliers */}
          {userRole !== "supplier" && order.jbId && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500 hidden sm:inline">JB: </span>
              {getJBFullName(order.jbId)}
            </p>
          )}

          {/* Sales Name - Hidden for suppliers */}
          {userRole !== "supplier" && order.sales && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500">Sales: </span>
              {getFullNameFromUsername(order.sales)}
            </p>
          )}

          {/* Customer Name - Hidden for suppliers */}
          {userRole !== "supplier" && order.atasNama && (
            <p className="text-[11px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">
              <span className="text-gray-500">Customer Name: </span>
              {order.atasNama}
            </p>
          )}

          {/* Supplier with color badge - Hidden for suppliers */}
          {userRole !== "supplier" && (
            <div className="mb-0.5 sm:mb-1">
              <span className="text-[11px] sm:text-sm text-gray-500 hidden sm:inline">
                Supplier:{" "}
              </span>
              <span
                className={`text-[11px] sm:text-sm font-medium px-2 py-0.5 rounded ${getPabrikColor(pabrikLabel)}`}
              >
                {pabrikLabel}
              </span>
            </div>
          )}

          {/* ETA beneath Pabrik - smaller text */}
          <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
            <span className="text-gray-500 hidden sm:inline">ETA: </span>
            {formatDate(order.waktuKirim) || "-"}
          </p>

          {/* Action Buttons */}
          {(onToggleExpand || onSeeDetail || onUpdateOrder) && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
              {/* Update Order Button - Only for Change Requested status */}
              {onUpdateOrder && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => onUpdateOrder(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Update Order</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Update order details</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Show/Hide Items Button */}
              {onToggleExpand && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onToggleExpand}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Hide Items</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                          <span className="hidden sm:inline">Show Items</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isExpanded ? "Hide order items" : "Show order items"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* See Details Button */}
              {onSeeDetail && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSeeDetail(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">See Details</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View order details</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Review Revision Button */}
              {onReviewRevision && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReviewRevision(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    >
                      <ClipboardCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Review Revision</span>
                      <span className="sm:hidden">Review</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Review order revision</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <DetailItemsTable
          order={{
            ...order,
            timestamp: order.createdDate,
            updatedBy: order.updatedBy || order.createdBy,
            namaPelanggan: { id: "", name: "" },
            createdBy: { id: order.jbId, username: order.jbId },
          }}
          userRole="jb"
        />
      )}
    </Card>
  );
}
