/**
 * Admin Panel App Component
 * 
 * This is a separate admin panel application that manages:
 * - Supervisor authentication
 * - Products management
 * - Orders management
 * - Consumables (expenses/profit) management
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "./contexts/LanguageContext.jsx";
import { useProducts } from "./hooks/useProducts.js";
import { apiPost, apiPatch, apiDelete, apiGet } from "./utils/api.js";
import {
  loadSupervisorToken,
  loadSupervisorEmail,
  saveSupervisorToken,
  saveSupervisorEmail,
  clearSupervisorData,
} from "./utils/storage.js";

// Components
import SupervisorSection from "./components/supervisor/SupervisorSection.jsx";
import SectionHeading from "./components/SectionHeading.jsx";

const BUSINESS_NAME = "Amelie Coffee & Bakery";

function AdminApp() {
  const { t } = useLanguage();

  // Products
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();

  // Supervisor state
  const [supervisorToken, setSupervisorToken] = useState(() => loadSupervisorToken());
  const [supervisorProfile, setSupervisorProfile] = useState(() => {
    const email = loadSupervisorEmail();
    return email ? { email } : null;
  });
  // Track if we just logged in to skip immediate verification
  const justLoggedInRef = useRef(false);

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
      if (error.status === 401) {
        console.warn("401 error fetching consumables, but keeping session - might be server restart");
      }
    }
  }, [supervisorToken]);

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
      if (error.status === 401) {
        console.warn("401 error fetching orders, but keeping session - might be server restart");
      }
    }
  }, [supervisorToken]);

  // Verify token and load data when token is available
  useEffect(() => {
    if (!supervisorToken) return;
    
    // Skip verification if we just logged in (login handler already loaded data)
    if (justLoggedInRef.current) {
      justLoggedInRef.current = false;
      return;
    }
    
    let isMounted = true;
    let hasVerified = false;
    
    const verifyAndLoad = async () => {
      if (hasVerified) return;
      hasVerified = true;
      
      try {
        const response = await fetch("/api/supervisor/verify", {
          headers: {
            "x-supervisor-token": supervisorToken,
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.warn("Token verification failed (401), but keeping session for now");
            setTimeout(async () => {
              try {
                await fetchConsumables();
              } catch (e) {
                if (e.status === 401 && isMounted) {
                  console.log("Multiple 401 errors, logging out");
                  handleSupervisorLogout();
                }
              }
            }, 1000);
            return;
          }
          console.warn("Token verification failed, but keeping session:", response.status);
          return;
        }
        
        const data = await response.json();
        if (data.valid && data.profile && isMounted) {
          setSupervisorProfile(data.profile);
          fetchConsumables();
          fetchOrders();
        }
      } catch (error) {
        console.error("Token verification error:", error);
      }
    };
    
    verifyAndLoad();
    
    return () => {
      isMounted = false;
    };
  }, [supervisorToken, handleSupervisorLogout, fetchConsumables, fetchOrders]);

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
      
      justLoggedInRef.current = true;
      
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
      let errorMessage = error.message || "Login failed";
      
      if (errorMessage.includes("Invalid login") || errorMessage.includes("Invalid credentials")) {
        errorMessage = t("supervisor.login.invalidCredentials") || "Неверный логин или пароль";
      } else if (errorMessage.includes("Invalid password")) {
        errorMessage = t("supervisor.login.invalidPassword") || "Неверный пароль";
      } else if (errorMessage.includes("required")) {
        errorMessage = t("supervisor.login.fieldsRequired") || "Заполните все поля";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const handleConsumableSubmit = async (payload) => {
    if (!supervisorToken) return false;
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiPost("/consumables", payload, supervisorToken);
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
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiPatch(`/consumables/${entryId}`, updates, supervisorToken);
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
    if (consumableOperationInProgress) {
      console.warn("Consumable operation already in progress");
      return false;
    }
    
    setConsumableOperationInProgress(true);
    setConsumableState({ loading: true, error: "" });
    
    try {
      await apiDelete(`/consumables/${entryId}`, supervisorToken);
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

  return (
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
  );
}

export default AdminApp;

