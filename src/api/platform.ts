import { apiFetch } from '@/api/client';
import type {
  BulkUpdatePlatformsPayload,
  CreatePlatformPayload,
  PlatformDetail,
  PlatformSummary,
} from '@/types/platform';

export function getPlatforms(): Promise<PlatformSummary[]> {
  return apiFetch<PlatformSummary[]>('/media/platforms');
}

export function getPlatform(id: string): Promise<PlatformDetail> {
  return apiFetch<PlatformDetail>(`/media/platforms/${id}`);
}

export function createPlatform(
  body: CreatePlatformPayload,
): Promise<PlatformDetail> {
  return apiFetch<PlatformDetail>('/media/platforms', {
    method: 'POST',
    body,
  });
}

export function updatePlatforms(
  body: BulkUpdatePlatformsPayload,
): Promise<PlatformDetail[]> {
  return apiFetch<PlatformDetail[]>('/media/platforms', {
    method: 'PATCH',
    body,
  });
}
