// src/app/(dashboard)/credits/page.tsx
'use client';

import { useCredits, useCreditSummary } from '@/components/features/credits/hooks/useCredits';
import { CreditTable } from '@/components/features/credits/components/CreditTable';
import { CreditSummary } from '@/components/features/credits/components/CreditSummary';

export default function CreditsPage() {
  const { data: creditsData, isLoading: creditsLoading } = useCredits();
  const { data: summary, isLoading: summaryLoading } = useCreditSummary();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crédits Clients</h1>
        <p className="text-muted-foreground">
          Gérez les crédits accordés à vos clients
        </p>
      </div>

      {/* Résumé */}
      <CreditSummary summary={summary} isLoading={summaryLoading} />

      {/* Tableau */}
      <CreditTable
        data={creditsData?.data || []}
        isLoading={creditsLoading}
      />
    </div>
  );
}