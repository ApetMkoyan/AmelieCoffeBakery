import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const languages = [
  { code: "en", label: "EN", flag: "🌐" },
  { code: "ka", label: "KA", flag: "🇬🇪" },
  { code: "hy", label: "HY", flag: "🇦🇲" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
];

function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  // Закрыть при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-globe"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Выбрать язык"
      >
        🌐
      </button>
      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${language === lang.code ? "active" : ""}`}
              onClick={() => handleLanguageChange(lang.code)}
              type="button"
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-label">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;

