import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function ProductCategoryCard({ category, description, items, onAddToCart }) {
  const { t } = useLanguage();
  
  const categoryLabels = {
    coffee: "menu.coffee",
    cake: "menu.cake",
    "wedding-cakes": "menu.wedding",
    "tama-products": "menu.tama",
  };
  
  return (
    <article className="card category-card" data-category={category}>
      <div className="category-header">
        <p className="category-chip">{t(categoryLabels[category] || category)}</p>
        <p className="category-description">{description}</p>
      </div>

      <div className="product-items">
        {items.map((item) => (
          <ProductCardEntry
            key={item.id || item.name}
            item={item}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </article>
  );
}

function ProductCardEntry({ item, onAddToCart }) {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const cardRef = useRef(null);

  // Close description when clicking outside
  useEffect(() => {
    if (!showInfo) return;

    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInfo]);

  return (
    <>
      {showInfo && <div className="description-backdrop" onClick={() => setShowInfo(false)} />}
      <div className={`product-card-entry ${showInfo ? "info-open" : ""}`} ref={cardRef}>
        {item.image && (
          <div className="product-image">
            <img src={item.image} alt={item.name} loading="lazy" />
          </div>
        )}
        <div className="product-card__body">
          <div className="product-card__header">
            <h3>{item.name}</h3>
            <p className="price">{formatCurrency(item.price)}</p>
          </div>
          {showInfo && <p className="description">{item.description}</p>}
          <div className="product-card__actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => onAddToCart?.(item)}
            >
              {t("products.addToCart")}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setShowInfo((prev) => !prev)}
            >
              {showInfo ? t("products.hideInfo") : t("products.info")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductCategoryCard;

