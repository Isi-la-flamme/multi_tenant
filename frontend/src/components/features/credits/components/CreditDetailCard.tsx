// src/components/features/credits/components/CreditDetailCard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Credit } from '@/types/credit.types';
import { User, Euro, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreditDetailCardProps {
  credit?: Credit;
  isLoading?: boolean;
}

export function CreditDetailCard({ credit, isLoading }: CreditDetailCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-1 h-8 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!credit) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Crédit non trouvé</p>
        </CardContent>
      </Card>
    );
  }

  const usageRate = credit.totalCredit > 0 
    ? (credit.usedCredit / credit.totalCredit) * 100 
    : 0;

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: {
      label: 'Actif',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    },
    suspended: {
      label: 'Suspendu',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    },
    closed: {
      label: 'Fermé',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    },
  };

  const status = statusLabels[credit.status] || statusLabels.active;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {credit.clientName}
            </CardTitle>
            <CardDescription>
              ID Client : {credit.clientId}
            </CardDescription>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Crédit Total</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(credit.totalCredit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Utilisé</p>
            <p className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(credit.usedCredit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disponible</p>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(credit.availableCredit)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Taux d'utilisation</span>
            <span className="font-medium">{usageRate.toFixed(1)}%</span>
          </div>
          <Progress value={usageRate} className="h-2" />
        </div>

        <div className="border-t pt-4 text-sm text-muted-foreground">
          <p>
            <Calendar className="mr-2 inline h-4 w-4" />
            Créé le : {format(new Date(credit.createdAt), 'PPP', { locale: fr })}
          </p>
          {credit.updatedAt && (
            <p>
              Dernière mise à jour :{' '}
              {format(new Date(credit.updatedAt), 'PPP', { locale: fr })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}