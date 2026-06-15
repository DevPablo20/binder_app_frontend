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
  return apiFetch<LoginResponse>('/auth/login', { method: 'POST', body });
}

export function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/auth/logout', { method: 'POST' });
}

export function forgotPassword(
  body: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/auth/password/forgot', {
    method: 'POST',
    body,
  });
}

export function resetPassword(
  body: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  return apiFetch<ResetPasswordResponse>('/auth/password/reset', {
    method: 'POST',
    body,
  });
}
