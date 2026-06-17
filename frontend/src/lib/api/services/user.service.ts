// src/lib/api/services/user.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { UserProfile, UpdateProfileData, ChangePasswordData } from '@/types/user.types';
import { ApiResponse } from '@/types/common.types';

export const userService = {
  // Récupérer le profil
  getProfile: async () => {
    const { data } = await apiClient.get<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USERS.GET_PROFILE
    );
    return data.data;
  },

  // Mettre à jour le profil
  updateProfile: async (profileData: UpdateProfileData) => {
    const { data } = await apiClient.put<ApiResponse<UserProfile>>(
      API_ENDPOINTS.USERS.UPDATE_PROFILE,
      profileData
    );
    return data.data;
  },

  // Changer le mot de passe
  changePassword: async (passwordData: ChangePasswordData) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD,
      passwordData
    );
    return data;
  },

  // Upload d'avatar
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await apiClient.post<ApiResponse<{ avatar: string }>>(
      `${API_ENDPOINTS.USERS.UPDATE_PROFILE}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.data;
  },
};