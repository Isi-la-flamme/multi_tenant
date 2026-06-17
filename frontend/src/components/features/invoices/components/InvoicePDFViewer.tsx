// src/components/features/invoices/components/InvoicePDFViewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoicePDFViewerProps {
  invoiceId: string;
  pdfUrl?: string;
  onGeneratePDF?: (id: string) => Promise<string | undefined>;  // ✅ Changement de type
}

export function InvoicePDFViewer({
  invoiceId,
  pdfUrl,
  onGeneratePDF,
}: InvoicePDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfSrc, setPdfSrc] = useState<string | undefined>(pdfUrl);

  useEffect(() => {
    if (pdfUrl) {
      setPdfSrc(pdfUrl);
    }
  }, [pdfUrl]);

  const handleGeneratePDF = async () => {
    if (!onGeneratePDF) return;

    setIsLoading(true);
    try {
      const url = await onGeneratePDF(invoiceId);
      if (url) {
        setPdfSrc(url);
      }
      toast.success('PDF généré avec succès');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de la génération du PDF'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Génération du PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pdfSrc) {
    return (
      <Card>
        <CardContent className="flex h-96 flex-col items-center justify-center">
          <Eye className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">Aperçu PDF</h3>
          <p className="text-sm text-muted-foreground">
            Générez le PDF pour visualiser la facture
          </p>
          <Button className="mt-4" onClick={handleGeneratePDF}>
            <Download className="mr-2 h-4 w-4" />
            Générer le PDF
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <iframe
          src={pdfSrc}
          className="h-[600px] w-full rounded-b-lg"
          title="Aperçu PDF"
        />
      </CardContent>
    </Card>
  );
}