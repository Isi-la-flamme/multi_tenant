// src/app/(dashboard)/profile/page.tsx
'use client';

import { useUserProfile } from '@/components/features/user/hooks/useUser';
import { ProfileAvatar } from '@/components/features/user/components/ProfileAvatar';
import { ProfileInfo } from '@/components/features/user/components/ProfileInfo';
import { ProfileForm } from '@/components/features/user/components/ProfileForm';
import { ChangePasswordForm } from '@/components/features/user/components/ChangePasswordForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useUserProfile();

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement du profil</p>
          <p className="text-sm text-muted-foreground">
            Veuillez réessayer plus tard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      {/* Section Avatar + Info */}
      <div className="grid gap-6 md:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <Skeleton className="h-32 w-32 rounded-full" />
          ) : (
            <ProfileAvatar
              avatar={user?.avatar}
              name={user?.name || 'Utilisateur'}
              size="xl"
            />
          )}
        </div>
        <div>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin' && 'Administrateur'}
                {user?.role === 'manager' && 'Gestionnaire'}
                {user?.role === 'user' && 'Utilisateur'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grille des formulaires */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileInfo user={user} isLoading={isLoading} />
          <ProfileForm user={user} isLoading={isLoading} />
        </div>
        <div className="space-y-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}