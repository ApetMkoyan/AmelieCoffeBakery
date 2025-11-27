import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const initialForm = {
  email: "",
  passcode: "",
};

function SupervisorLogin({ onLogin }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: t("supervisor.login.signIn") });
    const result = await onLogin(form);
    if (result.success) {
      setStatus({ type: "success", message: t("supervisor.login.welcome") });
      setForm(initialForm);
    } else {
      setStatus({ type: "error", message: result.message || t("supervisor.login.failed") });
    }
  };

  return (
    <form className="supervisor-login" onSubmit={handleSubmit}>
      <div>
        <h3>{t("supervisor.login.title")}</h3>
        <p>{t("supervisor.login.subtitle")}</p>
      </div>
      <label>
        {t("supervisor.login.email")}
        <input
          type="text"
          name="email"
          placeholder="Amelie123"
          value={form.email}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        {t("supervisor.login.passcode")}
        <input
          type="password"
          name="passcode"
          value={form.passcode}
          onChange={handleChange}
          required
        />
      </label>
      <button type="submit" className="btn primary">
        {status.type === "loading" ? t("supervisor.login.signIn") : t("supervisor.login.logIn")}
      </button>
      {status.message && (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      )}
    </form>
  );
}

export default SupervisorLogin;

