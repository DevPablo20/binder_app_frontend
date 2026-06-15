import type { Role } from '@/types/user';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface CompanyDetail {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWithUsers extends CompanyDetail {
  users: UserSummary[];
}

export interface CreateCompanyPayload {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UpdateCompanyItem {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BulkUpdateCompaniesPayload {
  companies: UpdateCompanyItem[];
}
