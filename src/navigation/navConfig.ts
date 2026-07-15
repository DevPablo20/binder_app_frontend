import BusinessIcon from '@mui/icons-material/Business';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import HomeIcon from '@mui/icons-material/Home';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

import { hasMinRole } from '@/auth/roles';
import type { Role } from '@/types/user';

export type NavSection = 'workspace' | 'catalog' | 'admin';

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
  catalog: 'Catálogo de mídia',
  admin: 'Administração',
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
    id: 'business',
    label: 'Negócio',
    path: '/dashboard/clients',
    icon: StorefrontOutlinedIcon,
    section: 'workspace',
    minRole: 'superadmin',
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    path: '/dashboard/catalog',
    icon: CategoryOutlinedIcon,
    section: 'catalog',
    minRole: 'viewer',
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
  {
    id: 'admin-invites',
    label: 'Convites',
    path: '/dashboard/admin/invites',
    icon: MailOutlinedIcon,
    section: 'admin',
    minRole: 'editor',
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

export const NAV_SECTION_ORDER: NavSection[] = [
  'workspace',
  'catalog',
  'admin',
];
