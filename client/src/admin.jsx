import React from "react";
import ReactDOM from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import AdminApp from "./AdminApp.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("admin-root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminApp />
    </LanguageProvider>
  </React.StrictMode>
);

