import { useLanguage } from "../contexts/LanguageContext.jsx";
import { scrollToElementById } from "../utils/scroll.js";

const BUSINESS_NAME = "Amelie Coffee & Bakery";

function Hero() {
  const { t } = useLanguage();
  return (
    <header className="hero" id="top">
      <div className="hero-content">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="business-name">{BUSINESS_NAME}</h1>
        <p className="lead">{t("hero.lead")}</p>
        <div className="hero-actions">
          <a className="btn primary" href="#menu">
            {t("hero.browseMenu")}
          </a>
          <a 
            className="btn ghost" 
            href="#custom-order"
            onClick={(e) => {
              e.preventDefault();
              scrollToElementById("custom-order", 140);
            }}
          >
            {t("hero.customOrder")}
          </a>
        </div>
      </div>
    </header>
  );
}

export default Hero;

