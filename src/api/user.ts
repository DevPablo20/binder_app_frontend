import { apiFetch } from '@/api/client';
import type { MeResponse } from '@/types/user';

export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/user/me');
}
