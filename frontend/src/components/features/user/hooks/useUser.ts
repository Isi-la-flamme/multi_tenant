// src/components/features/user/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/api/services/user.service';
import { UpdateProfileData, ChangePasswordData } from '@/types/user.types';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export const useUserProfile = () => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000,
    enabled: !!session,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { update } = useSession();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      // Mettre à jour la session avec le nouveau nom
      if (data.name) {
        update({
          ...data,
          name: data.name,
        });
      }
      
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de la mise à jour du profil'
      );
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => userService.changePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe changé avec succès');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors du changement de mot de passe'
      );
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Avatar mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de l\'upload de l\'avatar'
      );
    },
  });
};