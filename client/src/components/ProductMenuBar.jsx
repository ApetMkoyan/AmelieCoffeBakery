import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const menuSections = [
  { id: "coffee", labelKey: "menu.coffee" },
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
    // Toggle active state: if clicking the same section, deactivate it
    if (activeSection === sectionId) {
      setActiveSection(null);
      return;
    }
    
    // Set active section for visual feedback
    setActiveSection(sectionId);
    
    // Find the details element (accordion) for this section
    let detailsElement = document.querySelector(`details#${sectionId}`);
    
    // If not found, try to find it in the menu section
    if (!detailsElement) {
      detailsElement = document.querySelector(`details[id="${sectionId}"]`);
    }
    
    if (detailsElement) {
      // Open the accordion if it's closed
      if (!detailsElement.open) {
        detailsElement.open = true;
        // Wait for the accordion to expand before scrolling
        // This ensures the target position is accurate
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              scrollToElement(detailsElement);
            }, 200);
          });
        });
      } else {
        // If already open, scroll smoothly immediately
        scrollToElement(detailsElement);
      }
    } else {
      // Fallback: try to find any element with this ID
      const element = document.getElementById(sectionId);
      if (element) {
        scrollToElement(element);
      }
    }
  };

  const scrollToElement = (element) => {
    // Calculate proper offset accounting for fixed headers
    const headerHeight = 60; // TopNav height
    const menuBarHeight = 60; // ProductMenuBar height
    const totalOffset = headerHeight + menuBarHeight + 20; // Extra padding for visual spacing
    
    // Get the element's position relative to the document
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const scrollTarget = absoluteElementTop - totalOffset;
    
    // Use smooth scrolling - browser handles easing automatically
    window.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: "smooth",
    });
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

