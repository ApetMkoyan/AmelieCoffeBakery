import React, { useMemo, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
  }).format(Number(value || 0));

function ExpensesReport({ consumables, state, onEditEntry, onDeleteEntry }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const filteredData = useMemo(() => {
    if (!consumables.length) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return consumables.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
  }, [consumables, startDate, endDate]);

  const dailyTotals = useMemo(() => {
    return filteredData.reduce((acc, row) => {
      const key = row.date;
      if (!acc[key]) {
        acc[key] = { expense: 0, profit: 0, items: [] };
      }
      acc[key].expense += Number(row.expense);
      acc[key].profit += Number(row.profit);
      acc[key].items.push(row);
      return acc;
    }, {});
  }, [filteredData]);

  const periodTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.expense += Number(row.expense);
        acc.profit += Number(row.profit);
        return acc;
      },
      { expense: 0, profit: 0 }
    );
  }, [filteredData]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    let start, end;
    switch (newPeriod) {
      case "today":
        start = end = today;
        break;
      case "week":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = today;
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "custom":
        return;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
    }
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const netProfit = periodTotals.profit - periodTotals.expense;

  const handleEdit = (row) => {
    const nextItem = window.prompt(t("supervisor.expenses.updateName"), row.item);
    if (nextItem === null) return;
    const currentAmount = row.expense > 0 ? row.expense : row.profit;
    const nextAmount = window.prompt(
      t("supervisor.expenses.updateAmount"),
      Number(currentAmount).toString()
    );
    if (nextAmount === null || Number.isNaN(Number(nextAmount))) return;
    const payload = { 
      item: nextItem,
      date: row.date
    };
    if (row.expense > 0) {
      payload.expense = Number(nextAmount);
      payload.profit = 0;
    } else {
      payload.profit = Number(nextAmount);
      
      payload.expense = 0;
    }
    onEditEntry?.(row.id, payload);
  };

  const handleDelete = (row) => {
    if (
      window.confirm(
        t("supervisor.expenses.deleteConfirm", { item: row.item })
      )
    ) {
      onDeleteEntry?.(row.id);
    }
  };

  return (
    <div className="expenses-report">
      <div className="expenses-report__controls">
        <div className="period-selector">
          <label>{t("supervisor.report.period")}</label>
          <div className="period-buttons">
            <button
              type="button"
              className={period === "today" ? "btn primary" : "btn ghost"}
              onClick={() => handlePeriodChange("today")}
            >
              {t("supervisor.report.today")}
            </button>
            <button
              type="button"
              className={period === "week" ? "btn primary" : "btn ghost"}
              onClick={() => handlePeriodChange("week")}
            >
              {t("supervisor.report.week")}
            </button>
            <button
              type="button"
              className={period === "month" ? "btn primary" : "btn ghost"}
              onClick={() => handlePeriodChange("month")}
            >
              {t("supervisor.report.month")}
            </button>
            <button
              type="button"
              className={period === "custom" ? "btn primary" : "btn ghost"}
              onClick={() => handlePeriodChange("custom")}
            >
              {t("supervisor.report.custom")}
            </button>
          </div>
        </div>

        {period === "custom" && (
          <div className="date-range">
            <label>
              {t("supervisor.report.startDate")}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              {t("supervisor.report.endDate")}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="expenses-report__summary">
        <div className="summary-card">
          <h4>{t("supervisor.report.totalExpenses")}</h4>
          <p className="summary-value expense">{currency(periodTotals.expense)}</p>
        </div>
        <div className="summary-card">
          <h4>{t("supervisor.report.totalProfit")}</h4>
          <p className="summary-value profit">{currency(periodTotals.profit)}</p>
        </div>
        <div className="summary-card">
          <h4>{t("supervisor.report.netProfit")}</h4>
          <p className={`summary-value ${netProfit >= 0 ? "profit" : "expense"}`}>
            {currency(netProfit)}
          </p>
        </div>
      </div>

      <div className="expenses-report__table">
        {state.error && <p className="form-status error">{state.error}</p>}
        {state.loading ? (
          <p>{t("supervisor.report.loading")}</p>
        ) : filteredData.length ? (
          <table>
            <thead>
              <tr>
                <th>{t("supervisor.report.date")}</th>
                <th>{t("supervisor.report.item")}</th>
                <th>{t("supervisor.report.expense")}</th>
                <th>{t("supervisor.report.profit")}</th>
                <th>{t("supervisor.report.dayTotal")}</th>
                <th>{t("supervisor.report.dayProfit")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dailyTotals)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, totals]) => (
                  <React.Fragment key={date}>
                    {totals.items.map((row, idx) => (
                      <tr key={row.id || `${date}-${idx}`}>
                        {idx === 0 && (
                          <td rowSpan={totals.items.length}>{date}</td>
                        )}
                        <td>{row.item}</td>
                        <td>{currency(row.expense)}</td>
                        <td>{currency(row.profit)}</td>
                        {idx === 0 && (
                          <>
                            <td rowSpan={totals.items.length}>
                              {currency(totals.expense)}
                            </td>
                            <td rowSpan={totals.items.length}>
                              {currency(totals.profit)}
                            </td>
                          </>
                        )}
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
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        ) : (
          <p>{t("supervisor.report.noData")}</p>
        )}
      </div>
    </div>
  );
}

export default ExpensesReport;

