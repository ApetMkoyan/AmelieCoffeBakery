import { useLanguage } from "../../contexts/LanguageContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function totalsByDate(rows) {
  return rows.reduce((acc, row) => {
    const key = row.date;
    if (!acc[key]) {
      acc[key] = { expense: 0, profit: 0 };
    }
    acc[key].expense += Number(row.expense);
    acc[key].profit += Number(row.profit);
    return acc;
  }, {});
}

function ConsumableTable({ consumables, state, onEdit, onDelete }) {
  const { t } = useLanguage();
  const dailyTotals = totalsByDate(consumables);

  const monthlyExpense = consumables.reduce(
    (sum, row) => sum + Number(row.expense),
    0
  );
  const monthlyProfit = consumables.reduce(
    (sum, row) => sum + Number(row.profit),
    0
  );

  const handleEdit = (row) => {
    const nextItem = window.prompt(t("supervisor.expenses.updateName"), row.item);
    if (nextItem === null) return;
    const currentAmount = row.expense > 0 ? row.expense : row.profit;
    const nextAmount = window.prompt(
      t("supervisor.expenses.updateAmount"),
      Number(currentAmount).toString()
    );
    if (nextAmount === null || Number.isNaN(Number(nextAmount))) return;
    const payload = { item: nextItem };
    if (row.expense > 0) {
      payload.expense = Number(nextAmount);
    } else {
      payload.profit = Number(nextAmount);
    }
    onEdit?.(row.id, payload);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(
        t("supervisor.expenses.deleteConfirm", { item: row.item })
      )
    ) {
      onDelete?.(row.id);
    }
  };

  return (
    <div className="table-wrapper">
      {state.error && <p className="form-status error">{state.error}</p>}
      <table>
        <thead>
          <tr>
            <th>{t("supervisor.expenses.date")}</th>
            <th>{t("supervisor.expenses.expenseName")}</th>
            <th>{t("supervisor.expenses.expense")} ({t("common.currency")})</th>
            <th>{t("supervisor.expenses.dayTotal")}</th>
            <th>{t("supervisor.expenses.dayProfit")}</th>
            <th>{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {state.loading ? (
            <tr>
              <td colSpan="6">{t("supervisor.expenses.loading")}</td>
            </tr>
          ) : consumables.length ? (
            consumables.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td>{row.item}</td>
                <td>{currency(row.expense)}</td>
                <td>{currency(dailyTotals[row.date].expense)}</td>
                <td>{currency(dailyTotals[row.date].profit)}</td>
                <td className="table-actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => handleEdit(row)}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => handleDelete(row)}
                  >
                    {t("common.delete")}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">{t("supervisor.expenses.noEntries")}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2">{t("supervisor.expenses.monthlyTotals")}</td>
            <td>{currency(monthlyExpense)}</td>
            <td />
            <td>{currency(monthlyProfit)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default ConsumableTable;

