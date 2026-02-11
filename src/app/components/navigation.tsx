import { cn } from "@/app/components/ui/utils";
import {
  Activity,
  CirclePlus,
  Home,
  Inbox,
  List,
  Package,
  Settings,
} from "lucide-react";

interface NavigationProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userRole?: "sales" | "stockist" | "jb" | "supplier";
}

export function Navigation({
  currentPage = "tambah-pesanan",
  onNavigate,
  userRole = "sales",
}: NavigationProps) {
  // Define navigation items based on role
  const getNavItems = () => {
    if (userRole === "stockist") {
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "my-orders", label: "Requests", icon: List },
        { id: "settings", label: "Settings", icon: Settings },
      ];
    } else if (userRole === "jb") {
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "jb-requests", label: "Requests", icon: List },
        { id: "inbound", label: "Inbound", icon: Inbox },
        { id: "jb-orders", label: "Orders", icon: Package },
        { id: "settings", label: "Settings", icon: Settings },
      ];
    } else if (userRole === "supplier") {
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "supplier-orders", label: "Orders", icon: Package },
        { id: "settings", label: "Settings", icon: Settings },
      ];
    } else {
      // Sales navigation items
      return [
        { id: "home", label: "Home", icon: Home },
        { id: "activities", label: "Activities", icon: Activity },
        { id: "tambah-pesanan", label: "New Request", icon: CirclePlus },
        { id: "my-orders", label: "My Requests", icon: List },
        { id: "settings", label: "Settings", icon: Settings },
      ];
    }
  };

  const navItems = getNavItems();

  const handleClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex md:flex-col md:w-52 md:left-0 md:top-0 md:h-screen md:bg-white md:border-r md:border-gray-200 md:p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]",
                  isActive ? "text-blue-500" : "text-gray-600",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isActive ? "bg-blue-50" : "",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
