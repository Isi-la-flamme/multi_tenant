// src/components/features/user/components/ProfileForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateProfile } from '../hooks/useUser';
import { UserProfile } from '@/types/user.types';

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user?: UserProfile;
  isLoading?: boolean;
}

export function ProfileForm({ user, isLoading }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      company: '',
      address: '',
    },
  });

  // Remplir le formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    // Filtrer les champs vides pour ne pas envoyer de valeurs vides
    const cleanedData: any = {};
    
    if (data.name) cleanedData.name = data.name;
    if (data.phone?.trim()) cleanedData.phone = data.phone.trim();
    if (data.company?.trim()) cleanedData.company = data.company.trim();
    if (data.address?.trim()) cleanedData.address = data.address.trim();

    try {
      await updateProfile.mutateAsync(cleanedData);
    } catch (error) {
      // Erreur déjà gérée par le hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modifier le profil</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier le profil</CardTitle>
        <CardDescription>
          Mettez à jour vos informations personnelles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              placeholder="Jean Dupont"
              {...register('name')}
              disabled={updateProfile.isPending}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              {...register('phone')}
              disabled={updateProfile.isPending}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input
              id="company"
              placeholder="Nom de votre entreprise"
              {...register('company')}
              disabled={updateProfile.isPending}
            />
            {errors.company && (
              <p className="text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="Votre adresse"
              {...register('address')}
              disabled={updateProfile.isPending}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending || !isDirty}
          >
            {updateProfile.isPending ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}