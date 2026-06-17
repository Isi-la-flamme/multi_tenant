import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { LoginCredentials, RegisterData, AuthResponse, User, ChangePasswordDTO } from '@/types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return data;
  },

  register: async (data: RegisterData) => {
    const { data: response } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post<{ accessToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return data;
  },

  logout: async () => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    return data;
  },

  changePassword: async (passwordData: ChangePasswordDTO) => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD,
      passwordData
    );
    return data;
  },
};