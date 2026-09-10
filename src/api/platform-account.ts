import { apiFetch } from '@/api/client';
import type {
  BulkCreatePlatformAccountsPayload,
  BulkDeleteIdsPayload,
  BulkUpdatePlatformAccountsPayload,
  CreatePlatformAccountPayload,
  PlatformAccountDetail,
  PlatformAccountQuery,
  PlatformAccountSummary,
} from '@/types/bridge';

function buildQuery(params: PlatformAccountQuery): string {
  const search = new URLSearchParams();
  if (params.platformId) search.set('platformId', params.platformId);
  if (params.clientId) search.set('clientId', params.clientId);
  if (params.isActive !== undefined) {
    search.set('isActive', String(params.isActive));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getPlatformAccounts(
  query: PlatformAccountQuery = {},
): Promise<PlatformAccountSummary[]> {
  return apiFetch<PlatformAccountSummary[]>(
    `/bridge/platform-accounts${buildQuery(query)}`,
  );
}

export function getPlatformAccount(id: string): Promise<PlatformAccountDetail> {
  return apiFetch<PlatformAccountDetail>(`/bridge/platform-accounts/${id}`);
}

export function createPlatformAccount(
  body: CreatePlatformAccountPayload,
): Promise<PlatformAccountDetail> {
  return apiFetch<PlatformAccountDetail>('/bridge/platform-accounts', {
    method: 'POST',
    body,
  });
}

export function createPlatformAccountsBulk(
  body: BulkCreatePlatformAccountsPayload,
): Promise<PlatformAccountDetail[]> {
  return apiFetch<PlatformAccountDetail[]>('/bridge/platform-accounts/bulk', {
    method: 'POST',
    body,
  });
}

export function updatePlatformAccounts(
  body: BulkUpdatePlatformAccountsPayload,
): Promise<PlatformAccountDetail[]> {
  return apiFetch<PlatformAccountDetail[]>('/bridge/platform-accounts', {
    method: 'PATCH',
    body,
  });
}

export function deletePlatformAccounts(
  body: BulkDeleteIdsPayload,
): Promise<void> {
  return apiFetch<void>('/bridge/platform-accounts', {
    method: 'DELETE',
    body,
  });
}
