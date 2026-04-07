// ...existing code...
import {
  Briefcase,
  ChevronDown,
  Factory,
  Package,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AvailablePcsDemo } from "./components/available-pcs-demo";
import { ETACalendar } from "./components/eta-calendar";
import { JBHome } from "./components/jb-home";
import { JBInboundSearch } from "./components/jb-inbound-search";

import { JBRequests } from "./components/jb-requests";
import { Login } from "./components/login";
import { MyOrders } from "./components/my-requests";
import { Navigation } from "./components/navigation";
import { Notifications } from "./components/notifications";
import { OrderDetails } from "./components/order-details";
import { OrderEditForm } from "./components/order-edit-form";
import { QuestionForm } from "./components/question-form";
import { Register } from "./components/register";
import { RequestDetails } from "./components/request-details";
import { RequestForm } from "./components/request-form";
import { SalesQuestions } from "./components/sales-questions";
import { Settings } from "./components/settings";
import { StockistHome } from "./components/stockist-home";
import { StockistQuestions } from "./components/stockist-questions";
import { SupplierHome } from "./components/supplier-home";

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
import { UnifiedOrders } from "./components/unified-orders";
import { WriteOrder } from "./components/write-order";
import { populateMockData } from "./utils/mock-data";
import {
  checkAndExpireRequests,
  checkAndNotifyExpiringRequests,
  notifyOrderStatusChanged,
  sortExistingNotifications,
} from "./utils/notification-helper";
import {
  authenticateUser,
  getBranchName,
  getCurrentUserDetails,
  getFullNameFromUsername,
  getUserRole,
  initializeUserData,
  type LanguageCode,
} from "./utils/user-data";

export default function App() {
  const { i18n } = useTranslation();

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
  const [userLanguage, setUserLanguage] = useState<LanguageCode>(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem("userLanguage") as LanguageCode;
    return savedLanguage || "en";
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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [editingOrderForUpdate, setEditingOrderForUpdate] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<"verify" | "detail">("verify");
  const [myOrdersTab, setMyOrdersTab] = useState<string>("open");
  const [myOrdersKey, setMyOrdersKey] = useState<number>(0); // Force remount when incremented
  const [justCreatedRequest, setJustCreatedRequest] = useState(false); // Flag to force Open tab after creating request
  const [previousOrdersTab, setPreviousOrdersTab] = useState<string>("");
  const [previousPage, setPreviousPage] = useState<string>("");
  const [jbRequestsTab, setJbRequestsTab] = useState<string>("assigned");
  const [cameFromNotifications, setCameFromNotifications] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [focusJBOrdersSearch, setFocusJBOrdersSearch] = useState(false);

  // Initialize mock data and user data on first load
  useEffect(() => {
    initializeUserData();
    sortExistingNotifications(); // Sort existing notifications on app load
  }, []);

  // Check for expiring requests when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && userRole) {
      checkAndExpireRequests(); // Check and expire requests first
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
      // Reset orders tab to first tab when navigating fresh (not back)
      if (
        ["sales-orders", "jb-orders", "supplier-orders"].includes(targetPage)
      ) {
        setPreviousOrdersTab("");
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
    setPreviousPage(currentPage);
    setEditingOrder(order);
    setFormMode("edit");
    setCurrentPage("tambah-pesanan");
  };

  const handleDuplicateOrder = (order: any, currentTab?: string) => {
    setPreviousPage(currentPage);
    if (currentTab) setPreviousOrdersTab(currentTab);
    setEditingOrder(order);
    setFormMode("duplicate");
    setCurrentPage("tambah-pesanan");
  };

  const handleCreateNewQuestion = () => {
    setEditingQuestion(null);
    setCurrentPage("pertanyaan-baru");
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setCurrentPage("pertanyaan-baru");
  };

  const handleQuestionSaveComplete = () => {
    setEditingQuestion(null);
    setCurrentPage("pertanyaan");
  };

  const handleRequestDetails = (order: any, currentTab: string) => {
    console.log(
      "📋 handleRequestDetails called with:",
      order?.requestNo || order?.id,
      "tab:",
      currentTab,
    );
    setMyOrdersTab(currentTab); // Save the current tab
    setPreviousOrdersTab(currentTab);
    setPreviousPage(currentPage);
    setVerifyingOrder(order);
    setVerifyMode("verify");
    setCurrentPage("request-details");
    console.log("   ✅ Page set to verify-stock, mode: verify");
  };

  const handleSeeDetail = (order: any, currentTab: string) => {
    setMyOrdersTab(currentTab); // Save the current tab
    setJbRequestsTab(currentTab); // Save for JB as well
    setPreviousOrdersTab(currentTab);
    setPreviousPage(currentPage);

    // When JB opens an Open request, update status to JB Verifying
    let updatedOrder = order;
    if (userRole === "jb" && order.status === "Open") {
      const savedRequests = localStorage.getItem("requests");
      if (savedRequests) {
        const allRequests = JSON.parse(savedRequests);
        const idx = allRequests.findIndex((r: any) => r.id === order.id);
        if (idx !== -1) {
          allRequests[idx] = {
            ...allRequests[idx],
            status: "JB Verifying",
            viewedBy: [
              ...new Set([...(allRequests[idx].viewedBy || []), currentUser]),
            ],
            updatedDate: Date.now(),
            updatedBy: currentUser,
          };
          localStorage.setItem("requests", JSON.stringify(allRequests));
          updatedOrder = { ...order, status: "JB Verifying" };
        }
      }
    }

    setVerifyingOrder(updatedOrder);

    // For JB role in assigned tab, route to write-order
    if (userRole === "jb" && currentTab === "assigned") {
      setCurrentPage("write-order");
    } else {
      setVerifyMode("detail");
      setCurrentPage("request-details");
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

    // Return to the page the user came from — never go back to request-details
    // with a null verifyingOrder (can happen when duplicate form goes back here first)
    const fallback =
      userRole === "jb"
        ? "jb-orders"
        : userRole === "sales"
          ? "sales-orders"
          : "my-orders";
    const target =
      previousPage && previousPage !== "request-details"
        ? previousPage
        : fallback;
    setCurrentPage(target);
  };

  const handleBackFromWriteOrder = () => {
    setVerifyingOrder(null);

    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      return;
    }

    setCurrentPage(previousPage || "jb-orders");
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

  const handleNavigateToUpdateOrder = (orderId: string) => {
    console.log(`📝 Navigating to update order ${orderId} (Role: ${userRole})`);

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

    // Navigate to update order page
    handleUpdateOrder(order);
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
      // For stockist: if status is Open, go to verify-stock in verify mode
      // Otherwise, go to detail mode (read-only)
      const isVerifyMode = request.status === "Open";

      if (isVerifyMode) {
        console.log("→ Opening in Verify Stock mode (can edit/verify)");
        handleRequestDetails(request, "open");
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
    // If status is Open or JB Verifying, show the original request detail page
    if (order.status === "Open" || order.status === "JB Verifying") {
      const requestId = order.requestId || order.id;
      const savedRequests = localStorage.getItem("requests");
      if (savedRequests) {
        const allRequests = JSON.parse(savedRequests);
        const request = allRequests.find((r: any) => r.id === requestId);
        if (request) {
          setMyOrdersTab(currentTab || "open");
          setPreviousOrdersTab(currentTab || "open");
          setPreviousPage(currentPage);
          setVerifyingOrder(request);
          setVerifyMode("detail");
          setCurrentPage("request-details");
          return;
        }
      }
    }

    // Mark order as viewed by current user
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders && currentUser) {
      const allOrders = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o: any) => o.id === order.id);

      if (orderIndex !== -1) {
        // Initialize viewedBy array if it doesn't exist
        if (!allOrders[orderIndex].viewedBy) {
          allOrders[orderIndex].viewedBy = [];
        }

        // Add current user to viewedBy array if not already there
        if (!allOrders[orderIndex].viewedBy.includes(currentUser)) {
          allOrders[orderIndex].viewedBy.push(currentUser);
          localStorage.setItem("orders", JSON.stringify(allOrders));

          // Update the order object we're passing to the detail view
          order.viewedBy = allOrders[orderIndex].viewedBy;
        }
      }
    }

    setViewingOrder(order);
    setIsReviewMode(false);
    if (currentTab) {
      setPreviousOrdersTab(currentTab);
    }
    setPreviousPage(currentPage);
    setCurrentPage("order-details");
  };

  const handleReviewRevision = (order: any, currentTab?: string) => {
    // Mark order as viewed by current user
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders && currentUser) {
      const allOrders = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o: any) => o.id === order.id);

      if (orderIndex !== -1) {
        // Initialize viewedBy array if it doesn't exist
        if (!allOrders[orderIndex].viewedBy) {
          allOrders[orderIndex].viewedBy = [];
        }

        // Add current user to viewedBy array if not already there
        if (!allOrders[orderIndex].viewedBy.includes(currentUser)) {
          allOrders[orderIndex].viewedBy.push(currentUser);
          localStorage.setItem("orders", JSON.stringify(allOrders));

          // Update the order object we're passing to the detail view
          order.viewedBy = allOrders[orderIndex].viewedBy;
        }
      }
    }

    setViewingOrder(order);
    setIsReviewMode(true);
    if (currentTab) {
      setPreviousOrdersTab(currentTab);
    }
    setPreviousPage(currentPage);
    setCurrentPage("order-details");
  };

  const handleApproveRevision = (orderId: string) => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o: any) => o.id === orderId);

      if (orderIndex !== -1) {
        const currentOrder = allOrders[orderIndex];
        const oldStatus = currentOrder.status;

        // Mark approval based on user role
        if (userRole === "jb") {
          currentOrder.jbApproved = true;
        } else if (userRole === "sales") {
          currentOrder.salesApproved = true;
        }

        // If both JB and Sales have approved, change status to Order Revised
        if (currentOrder.jbApproved && currentOrder.salesApproved) {
          currentOrder.status = "Order Revised";
          toast.success(
            "Order revision fully approved - Status changed to Order Revised",
          );

          // Create notification for full approval
          notifyOrderStatusChanged(
            currentOrder,
            oldStatus,
            "Order Revised",
            currentUser,
            userRole,
          );
        } else {
          toast.success(
            `Order approved by ${userRole.toUpperCase()} - Waiting for ${userRole === "jb" ? "Sales" : "JB"} approval`,
          );
        }

        currentOrder.updatedDate = Date.now();
        currentOrder.updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));

        // Go back
        handleBackFromOrderDetails();
      }
    }
  };

  const handleCancelOrderFromReview = (orderId: string) => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      const allOrders = JSON.parse(savedOrders);
      const orderIndex = allOrders.findIndex((o: any) => o.id === orderId);

      if (orderIndex !== -1) {
        const oldStatus = allOrders[orderIndex].status;
        allOrders[orderIndex].status = "Cancelled";
        allOrders[orderIndex].updatedDate = Date.now();
        allOrders[orderIndex].updatedBy = currentUser;
        localStorage.setItem("orders", JSON.stringify(allOrders));

        // Create notification
        notifyOrderStatusChanged(
          allOrders[orderIndex],
          oldStatus,
          "Cancelled",
          currentUser,
          userRole,
        );

        // Show toast
        toast.success("Order cancelled successfully");

        // Go back
        handleBackFromOrderDetails();
      }
    }
  };

  const handleBackFromOrderDetails = () => {
    setViewingOrder(null);
    setIsReviewMode(false);
    // Return to the page the user came from
    const fallback =
      userRole === "supplier"
        ? "supplier-orders"
        : userRole === "sales"
          ? "sales-orders"
          : "jb-orders";
    setCurrentPage(previousPage || fallback);
    setPreviousPage("");
  };

  const handleUpdateOrder = (order: any, currentTab?: string) => {
    setEditingOrderForUpdate(order);
    if (currentTab) {
      setPreviousOrdersTab(currentTab);
    }
    setPreviousPage(currentPage);
    setCurrentPage("order-edit");
  };

  const handleUpdateOrderWithTabReturn = (order: any, returnTab: string) => {
    setEditingOrderForUpdate(order);
    setPreviousOrdersTab(returnTab);
    setCurrentPage("order-edit");
  };

  const handleBackFromOrderEdit = () => {
    setEditingOrderForUpdate(null);

    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      return;
    }

    const fallback =
      userRole === "supplier"
        ? "supplier-orders"
        : userRole === "jb"
          ? "jb-orders"
          : "sales-orders";
    setCurrentPage(previousPage || fallback);
  };

  const handleOrderEditSave = () => {
    // Re-read the updated order from localStorage so viewingOrder reflects the new status
    if (editingOrderForUpdate) {
      const saved = localStorage.getItem("orders");
      if (saved) {
        const all = JSON.parse(saved);
        const fresh = all.find((o: any) => o.id === editingOrderForUpdate.id);
        if (fresh) setViewingOrder(fresh);
      }
    }
    setEditingOrderForUpdate(null);
    const fallback =
      userRole === "supplier"
        ? "supplier-orders"
        : userRole === "jb"
          ? "jb-orders"
          : "sales-orders";
    setCurrentPage(previousPage || fallback);
  };

  const handleJBRejectRequest = (reason: string) => {
    if (!verifyingOrder) return;
    const savedRequests = localStorage.getItem("requests");
    if (savedRequests) {
      const allRequests = JSON.parse(savedRequests);
      const idx = allRequests.findIndex((r: any) => r.id === verifyingOrder.id);
      if (idx !== -1) {
        allRequests[idx].status = "Rejected";
        allRequests[idx].rejectionReason = reason;
        allRequests[idx].updatedDate = Date.now();
        allRequests[idx].updatedBy = currentUser;
        localStorage.setItem("requests", JSON.stringify(allRequests));
        toast.success("Request rejected");
        handleBackFromVerify();
      }
    }
  };

  const handleJBWriteOrder = () => {
    // Navigate to write-order; on back from there return to jb-orders with saved tab
    setCurrentPage("write-order");
  };

  const handleNavigateToTab = (tab: string) => {
    setMyOrdersTab(tab);
    setCurrentPage("my-orders");
  };

  const handleJBNavigateToTab = (tab: string) => {
    // Map old jb-requests tabs to jb-orders tabs
    const tabMap: Record<string, string> = {
      assigned: "internal",
      done: "shipping",
    };
    setPreviousOrdersTab(tabMap[tab] || tab);
    setCurrentPage("jb-orders");
  };

  const handleSaveComplete = (action: "save" | "saveAndAddMore") => {
    // After saving, reset to new mode
    setEditingOrder(null);
    setFormMode("new");
    setHasFormChanges(false);

    // Note: Navigation is handled by onNavigateToMyRequests for "save" action
    // which is called by order-form.tsx before this callback
  };

  const handleNavigateToMyRequests = () => {
    setHasFormChanges(false);
    // Sales users go to the Pesanan page on the Internal tab
    if (userRole === "sales") {
      setPreviousOrdersTab("internal");
      setCurrentPage("sales-orders");
    } else {
      sessionStorage.removeItem("myRequestActiveTab");
      setJustCreatedRequest(true);
      setMyOrdersTab("open");
      setMyOrdersKey((prev) => prev + 1);
      setCurrentPage("my-orders");
    }
  };

  const getFormTitle = () => {
    if (formMode === "edit") return "Edit Request";
    if (formMode === "duplicate") return "Create New Request";
    return "Create Request";
  };

  const handleCancelEdit = () => {
    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      setHasFormChanges(false);
      return;
    }

    // Go back to where the user came from
    const fallback = userRole === "sales" ? "sales-orders" : "my-orders";
    setCurrentPage(previousPage || fallback);
    setHasFormChanges(false);
  };

  const handleCancelCreate = () => {
    // If came from notifications, return to notifications
    if (cameFromNotifications) {
      setCameFromNotifications(false);
      setCurrentPage("notifications");
      setHasFormChanges(false);
      return;
    }

    // If there are unsaved changes, show confirmation dialog
    if (hasFormChanges) {
      setPendingNavigation(previousPage || "home");
      setShowNavigationWarning(true);
    } else {
      // No changes, go back to where the user came from
      setCurrentPage(previousPage || "home");
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

    // Load user's language preference
    if (user.language) {
      setUserLanguage(user.language);
      i18n.changeLanguage(user.language);
      localStorage.setItem("userLanguage", user.language);
    }

    // Check for expiring requests immediately on login
    checkAndExpireRequests(); // Check and expire requests first
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

  const handleLanguageChange = (language: LanguageCode) => {
    setUserLanguage(language);
    i18n.changeLanguage(language);
    localStorage.setItem("userLanguage", language);

    // Update user profile in storage
    const userProfileStr =
      localStorage.getItem("userProfile") ||
      sessionStorage.getItem("userProfile");
    if (userProfileStr) {
      const userProfile = JSON.parse(userProfileStr);
      userProfile.language = language;

      const isRemembered = localStorage.getItem("isAuthenticated") === "true";
      if (isRemembered) {
        localStorage.setItem("userProfile", JSON.stringify(userProfile));
      } else {
        sessionStorage.setItem("userProfile", JSON.stringify(userProfile));
      }
    }
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
      case "pertanyaan":
        return (
          <SalesQuestions
            onCreateNew={handleCreateNewQuestion}
            onEditQuestion={handleEditQuestion}
          />
        );
      case "pertanyaan-baru":
        return (
          <QuestionForm
            onSaveComplete={handleQuestionSaveComplete}
            initialQuestion={editingQuestion}
          />
        );
      case "tambah-pesanan":
        return (
          <RequestForm
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
        console.log("🔷 Rendering MyOrders component");
        console.log("   myOrdersKey:", myOrdersKey);
        console.log("   myOrdersTab (initialTab prop):", myOrdersTab);
        console.log("   justCreatedRequest:", justCreatedRequest);
        return (
          <MyOrders
            key={myOrdersKey}
            onEditOrder={handleEditOrder}
            onDuplicateOrder={handleDuplicateOrder}
            userRole={userRole}
            onViewRequestDetails={handleRequestDetails}
            onSeeDetail={handleSeeDetail}
            initialTab={myOrdersTab}
            justCreatedRequest={justCreatedRequest}
            onClearJustCreated={() => setJustCreatedRequest(false)}
          />
        );
      case "stockist-questions":
        return <StockistQuestions />;
      case "sales-orders":
        return (
          <UnifiedOrders
            userRole="sales"
            onEditRequest={handleEditOrder}
            onDuplicateRequest={handleDuplicateOrder}
            onViewRequestDetails={handleSeeDetail}
            onSeeDetail={handleSeeOrderDetail}
            onUpdateOrder={handleUpdateOrder}
            initialTab={previousOrdersTab}
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
      case "eta-calendar":
        return (
          <ETACalendar
            userRole={userRole as "sales" | "jb"}
            currentUser={currentUser}
            onSeeDetail={(order) => handleSeeOrderDetail(order)}
            onUpdateOrder={(order) => {
              setPreviousPage("eta-calendar");
              handleSeeOrderDetail(order);
            }}
            onEditOrder={handleEditOrder}
            onCancelOrder={(id) => {
              const orders = JSON.parse(localStorage.getItem("orders") ?? "[]");
              const order = orders.find((o: any) => o.id === id);
              if (order) handleSeeOrderDetail(order);
            }}
            onDuplicateOrder={(order) => handleDuplicateOrder(order)}
          />
        );
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
        return (
          <JBInboundSearch
            onSeeDetail={(order) => {
              setPreviousPage("inbound");
              handleSeeOrderDetail(order);
            }}
          />
        );
      case "supplier-orders": {
        const currentSupplierId = (getCurrentUserDetails() as any)?.supplierId;
        return (
          <UnifiedOrders
            userRole="supplier"
            onSeeDetail={handleSeeOrderDetail}
            onUpdateOrder={handleUpdateOrder}
            initialTab={previousOrdersTab}
            supplierId={currentSupplierId}
          />
        );
      }
      case "jb-orders":
      case "order":
        return (
          <UnifiedOrders
            userRole="jb"
            onViewRequestDetails={handleSeeDetail}
            onSeeDetail={handleSeeOrderDetail}
            onUpdateOrder={handleUpdateOrder}
            initialTab={previousOrdersTab}
            focusSearch={focusJBOrdersSearch}
            onFocusSearchConsumed={() => setFocusJBOrdersSearch(false)}
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
        return (
          <Settings
            onLogout={handleLogout}
            username={currentUser}
            currentLanguage={userLanguage}
            onLanguageChange={handleLanguageChange}
          />
        );
      case "notifications":
        return (
          <Notifications
            onNavigateToRequest={handleNavigateToRequest}
            onNavigateToOrder={handleNavigateToOrder}
            onNavigateToUpdateOrder={handleNavigateToUpdateOrder}
          />
        );
      case "request-details":
        return (
          <RequestDetails
            request={verifyingOrder}
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
            onReject={
              // JB can reject Open requests
              userRole === "jb" &&
              verifyMode === "detail" &&
              (verifyingOrder?.status === "Open" ||
                verifyingOrder?.status === "JB Verifying")
                ? handleJBRejectRequest
                : undefined
            }
            onWriteOrder={
              // JB can write order for Open/JB Verifying requests
              userRole === "jb" &&
              verifyMode === "detail" &&
              (verifyingOrder?.status === "Open" ||
                verifyingOrder?.status === "JB Verifying")
                ? handleJBWriteOrder
                : undefined
            }
          />
        );
      case "write-order":
        return (
          <WriteOrder
            request={verifyingOrder}
            onBack={handleBackFromWriteOrder}
          />
        );
      case "order-details":
        return (
          <OrderDetails
            order={viewingOrder}
            onBack={handleBackFromOrderDetails}
            reviewMode={isReviewMode}
            onApproveRevision={handleApproveRevision}
            onCancelOrder={handleCancelOrderFromReview}
            onUpdateOrder={handleUpdateOrder}
          />
        );
      default:
        return (
          <RequestForm
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-4 pb-4">
        {/* Profile Section - Fixed at top right */}
        <div className="fixed top-4 right-4 z-40">
          <div
            className={`flex items-center rounded-lg shadow-md ${roleConfig.bg} border border-gray-200 cursor-pointer transition-all ${
              isProfileExpanded
                ? "gap-3 px-3 py-2 flex-col items-start"
                : "p-1.5"
            }`}
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          >
            {/* Icon - Always visible, smaller when collapsed */}
            <div
              className={`flex items-center w-full ${isProfileExpanded ? "gap-3" : ""}`}
            >
              <RoleIcon
                className={`${isProfileExpanded ? "w-6 h-6" : "w-4 h-4"} ${roleConfig.color}`}
              />

              {/* Expanded info - only shown when expanded */}
              {isProfileExpanded && (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${roleConfig.color}`}
                    >
                      {getFullNameFromUsername(currentUser) || currentUser}
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform rotate-180" />
                  </div>
                  <span className={`text-xs ${roleConfig.color} opacity-60`}>
                    {currentUser}
                  </span>
                  <span className={`text-xs ${roleConfig.color} opacity-80`}>
                    {roleConfig.label}
                  </span>
                  {(() => {
                    const userDetails = getCurrentUserDetails();
                    return userDetails?.branchCode ? (
                      <span
                        className={`text-xs ${roleConfig.color} opacity-70`}
                      >
                        {getBranchName(userDetails.branchCode)} Branch
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            {isProfileExpanded && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const result = await populateMockData();
                  toast.success(
                    `Populated ${result.requests} requests, ${result.orders} orders, ${result.notifications} notifications`,
                  );
                }}
                className="w-full text-xs px-2 py-1 rounded border border-dashed border-current opacity-60 hover:opacity-100 transition-opacity"
              >
                Populate
              </button>
            )}
          </div>
        </div>

        <div
          className={`w-full max-w-7xl mx-auto ${["sales-orders", "jb-orders", "order", "supplier-orders", "request-details", "order-details", "order-edit"].includes(currentPage) ? "" : "pt-4"}`}
        >
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
      <Toaster position="top-center" richColors duration={4800} />
    </div>
  );
}
