// src/types/user.types.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  tenantId: string;
  avatar?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;  // Pas de null, seulement string ou undefined
  address?: string;
  company?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}