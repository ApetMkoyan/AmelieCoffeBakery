import { useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function OrderReview({ orderData, cartItems, onConfirm, onBack, status }) {
  const { t } = useLanguage();
  
  const total = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.quantity * Number(item.price),
        0
      ),
    [cartItems]
  );

  return (
    <div className="card order-review">
      <header>
        <h3>{t("orderReview.title")}</h3>
        <p>{t("orderReview.subtitle")}</p>
      </header>

      {cartItems.length > 0 && (
        <section className="review-section">
          <h4>{t("orderReview.itemsTitle")}</h4>
          <ul className="review-items">
            {cartItems.map((item) => (
              <li key={item.id} className="review-item">
                {item.image && (
                  <img src={item.image} alt={item.name} loading="lazy" />
                )}
                <div className="review-item__details">
                  <p className="review-item__name">{item.name}</p>
                  <p className="review-item__meta">
                    {currency(item.price)} × {item.quantity} = {currency(item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="review-section">
        <h4>{t("orderReview.customerInfo")}</h4>
        <div className="review-info-grid">
          <div>
            <strong>{t("order.firstName")}:</strong>
            <p>{orderData.firstName}</p>
          </div>
          <div>
            <strong>{t("order.lastName")}:</strong>
            <p>{orderData.lastName}</p>
          </div>
          <div>
            <strong>{t("order.phone")}:</strong>
            <p>{orderData.phone}</p>
          </div>
          <div>
            <strong>{t("order.address")}:</strong>
            <p>{orderData.address}</p>
          </div>
          <div>
            <strong>{t("order.delivery")}:</strong>
            <p>
              {orderData.delivery === "delivery"
                ? t("order.deliveryOption")
                : t("order.pickupOption")}
            </p>
          </div>
          <div>
            <strong>{t("order.eventDate")}:</strong>
            <p>
              {orderData.eventDate
                ? new Date(orderData.eventDate).toLocaleDateString()
                : "-"}
            </p>
          </div>
          <div>
            <strong>{t("order.paymentMethod")}:</strong>
            <p>
              {orderData.paymentMethod === "cash"
                ? t("order.cash")
                : t("order.card")}
            </p>
          </div>
          {orderData.cakeSize && (
            <div>
              <strong>{t("order.cakeSize")}:</strong>
              <p>{orderData.cakeSize}</p>
            </div>
          )}
          {orderData.budgetRange && (
            <div>
              <strong>{t("order.budgetRange")}:</strong>
              <p>{orderData.budgetRange} ₾</p>
            </div>
          )}
          {orderData.notes && (
            <div className="full-width">
              <strong>{t("order.notes")}:</strong>
              <p>{orderData.notes}</p>
            </div>
          )}
        </div>
      </section>

      {cartItems.length > 0 && (
        <section className="review-section review-total">
          <div className="review-total-row">
            <strong>{t("cart.total")}:</strong>
            <strong className="total-amount">{currency(total)}</strong>
          </div>
        </section>
      )}

      <div className="review-actions">
        <button
          type="button"
          className="btn ghost"
          onClick={onBack}
          disabled={status.type === "loading"}
        >
          {t("orderReview.back")}
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onConfirm}
          disabled={status.type === "loading"}
        >
          {status.type === "loading"
            ? t("order.submitting")
            : t("orderReview.confirmOrder")}
        </button>
      </div>

      {status.message && (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      )}
    </div>
  );
}

export default OrderReview;

