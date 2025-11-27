import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import SizeSelectorModal from "./SizeSelectorModal.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function ProductCategoryCard({ category, description, items, onAddToCart }) {
  const { t } = useLanguage();
  
  const categoryLabels = {
    coffee: "menu.coffee",
    "baked-goods": "menu.bakedGoods",
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

// Helper function to get translated description
const getTranslatedDescription = (item, t) => {
  if (!item.id) return item.description || "";
  const translationKey = `productDescriptions.${item.id}`;
  const translated = t(translationKey);
  // If translation exists (not the key itself), use it
  if (translated && translated !== translationKey) {
    return translated;
  }
  return item.description || "";
};

// Check if product has size options (300ml and 500ml)
const hasSizeOptions = (item) => {
  const desc = item.description || "";
  return desc.includes("300ml") && desc.includes("500ml");
};

function ProductCardEntry({ item, onAddToCart }) {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const cardRef = useRef(null);

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

  const handleAddToCart = () => {
    if (hasSizeOptions(item)) {
      setShowSizeModal(true);
    } else {
      onAddToCart?.(item);
    }
  };

  const translatedDescription = getTranslatedDescription(item, t);

  return (
    <>
      {showInfo && <div className="description-backdrop" onClick={() => setShowInfo(false)} />}
      {showSizeModal && (
        <SizeSelectorModal
          product={item}
          onSelect={onAddToCart}
          onClose={() => setShowSizeModal(false)}
        />
      )}
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
          {showInfo && <p className="description">{translatedDescription}</p>}
          <div className="product-card__actions">
            <button
              type="button"
              className="btn primary"
              onClick={handleAddToCart}
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

