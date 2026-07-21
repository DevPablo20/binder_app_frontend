import { apiFetch } from '@/api/client';
import type {
  BulkDeleteIdsPayload,
  BulkUpdatePlatformObjectMapsPayload,
  CreatePlatformObjectMapPayload,
  PlatformObjectMapDetail,
  PlatformObjectMapQuery,
  PlatformObjectMapSummary,
} from '@/types/bridge';

function buildQuery(params: PlatformObjectMapQuery): string {
  const search = new URLSearchParams();
  if (params.platformAccountId) {
    search.set('platformAccountId', params.platformAccountId);
  }
  if (params.campaignId) search.set('campaignId', params.campaignId);
  if (params.objectType) search.set('objectType', params.objectType);
  if (params.isActive !== undefined) {
    search.set('isActive', String(params.isActive));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getPlatformObjectMaps(
  query: PlatformObjectMapQuery = {},
): Promise<PlatformObjectMapSummary[]> {
  return apiFetch<PlatformObjectMapSummary[]>(
    `/bridge/platform-object-maps${buildQuery(query)}`,
  );
}

export function createPlatformObjectMap(
  body: CreatePlatformObjectMapPayload,
): Promise<PlatformObjectMapDetail> {
  return apiFetch<PlatformObjectMapDetail>('/bridge/platform-object-maps', {
    method: 'POST',
    body,
  });
}

export function updatePlatformObjectMaps(
  body: BulkUpdatePlatformObjectMapsPayload,
): Promise<PlatformObjectMapDetail[]> {
  return apiFetch<PlatformObjectMapDetail[]>('/bridge/platform-object-maps', {
    method: 'PATCH',
    body,
  });
}

export function deletePlatformObjectMaps(
  body: BulkDeleteIdsPayload,
): Promise<void> {
  return apiFetch<void>('/bridge/platform-object-maps', {
    method: 'DELETE',
    body,
  });
}
