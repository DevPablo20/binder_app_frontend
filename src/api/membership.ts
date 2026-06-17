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
    `/user-company/${membershipId}/revoke`,
    { method: 'PATCH' },
  );
}

export function syncUserCompanies(
  userId: string,
  companyIds: string[],
): Promise<UserWithCompanies> {
  return apiFetch<UserWithCompanies>(`/user-company/user/${userId}/sync`, {
    method: 'PUT',
    body: { companyIds },
  });
}
