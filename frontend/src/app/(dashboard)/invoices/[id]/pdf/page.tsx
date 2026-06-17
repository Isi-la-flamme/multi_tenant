// src/app/(dashboard)/invoices/[id]/pdf/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoice, useGeneratePDF } from '@/components/features/invoices/hooks/useInvoices';
import { InvoicePDFViewer } from '@/components/features/invoices/components/InvoicePDFViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function InvoicePDFPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: invoice, isLoading } = useInvoice(id);
  const generatePDF = useGeneratePDF();

  const handleGeneratePDF = async (id: string): Promise<string | undefined> => {
    const result = await generatePDF.mutateAsync(id);
    if (result?.url) {
      return result.url;
    }
    return undefined;
  };

  // Générer automatiquement le PDF au chargement
  useEffect(() => {
    if (invoice && !generatePDF.isPending) {
      handleGeneratePDF(id);
    }
  }, [invoice]);

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push(`/dashboard/invoices/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la facture
      </Button>

      {/* PDF Viewer */}
      <InvoicePDFViewer
        invoiceId={id}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}