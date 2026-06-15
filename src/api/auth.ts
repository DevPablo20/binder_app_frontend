import { apiFetch } from '@/api/client';
import type { LoginRequest, LoginResponse, LogoutResponse } from '@/types/auth';

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', { method: 'POST', body });
}

export function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/auth/logout', { method: 'POST' });
}
