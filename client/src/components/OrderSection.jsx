import { useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

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

function CheckoutForm({ cartItems, status, onSubmit, showCustomFields }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
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
    if (!onSubmit) {
      console.error("onSubmit handler is missing");
      return;
    }
    try {
      const success = await onSubmit(form);
      if (success) {
        setForm(initialForm);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form className="card checkout-form" onSubmit={handleSubmit}>
      <header>
        <h3>{t("order.title")}</h3>
        <p>
          {cartItems.length
            ? `${t("cart.total")}: ₾${cartTotal.toFixed(2)}`
            : t("cart.empty")}
        </p>
      </header>

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

      {showCustomFields && (
        <>
          <label>
            {t("order.cakeSize")}
            <input
              type="text"
              name="cakeSize"
              value={form.cakeSize}
              onChange={handleChange}
              placeholder={t("order.cakeSizePlaceholder")}
              required={showCustomFields}
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
              required={showCustomFields}
            />
          </label>
        </>
      )}

      {(showCustomFields || form.paymentMethod === "card") && (
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
        disabled={status.type === "loading"}
      >
        {status.type === "loading" ? t("order.submitting") : t("order.placeOrder")}
      </button>

      {status.message && (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      )}
    </form>
  );
}

export default CheckoutForm;

