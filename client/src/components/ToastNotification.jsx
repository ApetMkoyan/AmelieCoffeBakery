import { useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";

function ToastNotification({ message, onClose, duration = 3000 }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-notification show">
      <div className="toast-icon">✓</div>
      <div className="toast-message">{message}</div>
    </div>
  );
}

export default ToastNotification;


