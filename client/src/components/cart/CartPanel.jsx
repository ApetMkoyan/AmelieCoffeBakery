import { useLanguage } from "../../contexts/LanguageContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function CartPanel({ items, onIncrement, onDecrement, onRemove, onOrderClick }) {
  const { t } = useLanguage();
  const total = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.price),
    0
  );

  return (
    <section className="card cart-panel">
      <header>
        <h3>{t("cart.yourCart")}</h3>
        <p>{items.length ? `${items.length} ${t("cart.items")}` : t("cart.empty")}</p>
      </header>

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
        <p>{t("cart.addFavorites")}</p>
      )}

      <footer className="cart-summary">
        <div className="cart-total-row">
          <p>{t("cart.total")}</p>
          <strong>{currency(total)}</strong>
        </div>
        {items.length > 0 && onOrderClick && (
          <button
            type="button"
            className="btn primary full-width cart-order-button"
            onClick={onOrderClick}
          >
            {t("cart.orderNow")}
          </button>
        )}
      </footer>
    </section>
  );
}

export default CartPanel;

