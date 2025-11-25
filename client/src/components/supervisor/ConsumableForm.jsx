import { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const initialForm = {
  type: "expense",
  item: "",
  amount: "",
};

function ConsumableForm({ onSubmit }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const today = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    const amount = Number(form.amount);
    const payload = {
      date: today,
      item: form.item,
      expense: form.type === "expense" ? amount : 0,
      profit: form.type === "profit" ? amount : 0,
    };
    const success = await onSubmit(payload);
    setIsSaving(false);
    if (success) {
      setForm(initialForm);
    }
  };

  return (
    <form className="consumable-form" onSubmit={handleSubmit}>
      <label>
        {t("supervisor.expenses.type")}
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">{t("supervisor.expenses.expense")}</option>
          <option value="profit">{t("supervisor.expenses.profit")}</option>
        </select>
      </label>
      <label>
        {t("supervisor.expenses.name")}
        <input
          type="text"
          name="item"
          value={form.item}
          onChange={handleChange}
          placeholder={t("supervisor.expenses.itemPlaceholder")}
          required
        />
      </label>
      <label>
        {t("supervisor.expenses.amount")}
        <input
          type="number"
          step="0.01"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
      </label>
      <div className="consumable-form__date">
        {t("supervisor.expenses.recording")} <strong>{today}</strong>
      </div>
      <button className="btn primary" type="submit">
        {isSaving ? t("supervisor.expenses.saving") : t("supervisor.expenses.addEntry")}
      </button>
    </form>
  );
}

export default ConsumableForm;

