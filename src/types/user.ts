export type Role = 'superadmin' | 'editor' | 'viewer';

export interface CompanySummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CompanyWithMembership {
  id: string;
  membershipId: string;
  name: string;
  isActive: boolean;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companies: CompanySummary[];
}

export interface UserWithCompanies {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  companies: CompanyWithMembership[];
}
