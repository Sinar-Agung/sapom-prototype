import {
  CUSTOMER_EXPECTATION_OPTIONS,
  JENIS_PRODUK_OPTIONS,
  NAMA_BASIC_OPTIONS,
  NAMA_PRODUK_OPTIONS,
  getLabelFromValue,
} from "@/app/data/order-data";
import { Order } from "@/app/types/order";
import { DetailBarangItem, Request } from "@/app/types/request";
import {
  notifyOrderCreated,
  notifyRequestStatusChanged,
} from "@/app/utils/notification-helper";
import { getStatusBadgeClasses } from "@/app/utils/status-colors";
import {
  findUserByUsername,
  getFullNameFromUsername,
} from "@/app/utils/user-data";
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
  ArrowLeft,
  Calculator,
  Check,
  Copy,
  CopyPlus,
  MessageCircle,
  Share2,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

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

// Color mapping for Kadar
const KADAR_COLORS: Record<string, string> = {
  "6k": "bg-green-500 text-white",
  "8k": "bg-blue-500 text-white",
  "9k": "bg-blue-700 text-white",
  "16k": "bg-orange-500 text-white",
  "17k": "bg-pink-500 text-white",
  "24k": "bg-red-500 text-white",
};

// Color mapping for Warna
const WARNA_COLORS: Record<string, string> = {
  rg: "bg-rose-300 text-gray-800",
  ap: "bg-gray-200 text-gray-800",
  kn: "bg-yellow-400 text-gray-800",
  ks: "bg-yellow-300 text-gray-800",
  "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
  "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
};

interface WriteOrderProps {
  order: Request;
  onBack: () => void;
}

export function WriteOrder({ order, onBack }: WriteOrderProps) {
  const [orderItems, setOrderItems] = useState<DetailBarangItem[]>([]);
  const [hasCreatedOrder, setHasCreatedOrder] = useState(false);
  const [eta, setEta] = useState(order.waktuKirim);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orderItemsRef = useRef<OrderItem[]>([]);

  useEffect(() => {
    // Initialize order items - use existing orderPcs or calculate default (requested - available)
    const initializeditems = order.detailItems.map((item) => {
      // If orderPcs already exists and is not "0", use it
      if (item.orderPcs && item.orderPcs !== "0") {
        return item;
      }

      // Otherwise calculate default: requested - available
      const requestedPcs = parseInt(item.pcs) || 0;
      const availablePcs = parseInt(item.availablePcs || "0") || 0;
      const defaultOrderPcs = Math.max(0, requestedPcs - availablePcs);

      return {
        ...item,
        orderPcs: defaultOrderPcs.toString(),
      };
    });
    setOrderItems(initializeditems);
    orderItemsRef.current = initializeditems;
  }, [order]);

  // Keep ref in sync with state
  useEffect(() => {
    orderItemsRef.current = orderItems;
  }, [orderItems]);

  // Cleanup and save on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savingAnimationTimeoutRef.current) {
        clearTimeout(savingAnimationTimeoutRef.current);
      }

      // Save immediately if there are unsaved changes
      if (hasUnsavedChanges) {
        const savedOrders = localStorage.getItem("requests");
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const orderIndex = orders.findIndex(
            (o: Request) => o.id === order.id,
          );
          if (orderIndex !== -1) {
            orders[orderIndex].detailItems = orderItemsRef.current;
            orders[orderIndex].waktuKirim = eta;
            localStorage.setItem("requests", JSON.stringify(orders));
          }
        }
      }
    };
  }, [hasUnsavedChanges, eta, order.id]);

  const saveChanges = () => {
    try {
      const savedOrders = localStorage.getItem("requests");
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const orderIndex = orders.findIndex((o: Request) => o.id === order.id);
        if (orderIndex !== -1) {
          // Read from ref to get the latest orderItems
          orders[orderIndex].detailItems = orderItemsRef.current;
          orders[orderIndex].waktuKirim = eta;
          localStorage.setItem("requests", JSON.stringify(orders));
          setHasUnsavedChanges(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error saving changes:", error);
      return false;
    }
  };

  const debouncedSave = (immediate = false) => {
    // Clear any existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Clear any existing animation timeout
    if (savingAnimationTimeoutRef.current) {
      clearTimeout(savingAnimationTimeoutRef.current);
      savingAnimationTimeoutRef.current = null;
    }

    if (immediate) {
      // Save immediately without animation or toast
      const saved = saveChanges();
      if (saved) {
        setIsSaving(false);
      }
      return saved;
    }

    // Debounced save with animation
    saveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        setIsSaving(true);

        savingAnimationTimeoutRef.current = setTimeout(() => {
          const saved = saveChanges();
          if (saved) {
            setIsSaving(false);
            toast.success("Request updated");
          }
        }, 500);
      }
    }, 1200);
  };

  const handleOrderPcsChange = (itemId: string, value: string) => {
    setOrderItems((prevItems: OrderItem[]) => {
      const updatedItems = prevItems.map((item: OrderItem) =>
        item.id === itemId ? { ...item, orderPcs: value } : item,
      );
      return updatedItems;
    });
    setHasUnsavedChanges(true);
  };

  const handleOrderPcsBlur = () => {
    if (hasUnsavedChanges) {
      debouncedSave();
    }
  };

  const handleMatchOrderPcs = (itemId: string) => {
    const item = orderItems.find((item) => item.id === itemId);
    if (item) {
      const requestedPcs = parseInt(item.pcs) || 0;
      handleOrderPcsChange(itemId, requestedPcs.toString());
    }
  };

  const handleAutoFillOrderPcs = (itemId: string) => {
    const item = orderItems.find((item) => item.id === itemId);
    if (item) {
      const requestedPcs = parseInt(item.pcs) || 0;
      const availablePcs = parseInt(item.availablePcs || "0") || 0;
      const autoFillPcs = Math.max(0, requestedPcs - availablePcs);
      handleOrderPcsChange(itemId, autoFillPcs.toString());
    }
  };

  const handleMatchAll = () => {
    setOrderItems((prevItems: OrderItem[]) => {
      const updatedItems = prevItems.map((item: OrderItem) => {
        const requestedPcs = parseInt(item.pcs) || 0;
        return { ...item, orderPcs: requestedPcs.toString() };
      });
      return updatedItems;
    });
    setHasUnsavedChanges(true);
  };

  const handleAutoFillAll = () => {
    setOrderItems((prevItems: OrderItem[]) => {
      const updatedItems = prevItems.map((item: OrderItem) => {
        const requestedPcs = parseInt(item.pcs) || 0;
        const availablePcs = parseInt(item.availablePcs || "0") || 0;
        const autoFillPcs = Math.max(0, requestedPcs - availablePcs);
        return { ...item, orderPcs: autoFillPcs.toString() };
      });
      return updatedItems;
    });
    setHasUnsavedChanges(true);
  };

  const getOrderImage = (order: Request) => {
    if (order.kategoriBarang === "basic" && order.namaBasic) {
      return NAMA_BASIC_IMAGES[order.namaBasic] || italySanta;
    }
    return order.fotoBarangBase64 || italySanta;
  };

  const getKadarColor = (kadar: string) => {
    return KADAR_COLORS[kadar.toLowerCase()] || "bg-gray-500 text-white";
  };

  const getWarnaColor = (warna: string) => {
    return WARNA_COLORS[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
  };

  const getWarnaLabel = (warna: string) => {
    const labels: Record<string, string> = {
      rg: "RG",
      ap: "AP",
      kn: "KN",
      ks: "KS",
      "2w-ap-rg": "2W (AP & RG)",
      "2w-ap-kn": "2W (AP & KN)",
    };
    return labels[warna.toLowerCase()] || warna.toUpperCase();
  };

  const getUkuranDisplay = (ukuran: string) => {
    const numValue = parseFloat(ukuran);
    if (!isNaN(numValue)) {
      return `${ukuran} cm`;
    }
    return ukuran;
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

  const handleCreateOrder = () => {
    // Filter items with order pcs > 0
    const itemsToOrder = orderItems.filter(
      (item: OrderItem) => parseInt(item.orderPcs || "0") > 0,
    );

    if (itemsToOrder.length === 0) {
      toast.error("Please enter order quantities");
      return;
    }

    // Show share dialog
    setShowShareDialog(true);
  };

  const generateOrderMessage = () => {
    const itemsToOrder = orderItems.filter(
      (item: OrderItem) => parseInt(item.orderPcs || "0") > 0,
    );

    // Get product details
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
        ? order.pabrik
        : order.pabrik?.name || "Unknown Pabrik";

    // Build order message
    let message = `*ORDER TO SUPPLIER*\n\n`;
    message += `Request No: ${order.requestNo || "-"}\n`;
    message += `Product: ${jenisProdukLabel} ${productNameLabel}\n`;
    message += `Pabrik: ${pabrikLabel}\n`;
    message += `ETA: ${formatDate(order.waktuKirim) || "-"}\n\n`;
    message += `*DETAIL ITEMS:*\n`;

    itemsToOrder.forEach((item: OrderItem, index: number) => {
      message += `\n${index + 1}. `;
      message += `Kadar: ${item.kadar.toUpperCase()}, `;
      message += `Warna: ${getWarnaLabel(item.warna)}, `;
      message += `Ukuran: ${getUkuranDisplay(item.ukuran)}, `;
      message += `Berat: ${item.berat || "-"}, `;
      message += `Order Qty: ${item.orderPcs} pcs`;
    });

    message += `\n\n_Sent via SAPOM Order System_`;
    return message;
  };

  const getOrderImageFile = async (): Promise<File | null> => {
    try {
      const imageUrl = getOrderImage(order);

      // Check if it's a base64 image
      if (imageUrl.startsWith("data:image")) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], "jewelry-order.jpg", { type: "image/jpeg" });
      } else {
        // It's a regular URL (imported image)
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], "jewelry-order.jpg", {
          type: blob.type || "image/jpeg",
        });
      }
    } catch (error) {
      console.error("Error loading image:", error);
      return null;
    }
  };

  const handleShareViaWhatsApp = async () => {
    const message = generateOrderMessage();

    // Try to use Web Share API with image if available
    if (navigator.share && navigator.canShare) {
      const imageFile = await getOrderImageFile();

      if (imageFile) {
        const shareData: ShareData = {
          text: message,
          files: [imageFile],
        };

        // Check if sharing with files is supported
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            setHasCreatedOrder(true);
            setShowShareDialog(false);
            toast.success("Order shared successfully");
            return;
          } catch (error) {
            if ((error as Error).name !== "AbortError") {
              console.error("Error sharing with image:", error);
              // Fall through to text-only WhatsApp
            } else {
              return; // User cancelled
            }
          }
        }
      }
    }

    // Fallback to text-only WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setHasCreatedOrder(true);
    setShowShareDialog(false);
    toast.info(
      "Opening WhatsApp... Please attach the jewelry image manually if needed.",
    );
  };

  const handleShareViaSystem = async () => {
    const message = generateOrderMessage();

    if (navigator.share) {
      try {
        const imageFile = await getOrderImageFile();
        const shareData: ShareData = {
          title: "Order to Supplier",
          text: message,
        };

        // Add image file if available and supported
        if (imageFile && navigator.canShare) {
          const dataWithFiles = { ...shareData, files: [imageFile] };
          if (navigator.canShare(dataWithFiles)) {
            await navigator.share(dataWithFiles);
          } else {
            // Share without files if not supported
            await navigator.share(shareData);
          }
        } else {
          await navigator.share(shareData);
        }

        setHasCreatedOrder(true);
        setShowShareDialog(false);
        toast.success("Order shared successfully");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
          toast.error("Failed to share order");
        }
      }
    } else {
      toast.error("System sharing not supported on this device");
    }
  };

  const handleCreateOrderStatus = () => {
    // Save before creating order
    if (hasUnsavedChanges) {
      debouncedSave(true);
    }

    const currentUser =
      sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "User";

    const savedRequests = localStorage.getItem("requests");
    if (savedRequests) {
      const requests = JSON.parse(savedRequests);
      const requestIndex = requests.findIndex(
        (o: Request) => o.id === order.id,
      );
      if (requestIndex !== -1) {
        // Update the request status to "Ordered"
        requests[requestIndex].status = "Ordered";
        requests[requestIndex].updatedDate = Date.now();
        requests[requestIndex].updatedBy = currentUser;
        requests[requestIndex].waktuKirim = eta;
        requests[requestIndex].detailItems = orderItems;
        localStorage.setItem("requests", JSON.stringify(requests));

        // Create a new Order object with orderPcs as pcs
        const orderDetailItems = orderItems.map((item) => ({
          ...item,
          pcs: item.orderPcs || item.pcs, // Use orderPcs as the pcs value
        }));

        // Generate PO Number: SA{BranchCode}{SupplierInitials}{YYYYMMDD}{SequentialNumber}
        const user = findUserByUsername(currentUser);
        const branchCode = user?.branchCode || "A"; // A=JKT, B=BDG, C=SBY
        const pabrikName =
          typeof order.pabrik === "string"
            ? order.pabrik
            : order.pabrik?.name || "";
        const supplierInitials = pabrikName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

        // Get sequential number from localStorage
        const poCounterKey = `po-counter-${dateStr}`;
        const currentCounter = parseInt(
          localStorage.getItem(poCounterKey) || "0",
          10,
        );
        const nextCounter = currentCounter + 1;
        localStorage.setItem(poCounterKey, nextCounter.toString());
        const sequentialNumber = nextCounter.toString().padStart(4, "0");

        const PONumber = `SA${branchCode}${supplierInitials}${dateStr}${sequentialNumber}`;

        // Compute product display name
        const productDisplayName =
          order.kategoriBarang === "basic"
            ? getLabelFromValue(NAMA_BASIC_OPTIONS, order.namaBasic)
            : getLabelFromValue(NAMA_PRODUK_OPTIONS, order.namaProduk);

        // Get sales and atas nama from the order (which is a request)
        const salesUsername = order.createdBy || "";
        const atasNamaValue =
          typeof order.namaPelanggan === "string"
            ? order.namaPelanggan
            : order.namaPelanggan?.name || "";

        // Convert pabrik to EntityReference if it's a string
        const pabrikRef: typeof order.pabrik =
          typeof order.pabrik === "string"
            ? { id: order.pabrik, name: order.pabrik }
            : order.pabrik;

        const newOrder: Order = {
          id: `order-${Date.now()}`,
          PONumber,
          requestNo: order.requestNo,
          requestId: order.id,
          createdDate: Date.now(),
          createdBy: currentUser,
          jbId: currentUser,
          sales: salesUsername,
          atasNama: atasNamaValue,
          pabrik: pabrikRef as any,
          kategoriBarang: order.kategoriBarang,
          jenisProduk: order.jenisProduk,
          namaProduk: order.namaProduk,
          namaBasic: order.namaBasic,
          namaBarang: productDisplayName,
          waktuKirim: eta,
          customerExpectation: order.customerExpectation,
          detailItems: orderDetailItems,
          photoId: order.photoId,
          fotoBarangBase64: order.fotoBarangBase64,
          status: "New",
        };

        // Save the new order to localStorage
        const savedOrders = localStorage.getItem("orders");
        const orders: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
        orders.push(newOrder);
        localStorage.setItem("orders", JSON.stringify(orders));

        // Update request status to "Ordered"
        const savedRequests = localStorage.getItem("requests");
        if (savedRequests) {
          const requests: Request[] = JSON.parse(savedRequests);
          const requestIndex = requests.findIndex((r) => r.id === order.id);
          if (requestIndex !== -1) {
            const oldStatus = requests[requestIndex].status;
            requests[requestIndex].status = "Ordered";
            requests[requestIndex].updatedDate = Date.now();
            requests[requestIndex].updatedBy = currentUser;
            localStorage.setItem("requests", JSON.stringify(requests));

            // Create notification for request status change to Ordered
            notifyRequestStatusChanged(
              requests[requestIndex],
              oldStatus,
              "Ordered",
              currentUser,
              "jb",
              newOrder,
            );
          }
        }

        // Create notification for order creation
        notifyOrderCreated(newOrder, currentUser);

        toast.success("Order created successfully!");
        setTimeout(() => {
          onBack();
        }, 500);
      }
    }
  };

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
      ? order.pabrik
      : order.pabrik?.name || "Unknown Pabrik";

  const atasNamaLabel =
    typeof order.namaPelanggan === "string"
      ? order.namaPelanggan
      : order.namaPelanggan?.name || "";

  return (
    <div className="min-h-screen pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (hasUnsavedChanges) {
              debouncedSave(true);
            }
            toast.success("Request updated");
            onBack();
          }}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Write Order</h1>
          <p className="text-sm text-gray-600">
            Enter order quantities for supplier
          </p>
        </div>
      </div>

      {/* Order Card */}
      <Card className="p-4 mb-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-32 h-32 shrink-0 border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={getOrderImage(order)}
              alt={productNameLabel}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-base">
                {jenisProdukLabel} {productNameLabel}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  order.kategoriBarang === "basic"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {order.kategoriBarang === "basic" ? "Basic" : "Model"}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClasses(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            {order.requestNo && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Request No: </span>
                <span className="font-mono">{order.requestNo}</span>
              </p>
            )}
            <p className="text-sm text-gray-700 mb-1">
              <span className="text-gray-500">Created: </span>
              {formatTimestamp(order.timestamp) || "-"}
            </p>
            {order.createdBy && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Sales: </span>
                {getFullNameFromUsername(order.createdBy)}
              </p>
            )}
            {atasNamaLabel && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="text-gray-500">Atas Nama: </span>
                {atasNamaLabel}
              </p>
            )}
            <div className="mb-1">
              <span className="text-sm text-gray-500">Pabrik: </span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded ${getPabrikColor(pabrikLabel)}`}
              >
                {pabrikLabel}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              <span className="text-gray-500">ETA: </span>
              {formatDate(order.waktuKirim) || "-"}
            </p>
            {order.customerExpectation && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="text-gray-500">Customer Expectation: </span>
                {getLabelFromValue(
                  CUSTOMER_EXPECTATION_OPTIONS,
                  order.customerExpectation,
                )}
              </p>
            )}
            <div className="mt-3">
              <label className="text-sm text-gray-500 block mb-1">
                ETA (Editable):
              </label>
              <Input
                type="date"
                value={eta ? new Date(eta).toISOString().split("T")[0] : ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEta(new Date(e.target.value).toISOString())
                }
                className="w-full"
              />
            </div>{" "}
          </div>
        </div>
      </Card>

      {/* Order Items Table */}
      <Card className="p-4">
        {/* Saving Indicator */}
        {isSaving && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <div className="flex gap-1">
              <span
                className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-blue-700">Saving changes...</span>
          </div>
        )}

        <h3 className="font-semibold mb-3">Order Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">#</th>
                <th className="border p-2 text-left">Kadar</th>
                <th className="border p-2 text-left">Warna</th>
                <th className="border p-2 text-left">Ukuran</th>
                <th className="border p-2 text-left">Berat</th>
                <th className="border p-2 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span>Requested</span>
                    <button
                      onClick={handleMatchAll}
                      title="Match All - Copy all requested values to Order Pcs"
                      className="p-1 hover:bg-gray-200 rounded transition-colors text-blue-600"
                    >
                      <CopyPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="border p-2 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span>Available</span>
                    <button
                      onClick={handleAutoFillAll}
                      title="Auto-fill All - Calculate Requested - Available for all items"
                      className="p-1 hover:bg-gray-200 rounded transition-colors text-green-600"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="border p-2 text-left bg-amber-50">Order Pcs</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item: OrderItem, index: number) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td
                    className={`border p-2 font-medium ${getKadarColor(item.kadar)}`}
                  >
                    {item.kadar.toUpperCase()}
                  </td>
                  <td className={`border p-2 ${getWarnaColor(item.warna)}`}>
                    {getWarnaLabel(item.warna)}
                  </td>
                  <td className="border p-2">
                    {getUkuranDisplay(item.ukuran)}
                  </td>
                  <td className="border p-2">{item.berat || "-"}</td>
                  <td className="border p-2">
                    <div className="flex items-center justify-between">
                      <span>{item.pcs}</span>
                      <button
                        onClick={() => handleMatchOrderPcs(item.id)}
                        title="Match - Copy requested to Order Pcs"
                        className="p-1 hover:bg-blue-50 rounded transition-colors text-blue-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center justify-between">
                      <span>{item.availablePcs || "0"}</span>
                      <button
                        onClick={() => handleAutoFillOrderPcs(item.id)}
                        title="Auto-fill - Calculate Requested - Available"
                        className="p-1 hover:bg-green-50 rounded transition-colors text-green-600"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="border p-2 bg-amber-50">
                    <Input
                      type="number"
                      min="0"
                      value={item.orderPcs || "0"}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleOrderPcsChange(item.id, e.target.value)
                      }
                      onBlur={handleOrderPcsBlur}
                      className="w-20 h-8 text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={handleCreateOrder}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Order
          </Button>
          <Button
            onClick={handleCreateOrderStatus}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </Card>

      {/* Share Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Order</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you want to share this order with the supplier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleShareViaWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Share via WhatsApp</div>
                <div className="text-xs opacity-90">
                  Open WhatsApp to send order
                </div>
              </div>
            </Button>
            {navigator.share && (
              <Button
                onClick={handleShareViaSystem}
                variant="outline"
                className="w-full justify-start"
              >
                <Share2 className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Share via Other Apps</div>
                  <div className="text-xs text-gray-500">
                    Use system share menu
                  </div>
                </div>
              </Button>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
