// ...existing code...
import { Briefcase, Factory, Package, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AvailablePcsDemo } from "./components/available-pcs-demo";
import { JBHome } from "./components/jb-home";
import { JBInbound } from "./components/jb-inbound";
import { JBOrder } from "./components/jb-order";
import { JBRequests } from "./components/jb-requests";
import { Login } from "./components/login";
import { MyOrders } from "./components/my-requests";
import { Navigation } from "./components/navigation";
import { Notifications } from "./components/notifications";
import { OrderDetails } from "./components/order-details";
import { OrderEditForm } from "./components/order-edit-form";
import { OrderForm } from "./components/order-form";
import { Register } from "./components/register";
import { SalesOrders } from "./components/sales-orders";
import { Settings } from "./components/settings";
import { StockistHome } from "./components/stockist-home";
import { SupplierHome } from "./components/supplier-home";
import { SupplierOrders } from "./components/supplier-orders";
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
import {
  initializeMockData,
  initializeMockNotifications,
} from "./utils/mock-data";
import { checkAndNotifyExpiringRequests } from "./utils/notification-helper";
import {
  authenticateUser,
  getUserRole,
  initializeUserData,
} from "./utils/user-data";

export default function App() {
  // ...state declarations...
  // (First set of isAuthenticated, currentUser, userRole already declared above)
  // ...other state declarations...

  // Place the ETA reminder useEffect after userRole/currentUser are declared
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
  const [userRole, setUserRole] = useState<
    "sales" | "stockist" | "jb" | "supplier"
  >(() => {
    return (localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      "sales") as "sales" | "stockist" | "jb" | "supplier";
  });
  const [authPage, setAuthPage] = useState<"login" | "register">("login");
  const [currentPage, setCurrentPage] = useState(() => {
    // Stockists, JB, and Suppliers should see home page by default, sales see form
    const role = (localStorage.getItem("userRole") ||
      sessionStorage.getItem("userRole") ||
      "sales") as "sales" | "stockist" | "jb" | "supplier";
    return role === "stockist" || role === "jb" || role === "supplier"
      ? "home"
      : "tambah-pesanan";
  });
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | "duplicate">("new");
  const [verifyingOrder, setVerifyingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [editingOrderForUpdate, setEditingOrderForUpdate] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<"verify" | "detail">("verify");
  const [myOrdersTab, setMyOrdersTab] = useState<string>("open");
  const [previousOrdersTab, setPreviousOrdersTab] = useState<string>("new");
  const [jbRequestsTab, setJbRequestsTab] = useState<string>("assigned");
  const [cameFromNotifications, setCameFromNotifications] = useState(false);

  // Initialize mock data and user data on first load
  useEffect(() => {
    initializeMockData();
    initializeMockNotifications();
    initializeUserData();
  }, []);

  // Check for expiring requests when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && userRole) {
      checkAndNotifyExpiringRequests(currentUser, userRole);
    }
  }, [isAuthenticated, currentUser, userRole]);

  // Update browser tab title based on user role
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const roleLabel =
        userRole === "jb"
          ? "JB"
          : userRole === "stockist"
            ? "Stockist"
            : userRole === "supplier"
              ? "Supplier"
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
    console.log(
      "📋 handleVerifyStock called with:",
      order?.requestNo || order?.id,
      "tab:",
      currentTab,
    );
    setMyOrdersTab(currentTab); // Save the current tab
    setVerifyingOrder(order);
    setVerifyMode("verify");
    setCurrentPage("verify-stock");
    console.log("   ✅ Page set to verify-stock, mode: verify");
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

    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      return;
    }

    // Return to appropriate page based on user role
    if (userRole === "jb") {
      setCurrentPage("jb-requests");
    } else {
      setCurrentPage("my-orders");
    }
  };

  const handleBackFromWriteOrder = () => {
    setVerifyingOrder(null);

    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      return;
    }

    setCurrentPage("jb-requests");
  };

  const handleNavigateToOrder = (orderId: string) => {
    console.log(`📍 Navigating to order ${orderId} (Role: ${userRole})`);

    // Load the order from localStorage
    const ordersJson = localStorage.getItem("orders");
    if (!ordersJson) {
      console.error("No orders found in localStorage");
      return;
    }

    const orders = JSON.parse(ordersJson);
    const order = orders.find((o: any) => o.id === orderId);

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Mark that we're navigating from notifications
    setCameFromNotifications(true);

    // Set the order as viewing order and navigate to details
    handleSeeOrderDetail(order);
  };

  const handleNavigateToRequest = (requestId: string) => {
    // Mark that we're navigating from notifications
    setCameFromNotifications(true);

    // Load the request from localStorage
    const requestsJson = localStorage.getItem("requests");
    if (!requestsJson) {
      console.error("No requests found in localStorage");
      return;
    }

    const requests = JSON.parse(requestsJson);
    const request = requests.find((r: any) => r.id === requestId);

    if (!request) {
      console.error(`Request with ID ${requestId} not found`);
      return;
    }

    console.log(
      `📍 Navigating to request ${request.requestNo || request.id} (Status: ${request.status}, Role: ${userRole})`,
    );

    // Navigate based on user role
    if (userRole === "stockist") {
      // For stockist: if status is Open or Stockist Processing, go to verify-stock in verify mode
      // Otherwise, go to detail mode (read-only)
      const isVerifyMode =
        request.status === "Open" || request.status === "Stockist Processing";

      if (isVerifyMode) {
        console.log("→ Opening in Verify Stock mode (can edit/verify)");
        handleVerifyStock(request, "open");
      } else {
        console.log("→ Opening in Detail mode (read-only)");
        handleSeeDetail(request, "open");
      }
    } else if (userRole === "jb") {
      // JB sees request details
      console.log("→ Opening request detail for JB");
      handleSeeDetail(request, "assigned");
    } else if (userRole === "sales") {
      // Sales: if request is Open and belongs to them, go to edit page
      // Otherwise, go to detail page
      if (request.status === "Open" && request.createdBy === currentUser) {
        console.log(
          "→ Opening in Edit mode (request is Open and belongs to user)",
        );
        handleEditOrder(request);
      } else {
        console.log("→ Opening request detail for Sales");
        handleSeeDetail(request, "open");
      }
    } else {
      // Default: go to detail page
      console.log("→ Opening request detail (default)");
      handleSeeDetail(request, "open");
    }
  };

  const handleSeeOrderDetail = (order: any, currentTab?: string) => {
    setViewingOrder(order);
    if (currentTab) {
      setPreviousOrdersTab(currentTab);
    }
    setCurrentPage("order-details");
  };

  const handleBackFromOrderDetails = () => {
    setViewingOrder(null);
    // Navigate back to appropriate orders page based on user role
    if (userRole === "supplier") {
      setCurrentPage("supplier-orders");
    } else {
      setCurrentPage("jb-orders");
    }
  };

  const handleUpdateOrder = (order: any, currentTab?: string) => {
    setEditingOrderForUpdate(order);
    if (currentTab) {
      setPreviousOrdersTab(currentTab);
    }
    setCurrentPage("order-edit");
  };

  const handleBackFromOrderEdit = () => {
    setEditingOrderForUpdate(null);
    setCurrentPage("jb-orders");
  };

  const handleOrderEditSave = () => {
    setEditingOrderForUpdate(null);
    setCurrentPage("jb-orders");
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

  const handleNavigateToMyRequests = () => {
    // Navigate to My Requests page
    setCurrentPage("my-orders");
    setHasFormChanges(false);
  };

  const getFormTitle = () => {
    if (formMode === "edit") return "Edit Request";
    if (formMode === "duplicate") return "Create New Request";
    return "Create Request";
  };

  const handleCancelEdit = () => {
    // Go back to my-orders page with the saved tab
    setCurrentPage("my-orders");
    setHasFormChanges(false);
  };

  const handleCancelCreate = () => {
    // If there are unsaved changes, show confirmation dialog
    if (hasFormChanges) {
      setPendingNavigation("home");
      setShowNavigationWarning(true);
    } else {
      // No changes, go back to home page directly
      setCurrentPage("home");
    }
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

    // Check for expiring requests immediately on login
    checkAndNotifyExpiringRequests(username, role);

    // Set default page based on role
    if (role === "stockist" || role === "jb") {
      setCurrentPage("home");
    } else {
      setCurrentPage("tambah-pesanan");
    }

    // Store user profile in session storage
    const userProfile = JSON.stringify(user);

    if (rememberMe) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userProfile", userProfile);
    } else {
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("userProfile", userProfile);
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
    localStorage.removeItem("userProfile");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userProfile");
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
            onNavigateToMyRequests={handleNavigateToMyRequests}
            onCancel={
              formMode === "edit" ? handleCancelEdit : handleCancelCreate
            }
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
            onSeeDetail={handleSeeDetail}
            initialTab={myOrdersTab}
          />
        );
      case "sales-orders":
        return <SalesOrders onSeeDetail={handleSeeOrderDetail} />;
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
        } else if (userRole === "supplier") {
          return (
            <SupplierHome
              onNavigateToOrders={() => handleNavigate("supplier-orders")}
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
      case "supplier-orders":
        return (
          <SupplierOrders
            onSeeDetail={handleSeeOrderDetail}
            initialTab={previousOrdersTab}
          />
        );
      case "jb-orders":
      case "order":
        return (
          <JBOrder
            onSeeDetail={handleSeeOrderDetail}
            onUpdateOrder={handleUpdateOrder}
            initialTab={previousOrdersTab}
          />
        );
      case "order-edit":
        return (
          <OrderEditForm
            order={editingOrderForUpdate}
            onBack={handleBackFromOrderEdit}
            onSave={handleOrderEditSave}
          />
        );
      case "jb-requests":
        return (
          <JBRequests
            onSeeDetail={handleSeeDetail}
            initialTab={jbRequestsTab}
          />
        );
      case "settings":
        return <Settings onLogout={handleLogout} username={currentUser} />;
      case "notifications":
        return (
          <Notifications
            onNavigateToRequest={handleNavigateToRequest}
            onNavigateToOrder={handleNavigateToOrder}
          />
        );
      case "verify-stock":
        return (
          <VerifyStock
            order={verifyingOrder}
            onBack={handleBackFromVerify}
            mode={verifyMode}
            isJBWaiting={userRole === "jb" && jbRequestsTab === "waiting"}
            onEditRequest={
              // Only show edit button for sales when request is Open and belongs to them
              userRole === "sales" &&
              verifyingOrder?.status === "Open" &&
              verifyingOrder?.createdBy === currentUser
                ? () => handleEditOrder(verifyingOrder)
                : undefined
            }
            onDuplicateRequest={
              // Only show duplicate button for sales
              userRole === "sales"
                ? () => handleDuplicateOrder(verifyingOrder)
                : undefined
            }
          />
        );
      case "write-order":
        return (
          <WriteOrder
            order={verifyingOrder}
            onBack={handleBackFromWriteOrder}
          />
        );
      case "order-details":
        return (
          <OrderDetails
            order={viewingOrder}
            onBack={handleBackFromOrderDetails}
          />
        );
      default:
        return (
          <OrderForm
            onFormChange={setHasFormChanges}
            initialData={editingOrder}
            mode={formMode}
            onSaveComplete={handleSaveComplete}
            onNavigateToMyRequests={handleNavigateToMyRequests}
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
      case "supplier":
        return {
          icon: Factory,
          label: "Supplier",
          color: "text-orange-600",
          bg: "bg-orange-50",
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
            title={`${roleConfig.label} - ${currentUser}`}
          >
            <RoleIcon className={`w-5 h-5 ${roleConfig.color}`} />
            <span
              className={`text-sm font-medium ${roleConfig.color} hidden sm:inline`}
            >
              {roleConfig.label} - {currentUser}
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
