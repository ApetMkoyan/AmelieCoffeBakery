import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { scrollToElementById } from "../utils/scroll.js";

const menuSections = [
  { id: "drinks", labelKey: "menu.drinks" },
  { id: "baked-goods", labelKey: "menu.bakedGoods" },
  { id: "cake", labelKey: "menu.cake" },
  { id: "wedding-cakes", labelKey: "menu.wedding" },
  { id: "custom-order", labelKey: "menu.custom" },
];

function ProductMenuBar() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(null);

  // Clear active state when user scrolls away from menu sections
  useEffect(() => {
    let scrollTimeout;
    let isScrolling = false;
    
    const handleScroll = () => {
      if (!activeSection) return; // Only track if there's an active section
      
      isScrolling = true;
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        if (isScrolling) {
          // Check if we've scrolled away from the active section
          const activeElement = document.querySelector(`details#${activeSection}`);
          if (activeElement) {
            const rect = activeElement.getBoundingClientRect();
            const headerOffset = 180;
            
            // If the active section is not in view, clear active state
            if (rect.top > headerOffset + 100 || rect.bottom < headerOffset) {
              setActiveSection(null);
            }
          }
        }
        isScrolling = false;
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [activeSection]);

  const handleClick = (sectionId) => {
    // Special handling for custom-order: scroll directly to order form
    if (sectionId === "custom-order") {
      setActiveSection(sectionId);
      scrollToElementById("custom-order", 140);
      return;
    }
    
    // Toggle active state: if clicking the same section, deactivate it
    if (activeSection === sectionId) {
      setActiveSection(null);
      return;
    }
    
    // Set active section for visual feedback
    setActiveSection(sectionId);
    
    // Scroll to the section
    scrollToElementById(sectionId, 140);
  };

  return (
    <nav className="product-menu-bar">
      {menuSections.map((section) => (
        <button
          key={section.id}
          className={`product-menu-item ${activeSection === section.id ? "active" : ""}`}
          onClick={() => handleClick(section.id)}
        >
          {t(section.labelKey)}
        </button>
      ))}
    </nav>
  );
}

export default ProductMenuBar;

