// src/app/(dashboard)/wallet/page.tsx
'use client';

import { useWalletBalance, useWalletTransactions } from '@/components/features/wallet/hooks/useWallet';
import { WalletBalance } from '@/components/features/wallet/components/WalletBalance';
import { WalletTransactions } from '@/components/features/wallet/components/WalletTransactions';
import { WalletDeposit } from '@/components/features/wallet/components/WalletDeposit';
import { WalletWithdraw } from '@/components/features/wallet/components/WalletWithdraw';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet as WalletIcon, History, TrendingUp, TrendingDown } from 'lucide-react';

export default function WalletPage() {
  const { data: wallet, isLoading: balanceLoading } = useWalletBalance();
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portefeuille</h1>
        <p className="text-muted-foreground">
          Gérez votre solde et vos transactions
        </p>
      </div>

      {/* Balance */}
      <WalletBalance wallet={wallet} isLoading={balanceLoading} />

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <WalletDeposit />
        <WalletWithdraw />
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des transactions
          </CardTitle>
          <CardDescription>
            Toutes les transactions effectuées sur votre portefeuille
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="deposit">
                <TrendingDown className="mr-1 h-3 w-3" />
                Dépôts
              </TabsTrigger>
              <TabsTrigger value="withdrawal">
                <TrendingUp className="mr-1 h-3 w-3" />
                Retraits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <WalletTransactions
                transactions={transactionsData?.data}
                isLoading={transactionsLoading}
              />
            </TabsContent>

            <TabsContent value="deposit">
              <WalletTransactions
                transactions={transactionsData?.data?.filter(
                  t => t.type === 'deposit'
                )}
                isLoading={transactionsLoading}
              />
            </TabsContent>

            <TabsContent value="withdrawal">
              <WalletTransactions
                transactions={transactionsData?.data?.filter(
                  t => t.type === 'withdrawal'
                )}
                isLoading={transactionsLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}