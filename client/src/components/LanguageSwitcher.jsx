import { useLanguage } from "../contexts/LanguageContext.jsx";

const languages = [
  { code: "en", label: "EN" },
  { code: "ka", label: "KA" },
  { code: "hy", label: "HY" },
  { code: "ru", label: "RU" },
];

function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <button
          key={lang.code}
          className={`lang-button ${language === lang.code ? "active" : ""}`}
          onClick={() => changeLanguage(lang.code)}
          type="button"
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;

