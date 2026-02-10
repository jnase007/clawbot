import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <Check className="w-4 h-4" />,
  error: <X className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  loading: <Loader2 className="w-4 h-4 animate-spin" />,
};

const styles: Record<ToastType, string> = {
  success: 'bg-green-500/90 text-white border-green-400',
  error: 'bg-red-500/90 text-white border-red-400',
  info: 'bg-blue-500/90 text-white border-blue-400',
  loading: 'bg-slate-700/90 text-white border-slate-500',
};

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in ${styles[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium">{toast.message}</span>
      {toast.type !== 'loading' && (
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-2 opacity-70 hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Custom hook for toast management
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string, duration?: number): string => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateToast = (id: string, type: ToastType, message: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type, message } : t))
    );
  };

  const success = (message: string) => addToast('success', message);
  const error = (message: string) => addToast('error', message);
  const info = (message: string) => addToast('info', message);
  const loading = (message: string) => addToast('loading', message);

  return {
    toasts,
    addToast,
    removeToast,
    updateToast,
    success,
    error,
    info,
    loading,
  };
}

export default Toast;
