import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorMessage({
  message,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border border-error/30 bg-error/10 text-error ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <span className="flex-1 text-sm leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-error/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
