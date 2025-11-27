import { useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const formatCurrency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

/**
 * Modal for selecting drink size (300ml or 500ml)
 */
function SizeSelectorModal({ product, onSelect, onClose }) {
  const { t } = useLanguage();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Extract prices from description (works with both English and translated descriptions)
  const getPrices = () => {
    const desc = product.description || "";
    // Match patterns like "300ml (5₾)" or "300мл (5₾)" or "300ml 5₾" etc.
    const match300 = desc.match(/300\s*(?:ml|мл).*?(\d+\.?\d*)\s*₾/i) || desc.match(/300\s*(?:ml|мл).*?\((\d+\.?\d*)\)/i);
    const match500 = desc.match(/500\s*(?:ml|мл).*?(\d+\.?\d*)\s*₾/i) || desc.match(/500\s*(?:ml|мл).*?\((\d+\.?\d*)\)/i);
    
    let price300 = product.price;
    let price500 = product.price;
    
    if (match300) price300 = parseFloat(match300[1]);
    if (match500) price500 = parseFloat(match500[1]);
    
    return { price300, price500 };
  };

  const { price300, price500 } = getPrices();

  const handleSizeSelect = (size, price) => {
    onSelect({
      ...product,
      size,
      price: price,
      name: `${product.name} (${size})`,
    });
    onClose();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal size-selector-modal" ref={modalRef}>
        <div className="modal-header">
          <h3>{product.name}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-subtitle">{t("products.selectSize")}</p>
          <div className="size-options">
            <button
              type="button"
              className="size-option"
              onClick={() => handleSizeSelect("300ml", price300)}
            >
              <span className="size-label">{t("products.size300ml")}</span>
              <span className="size-price">{formatCurrency(price300)}</span>
            </button>
            <button
              type="button"
              className="size-option"
              onClick={() => handleSizeSelect("500ml", price500)}
            >
              <span className="size-label">{t("products.size500ml")}</span>
              <span className="size-price">{formatCurrency(price500)}</span>
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
          >
            {t("products.cancel")}
          </button>
        </div>
      </div>
    </>
  );
}

export default SizeSelectorModal;

