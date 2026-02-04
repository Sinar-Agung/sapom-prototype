import { Card } from "./ui/card";
import { Package } from "lucide-react";

export function JBOrder() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>
      
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Order Management</p>
          <p className="text-sm">View and manage your jewelry orders</p>
        </div>
      </Card>
    </div>
  );
}
