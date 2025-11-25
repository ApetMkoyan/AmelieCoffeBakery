import { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const blankProduct = {
  category: "coffee",
  name: "",
  price: "",
  description: "",
  image: "",
};

function ProductManager({ products = {}, onAddProduct, onEditProduct, onDeleteProduct }) {
  const { t } = useLanguage();
  
  const categories = [
    { value: "coffee", labelKey: "menu.coffee" },
    { value: "cake", labelKey: "menu.cake" },
    { value: "wedding-cakes", labelKey: "menu.wedding" },
    { value: "tama-products", labelKey: "menu.tama" },
  ];
  const [form, setForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [activeCategory, setActiveCategory] = useState("coffee");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: t("supervisor.products.saving") });
    
    if (editingId) {
      const result = await onEditProduct(editingId, form);
      if (result.success) {
        setStatus({ type: "success", message: t("supervisor.products.saved") });
        setForm(blankProduct);
        setEditingId(null);
      } else {
        setStatus({ type: "error", message: result.message || t("supervisor.products.failed") });
      }
    } else {
      const result = await onAddProduct(form);
      if (result.success) {
        setStatus({ type: "success", message: t("supervisor.products.saved") });
        setForm((prev) => ({ ...blankProduct, category: prev.category }));
      } else {
        setStatus({ type: "error", message: result.message || t("supervisor.products.failed") });
      }
    }
  };

  const handleEdit = (product) => {
    setForm({
      category: activeCategory,
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      image: product.image || "",
    });
    setEditingId(product.id);
    setStatus({ type: "idle", message: "" });
  };

  const handleCancel = () => {
    setForm(blankProduct);
    setEditingId(null);
    setStatus({ type: "idle", message: "" });
  };

  const handleDelete = async (productId) => {
    if (window.confirm(t("supervisor.products.delete") + "?")) {
      const result = await onDeleteProduct(productId);
      if (result?.success) {
        setStatus({ type: "success", message: t("supervisor.products.saved") });
      }
    }
  };

  const categoryItems = useMemo(() => {
    return products[activeCategory] || [];
  }, [products, activeCategory]);

  return (
    <div className="product-manager">
      <div className="product-manager__form">
        <h4>{editingId ? t("supervisor.products.edit") : t("supervisor.products.addNew")}</h4>
        <form onSubmit={handleSubmit}>
          <label>
            {t("supervisor.products.category")}
            <select
              name="category"
              value={form.category}
              onChange={(event) => {
                handleChange(event);
                setActiveCategory(event.target.value);
              }}
              disabled={!!editingId}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("supervisor.products.productName")}
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("supervisor.products.price")}
            <input
              type="number"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("supervisor.products.description")}
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("supervisor.products.photoUrl")}
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>
          <div className="form-actions">
            <button className="btn primary" type="submit" disabled={status.type === "loading"}>
              {status.type === "loading" ? t("supervisor.products.saving") : (editingId ? t("supervisor.products.save") : t("supervisor.products.addProduct"))}
            </button>
            {editingId && (
              <button type="button" className="btn ghost" onClick={handleCancel}>
                {t("supervisor.products.cancel")}
              </button>
            )}
          </div>
          {status.message && (
            <p className={`form-status inline ${status.type}`}>{status.message}</p>
          )}
        </form>
      </div>

      <div className="product-manager__list">
        <div className="product-manager__tabs">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={
                activeCategory === cat.value ? "tab tab--active" : "tab"
              }
              onClick={() => {
                setActiveCategory(cat.value);
                handleCancel();
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="product-gallery">
          {categoryItems.length ? (
            categoryItems.map((item) => (
              <article key={item.id || item.name} className="product-gallery__item">
                {item.image && (
                  <img src={item.image} alt={item.name} loading="lazy" />
                )}
                <div>
                  <h5>{item.name}</h5>
                  <p className="price">₾{Number(item.price).toFixed(2)}</p>
                  <p>{item.description}</p>
                  <div className="product-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleEdit(item)}
                    >
                      {t("supervisor.products.edit")}
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      {t("supervisor.products.delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p>{t("supervisor.products.noItems")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductManager;
