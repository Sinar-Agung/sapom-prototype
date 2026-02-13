import { Order } from "@/app/types/order";
import { getFullNameFromUsername } from "@/app/utils/user-data";
import {
  CheckCircle,
  Clock,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";

interface SupplierHomeProps {
  onNavigateToOrders?: () => void;
}

export function SupplierHome({ onNavigateToOrders }: SupplierHomeProps) {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const currentUser =
    sessionStorage.getItem("username") ||
    localStorage.getItem("username") ||
    "";
  const fullName = getFullNameFromUsername(currentUser);

  // Get supplier ID from user data
  const getSupplierId = () => {
    // First try to get from stored user profile
    const userProfile =
      sessionStorage.getItem("userProfile") ||
      localStorage.getItem("userProfile");

    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        if (user.accountType === "supplier" && user.supplierId) {
          return user.supplierId;
        }
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }

    // Fallback to searching in userDatabase
    const userDataString = sessionStorage.getItem("userDatabase");
    if (userDataString) {
      const users = JSON.parse(userDataString);
      const user = users.find((u: any) => u.username === currentUser);
      return user?.supplierId || "";
    }
    return "";
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedOrders = localStorage.getItem("orders");
    const supplierId = getSupplierId();

    if (savedOrders && supplierId) {
      const allOrders: Order[] = JSON.parse(savedOrders);

      // Filter orders for this supplier
      const myOrders = allOrders.filter(
        (order) => order.pabrik?.id === supplierId,
      );

      // Get 5 most recent orders
      const recent = [...myOrders]
        .sort((a, b) => b.createdDate - a.createdDate)
        .slice(0, 5);
      setRecentOrders(recent);

      // Calculate counts
      setNewOrdersCount(myOrders.filter((o) => o.status === "New").length);
      setInProgressCount(
        myOrders.filter((o) => ["Viewed", "Request Change"].includes(o.status))
          .length,
      );
      setCompletedCount(
        myOrders.filter((o) =>
          ["Stock Ready", "Unable to Fulfill"].includes(o.status),
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

  return (
    <div className="space-y-6 pb-20 md:pb-4">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {fullName}!</h1>
        <p className="text-gray-600">Supplier Dashboard</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* New Orders Card */}
        <Card
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToOrders?.()}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Orders</p>
              <p className="text-2xl font-bold text-blue-600">
                {newOrdersCount}
              </p>
            </div>
          </div>
        </Card>

        {/* In Progress Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inProgressCount}
              </p>
            </div>
          </div>
        </Card>

        {/* Completed Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onNavigateToOrders?.()}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
          >
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">View New Orders</p>
              <p className="text-sm text-gray-600">
                {newOrdersCount} new order{newOrdersCount !== 1 ? "s" : ""}{" "}
                waiting
              </p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left opacity-50 cursor-not-allowed">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium">Performance</p>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Recent Orders */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
          <button
            onClick={() => onNavigateToOrders?.()}
            className="text-sm text-blue-600 hover:underline"
          >
            View All
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium font-mono text-sm text-blue-700">
                    {order.PONumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTimestamp(order.createdDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      order.status === "New"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "Viewed"
                          ? "bg-purple-100 text-purple-800"
                          : order.status === "Request Change"
                            ? "bg-orange-100 text-orange-800"
                            : order.status === "Stock Ready"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Unable to Fulfill"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
