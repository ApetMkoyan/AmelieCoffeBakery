import { useLanguage } from "../contexts/LanguageContext.jsx";

const guestLinks = [
  { id: "home", href: "#top", labelKey: "nav.home" },
  { id: "menu", href: "#menu", labelKey: "nav.menu" },
  { id: "custom-order", href: "#custom-order", labelKey: "nav.customOrder" },
  { id: "supervisor", href: "#supervisor", labelKey: "nav.supervisor" },
];

const supervisorLinks = [
  { id: "home", href: "#top", labelKey: "nav.backToMenu" },
];

function TopNav({ currentView = "guest", onNavigate }) {
  const { t } = useLanguage();
  const links = currentView === "supervisor" ? supervisorLinks : guestLinks;

  const handleClick = (event, id, href) => {
    if (!onNavigate) return;
    const handled = onNavigate(id, href);
    if (handled) {
      event.preventDefault();
    }
  };

  return (
    <nav className="top-nav">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          onClick={(event) => handleClick(event, link.id, link.href)}
        >
          {t(link.labelKey)}
        </a>
      ))}
    </nav>
  );
}

export default TopNav;

