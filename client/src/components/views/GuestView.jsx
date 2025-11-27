import { useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import Hero from "../Hero.jsx";
import ProductMenuBar from "../ProductMenuBar.jsx";
import SectionHeading from "../SectionHeading.jsx";
import MenuAccordion from "../menu/MenuAccordion.jsx";
import CartPanel from "../cart/CartPanel.jsx";
import CheckoutForm from "../OrderSection.jsx";
import { scrollToElementById } from "../../utils/scroll.js";

/**
 * Guest view component - main customer-facing interface
 */
function GuestView({
  products,
  productsLoading,
  productsError,
  cartItems,
  cartItemCount,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  onOrderSubmit,
  orderStatus,
  scrollToOrderForm,
}) {
  const { t, language } = useLanguage();

  // Memoize catalog content with descriptions
  const catalogContent = useMemo(() => {
    if (productsLoading) {
      return { isLoading: true, products: {}, descriptions: {} };
    }
    if (productsError) {
      return { error: productsError, products: {}, descriptions: {} };
    }

    const descriptions = {
      drinks: t("categories.drinks"),
      "baked-goods": t("categories.baked-goods"),
      cake: t("categories.cake"),
      "wedding-cakes": t("categories.wedding-cakes"),
      "tama-products": t("categories.tama-products"),
    };

    return {
      isLoading: false,
      products,
      descriptions,
    };
  }, [products, productsLoading, productsError, language, t]);

  return (
    <>
      <Hero />
      <ProductMenuBar />
      <main>
        <section id="menu" className="section">
          <SectionHeading
            title={t("menu.title")}
            subtitle={t("menu.subtitle")}
          />
          {catalogContent.isLoading ? (
            <p>{t("menu.loadingMenu")}</p>
          ) : catalogContent.error ? (
            <p>{catalogContent.error}</p>
          ) : (
            <MenuAccordion
              products={catalogContent.products}
              descriptions={catalogContent.descriptions}
              onAddToCart={addToCart}
              renderCustomSection={() => (
                <div className="custom-order-preview">
                  <p>{t("menu.customOrderPreview")}</p>
                  <div className="preview-actions">
                    <a
                      className="btn primary"
                      href="#cart"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToElementById("cart", 140);
                      }}
                    >
                      {t("menu.viewCart")}
                    </a>
                    <a
                      className="btn ghost"
                      href="#custom-order"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToOrderForm();
                      }}
                    >
                      {t("menu.customOrderForm")}
                    </a>
                  </div>
                </div>
              )}
            />
          )}
        </section>

        <section id="custom-order" className="section order-section">
          <SectionHeading
            title={t("order.title")}
            subtitle={t("order.subtitle")}
          />
          <CheckoutForm
            cartItems={cartItems}
            status={orderStatus}
            onSubmit={onOrderSubmit}
          />
        </section>

        <section id="cart" className="section cart-section">
          <SectionHeading
            title={t("cart.title")}
            subtitle={t("cart.subtitle")}
          />
          <CartPanel
            items={cartItems}
            onIncrement={(id) => updateCartQuantity(id, 1)}
            onDecrement={(id) => updateCartQuantity(id, -1)}
            onRemove={removeFromCart}
            onOrderClick={scrollToOrderForm}
          />
        </section>
      </main>
    </>
  );
}

export default GuestView;

