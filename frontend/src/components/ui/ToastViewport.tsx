import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div key={toast.id} className={`toast-item toast-item--${toast.tone}`}>
            <div className="toast-item__icon">
              <Icon size={16} />
            </div>
            <div className="toast-item__body">
              <div className="toast-item__title">{toast.title}</div>
              {toast.description && <div className="toast-item__desc">{toast.description}</div>}
            </div>
            <button
              type="button"
              className="toast-item__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
