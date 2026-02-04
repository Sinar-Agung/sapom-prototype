"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { AvailablePcsInput } from "./ui/available-pcs-input";
import { Label } from "./ui/label";

export function AvailablePcsDemo() {
  const [availablePcs, setAvailablePcs] = useState("");
  const requestedPcs = "50"; // Example requested quantity

  // Example detail items from an order
  const [detailItems, setDetailItems] = useState([
    {
      id: "1",
      kadar: "8K",
      warna: "RG",
      ukuran: "16",
      berat: "5.5",
      pcs: "25",
      availablePcs: "",
    },
    {
      id: "2",
      kadar: "8K",
      warna: "AP",
      ukuran: "18",
      berat: "6.0",
      pcs: "30",
      availablePcs: "",
    },
    {
      id: "3",
      kadar: "9K",
      warna: "KN",
      ukuran: "20",
      berat: "7.0",
      pcs: "15",
      availablePcs: "",
    },
  ]);

  const handleAvailablePcsChange = (itemId: string, value: string) => {
    setDetailItems(
      detailItems.map((item) =>
        item.id === itemId ? { ...item, availablePcs: value } : item
      )
    );
  };

  return (
    <div className="space-y-6 p-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Available Pcs Input Demo</h2>

        {/* Simple Example */}
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-4">Simple Example</h3>
          <div className="max-w-xs space-y-2">
            <Label>Available Pcs</Label>
            <AvailablePcsInput
              value={availablePcs}
              onChange={setAvailablePcs}
              requestedPcs={requestedPcs}
            />
            <p className="text-xs text-gray-500">
              Requested: <span className="font-medium">{requestedPcs} pcs</span>
              {availablePcs && (
                <>
                  {" | "}
                  Available: <span className="font-medium">{availablePcs} pcs</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Table Example */}
        <div>
          <h3 className="text-sm font-medium mb-4">
            Order Detail Items with Available Pcs
          </h3>
          <div className="max-h-[350px] overflow-auto">
            <table className="w-full text-xs border">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">#</th>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">
                    Kadar
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">
                    Warna
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">
                    Ukuran
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">
                    Berat
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r bg-gray-50">
                    Requested Pcs
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-gray-50">
                    Available Pcs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {detailItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-r">{index + 1}</td>
                    <td className="px-3 py-2 border-r font-medium">
                      {item.kadar}
                    </td>
                    <td className="px-3 py-2 border-r">{item.warna}</td>
                    <td className="px-3 py-2 border-r">{item.ukuran} cm</td>
                    <td className="px-3 py-2 border-r">{item.berat} gr</td>
                    <td className="px-3 py-2 border-r">
                      <span className="font-semibold">{item.pcs}</span>
                    </td>
                    <td className="px-3 py-2">
                      <AvailablePcsInput
                        value={item.availablePcs}
                        onChange={(value) =>
                          handleAvailablePcsChange(item.id, value)
                        }
                        requestedPcs={item.pcs}
                        className="max-w-[180px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
            <p className="font-medium">Summary:</p>
            <p>
              Total Requested:{" "}
              <span className="font-semibold">
                {detailItems.reduce((sum, item) => sum + parseInt(item.pcs), 0)}{" "}
                pcs
              </span>
            </p>
            <p>
              Total Available:{" "}
              <span className="font-semibold">
                {detailItems.reduce(
                  (sum, item) => sum + (parseInt(item.availablePcs) || 0),
                  0
                )}{" "}
                pcs
              </span>
            </p>
            {detailItems.some((item) => item.availablePcs) && (
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    detailItems.every(
                      (item) =>
                        parseInt(item.availablePcs || "0") >=
                        parseInt(item.pcs)
                    )
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {detailItems.every(
                    (item) =>
                      parseInt(item.availablePcs || "0") >= parseInt(item.pcs)
                  )
                    ? "All items available"
                    : "Some items unavailable or partial"}
                </span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Feature Description */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-sm font-semibold mb-2">Component Features:</h3>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>
            <strong>Integer-only validation:</strong> Only allows non-negative
            integers (0 and up)
          </li>
          <li>
            <strong>Auto-match button:</strong> Double chevron up button automatically
            fills the requested quantity
          </li>
          <li>
            <strong>Mobile-friendly:</strong> Uses numeric keyboard on mobile devices
          </li>
          <li>
            <strong>Accessible:</strong> Includes tooltip on hover ("Match requested
            pcs")
          </li>
          <li>
            <strong>Compact design:</strong> Fits well in table layouts and forms
          </li>
        </ul>
      </Card>
    </div>
  );
}