import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

// Avisos flotantes (éxito / error) para acciones que antes no daban feedback:
// desactivar, reactivar, eliminar, etc.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, text) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const toast = useRef({
    ok:    (text) => push('ok', text),
    error: (text) => push('error', text),
  }).current;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="gs-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`gs-toast gs-toast-${t.type}`}
            role="status"
            onClick={() => remove(t.id)}
          >
            <span aria-hidden="true">{t.type === 'ok' ? '✓' : '⚠'}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) ?? { ok: () => {}, error: () => {} };
}
