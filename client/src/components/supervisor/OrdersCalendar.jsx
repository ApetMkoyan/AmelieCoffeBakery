import { useLanguage } from "../../contexts/LanguageContext.jsx";

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const normalizeDate = (order) => {
  const source = order.eventDate || order.createdAt;
  return source ? new Date(source).toISOString().split("T")[0] : "unscheduled";
};

function OrdersCalendar({ orders, loading, onUpdateStatus, onDeleteOrder }) {
  const { t } = useLanguage();
  
  const statuses = [
    { value: "pending", labelKey: "supervisor.orders.statusPending" },
    { value: "confirmed", labelKey: "supervisor.orders.statusConfirmed" },
    { value: "completed", labelKey: "supervisor.orders.statusCompleted" },
  ];
const grouped = orders.reduce((acc, order) => {
    const key = normalizeDate(order);
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

const sortedDates = Object.keys(grouped).sort((a, b) => {
  if (a === "unscheduled") return 1;
  if (b === "unscheduled") return -1;
  return new Date(a) - new Date(b);
});

  if (loading) {
    return <p>{t("supervisor.orders.loadingOrders")}</p>;
  }

  if (!orders.length) {
    return <p>{t("supervisor.orders.noOrders")}</p>;
  }

  return (
    <div className="calendar-table">
      <table>
        <thead>
          <tr>
            <th>{t("supervisor.orders.eventDate")}</th>
            <th>{t("supervisor.orders.customer")}</th>
            <th>{t("supervisor.orders.itemsDetails")}</th>
            <th>{t("supervisor.orders.contact")}</th>
            <th>{t("supervisor.orders.status")}</th>
            <th>{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedDates.map((date) =>
            grouped[date].map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>
                    {date === "unscheduled"
                      ? t("supervisor.orders.notScheduled")
                      : formatDate(date)}
                  </strong>
                </td>
                <td>
                  {order.firstName} {order.lastName}
                </td>
                <td>
                  {order.items?.length ? (
                    <ul className="order-items">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.id}`}>
                          {item.quantity}× {item.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{order.details}</p>
                  )}
                  {order.paymentMethod && (
                    <small>{t("supervisor.orders.payment")}: {order.paymentMethod}</small>
                  )}
                  {order.notes && <small>{t("order.notes")}: {order.notes}</small>}
                </td>
                <td>
                  <p>{order.phone}</p>
                  {order.email && <small>{order.email}</small>}
                </td>
                <td>
                  <select
                    value={order.status || "pending"}
                    onChange={(event) =>
                      onUpdateStatus(order.id, event.target.value)
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {t(status.labelKey)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="table-actions">
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => onDeleteOrder(order.id)}
                  >
                    {t("common.delete")}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersCalendar;

