// src/app/(dashboard)/invoices/page.tsx
'use client';

import { useState } from 'react';
import { useInvoices, useGeneratePDF, useMarkInvoiceAsPaid, useCancelInvoice } from '@/components/features/invoices/hooks/useInvoices';
import { InvoiceTable } from '@/components/features/invoices/components/InvoiceTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function InvoicesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useInvoices(page, limit, statusFilter);
  const generatePDF = useGeneratePDF();
  const markAsPaid = useMarkInvoiceAsPaid();
  const cancelInvoice = useCancelInvoice();

  const handleGeneratePDF = async (id: string) => {
    await generatePDF.mutateAsync(id);
  };

  const handleMarkAsPaid = async (id: string) => {
    await markAsPaid.mutateAsync(id);
    refetch();
  };

  const handleCancel = async (id: string) => {
    await cancelInvoice.mutateAsync(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground">
            Gérez vos factures clients
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/invoices/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Label className="text-sm">Statut</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tableau */}
      <InvoiceTable
        data={data?.data || []}
        isLoading={isLoading}
        onGeneratePDF={handleGeneratePDF}
        onMarkAsPaid={handleMarkAsPaid}
        onCancel={handleCancel}
      />
    </div>
  );
}