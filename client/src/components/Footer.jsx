import { useLanguage } from "../contexts/LanguageContext.jsx";

function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <p>{t("footer.copyright").replace("{year}", year)}</p>
    </footer>
  );
}

export default Footer;

