import type { Role } from '@/types/user';

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  superadmin: 3,
};

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: 'Superadmin',
  editor: 'Editor',
  viewer: 'Visualizador',
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}
