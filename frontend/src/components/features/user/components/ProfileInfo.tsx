// src/components/features/user/components/ProfileInfo.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/types/user.types';

interface ProfileInfoProps {
  user?: UserProfile;
  isLoading?: boolean;
}

const roleLabels = {
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  user: 'Utilisateur',
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function ProfileInfo({ user, isLoading }: ProfileInfoProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Aucune information disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Impossible de charger les informations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Informations personnelles
          <Badge className={roleColors[user.role] || roleColors.user}>
            {roleLabels[user.role] || user.role}
          </Badge>
        </CardTitle>
        <CardDescription>
          Membre depuis le {format(new Date(user.createdAt), 'PPP', { locale: fr })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Nom complet</p>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {user.phone && (
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Téléphone</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
          </div>
        )}

        {user.company && (
          <div className="flex items-start gap-3">
            <Building className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Entreprise</p>
              <p className="text-sm text-muted-foreground">{user.company}</p>
            </div>
          </div>
        )}

        {user.address && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Adresse</p>
              <p className="text-sm text-muted-foreground">{user.address}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Date d'inscription</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(user.createdAt), 'PPP', { locale: fr })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}