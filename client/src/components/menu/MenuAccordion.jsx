import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ProductCategoryCard from "../products/ProductCategoryCard.jsx";
import DrinksCategoryCard from "../products/DrinksCategoryCard.jsx";
import { scrollToElementById } from "../../utils/scroll.js";

const sections = [
  { id: "drinks", labelKey: "menu.drinks" },
  { id: "cake", labelKey: "menu.cakeTama" },
  { id: "wedding-cakes", labelKey: "menu.weddingCakes" },
  { id: "custom-order", labelKey: "menu.createOrder" },
];

function MenuAccordion({
  products,
  descriptions,
  onAddToCart,
  renderCustomSection,
}) {
  const { t } = useLanguage();

  const handleSummaryClick = (sectionId, e) => {
    if (sectionId === "custom-order") {
      e.preventDefault();
      scrollToElementById("custom-order", 140);
    }
  };

  return (
    <div className="menu-accordion">
      {sections.map((section, index) => {
        const isCustom = section.id === "custom-order";
        const categoryItems = (() => {
          if (isCustom) return [];
          if (section.id === "cake") {
            return [
              ...(products.cake || []),
              ...(products["tama-products"] || []),
            ];
          }
          return products[section.id] || [];
        })();

        return (
          <details
            key={section.id}
            id={section.id}
            open={index === 0}
          >
            <summary onClick={(e) => handleSummaryClick(section.id, e)}>
              {t(section.labelKey)}
            </summary>
            <div className="accordion-panel">
              {isCustom ? (
                renderCustomSection()
              ) : categoryItems.length ? (
                section.id === "drinks" ? (
                  <DrinksCategoryCard
                    category={section.id}
                    description={
                      descriptions[section.id] || t("menu.descriptionFallback")
                    }
                    items={categoryItems}
                    onAddToCart={onAddToCart}
                  />
                ) : (
                  <ProductCategoryCard
                    category={section.id}
                    description={
                      descriptions[section.id] || t("menu.descriptionFallback")
                    }
                    items={categoryItems}
                    onAddToCart={onAddToCart}
                  />
                )
              ) : (
                <p>{t("menu.updatingMenu")}</p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default MenuAccordion;

