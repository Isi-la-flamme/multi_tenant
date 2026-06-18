// src/app/(dashboard)/invoices/create/page.tsx
'use client';

import { InvoiceForm } from '@/components/features/invoices/components/InvoiceForm';
import { useCreateInvoice } from '@/components/features/invoices/hooks/useInvoices';
import { useCredits } from '@/components/features/credits/hooks/useCredits';

export default function CreateInvoicePage() {
  const createInvoice = useCreateInvoice();
  const { data: creditsData } = useCredits();

  const clients = creditsData?.data?.map((credit) => ({
    id: credit.clientId,
    name: credit.clientName,
  })) || [];

  const handleSubmit = async (data: any) => {
    await createInvoice.mutateAsync(data);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nouvelle facture</h1>
        <p className="text-muted-foreground">
          Créez une nouvelle facture pour un client
        </p>
      </div>

      <InvoiceForm
        onSubmit={handleSubmit}
        isLoading={createInvoice.isPending}
        clients={clients}
      />
    </div>
  );
}