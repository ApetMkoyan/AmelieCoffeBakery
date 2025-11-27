import { useMemo, useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import OrderReview from "./OrderReview.jsx";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  delivery: "delivery",
  eventDate: "",
  paymentMethod: "cash",
  cakeSize: "",
  budgetRange: "",
  notes: "",
};

function CheckoutForm({ cartItems, status, onSubmit, forceOrderType }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [showReview, setShowReview] = useState(false);
  const [orderType, setOrderType] = useState(cartItems.length > 0 ? "checkout" : "custom");
  
  // Auto-switch to custom if cart becomes empty
  useEffect(() => {
    if (cartItems.length === 0 && orderType === "checkout") {
      setOrderType("custom");
    }
  }, [cartItems.length, orderType]);

  // Force order type when forceOrderType prop changes
  useEffect(() => {
    if (forceOrderType && cartItems.length > 0) {
      setOrderType(forceOrderType);
    }
  }, [forceOrderType, cartItems.length]);
  
  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.quantity * Number(item.price),
        0
      ),
    [cartItems]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Show review page instead of submitting directly
    setShowReview(true);
  };

  const handleConfirmOrder = async () => {
    if (!onSubmit) {
      console.error("onSubmit handler is missing");
      return;
    }
    try {
      const success = await onSubmit(form);
      if (success) {
        setForm(initialForm);
        setShowReview(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleBackToForm = () => {
    setShowReview(false);
  };

  // Show review page if form is submitted
  if (showReview) {
    return (
      <OrderReview
        orderData={form}
        cartItems={cartItems}
        onConfirm={handleConfirmOrder}
        onBack={handleBackToForm}
        status={status}
      />
    );
  }

  return (
    <form className="card checkout-form" onSubmit={handleSubmit}>
      <header>
        <h3>{t("order.title")}</h3>
        <p>
          {orderType === "checkout" && cartItems.length
            ? `${t("cart.total")}: ₾${cartTotal.toFixed(2)}`
            : orderType === "custom"
            ? t("order.customOrderSubtitle")
            : t("cart.empty")}
        </p>
      </header>

      {/* Order Type Selector */}
      <div className="order-type-selector">
        <button
          type="button"
          className={`order-type-btn ${orderType === "checkout" ? "active" : ""}`}
          onClick={() => setOrderType("checkout")}
          disabled={cartItems.length === 0}
        >
          {t("order.checkoutType")}
        </button>
        <button
          type="button"
          className={`order-type-btn ${orderType === "custom" ? "active" : ""}`}
          onClick={() => setOrderType("custom")}
        >
          {t("order.customType")}
        </button>
      </div>

      {orderType === "checkout" && cartItems.length === 0 && (
        <p className="form-status error">{t("order.emptyCartMessage")}</p>
      )}

      <div className="form-grid">
        <label>
          {t("order.firstName")}
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          {t("order.lastName")}
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          {t("order.phone")}
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          {t("order.address")}
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          {t("order.delivery")}
          <select
            name="delivery"
            value={form.delivery}
            onChange={handleChange}
            required
          >
            <option value="delivery">{t("order.deliveryOption")}</option>
            <option value="pickup">{t("order.pickupOption")}</option>
          </select>
        </label>
        <label>
          {t("order.eventDate")}
          <input
            type="date"
            name="eventDate"
            value={form.eventDate}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          {t("order.paymentMethod")}
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            required
          >
            <option value="cash">{t("order.cash")}</option>
            <option value="card">{t("order.card")}</option>
          </select>
        </label>
      </div>

      {/* Custom Order Fields - only for custom orders */}
      {orderType === "custom" && (
        <>
          <label>
            {t("order.cakeSize")}
            <input
              type="text"
              name="cakeSize"
              value={form.cakeSize}
              onChange={handleChange}
              placeholder={t("order.cakeSizePlaceholder")}
              required={orderType === "custom"}
            />
          </label>
          <label>
            {t("order.budgetRange")}
            <input
              type="text"
              name="budgetRange"
              value={form.budgetRange}
              onChange={handleChange}
              placeholder={t("order.budgetRangePlaceholder")}
              required={orderType === "custom"}
            />
          </label>
        </>
      )}

      {/* Payment Note - only for custom orders or card payment */}
      {(orderType === "custom" || form.paymentMethod === "card") && (
        <p className="payment-note">
          {t("order.paymentNote")}
        </p>
      )}

      <label>
        {t("order.notes")}
        <textarea
          name="notes"
          rows="3"
          value={form.notes}
          onChange={handleChange}
          placeholder={t("order.notesPlaceholder")}
        />
      </label>

      <button
        type="submit"
        className="btn primary full-width"
        disabled={status.type === "loading" || (orderType === "checkout" && cartItems.length === 0)}
      >
        {t("order.reviewOrder")}
      </button>

      {status.message && (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      )}
    </form>
  );
}

export default CheckoutForm;

