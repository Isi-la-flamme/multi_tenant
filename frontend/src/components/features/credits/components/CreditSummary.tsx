// src/components/features/credits/components/CreditSummary.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditSummary as CreditSummaryType } from '@/types/credit.types';
import { Users, Euro, TrendingUp, TrendingDown } from 'lucide-react';

interface CreditSummaryProps {
  summary?: CreditSummaryType;
  isLoading?: boolean;
}

export function CreditSummary({ summary, isLoading }: CreditSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  const usageRate = summary.totalCredit > 0 
    ? (summary.totalUsed / summary.totalCredit) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crédit Total
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(summary.totalCredit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisé
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(summary.totalUsed)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponible
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(summary.totalAvailable)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taux d'utilisation</span>
              <span className="font-medium">{usageRate.toFixed(1)}%</span>
            </div>
            <Progress value={usageRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilisé : {summary.totalUsed.toFixed(2)} €</span>
              <span>Disponible : {summary.totalAvailable.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}