import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/ui/PageLoader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader label="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
