import ConsumableForm from "./ConsumableForm.jsx";
import ExpensesReport from "./ExpensesReport.jsx";
import SupervisorInfo from "./SupervisorInfo.jsx";
import ProductManager from "./ProductManager.jsx";
import OrdersPanel from "./OrdersPanel.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function SupervisorDashboard({
  businessName,
  profile,
  products,
  consumables,
  consumableState,
  orders,
  ordersState,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onDeleteOrder,
  onLogout,
}) {
  const { t } = useLanguage();
  
  const confirmAndDeleteOrder = (orderId) => {
    if (window.confirm(t("supervisor.orders.deleteConfirm"))) {
      onDeleteOrder(orderId);
    }
  };

  return (
    <div className="supervisor-dashboard">
      <SupervisorInfo
        businessName={businessName}
        profile={profile}
        onLogout={onLogout}
      />

      <div className="supervisor-panels">
        <details open>
          <summary>{t("supervisor.panels.productStudio")}</summary>
          <div className="panel-content">
            <ProductManager
              products={products}
              onAddProduct={onAddProduct}
              onEditProduct={onEditProduct}
              onDeleteProduct={onDeleteProduct}
            />
          </div>
        </details>

        <details>
          <summary>{t("supervisor.panels.expensesProfit")}</summary>
          <div className="panel-content">
            <ConsumableForm onSubmit={onAddEntry} />
            <ExpensesReport
              consumables={consumables}
              state={consumableState}
              onEditEntry={onEditEntry}
              onDeleteEntry={onDeleteEntry}
            />
          </div>
        </details>

        <details>
          <summary>{t("supervisor.panels.ordersCalendar")}</summary>
          <div className="panel-content">
            <OrdersPanel
              orders={orders}
              state={ordersState}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onDeleteOrder={confirmAndDeleteOrder}
            />
          </div>
        </details>
      </div>
    </div>
  );
}

export default SupervisorDashboard;

