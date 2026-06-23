import { apiFetch } from '@/api/client';
import type {
  BulkUpdateCompaniesPayload,
  CompanyDetail,
  CompanyWithUsers,
  CreateCompanyPayload,
} from '@/types/company';

export function getCompanies(): Promise<CompanyWithUsers[]> {
  return apiFetch<CompanyWithUsers[]>('/access/companies');
}

export function createCompany(
  body: CreateCompanyPayload,
): Promise<CompanyDetail> {
  return apiFetch<CompanyDetail>('/access/companies', {
    method: 'POST',
    body,
  });
}

export function updateCompanies(
  body: BulkUpdateCompaniesPayload,
): Promise<CompanyDetail[]> {
  return apiFetch<CompanyDetail[]>('/access/companies', {
    method: 'PATCH',
    body,
  });
}
