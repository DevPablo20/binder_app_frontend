import { apiFetch } from '@/api/client';
import type {
  BulkUpdateGroupingsPayload,
  CreateGroupingPayload,
  GroupingDetail,
  GroupingSummary,
} from '@/types/grouping';

export function getGroupings(): Promise<GroupingSummary[]> {
  return apiFetch<GroupingSummary[]>('/media/groupings');
}

export function getGrouping(id: string): Promise<GroupingDetail> {
  return apiFetch<GroupingDetail>(`/media/groupings/${id}`);
}

export function createGrouping(
  body: CreateGroupingPayload,
): Promise<GroupingDetail> {
  return apiFetch<GroupingDetail>('/media/groupings', {
    method: 'POST',
    body,
  });
}

export function updateGroupings(
  body: BulkUpdateGroupingsPayload,
): Promise<GroupingDetail[]> {
  return apiFetch<GroupingDetail[]>('/media/groupings', {
    method: 'PATCH',
    body,
  });
}
