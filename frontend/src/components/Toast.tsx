import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={(_id: string) => {}} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove?: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

const Toast: React.FC<ToastMessage> = ({ type, message }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const bgColor =
    type === "error"
      ? "bg-red-50 border-red-200"
      : type === "success"
        ? "bg-emerald-50 border-emerald-200"
        : "bg-blue-50 border-blue-200";

  const textColor =
    type === "error"
      ? "text-red-800"
      : type === "success"
        ? "text-emerald-800"
        : "text-blue-800";

  const Icon =
    type === "error"
      ? AlertCircle
      : type === "success"
        ? CheckCircle
        : AlertCircle;

  const iconColor =
    type === "error"
      ? "text-red-600"
      : type === "success"
        ? "text-emerald-600"
        : "text-blue-600";

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} shadow-lg animate-in fade-in slide-in-from-right-4 duration-300`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className={`flex-shrink-0 ${textColor} hover:opacity-70 transition`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
