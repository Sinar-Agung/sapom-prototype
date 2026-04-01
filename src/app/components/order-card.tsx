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
import { ChevronDown, ChevronRight, ClipboardCheck, Copy, Edit, Trash2 } from "lucide-react";
import { DetailItemsTable } from "./detail-items-table";
import { NewBadge } from "./new-badge";
import { Badge } from "./ui/badge";
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
  onDuplicateOrder?: (order: Order) => void;
  onCancelOrder?: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  activeTab?: string;
  currentUser?: string;
  userRole?: "sales" | "jb" | "supplier" | "stockist";
}

export function OrderCard({
  order,
  isExpanded = false,
  onToggleExpand,
  onSeeDetail,
  onUpdateOrder,
  onDuplicateOrder,
  onCancelOrder,
  onEditOrder,
  activeTab,
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
        {/* Left Side - Image Only */}
        <div className="flex flex-col w-20 sm:w-36 md:w-44 lg:w-48 shrink-0">
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

          {/* Order Information Grid - All fields in one consistent grid */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-sm text-gray-700 mb-2 sm:mb-3">
            {/* PO Number - only show when available */}
            {order.PONumber && (
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-500">PO Number</span>
                <span>
                  <span>:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {order.PONumber}
                  </span>
                </span>
              </div>
            )}

            {/* Request No - for Sales/JB when status is Open or JB Verifying */}
            {(userRole === "sales" || userRole === "jb") &&
              order.requestNo &&
              ((order.status as string) === "Open" ||
                (order.status as string) === "JB Verifying") && (
                <div className="grid grid-cols-5 gap-x-3">
                  <span className="text-gray-500">Request No</span>
                  <span>
                    <span>:</span>
                    <span className="font-mono text-gray-700">
                      {order.requestNo}
                    </span>
                  </span>
                </div>
              )}

            {/* Updated Date */}
            <div className="grid grid-cols-5 gap-x-3">
              <span className="text-gray-500">Updated</span>
              <span>
                <span>:</span>
                <span className="font-medium">
                  {formatTimestampWithTime(
                    order.updatedDate || order.createdDate,
                  ) || "-"}
                </span>
              </span>
            </div>

            {/* Created Date */}
            <div className="grid grid-cols-5 gap-x-3">
              <span className="text-gray-500">Created</span>
              <span>
                <span>:</span>
                <span>
                  {formatTimestamp(order.createdDate) || "-"}
                </span>
              </span>
            </div>

            {/* ETA */}
            <div className="grid grid-cols-5 gap-x-3">
              <span className="text-gray-500">ETA</span>
              <span>
                <span>:</span>
                <span>
                  {formatDate(order.waktuKirim) || "-"}
                </span>
              </span>
            </div>

            {/* JB Name - Hidden for suppliers */}
            {userRole !== "supplier" && order.jbId && (
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-500">JB</span>
                <span>
                  <span>:</span>
                  <span className="text-gray-700">
                    {getJBFullName(order.jbId)}
                  </span>
                </span>
              </div>
            )}

            {/* Sales Name - Hidden for suppliers */}
            {/* {userRole !== "supplier" && order.sales && (
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-500">Sales</span>
                <span>
                  <span>:</span>
                  <span className="text-gray-700">
                    {getFullNameFromUsername(order.sales)}
                  </span>
                </span>
              </div>
            )} */}

            {/* Customer Name - Hidden for suppliers */}
            {userRole !== "supplier" && order.atasNama && (
              <div className="grid grid-cols-5 gap-x-3">
                <span className="text-gray-500">Customer Name</span>
                <span>
                  <span>:</span>
                  <span className="text-gray-700">{order.atasNama}</span>
                </span>
              </div>
            )}

            {/* Supplier - Hidden for suppliers */}
            {userRole !== "supplier" && (
              <div className="grid grid-cols-5 gap-x-3 items-center">
                <span className="text-gray-500">Supplier</span>
                <span>
                  <span>:</span>
                  <Badge
                    variant="secondary"
                    className={`${getPabrikColor(pabrikLabel)}`}
                  >
                    {pabrikLabel}
                  </Badge>
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onToggleExpand ||
            onSeeDetail ||
            onUpdateOrder ||
            onDuplicateOrder ||
            onCancelOrder ||
            onEditOrder) && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4">
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

              {/* Cancel Button - for Sales when Open or JB Verifying */}
              {onCancelOrder &&
                userRole === "sales" &&
                (activeTab === "open" ||
                  (activeTab === "internal" &&
                    ((order.status as string) === "Open" ||
                      (order.status as string) === "JB Verifying"))) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelOrder(order.id)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel this request</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Edit Button - for Sales when Open only */}
              {onEditOrder &&
                userRole === "sales" &&
                (activeTab === "open" ||
                  (activeTab === "internal" &&
                    (order.status as string) === "Open")) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditOrder(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit this request</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Update Order Button - Only if not JB */}
              {onUpdateOrder && userRole !== "jb" && (
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
                    <p>See Details</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Duplicate Button - only for sales */}
              {onDuplicateOrder && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateOrder(order)}
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Duplicate</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicate as new request</p>
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
