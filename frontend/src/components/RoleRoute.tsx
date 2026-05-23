import type { ReactNode } from 'react';
import type { User } from '@/types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RoleRouteProps {
  role: User['role'];
  children: ReactNode;
}

export default function RoleRoute({ role, children }: RoleRouteProps) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
