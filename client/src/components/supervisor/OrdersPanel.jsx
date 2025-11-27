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

      {state.error && (
        <div className="form-status error" style={{ 
          padding: "1rem", 
          borderRadius: "12px", 
          background: "rgba(192, 57, 43, 0.1)",
          border: "1px solid rgba(192, 57, 43, 0.3)",
          marginBottom: "1rem"
        }}>
          <strong>Error:</strong> {state.error}
        </div>
      )}

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

