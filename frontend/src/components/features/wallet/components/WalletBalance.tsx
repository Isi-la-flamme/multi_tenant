// src/components/features/wallet/components/WalletBalance.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from '@/types/wallet.types';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Lock } from 'lucide-react';

interface WalletBalanceProps {
  wallet?: Wallet;
  isLoading?: boolean;
}

export function WalletBalance({ wallet, isLoading }: WalletBalanceProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-48" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-blue-600" />
              Mon Portefeuille
            </CardTitle>
            <CardDescription>
              {wallet.currency} - Solde disponible
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Solde principal */}
        <div>
          <p className="text-sm text-muted-foreground">Solde disponible</p>
          <p className="text-4xl font-bold text-green-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: wallet.currency || 'EUR',
            }).format(wallet.availableBalance)}
          </p>
        </div>

        {/* Détails du solde */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Solde total</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: wallet.currency || 'EUR',
              }).format(wallet.balance)}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Solde gelé</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: wallet.currency || 'EUR',
              }).format(wallet.frozenBalance)}
            </p>
          </div>
        </div>

        {/* Info supplémentaire */}
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p>
            💡 Le solde disponible est le montant que vous pouvez utiliser 
            pour vos transactions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}