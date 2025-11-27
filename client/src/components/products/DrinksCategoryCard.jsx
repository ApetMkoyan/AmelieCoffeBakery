import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import SizeSelectorModal from "./SizeSelectorModal.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

// Группировка напитков по категориям
const categorizeDrinks = (drinks) => {
  const categories = {
    coffee: [],
    lemonades: [],
    tea: [],
    milkshakes: [],
    fresh: [],
  };

  drinks.forEach((drink) => {
    const name = drink.name.toLowerCase();
    const id = drink.id.toLowerCase();
    
    // Кофе
    if (name.includes("cappuccino") || name.includes("latte") || name.includes("americano") || 
        name.includes("kinder coffee") || name.includes("bounty coffee") || name.includes("nutella coffee") ||
        name.includes("bubble coffee") || id.includes("coffee")) {
      categories.coffee.push(drink);
    }
    // Лимонады
    else if (name.includes("berry mix") || name.includes("citrus mix") || name.includes("lavanda") || 
             (name.includes("mango-marakuja") && !name.includes("fresh") && !name.includes("tea")) ||
             name.includes("mojito")) {
      categories.lemonades.push(drink);
    }
    // Чай
    else if (name.includes("tea") || name.includes("cherry") || name.includes("garden") || 
             name.includes("ginger") || name.includes("pomegranate") || name.includes("bubble tea")) {
      categories.tea.push(drink);
    }
    // Милкшейки
    else if (name.includes("milkshake") || name.includes("hot chocolate")) {
      categories.milkshakes.push(drink);
    }
    // Фреш
    else if (name.includes("fresh")) {
      categories.fresh.push(drink);
    }
  });

  return categories;
};

function DrinksCategoryCard({ category, description, items, onAddToCart }) {
  const { t } = useLanguage();
  const categorizedDrinks = categorizeDrinks(items);

  const categoryLabels = {
    coffee: "menu.coffee",
    lemonades: "menu.lemonades",
    tea: "menu.tea",
    milkshakes: "menu.milkshakes",
    fresh: "menu.fresh",
  };

  const categoryOrder = ["coffee", "lemonades", "tea", "milkshakes", "fresh"];

  return (
    <article className="card category-card drinks-category-card" data-category={category}>
      <div className="category-header">
        <p className="category-description">{description}</p>
      </div>

      <div className="drinks-categories-container">
        {categoryOrder.map((catKey) => {
          const categoryItems = categorizedDrinks[catKey];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <div key={catKey} className="drinks-subcategory">
              <h4 className="drinks-subcategory-title">{t(categoryLabels[catKey] || catKey)}</h4>
              <div className="product-items">
                {categoryItems.map((item) => (
                  <ProductCardEntry
                    key={item.id || item.name}
                    item={item}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
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

  // Close description when clicking outside
  useEffect(() => {
    if (!showInfo) return;

    // Prevent body scroll when description is open on mobile
    const isMobile = window.innerWidth <= 640;
    if (isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }

    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };

    // Use touchstart for mobile for better performance
    const eventType = window.innerWidth <= 640 ? "touchstart" : "mousedown";
    const options = window.innerWidth <= 640 ? { passive: true } : false;
    
    document.addEventListener(eventType, handleClickOutside, options);
    return () => document.removeEventListener(eventType, handleClickOutside, options);
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

export default DrinksCategoryCard;

