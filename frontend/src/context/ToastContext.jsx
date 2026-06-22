import React, { createContext, useState, useCallback, useMemo } from 'react';

export const ToastContext = createContext();

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const typeStyles = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white',
};

const ToastItem = ({ toast, onDismiss }) => (
  <div
    className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl text-sm font-medium animate-slide-in-right ${typeStyles[toast.type] || typeStyles.info}`}
  >
    <span className="flex-1">{toast.message}</span>
    <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none">&times;</button>
  </div>
);
