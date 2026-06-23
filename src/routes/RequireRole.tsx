import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import type { Role } from '@/types/user';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
