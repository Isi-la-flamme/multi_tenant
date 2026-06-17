// src/app/(dashboard)/credits/clients/[clientId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCreditByClient, useCreditTransactions, useAddTransaction } from '@/components/features/credits/hooks/useCredits';
import { CreditDetailCard } from '@/components/features/credits/components/CreditDetailCard';
import { CreditTransactions } from '@/components/features/credits/components/CreditTransactions';
import { CreditAddTransaction } from '@/components/features/credits/components/CreditAddTransaction';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreditClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { data: credit, isLoading: creditLoading } = useCreditByClient(clientId);
  const { data: transactionsData, isLoading: transactionsLoading, refetch } = useCreditTransactions(clientId);
  const addTransaction = useAddTransaction();

  const handleAddTransaction = async (data: any) => {
    await addTransaction.mutateAsync({
      clientId,
      transaction: data,
    });
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/dashboard/credits')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste
      </Button>

      {/* Détail du crédit */}
      <CreditDetailCard credit={credit} isLoading={creditLoading} />

      {/* Ajouter une transaction */}
      <CreditAddTransaction
        clientId={clientId}
        onSubmit={handleAddTransaction}
        isLoading={addTransaction.isPending}
        onSuccess={() => refetch()}
      />

      {/* Historique des transactions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historique des transactions</h2>
        <CreditTransactions
          transactions={transactionsData?.data || []}
          isLoading={transactionsLoading}
        />
      </div>
    </div>
  );
}