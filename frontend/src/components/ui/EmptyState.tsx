import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="vault-empty">
      {Icon && (
        <div className="vault-empty__icon">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <p className="vault-empty__title">{title}</p>
      {description && <p className="vault-empty__desc">{description}</p>}
      {action && <div className="vault-empty__action">{action}</div>}
    </div>
  );
}
