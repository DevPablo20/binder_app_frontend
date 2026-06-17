import { apiFetch } from '@/api/client';
import type {
  AcceptInvitePayload,
  CreateInvitePayload,
  InviteMessageResponse,
  InvitePublicDetails,
  InviteSummary,
  RefuseInvitePayload,
} from '@/types/invite';

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

export function getInviteDetails(token: string): Promise<InvitePublicDetails> {
  return apiFetch<InvitePublicDetails>(`/invite/token/${token}/details`);
}

export function acceptInvite(
  body: AcceptInvitePayload,
): Promise<InviteMessageResponse> {
  return apiFetch<InviteMessageResponse>('/invite/accept', {
    method: 'POST',
    body,
  });
}

export function refuseInvite(
  body: RefuseInvitePayload,
): Promise<InviteMessageResponse> {
  return apiFetch<InviteMessageResponse>('/invite/refuse', {
    method: 'POST',
    body,
  });
}
