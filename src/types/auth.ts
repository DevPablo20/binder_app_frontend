export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
}

export interface LogoutResponse {
  logged_out: boolean;
}
