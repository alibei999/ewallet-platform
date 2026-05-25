import LoadingSpinner from '@/components/LoadingSpinner';

interface PageLoaderProps {
  label?: string;
}

export default function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <LoadingSpinner size="lg" />
      <span className="page-loader__label">{label}</span>
    </div>
  );
}
