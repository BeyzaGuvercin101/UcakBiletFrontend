import { apiRequest } from './apiClient';

export interface AuthUserDto {
  id: number;
  createTime: string;
  email: string;
  enabled: boolean;
}

export interface LoginResponse {
  accessToken: string;
}

export const authService = {
  login: (email: string, password: string) => apiRequest<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  }),

  register: (email: string, password: string) => apiRequest<AuthUserDto>('/api/v1/auth/register', {
    method: 'POST',
    auth: false,
    body: { email, password },
  }),

  logout: () => apiRequest<string>('/api/v1/auth/logout', { method: 'POST' }),

  refreshToken: () => apiRequest<LoginResponse>('/api/v1/auth/refresh-token', { method: 'POST' }),

  verifyEmail: (email: string, verificationCode: string) => apiRequest<AuthUserDto>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { email, verificationCode },
  }),

  resendVerificationEmail: (email: string) => apiRequest<string>('/api/v1/auth/resend-verification-email', {
    method: 'POST',
    body: { email },
  }),

  passwordResetRequest: (email: string) => apiRequest<string>('/api/v1/auth/password-reset-request', {
    method: 'POST',
    auth: false,
    body: { email },
  }),

  passwordReset: (email: string, token: string, newPassword: string) => apiRequest<string>('/api/v1/auth/password-reset', {
    method: 'POST',
    auth: false,
    body: { email, token, newPassword },
  }),
};

