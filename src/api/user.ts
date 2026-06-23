import { apiFetch } from '@/api/client';
import type { MeResponse, UserWithCompanies } from '@/types/user';

export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/access/users/me');
}

export function getUsers(): Promise<UserWithCompanies[]> {
  return apiFetch<UserWithCompanies[]>('/access/users');
}
