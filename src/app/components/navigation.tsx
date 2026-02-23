import { cn } from "@/app/components/ui/utils";
import { getUnreadCountForUser } from "@/app/utils/notification-helper";
import {
  Bell,
  CirclePlus,
  Home,
  Inbox,
  List,
  Package,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  // Update unread count periodically
  useEffect(() => {
    const updateUnreadCount = () => {
      if (currentUser) {
        const count = getUnreadCountForUser(currentUser, userRole);
        setUnreadCount(count);
      }
    };

    // Initial load
    updateUnreadCount();

    // Update every 5 seconds
    const intervalId = setInterval(updateUnreadCount, 5000);

    return () => clearInterval(intervalId);
  }, [currentUser, userRole]);
  // Define navigation items based on role
  const getNavItems = () => {
    if (userRole === "stockist") {
      return [
        { id: "home", label: t("navigation.home"), icon: Home },
        { id: "my-orders", label: t("navigation.requests"), icon: List },
        {
          id: "notifications",
          label: t("navigation.notifications"),
          icon: Bell,
        },
        { id: "settings", label: t("navigation.settings"), icon: Settings },
      ];
    } else if (userRole === "jb") {
      return [
        { id: "home", label: t("navigation.home"), icon: Home },
        { id: "jb-requests", label: t("navigation.requests"), icon: List },
        { id: "inbound", label: t("navigation.inbound"), icon: Inbox },
        { id: "jb-orders", label: t("navigation.orders"), icon: Package },
        {
          id: "notifications",
          label: t("navigation.notifications"),
          icon: Bell,
        },
        { id: "settings", label: t("navigation.settings"), icon: Settings },
      ];
    } else if (userRole === "supplier") {
      return [
        { id: "home", label: t("navigation.home"), icon: Home },
        { id: "supplier-orders", label: t("navigation.orders"), icon: Package },
        {
          id: "notifications",
          label: t("navigation.notifications"),
          icon: Bell,
        },
        { id: "settings", label: t("navigation.settings"), icon: Settings },
      ];
    } else {
      // Sales navigation items
      return [
        { id: "home", label: t("navigation.home"), icon: Home },
        {
          id: "tambah-pesanan",
          label: t("navigation.newRequest"),
          icon: CirclePlus,
        },
        { id: "my-orders", label: t("navigation.myRequests"), icon: List },
        { id: "sales-orders", label: t("navigation.orders"), icon: Package },
        {
          id: "notifications",
          label: t("navigation.notifications"),
          icon: Bell,
        },
        { id: "settings", label: t("navigation.settings"), icon: Settings },
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
            const showBadge = item.id === "notifications" && unreadCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {showBadge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
            const showBadge = item.id === "notifications" && unreadCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors min-w-[60px] relative",
                  isActive ? "text-blue-500" : "text-gray-600",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full transition-colors relative",
                    isActive ? "bg-blue-50" : "",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
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
