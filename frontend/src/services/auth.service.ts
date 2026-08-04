import { api } from './api';
import { ApiResponse, LoginResponseData, User } from '../types';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleName?: string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const AuthService = {
  async register(payload: RegisterPayload) {
    const response = await api.post<ApiResponse<{ user: User; message: string }>>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
    return response.data;
  },

  async logout() {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  async getMe() {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.get<ApiResponse>(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await api.post<ApiResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(payload: ForgotPasswordPayload) {
    const response = await api.post<ApiResponse>('/auth/forgot-password', payload);
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const response = await api.post<ApiResponse>('/auth/reset-password', payload);
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await api.post<ApiResponse>('/auth/change-password', payload);
    return response.data;
  }
};
