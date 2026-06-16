import type { Role } from '@/types/user';

export type InviteStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'expired'
  | 'cancelled';

export interface InviteSummary {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitePayload {
  email: string;
  companyIds: string[];
  role: Role;
}

export interface InviteMessageResponse {
  message: string;
}
