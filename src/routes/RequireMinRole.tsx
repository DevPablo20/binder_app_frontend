import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { hasMinRole } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import type { Role } from '@/types/user';

interface RequireMinRoleProps {
  minRole: Role;
  children: ReactNode;
}

export function RequireMinRole({ minRole, children }: RequireMinRoleProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || !hasMinRole(user.role, minRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
