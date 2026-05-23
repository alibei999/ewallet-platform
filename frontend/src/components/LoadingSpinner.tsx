interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export default function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-white/10 border-t-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}
