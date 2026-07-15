import { apiFetch } from '@/api/client';
import type {
  BulkUpdateSubGroupingsPayload,
  CreateSubGroupingsPayload,
  SubGroupingDetail,
  SubGroupingSummary,
} from '@/types/grouping';

export function getSubGroupings(): Promise<SubGroupingSummary[]> {
  return apiFetch<SubGroupingSummary[]>('/media/sub-groupings');
}

export function getSubGrouping(id: string): Promise<SubGroupingDetail> {
  return apiFetch<SubGroupingDetail>(`/media/sub-groupings/${id}`);
}

export function createSubGroupings(
  body: CreateSubGroupingsPayload,
): Promise<SubGroupingDetail[]> {
  return apiFetch<SubGroupingDetail[]>('/media/sub-groupings', {
    method: 'POST',
    body,
  });
}

export function updateSubGroupings(
  body: BulkUpdateSubGroupingsPayload,
): Promise<SubGroupingDetail[]> {
  return apiFetch<SubGroupingDetail[]>('/media/sub-groupings', {
    method: 'PATCH',
    body,
  });
}
