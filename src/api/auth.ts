import { apiFetch } from '@/api/client';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types/auth';

export function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/access/auth/login', { method: 'POST', body });
}

export function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/access/auth/logout', { method: 'POST' });
}

export function forgotPassword(
  body: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/access/auth/password/forgot', {
    method: 'POST',
    body,
  });
}

export function resetPassword(
  body: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>('/access/auth/password/reset', {
    method: 'POST',
    body,
  });
}
