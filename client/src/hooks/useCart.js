import { useState, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

/**
 * Custom hook for managing shopping cart
 * @returns {object} Cart state and handlers
 */
export function useCart() {
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [cartAnimate, setCartAnimate] = useState(false);

  const addToCart = useCallback(
    (product) => {
      setCartItems((prev) => {
        const productId = product.id || product.name;
        const existing = prev.find((item) => item.id === productId);

        if (existing) {
          const updated = prev.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          setToastMessage(t("cart.addedToCart", { name: product.name }));
          setCartAnimate(true);
          return updated;
        }

        const newItems = [
          ...prev,
          {
            id: productId,
            name: product.name,
            price: Number(product.price),
            image: product.image || "",
            quantity: 1,
          },
        ];
        setToastMessage(t("cart.addedToCart", { name: product.name }));
        setCartAnimate(true);
        return newItems;
      });
    },
    [t]
  );

  const updateCartQuantity = useCallback((productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
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
  };
}

