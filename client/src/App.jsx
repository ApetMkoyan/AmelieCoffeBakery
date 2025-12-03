/**
 * Main App Component
 * 
 * This is the root component that manages:
 * - Products data
 * - Cart management
 * - Order submission
 * - Navigation and routing
 * 
 * Note: Admin panel is now in a separate file (admin.html)
 */

import { useState } from "react";
import { useLanguage } from "./contexts/LanguageContext.jsx";
import { useProducts } from "./hooks/useProducts.js";
import { useCart } from "./hooks/useCart.js";
import { apiPost } from "./utils/api.js";
import { scrollToElementById } from "./utils/scroll.js";

// Components
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import CartIcon from "./components/CartIcon.jsx";
import CartModal from "./components/cart/CartModal.jsx";
import ToastNotification from "./components/ToastNotification.jsx";
import GuestView from "./components/views/GuestView.jsx";
import Footer from "./components/Footer.jsx";

const BUSINESS_NAME = "Amelie Coffee & Bakery";

function App() {
  const { t } = useLanguage();

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
  
  // Cart modal state
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);


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


  // Cart modal handlers
  const handleCartIconClick = () => {
    setIsCartModalOpen(true);
  };
  
  const handleCloseCartModal = () => {
    setIsCartModalOpen(false);
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
  const handleNavigate = (targetId, href) => {
    if (targetId === "home" || targetId === "menu" || targetId === "custom-order") {
      const selectorMap = {
        home: "#top",
        menu: "#menu",
        "custom-order": "#custom-order",
      };
      const selector = selectorMap[targetId] || href;
      setTimeout(() => {
        scrollToElementById(selector.replace("#", ""), 140);
      }, 0);
      return true;
    }
    return false;
  };

  return (
    <>
      <LanguageSwitcher />
      <CartIcon
        itemCount={cartItemCount}
        onClick={handleCartIconClick}
        animate={cartAnimate}
        onAnimationEnd={() => setCartAnimate(false)}
      />
      <CartModal
        isOpen={isCartModalOpen}
        onClose={handleCloseCartModal}
        items={cartItems}
        onIncrement={(id) => updateCartQuantity(id, 1)}
        onDecrement={(id) => updateCartQuantity(id, -1)}
        onRemove={removeFromCart}
        onCheckout={scrollToOrderForm}
      />
      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage("")}
      />
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
      <Footer />
    </>
  );
}

export default App;

