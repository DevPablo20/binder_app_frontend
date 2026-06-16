import { apiFetch } from '@/api/client';
import type { CreateInvitePayload, InviteSummary } from '@/types/invite';

export function getInvites(): Promise<InviteSummary[]> {
  return apiFetch<InviteSummary[]>('/invite');
}

export function createInvite(
  body: CreateInvitePayload,
): Promise<InviteSummary> {
  return apiFetch<InviteSummary>('/invite', {
    method: 'POST',
    body,
  });
}

export function cancelInvite(id: string): Promise<InviteSummary> {
  return apiFetch<InviteSummary>(`/invite/${id}/cancel`, {
    method: 'POST',
  });
}

export function resendInvite(id: string): Promise<InviteSummary> {
  return apiFetch<InviteSummary>(`/invite/${id}/resend`, {
    method: 'POST',
  });
}
