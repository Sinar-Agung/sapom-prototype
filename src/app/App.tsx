import { Briefcase, Package, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AvailablePcsDemo } from "./components/available-pcs-demo";
import { JBHome } from "./components/jb-home";
import { JBInbound } from "./components/jb-inbound";
import { JBOrder } from "./components/jb-order";
import { JBRequests } from "./components/jb-requests";
import { Login } from "./components/login";
import { MyOrders } from "./components/my-orders";
import { Navigation } from "./components/navigation";
import { OrderForm } from "./components/order-form";
import { Register } from "./components/register";
import { Settings } from "./components/settings";
import { StockistHome } from "./components/stockist-home";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Toaster } from "./components/ui/sonner";
import { VerifyStock } from "./components/verify-stock";
import { WriteOrder } from "./components/write-order";
import { initializeMockData } from "./utils/mock-data";
import {
  authenticateUser,
  getUserRole,
  initializeUserData,
} from "./utils/user-data";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in (from localStorage or sessionStorage)
    return (
      localStorage.getItem("isAuthenticated") === "true" ||
      sessionStorage.getItem("isAuthenticated") === "true"
    );
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return (
      localStorage.getItem("username") ||
      sessionStorage.getItem("username") ||
      ""
    );
  });
  const [userRole, setUserRole] = useState<"sales" | "stockist" | "jb">(() => {
    return (localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      "sales") as "sales" | "stockist" | "jb";
  });
  const [authPage, setAuthPage] = useState<"login" | "register">("login");
  const [currentPage, setCurrentPage] = useState(() => {
    // Stockists should see home page by default, sales see form
    const role = (localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      "sales") as "sales" | "stockist" | "jb";
    return role === "stockist" || role === "jb" ? "home" : "tambah-pesanan";
  });
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | "duplicate">("new");
  const [verifyingOrder, setVerifyingOrder] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<"verify" | "review">("verify");
  const [myOrdersTab, setMyOrdersTab] = useState<string>("open");
  const [jbRequestsTab, setJbRequestsTab] = useState<string>("assigned");

  // Initialize mock data and user data on first load
  useEffect(() => {
    initializeMockData();
    initializeUserData();
  }, []);

  // Update browser tab title based on user role
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const roleLabel =
        userRole === "jb"
          ? "JB"
          : userRole === "stockist"
            ? "Stockist"
            : "Sales";
      document.title = `SAPOM (${roleLabel})`;
    } else {
      document.title = "SAPOM";
    }
  }, [isAuthenticated, userRole]);

  const handleNavigate = (targetPage: string) => {
    // If currently on order form and there are unsaved changes
    if (
      currentPage === "tambah-pesanan" &&
      hasFormChanges &&
      targetPage !== "tambah-pesanan"
    ) {
      setPendingNavigation(targetPage);
      setShowNavigationWarning(true);
    } else {
      // Reset edit mode when navigating away from form
      if (targetPage !== "tambah-pesanan") {
        setEditingOrder(null);
        setFormMode("new");
      }
      setCurrentPage(targetPage);
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      setCurrentPage(pendingNavigation);
      setHasFormChanges(false);
      setEditingOrder(null);
      setFormMode("new");
    }
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setFormMode("edit");
    setCurrentPage("tambah-pesanan");
  };

  const handleDuplicateOrder = (order: any) => {
    setEditingOrder(order);
    setFormMode("duplicate");
    setCurrentPage("tambah-pesanan");
  };

  const handleVerifyStock = (order: any, currentTab: string) => {
    setMyOrdersTab(currentTab); // Save the current tab
    setVerifyingOrder(order);
    setVerifyMode("verify");
    setCurrentPage("verify-stock");
  };

  const handleReviewRequest = (order: any, currentTab: string) => {
    setMyOrdersTab(currentTab); // Save the current tab
    setVerifyingOrder(order);
    setVerifyMode("review");
    setCurrentPage("verify-stock");
  };

  const handleSeeDetail = (order: any, currentTab: string) => {
    setMyOrdersTab(currentTab); // Save the current tab
    setJbRequestsTab(currentTab); // Save for JB as well
    setVerifyingOrder(order);

    // For JB role in assigned tab, route to write-order
    if (userRole === "jb" && currentTab === "assigned") {
      setCurrentPage("write-order");
    } else {
      setVerifyMode("detail");
      setCurrentPage("verify-stock");
    }
  };

  const handleBackFromVerify = () => {
    setVerifyingOrder(null);
    setVerifyMode("verify");
    // Return to appropriate page based on user role
    if (userRole === "jb") {
      setCurrentPage("jb-requests");
    } else {
      setCurrentPage("my-orders");
    }
  };

  const handleBackFromWriteOrder = () => {
    setVerifyingOrder(null);
    setCurrentPage("jb-requests");
  };

  const handleNavigateToTab = (tab: string) => {
    setMyOrdersTab(tab);
    setCurrentPage("my-orders");
  };

  const handleJBNavigateToTab = (tab: string) => {
    setJbRequestsTab(tab);
    setCurrentPage("jb-requests");
  };

  const handleSaveComplete = () => {
    // After saving, reset to new mode
    setEditingOrder(null);
    setFormMode("new");
    setHasFormChanges(false);
  };

  const getFormTitle = () => {
    if (formMode === "edit") return "Edit Pesanan";
    if (formMode === "duplicate") return "Buat Pesanan Baru";
    return "Form Input Pesanan (Salesman E / I)";
  };

  // Authentication handlers
  const handleLogin = (
    username: string,
    password: string,
    rememberMe: boolean,
  ) => {
    // Authenticate user using the user database
    const user = authenticateUser(username, password);

    if (!user) {
      // This shouldn't happen as Login component validates, but just in case
      console.error("Authentication failed");
      return;
    }

    const role = getUserRole(user);

    setIsAuthenticated(true);
    setCurrentUser(username);
    setUserRole(role);

    // Set default page based on role
    if (role === "stockist" || role === "jb") {
      setCurrentPage("home");
    } else {
      setCurrentPage("tambah-pesanan");
    }

    if (rememberMe) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("userRole", role);
    } else {
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("userRole", role);
    }
  };

  const handleRegister = (
    username: string,
    password: string,
    email: string,
  ) => {
    // For demo purposes, automatically log in after registration
    // In production, this would create an account in the backend
    setIsAuthenticated(true);
    setCurrentUser(username);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser("");
    setUserRole("sales");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    // Clear form state
    setHasFormChanges(false);
    setEditingOrder(null);
    setFormMode("new");
    setCurrentPage("tambah-pesanan");
  };

  // If not authenticated, show login/register page
  if (!isAuthenticated) {
    if (authPage === "register") {
      return (
        <Register
          onRegister={handleRegister}
          onBackToLogin={() => setAuthPage("login")}
        />
      );
    }
    return (
      <Login onLogin={handleLogin} onRegister={() => setAuthPage("register")} />
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case "tambah-pesanan":
        return (
          <OrderForm
            onFormChange={setHasFormChanges}
            initialData={editingOrder}
            mode={formMode}
            onSaveComplete={handleSaveComplete}
            formTitle={getFormTitle()}
          />
        );
      case "my-orders":
        return (
          <MyOrders
            onEditOrder={handleEditOrder}
            onDuplicateOrder={handleDuplicateOrder}
            userRole={userRole}
            onVerifyStock={handleVerifyStock}
            onReviewRequest={handleReviewRequest}
            onSeeDetail={handleSeeDetail}
            initialTab={myOrdersTab}
          />
        );
      case "home":
        if (userRole === "stockist") {
          return (
            <StockistHome
              onNavigateToRequests={() => handleNavigate("my-orders")}
              onNavigateToTab={handleNavigateToTab}
            />
          );
        } else if (userRole === "jb") {
          return (
            <JBHome
              onNavigateToTab={handleJBNavigateToTab}
              onSeeDetail={handleSeeDetail}
            />
          );
        } else {
          // Demo page for Available Pcs Input
          return <AvailablePcsDemo />;
        }
      case "activities":
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Activities</h2>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </div>
        );
      case "inbound":
        return <JBInbound />;
      case "order":
        return <JBOrder />;
      case "jb-requests":
        return (
          <JBRequests
            onSeeDetail={handleSeeDetail}
            initialTab={jbRequestsTab}
          />
        );
      case "settings":
        return <Settings onLogout={handleLogout} username={currentUser} />;
      case "verify-stock":
        return (
          <VerifyStock
            order={verifyingOrder}
            onBack={handleBackFromVerify}
            mode={verifyMode}
            isJBWaiting={userRole === "jb" && jbRequestsTab === "waiting"}
          />
        );
      case "write-order":
        return (
          <WriteOrder
            order={verifyingOrder}
            onBack={handleBackFromWriteOrder}
          />
        );
      default:
        return (
          <OrderForm
            onFormChange={setHasFormChanges}
            initialData={editingOrder}
            mode={formMode}
            onSaveComplete={handleSaveComplete}
            formTitle={getFormTitle()}
          />
        );
    }
  };

  // Get role icon and label
  const getRoleConfig = () => {
    switch (userRole) {
      case "jb":
        return {
          icon: Briefcase,
          label: "Jewelry Buyer",
          color: "text-purple-600",
          bg: "bg-purple-50",
        };
      case "stockist":
        return {
          icon: Package,
          label: "Stockist",
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "sales":
      default:
        return {
          icon: UserCircle,
          label: "Sales",
          color: "text-blue-600",
          bg: "bg-blue-50",
        };
    }
  };

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  return (
    <div className="h-screen flex flex-col-reverse md:flex-row bg-gray-50 overflow-hidden">
      {/* Navigation - Fixed at bottom on mobile, sidebar on desktop */}
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userRole={userRole}
      />

      {/* Main Content - Fills remaining space with scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-4">
        {/* Role Indicator - Fixed at top right */}
        <div className="fixed top-4 right-4 z-40">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-md ${roleConfig.bg} border border-gray-200`}
            title={roleConfig.label}
          >
            <RoleIcon className={`w-5 h-5 ${roleConfig.color}`} />
            <span
              className={`text-sm font-medium ${roleConfig.color} hidden sm:inline`}
            >
              {roleConfig.label}
            </span>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto">{renderContent()}</div>
      </div>

      {/* Navigation Warning Dialog */}
      <AlertDialog
        open={showNavigationWarning}
        onOpenChange={setShowNavigationWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the form. Are you sure you want to
              leave this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
