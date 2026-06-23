import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

import { hasMinRole } from '@/auth/roles';
import type { Role } from '@/types/user';

export type NavSection = 'workspace' | 'admin';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: SvgIconComponent;
  section: NavSection;
  minRole: Role;
  end?: boolean;
}

export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  workspace: 'Área de trabalho',
  admin: 'Painel do administrador',
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Início',
    path: '/dashboard',
    icon: HomeIcon,
    section: 'workspace',
    minRole: 'viewer',
    end: true,
  },
  {
    id: 'invites',
    label: 'Convites',
    path: '/dashboard/invites',
    icon: MailOutlinedIcon,
    section: 'workspace',
    minRole: 'editor',
  },
  {
    id: 'admin-companies',
    label: 'Empresas',
    path: '/dashboard/admin/companies',
    icon: BusinessIcon,
    section: 'admin',
    minRole: 'superadmin',
  },
  {
    id: 'admin-users',
    label: 'Usuários',
    path: '/dashboard/admin/users',
    icon: PeopleAltOutlinedIcon,
    section: 'admin',
    minRole: 'superadmin',
  },
];

export function getVisibleNavItems(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => hasMinRole(role, item.minRole));
}

export function groupNavItemsBySection(
  items: NavItem[],
): Partial<Record<NavSection, NavItem[]>> {
  return items.reduce<Partial<Record<NavSection, NavItem[]>>>(
    (groups, item) => {
      const sectionItems = groups[item.section] ?? [];
      sectionItems.push(item);
      groups[item.section] = sectionItems;
      return groups;
    },
    {},
  );
}
