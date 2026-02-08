import {
  CUSTOMER_EXPECTATION_OPTIONS,
  getLabelFromValue,
} from "../data/order-data";

interface DetailBarangItem {
  id: string;
  kadar: string;
  warna: string;
  ukuran: string;
  berat: string;
  pcs: string;
  availablePcs?: string;
}

interface Order {
  customerExpectation?: string;
  detailItems: DetailBarangItem[];
}

interface DetailItemsTableProps {
  order: Order;
  userRole: "sales" | "stockist" | "jb";
}

export function DetailItemsTable({ order, userRole }: DetailItemsTableProps) {
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
      "2w-ap-rg": "bg-gradient-to-r from-gray-200 to-rose-300 text-gray-800",
      "2w-ap-kn": "bg-gradient-to-r from-gray-200 to-yellow-400 text-gray-800",
    };
    return colors[warna.toLowerCase()] || "bg-gray-300 text-gray-800";
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
    // Check if ukuran is a number (which means it's in cm)
    const numValue = parseFloat(ukuran);
    if (!isNaN(numValue)) {
      return { value: ukuran, showUnit: true };
    }
    // Otherwise it's a size like "S", "M", "L"
    return { value: ukuran, showUnit: false };
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-3 bg-white p-3 sm:p-4 rounded-lg border">
      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {order.customerExpectation && (
          <div>
            <span className="text-gray-500">Customer Expectation:</span>
            <p className="font-medium">
              {getLabelFromValue(
                CUSTOMER_EXPECTATION_OPTIONS,
                order.customerExpectation,
              )}
            </p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Total Items:</span>
          <p className="font-medium">{order.detailItems.length} item(s)</p>
        </div>
      </div>

      {/* Detail Items Table */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold mb-2">Detail Barang</h4>
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full border-collapse border text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border p-2 text-left bg-gray-100">#</th>
                <th className="border p-2 text-left bg-gray-100">Kadar</th>
                <th className="border p-2 text-left bg-gray-100">Warna</th>
                <th className="border p-2 text-left bg-gray-100">Ukuran</th>
                <th className="border p-2 text-left bg-gray-100">Berat</th>
                <th className="border p-2 text-left bg-gray-100">Pcs</th>
                {userRole === "stockist" && (
                  <th className="border p-2 text-left bg-gray-100">
                    Available Pcs
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {order.detailItems.map((item, index) => {
                const ukuranDisplay = getUkuranDisplay(item.ukuran);
                return (
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
                      {ukuranDisplay.showUnit
                        ? `${ukuranDisplay.value} cm`
                        : ukuranDisplay.value}
                    </td>
                    <td className="border p-2">{item.berat || "-"}</td>
                    <td className="border p-2">{item.pcs}</td>
                    {userRole === "stockist" && (
                      <td className="border p-2">{item.availablePcs || "-"}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
