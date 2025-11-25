import { useLanguage } from "../../contexts/LanguageContext.jsx";
import OrdersCalendar from "./OrdersCalendar.jsx";

function OrdersPanel({ orders, state, onUpdateOrderStatus, onDeleteOrder }) {
  const { t } = useLanguage();
  
  const statusLabels = {
    pending: "supervisor.orders.statusPending",
    confirmed: "supervisor.orders.statusConfirmed",
    completed: "supervisor.orders.statusCompleted",
  };
  
  const metrics = Object.keys(statusLabels).reduce(
    (acc, status) => ({
      ...acc,
      [status]: orders.filter((order) => order.status === status).length,
    }),
    {}
  );

  return (
    <div className="orders-panel">
      <div className="orders-panel__metrics">
        {Object.entries(statusLabels).map(([status, labelKey]) => (
          <div key={status} className="orders-chip">
            <p>{t(labelKey)}</p>
            <strong>{metrics[status] || 0}</strong>
          </div>
        ))}
        <div className="orders-chip">
          <p>{t("supervisor.orders.total")}</p>
          <strong>{orders.length}</strong>
        </div>
      </div>

      {state.error && <p className="form-status error">{state.error}</p>}

      <OrdersCalendar
        orders={orders}
        loading={state.loading}
        onUpdateStatus={onUpdateOrderStatus}
        onDeleteOrder={onDeleteOrder}
      />
    </div>
  );
}

export default OrdersPanel;

