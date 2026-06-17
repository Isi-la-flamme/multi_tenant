// src/components/features/dashboard/components/RecentActivities.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ShoppingCart,
  CreditCard,
  FileText,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'payment' | 'credit' | 'invoice';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface RecentActivitiesProps {
  activities?: Activity[];
  isLoading?: boolean;
}

const activityIcons = {
  order: ShoppingCart,
  payment: CreditCard,
  credit: Wallet,
  invoice: FileText,
};

const statusConfig = {
  completed: { label: 'Terminé', className: 'bg-green-100 text-green-800' },
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  failed: { label: 'Échoué', className: 'bg-red-100 text-red-800' },
};

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
          <CardDescription>Aucune activité récente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Aucune activité à afficher</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activités récentes</CardTitle>
        <CardDescription>Dernières actions sur votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || ShoppingCart;
            const StatusIcon = statusIcons[activity.status] || CheckCircle;
            const status = statusConfig[activity.status] || statusConfig.completed;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <span className="text-sm font-bold">
                      {activity.amount > 0 ? '+' : ''}
                      {activity.amount.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {format(new Date(activity.date), 'PPp', { locale: fr })}
                    </span>
                    <Badge className={status.className}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}