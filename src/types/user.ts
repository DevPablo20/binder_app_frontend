export type Role = 'superadmin' | 'editor' | 'viewer';

export interface CompanySummary {
  id: string;
  name: string;
  status: boolean;
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
