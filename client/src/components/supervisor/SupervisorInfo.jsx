import { useLanguage } from "../../contexts/LanguageContext.jsx";

function SupervisorInfo({ businessName, profile, onLogout }) {
  const { t } = useLanguage();
  return (
    <div className="supervisor-info">
      <div>
        <p className="eyebrow">{t("supervisor.title")}</p>
        <h3>{businessName}</h3>
        <p>
          {t("supervisor.info.loggedIn")} <strong>{profile?.email || "Amelie Team"}</strong>
        </p>
      </div>
      <button className="btn ghost" type="button" onClick={onLogout}>
        {t("supervisor.info.logout")}
      </button>
    </div>
  );
}

export default SupervisorInfo;

