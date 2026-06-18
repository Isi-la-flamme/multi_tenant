// src/app/(dashboard)/invoices/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoice, useGeneratePDF } from '@/components/features/invoices/hooks/useInvoices';
import { InvoiceDetailCard } from '@/components/features/invoices/components/InvoiceDetailCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading } = useInvoice(id);
  const generatePDF = useGeneratePDF();

  const handleGeneratePDF = async (id: string) => {
    const result = await generatePDF.mutateAsync(id);
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/dashboard/invoices')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste
      </Button>

      {/* Détail */}
      <InvoiceDetailCard
        invoice={invoice}
        isLoading={isLoading}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}