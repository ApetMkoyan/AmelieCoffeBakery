/**
 * Main App Component
 * 
 * This is the root component that manages:
 * - View state (guest/supervisor)
 * - Products, orders, and consumables data
 * - Cart management
 * - Supervisor authentication
 * - Navigation and routing
 */

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "./contexts/LanguageContext.jsx";
import { useProducts } from "./hooks/useProducts.js";
import { useCart } from "./hooks/useCart.js";
import { apiPost, apiPatch, apiDelete, apiGet } from "./utils/api.js";
import {
  loadSupervisorToken,
  loadSupervisorEmail,
  saveSupervisorToken,
  saveSupervisorEmail,
  clearSupervisorData,
} from "./utils/storage.js";
import { scrollToElementById } from "./utils/scroll.js";

// Components
import TopNav from "./components/TopNav.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import CartIcon from "./components/CartIcon.jsx";
import ToastNotification from "./components/ToastNotification.jsx";
import GuestView from "./components/views/GuestView.jsx";
import SupervisorSection from "./components/supervisor/SupervisorSection.jsx";
import Footer from "./components/Footer.jsx";
import SectionHeading from "./components/SectionHeading.jsx";

const BUSINESS_NAME = "Amelie Coffee & Bakery";

function App() {
  const { t } = useLanguage();
  const [view, setView] = useState("guest");

  // Products
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();

  // Cart
  const {
    cartItems,
    cartItemCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toastMessage,
    setToastMessage,
    cartAnimate,
    setCartAnimate,
  } = useCart();

  // Order status
  const [orderStatus, setOrderStatus] = useState({
    type: "idle",
    message: "",
  });

  // Force order type when clicking "Order Now" in cart
  const [forceOrderType, setForceOrderType] = useState(null);

  // Supervisor state
  const [supervisorToken, setSupervisorToken] = useState(() => loadSupervisorToken());
  const [supervisorProfile, setSupervisorProfile] = useState(() => {
    const email = loadSupervisorEmail();
    return email ? { email } : null;
  });

  // Consumables (expenses/profit)
  const [consumables, setConsumables] = useState([]);
  const [consumableState, setConsumableState] = useState({
    loading: false,
    error: "",
  });
  // Track ongoing operations to prevent race conditions
  const [consumableOperationInProgress, setConsumableOperationInProgress] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersState, setOrdersState] = useState({
    loading: false,
    error: "",
  });

  // Supervisor logout handler
  const handleSupervisorLogout = useCallback(() => {
    clearSupervisorData();
    setSupervisorToken("");
    setConsumables([]);
    setOrders([]);
    setSupervisorProfile(null);
  }, []);

  // Fetch consumables
  const fetchConsumables = useCallback(async () => {
    if (!supervisorToken) return;
    try {
      setConsumableState({ loading: true, error: "" });
      const data = await apiGet("/consumables", supervisorToken);
      setConsumables(data);
      setConsumableState({ loading: false, error: "" });
    } catch (error) {
      console.error("Error fetching consumables:", error);
      setConsumableState({ loading: false, error: error.message });
      if (error.message && (error.message.includes("expired") || error.message.includes("Unauthorized"))) {
        handleSupervisorLogout();
      }
    }
  }, [handleSupervisorLogout, supervisorToken]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!supervisorToken) return;
    try {
      setOrdersState({ loading: true, error: "" });
      const data = await apiGet("/orders", supervisorToken);
      setOrders(data);
      setOrdersState({ loading: false, error: "" });
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrdersState({ loading: false, error: error.message });
      if (error.message && (error.message.includes("expired") || error.message.includes("Unauthorized"))) {
        handleSupervisorLogout();
      }
    }
  }, [handleSupervisorLogout, supervisorToken]);

  // Load supervisor data when token is available
  useEffect(() => {
    fetchConsumables();
  }, [fetchConsumables]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Order submission
  const handleOrderSubmit = async (payload) => {
    try {
      setOrderStatus({ type: "loading", message: t("order.sendingOrder") });
      await apiPost("/orders", payload);
      setOrderStatus({
        type: "success",
        message: t("order.successMessage"),
      });
      return true;
    } catch (error) {
      console.error("Error submitting order:", error);
      setOrderStatus({
        type: "error",
        message: t("order.errorMessage"),
      });
      return false;
    }
  };

  // Checkout form submission
  const handleCheckoutSubmit = async (formValues) => {
    try {
      const items = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      const summary = items.length
        ? items.map((item) => `${item.quantity}x ${item.name}`).join(", ")
        : t("order.customOrderRequest");
      const details =
        summary + (formValues.notes ? ` · ${t("order.notes")}: ${formValues.notes}` : "");

      const payload = {
        ...formValues,
        items,
        details,
      };

      const success = await handleOrderSubmit(payload);
      if (success) {
        clearCart();
      }
      return success;
    } catch (error) {
      console.error("Checkout submission error:", error);
      return false;
    }
  };

  // Supervisor handlers
  const handleSupervisorLogin = async (credentials) => {
    try {
      const data = await apiPost("/supervisor/login", credentials);
      if (!data || !data.token) {
        return { success: false, message: "Invalid response from server" };
      }
      
      saveSupervisorToken(data.token);
      const newToken = data.token;
      setSupervisorToken(newToken);
      
      if (data.profile?.email) {
        saveSupervisorEmail(data.profile.email);
        setSupervisorProfile(data.profile);
      }
      
      setConsumableState({ loading: false, error: "" });
      
      // Fetch data with new token
      try {
        const [consumablesData, ordersData] = await Promise.all([
          apiGet("/consumables", newToken),
          apiGet("/orders", newToken),
        ]);
        setConsumables(consumablesData);
        setOrders(ordersData);
      } catch (fetchError) {
        console.error("Error fetching initial data:", fetchError);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const handleConsumableSubmit = async (payload) => {
    if (!supervisorToken) return false;
    // Prevent multiple simultaneous operations
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    // Clear previous errors and set loading state
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiPost("/consumables", payload, supervisorToken);
      // Small delay to ensure server has processed the write
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchConsumables();
      setConsumableState({ loading: false, error: "" });
      setConsumableOperationInProgress(false);
      return true;
    } catch (error) {
      console.error("Error submitting consumable:", error);
      setConsumableState({
        loading: false,
        error: t("supervisor.errors.saveEntry"),
      });
      setConsumableOperationInProgress(false);
      return false;
    }
  };

  const handleEditConsumable = async (entryId, updates) => {
    if (!supervisorToken) return false;
    // Prevent multiple simultaneous operations
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    // Clear previous errors and set loading state
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiPatch(`/consumables/${entryId}`, updates, supervisorToken);
      // Small delay to ensure server has processed the write
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchConsumables();
      setConsumableState({ loading: false, error: "" });
      setConsumableOperationInProgress(false);
      return true;
    } catch (error) {
      console.error("Error editing consumable:", error);
      setConsumableState({
        loading: false,
        error: t("supervisor.errors.updateEntry"),
      });
      setConsumableOperationInProgress(false);
      return false;
    }
  };

  const handleDeleteConsumable = async (entryId) => {
    if (!supervisorToken) return false;
    // Prevent multiple simultaneous operations
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    // Clear previous errors and set loading state
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiDelete(`/consumables/${entryId}`, supervisorToken);
      // Small delay to ensure server has processed the write
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchConsumables();
      setConsumableState({ loading: false, error: "" });
      setConsumableOperationInProgress(false);
      return true;
    } catch (error) {
      console.error("Error deleting consumable:", error);
      setConsumableState({
        loading: false,
        error: t("supervisor.errors.deleteEntry"),
      });
      setConsumableOperationInProgress(false);
      return false;
    }
  };

  const handleProductCreate = async (payload) => {
    if (!supervisorToken) return { success: false, message: "Unauthorized" };
    try {
      await apiPost("/products", payload, supervisorToken);
      await refetchProducts();
      return { success: true };
    } catch (error) {
      console.error("Error creating product:", error);
      return { success: false, message: error.message };
    }
  };

  const handleProductEdit = async (productId, payload) => {
    if (!supervisorToken) return { success: false, message: "Unauthorized" };
    try {
      await apiPatch(`/products/${productId}`, payload, supervisorToken);
      await refetchProducts();
      return { success: true };
    } catch (error) {
      console.error("Error editing product:", error);
      return { success: false, message: error.message };
    }
  };

  const handleProductDelete = async (productId) => {
    if (!supervisorToken) return { success: false, message: "Unauthorized" };
    try {
      await apiDelete(`/products/${productId}`, supervisorToken);
      await refetchProducts();
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      return { success: false, message: error.message };
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    if (!supervisorToken) return false;
    try {
      await apiPatch(`/orders/${orderId}`, { status }, supervisorToken);
      await fetchOrders();
      setOrdersState((prev) => ({ ...prev, error: "" }));
      return true;
    } catch (error) {
      console.error("Error updating order:", error);
      const errorMessage = error.message?.includes("expired") || error.message?.includes("Unauthorized")
        ? "Session expired. Please log in again."
        : error.message || t("supervisor.errors.updateOrder");
      setOrdersState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!supervisorToken) return false;
    try {
      await apiDelete(`/orders/${orderId}`, supervisorToken);
      await fetchOrders();
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      setOrdersState((prev) => ({
        ...prev,
        error: t("supervisor.errors.deleteOrder"),
      }));
      return false;
    }
  };

  // Scroll handlers
  const handleCartIconClick = () => {
    scrollToElementById("cart", 140);
  };

  const scrollToOrderForm = () => {
    // Force order type to "checkout" when coming from cart
    setForceOrderType("checkout");
    // Use setTimeout to ensure the element is rendered
    setTimeout(() => {
      scrollToElementById("custom-order", 140);
      // Reset forceOrderType after a short delay
      setTimeout(() => setForceOrderType(null), 500);
    }, 100);
  };

  // Navigation handler
  const handleNavigate = useCallback(
    (targetId, href) => {
      if (targetId === "supervisor") {
        setView("supervisor");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return true;
      }

      if (targetId === "home" || targetId === "menu" || targetId === "custom-order") {
        if (view !== "guest") {
          setView("guest");
        }
        const selectorMap = {
          home: "#top",
          menu: "#menu",
          "custom-order": "#custom-order",
        };
        const selector = selectorMap[targetId] || href;
        setTimeout(() => {
          scrollToElementById(selector.replace("#", ""), 140);
        }, view === "guest" ? 0 : 60);
        return true;
      }
      return false;
    },
    [view]
  );

  return (
    <>
      <TopNav currentView={view} onNavigate={handleNavigate} />
      <LanguageSwitcher />
      {view === "guest" && (
        <CartIcon
          itemCount={cartItemCount}
          onClick={handleCartIconClick}
          animate={cartAnimate}
          onAnimationEnd={() => setCartAnimate(false)}
        />
      )}
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage("")}
      />
      {view === "guest" ? (
        <GuestView
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          cartItems={cartItems}
          cartItemCount={cartItemCount}
          addToCart={addToCart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          onOrderSubmit={handleCheckoutSubmit}
          orderStatus={orderStatus}
          scrollToOrderForm={scrollToOrderForm}
          forceOrderType={forceOrderType}
        />
      ) : (
        <main className="supervisor-page">
          <section className="section supervisor-section">
            <SectionHeading
              title={t("supervisor.title")}
              subtitle={
                supervisorToken
                  ? t("supervisor.subtitle")
                  : t("supervisor.loginSubtitle")
              }
            />
            <SupervisorSection
              isAuthenticated={Boolean(supervisorToken)}
              businessName={BUSINESS_NAME}
              profile={supervisorProfile}
              products={products}
              consumables={consumables}
              consumableState={consumableState}
              orders={orders}
              ordersState={ordersState}
              onAddEntry={handleConsumableSubmit}
              onEditEntry={handleEditConsumable}
              onDeleteEntry={handleDeleteConsumable}
              onAddProduct={handleProductCreate}
              onEditProduct={handleProductEdit}
              onDeleteProduct={handleProductDelete}
              onUpdateOrderStatus={handleOrderStatusUpdate}
              onDeleteOrder={handleDeleteOrder}
              onLogin={handleSupervisorLogin}
              onLogout={handleSupervisorLogout}
            />
          </section>
        </main>
      )}

      <Footer />
    </>
  );
}

export default App;

