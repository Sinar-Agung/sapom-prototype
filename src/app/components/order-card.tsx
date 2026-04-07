import {
  getLabelFromValue,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
import { getImage } from "@/app/utils/image-storage";
import { formatRelativeTime } from "@/app/utils/relative-time";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import { getBranchName, getFullNameFromUsername } from "@/app/utils/user-data";
import casteli from "@/assets/images/casteli.png";
import hollowFancyNori from "@/assets/images/hollow-fancy-nori.png";
import italyBambu from "@/assets/images/italy-bambu.png";
import italyKaca from "@/assets/images/italy-kaca.png";
import italySanta from "@/assets/images/italy-santa.png";
import kalungFlexi from "@/assets/images/kalung-flexi.png";
import milano from "@/assets/images/milano.png";
import sunnyVanessa from "@/assets/images/sunny-vanessa.png";
import tambang from "@/assets/images/tambang.png";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Edit,
  Eye,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DetailItemsTable } from "./detail-items-table";
import { NewBadge } from "./new-badge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
  onPhotoUpdate?: (file: File) => void;
  activeTab?: string;
  currentUser?: string;
  userRole?: "sales" | "jb" | "supplier" | "stockist";
  showSalesName?: boolean;
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
  onPhotoUpdate,
  activeTab,
  currentUser,
  userRole,
  showSalesName,
}: OrderCardProps) {
  // Check if current user has viewed this order
  const isUnviewed = currentUser && !order.viewedBy?.includes(currentUser);

  // Async image loading
  const [resolvedImage, setResolvedImage] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (order.photoId) {
        const stored = await getImage(order.photoId);
        if (!cancelled) setResolvedImage(stored ?? getFallbackImage(order));
      } else {
        if (!cancelled) setResolvedImage(getFallbackImage(order));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [order.photoId, order.kategoriBarang, order.namaBasic]);

  // Photo upload refs
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpdate) {
      onPhotoUpdate(file);
      e.target.value = "";
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setShowCameraPreview(true);
      setCapturedImage(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch {
      fileInputCameraRef.current?.click();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCameraPreview(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
  };

  const confirmCameraPhoto = async () => {
    if (!capturedImage || !onPhotoUpdate) return;
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
    onPhotoUpdate(file);
    stopCamera();
  };
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

  const getFallbackImage = (o: Order): string => {
    if (o.kategoriBarang === "basic" && o.namaBasic) {
      return NAMA_BASIC_IMAGES[o.namaBasic] || italySanta;
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
    <>
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
          {/* Left Side - Updated Date and Image */}
          <div className="flex flex-col w-20 sm:w-36 md:w-44 lg:w-48 shrink-0">
            {/* Updated Date at top */}
            <div className="mb-1 sm:mb-2">
              <div className="text-[9px] sm:text-xs text-gray-500 mb-0.5">
                Updated
              </div>
              <div className="text-[11px] sm:text-sm font-semibold">
                {formatRelativeTime(order.updatedDate || order.createdDate) ||
                  "-"}
              </div>
            </div>

            {/* Product Image */}
            {onPhotoUpdate ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 border rounded-lg overflow-hidden bg-gray-50 relative cursor-pointer group">
                    <img
                      src={resolvedImage ?? getFallbackImage(order)}
                      alt={productNameLabel}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem
                    onClick={() => fileInputGalleryRef.current?.click()}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose from Gallery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={startCamera}>
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={resolvedImage ?? getFallbackImage(order)}
                  alt={productNameLabel}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputGalleryRef}
              onChange={handlePhotoFileChange}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputCameraRef}
              onChange={handlePhotoFileChange}
            />
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
            <div className="grid grid-cols-[minmax(160px,auto)_auto_1fr] gap-x-3 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-sm text-gray-700 mb-2 sm:mb-3">
              {/* PO Number - only show when available */}
              {order.PONumber && (
                <>
                  <span className="text-gray-500">PO Number</span>
                  <span>:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {order.PONumber}
                  </span>
                </>
              )}

              {/* PO Number - show when available and no dedicated PO field yet */}
              {!order.PONumber && order.requestNo && (
                <>
                  <span className="text-gray-500">PO Number</span>
                  <span>:</span>
                  <span className="font-mono text-gray-700">
                    {order.requestNo}
                  </span>
                </>
              )}

              {/* Updated Date */}
              <span className="text-gray-500">Updated</span>
              <span>:</span>
              <span className="font-medium">
                {formatTimestampWithTime(
                  order.updatedDate || order.createdDate,
                ) || "-"}
              </span>

              {/* Created Date */}
              <span className="text-gray-500">Created</span>
              <span>:</span>
              <span>{formatTimestamp(order.createdDate) || "-"}</span>

              {/* ETA */}
              <span className="text-gray-500">ETA</span>
              <span>:</span>
              <span>{formatDate(order.waktuKirim) || "-"}</span>

              {/* JB Name - Hidden for suppliers */}
              {userRole !== "supplier" && order.jbId && (
                <>
                  <span className="text-gray-500">JB</span>
                  <span>:</span>
                  <span className="text-gray-700">
                    {getJBFullName(order.jbId)}
                  </span>
                </>
              )}

              {/* Sales Name - for JB/stockist, or when showSalesName is set */}
              {userRole !== "supplier" &&
                order.sales &&
                (userRole === "jb" ||
                  userRole === "stockist" ||
                  showSalesName) && (
                  <>
                    <span className="text-gray-500">Sales</span>
                    <span>:</span>
                    <span className="text-gray-700">
                      {getFullNameFromUsername(order.sales)}
                    </span>
                  </>
                )}

              {/* Customer Name - Hidden for suppliers */}
              {userRole !== "supplier" && order.atasNama && (
                <>
                  <span className="text-gray-500">Customer Name</span>
                  <span>:</span>
                  <span className="text-gray-700">{order.atasNama}</span>
                </>
              )}

              {/* Supplier - Hidden for suppliers */}
              {userRole !== "supplier" && (
                <>
                  <span className="text-gray-500">Supplier</span>
                  <span>:</span>
                  <Badge
                    variant="secondary"
                    className={`${getPabrikColor(pabrikLabel)}`}
                  >
                    {pabrikLabel}
                  </Badge>
                </>
              )}

              {/* Branch - show when available */}
              {order.branchCode && (
                <>
                  <span className="text-gray-500">Branch</span>
                  <span>:</span>
                  <span className="font-medium text-gray-700">
                    {getBranchName(order.branchCode)}
                  </span>
                </>
              )}
            </div>

            {/* Reason of Rejection - only for Rejected status */}
            {(order.status as string) === "Rejected" &&
              order.rejectionReason && (
                <p className="text-[11px] sm:text-sm text-red-700 bg-red-50 rounded px-2 py-1 mb-2 sm:mb-3">
                  <span className="font-medium">Reason of Rejection: </span>
                  {order.rejectionReason}
                </p>
              )}

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
                  ((order.status as string) === "Open" ||
                    (order.status as string) === "JB Verifying") && (
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
                  (order.status as string) === "Open" && (
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

                {/* Update Order Button - Supplier only, and not for requests (Open/JB Verifying) */}
                {onUpdateOrder &&
                  userRole === "supplier" &&
                  (order.status as string) !== "Open" &&
                  (order.status as string) !== "JB Verifying" && (
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
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
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

      <Dialog open={showCameraPreview} onOpenChange={stopCamera}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!capturedImage ? (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ maxHeight: "60vh" }}
                />
              </div>
            ) : (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto"
                  style={{ maxHeight: "60vh" }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {!capturedImage ? (
              <>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
                <Button onClick={capturePhoto}>
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCapturedImage(null)}
                >
                  Retake
                </Button>
                <Button onClick={confirmCameraPhoto}>Confirm</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
