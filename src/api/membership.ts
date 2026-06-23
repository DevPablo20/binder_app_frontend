import { apiFetch } from '@/api/client';
import type { UserWithCompanies } from '@/types/user';

export interface UserCompanyMembership {
  id: string;
  userId: string;
  companyId: string;
  isActive: boolean;
}

export function revokeMembership(
  membershipId: string,
): Promise<UserCompanyMembership> {
  return apiFetch<UserCompanyMembership>(
    `/access/user-companies/${membershipId}/revoke`,
    { method: 'PATCH' },
  );
}

export function syncUserCompanies(
  userId: string,
  companyIds: string[],
): Promise<UserWithCompanies> {
  return apiFetch<UserWithCompanies>(
    `/access/user-companies/user/${userId}/sync`,
    {
      method: 'PUT',
      body: { companyIds },
    },
  );
}
