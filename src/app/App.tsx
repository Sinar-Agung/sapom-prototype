import { useState, useEffect } from "react";
import { OrderForm } from "./components/order-form";
import { MyOrders } from "./components/my-orders";
import { VerifyStock } from "./components/verify-stock";
import { Navigation } from "./components/navigation";
import { Settings } from "./components/settings";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { StockistHome } from "./components/stockist-home";
import { JBHome } from "./components/jb-home";
import { JBInbound } from "./components/jb-inbound";
import { JBOrder } from "./components/jb-order";
import { AvailablePcsDemo } from "./components/available-pcs-demo";
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
import { initializeMockData } from "./utils/mock-data";
import { initializeUserData, authenticateUser, getUserRole } from "./utils/user-data";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in (from localStorage or sessionStorage)
    return localStorage.getItem("isAuthenticated") === "true" || 
           sessionStorage.getItem("isAuthenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("username") || 
           sessionStorage.getItem("username") || "";
  });
  const [userRole, setUserRole] = useState<"sales" | "stockist" | "jb">(() => {
    return (localStorage.getItem("userRole") || 
           sessionStorage.getItem("userRole") || "sales") as "sales" | "stockist" | "jb";
  });
  const [authPage, setAuthPage] = useState<"login" | "register">("login");
  const [currentPage, setCurrentPage] = useState(() => {
    // Stockists should see home page by default, sales see form
    const role = (localStorage.getItem("userRole") || 
                 sessionStorage.getItem("userRole") || "sales") as "sales" | "stockist" | "jb";
    return role === "stockist" || role === "jb" ? "home" : "tambah-pesanan";
  });
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | "duplicate">("new");
  const [verifyingOrder, setVerifyingOrder] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<"verify" | "review">("verify");
  const [myOrdersTab, setMyOrdersTab] = useState<string>("open");

  // Initialize mock data and user data on first load
  useEffect(() => {
    initializeMockData();
    initializeUserData();
  }, []);

  const handleNavigate = (targetPage: string) => {
    // If currently on order form and there are unsaved changes
    if (currentPage === "tambah-pesanan" && hasFormChanges && targetPage !== "tambah-pesanan") {
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

  const handleVerifyStock = (order: any) => {
    setVerifyingOrder(order);
    setVerifyMode("verify");
    setCurrentPage("verify-stock");
  };

  const handleReviewRequest = (order: any) => {
    setVerifyingOrder(order);
    setVerifyMode("review");
    setCurrentPage("verify-stock");
  };

  const handleBackFromVerify = () => {
    setVerifyingOrder(null);
    setVerifyMode("verify");
    setCurrentPage("my-orders");
  };

  const handleNavigateToTab = (tab: string) => {
    setMyOrdersTab(tab);
    setCurrentPage("my-orders");
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
  const handleLogin = (username: string, password: string, rememberMe: boolean) => {
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

  const handleRegister = (username: string, password: string, email: string) => {
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
      <Login
        onLogin={handleLogin}
        onRegister={() => setAuthPage("register")}
      />
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
            initialTab={myOrdersTab}
          />
        );
      case "home":
        if (userRole === "stockist") {
          return <StockistHome onNavigateToRequests={() => handleNavigate("my-orders")} onNavigateToTab={handleNavigateToTab} />;
        } else if (userRole === "jb") {
          return <JBHome />;
        } else {
          // Demo page for Available Pcs Input
          return <AvailablePcsDemo />;
        }
      case "activities":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Activities</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
      case "inbound":
        return <JBInbound />;
      case "order":
        return <JBOrder />;
      case "settings":
        return (
          <Settings onLogout={handleLogout} username={currentUser} />
        );
      case "verify-stock":
        return (
          <VerifyStock
            order={verifyingOrder}
            onBack={handleBackFromVerify}
            mode={verifyMode}
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} userRole={userRole} />
      
      {/* Main Content - offset for desktop sidebar and mobile bottom nav */}
      <div className="md:ml-44 pb-20 md:pb-4 p-4">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
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
              You have unsaved changes in the form. Are you sure you want to leave this page?
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
    </div>
  );
}