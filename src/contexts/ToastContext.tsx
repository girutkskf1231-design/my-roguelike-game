import { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  toastState: ToastState;
}

const initialState: ToastState = { message: '', type: 'info', visible: false };

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToastState] = useState<ToastState>(initialState);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    setToastState({ message, type, visible: true });
    const t = setTimeout(() => {
      setToastState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toastState }}>
      {children}
      <ToastView />
    </ToastContext.Provider>
  );
}

function ToastView() {
  const ctx = useContext(ToastContext);
  if (!ctx || !ctx.toastState.visible) return null;
  const { message, type } = ctx.toastState;
  const bg =
    type === 'error'
      ? 'bg-red-950/95 border-red-500/50 text-red-100'
      : type === 'success'
        ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
        : 'bg-slate-800/95 border-slate-500/50 text-slate-100';
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl border shadow-xl transition-opacity duration-300 ${bg}`}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
