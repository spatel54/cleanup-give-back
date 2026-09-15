'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
  action?: ToastAction;
};

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, 'id'> & { id?: string }) => {
      const id = toast.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), 5200);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ toasts, pushToast, dismissToast }),
    [toasts, pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-sm w-[min(100vw-2rem,22rem)] pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const tone =
            toast.kind === 'success'
              ? 'border-primary/40 bg-[#f7fff1] text-text-primary'
              : toast.kind === 'error'
                ? 'border-[#ba1a1a]/40 bg-[#ffd9de] text-[#ba1a1a]'
                : 'border-border-outline bg-bg-surface text-text-primary';
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-md border px-md py-md shadow-bar-top flex items-start gap-md transition-transform duration-[400ms] ease-out ${tone}`}
            >
              <p className="font-body text-[14px] flex-1 min-w-0">{toast.message}</p>
              <div className="flex items-center gap-xs shrink-0">
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="min-h-11 px-sm font-data text-[12px] font-semibold underline underline-offset-2"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismissToast(toast.id)}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm hover:bg-black/5"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
