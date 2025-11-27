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
    const trimmedCredentials = {
      email: form.email.trim(),
      passcode: form.passcode.trim(),
    };
    const result = await onLogin(trimmedCredentials);
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
          value={form.email}
          onChange={handleChange}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="text"
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
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="text"
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

