import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  className?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-error' },
  neutral: { icon: Minus, color: 'text-muted' },
};

export default function StatCard({
  label,
  value,
  subLabel,
  subValue,
  icon,
  trend,
  trendLabel,
  className = '',
}: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : '';

  return (
    <div
      className={`relative rounded-2xl border border-border bg-card p-6 overflow-hidden ${className}`}
    >
      {/* Subtle accent glow */}
      <div className="absolute inset-0 rounded-2xl bg-accent/5 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted mb-1 truncate">{label}</p>
          <p className="text-2xl font-bold text-primary tracking-tight truncate">
            {value}
          </p>

          {trend && (TrendIcon || trendLabel) && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
              {trendLabel && (
                <span className="text-xs font-medium">{trendLabel}</span>
              )}
            </div>
          )}

          {subLabel && subValue && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-xs text-muted">{subLabel}</p>
              <p className="text-sm font-semibold text-primary/80 mt-0.5">
                {subValue}
              </p>
            </div>
          )}
        </div>

        {icon && (
          <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
