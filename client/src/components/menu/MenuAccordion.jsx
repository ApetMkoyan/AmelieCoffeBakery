import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ProductCategoryCard from "../products/ProductCategoryCard.jsx";
import DrinksCategoryCard from "../products/DrinksCategoryCard.jsx";

const sections = [
  { id: "drinks", labelKey: "menu.drinks" },
  { id: "baked-goods", labelKey: "menu.bakedGoods" },
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

  return (
    <div className="menu-accordion">
      {sections.map((section) => {
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
          <section
            key={section.id}
            id={section.id}
            className="menu-section"
          >
            <h2 className="menu-section-title">{t(section.labelKey)}</h2>
            <div className="menu-section-content">
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
          </section>
        );
      })}
    </div>
  );
}

export default MenuAccordion;

