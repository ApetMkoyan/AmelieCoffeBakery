import SupervisorLogin from "./SupervisorLogin.jsx";
import SupervisorDashboard from "./SupervisorDashboard.jsx";

function SupervisorSection({
  isAuthenticated,
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
  onLogin,
  onLogout,
}) {
  if (!isAuthenticated) {
    return (
      <div className="card supervisor-card">
        <SupervisorLogin onLogin={onLogin} />
      </div>
    );
  }

  return (
    <div className="card supervisor-card">
      <SupervisorDashboard
        businessName={businessName}
        profile={profile}
        products={products}
        consumables={consumables}
        consumableState={consumableState}
        orders={orders}
        ordersState={ordersState}
        onAddEntry={onAddEntry}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        onAddProduct={onAddProduct}
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onDeleteOrder={onDeleteOrder}
        onLogout={onLogout}
      />
    </div>
  );
}

export default SupervisorSection;

