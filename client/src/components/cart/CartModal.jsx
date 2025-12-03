import { useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import CartPanel from "./CartPanel.jsx";

const currency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function CartModal({ isOpen, onClose, items, onIncrement, onDecrement, onRemove, onCheckout }) {
  const { t } = useLanguage();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const total = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.price),
    0
  );

  const handleCheckoutClick = () => {
    onClose();
    if (onCheckout) {
      // Small delay to ensure modal closes smoothly
      setTimeout(() => {
        onCheckout();
      }, 200);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="size-selector-modal cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t("cart.yourCart")}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t("cart.close") || "Close"}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {items.length ? (
            <ul className="cart-items">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  )}
                  <div className="cart-item__details">
                    <p className="cart-item__title">
                      {item.name}
                      {item.size && <span className="cart-item__size"> ({item.size})</span>}
                    </p>
                    <p className="price">
                      {currency(item.price)} · Qty {item.quantity}
                    </p>
                    <div className="cart-item__actions">
                      <button
                        type="button"
                        onClick={() => onDecrement(item.id)}
                        aria-label={`Reduce ${item.name}`}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrement(item.id)}
                        aria-label={`Increase ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => onRemove(item.id)}
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cart-empty-message">{t("cart.addFavorites")}</p>
          )}
        </div>

        {items.length > 0 && (
          <div className="modal-footer">
            <div className="cart-total-row">
              <p>{t("cart.total")}</p>
              <strong>{currency(total)}</strong>
            </div>
            <button
              type="button"
              className="btn primary full-width"
              onClick={handleCheckoutClick}
            >
              {t("cart.goToCheckout") || t("cart.orderNow")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartModal;

