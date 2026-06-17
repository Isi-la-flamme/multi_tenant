// src/components/features/invoices/components/InvoiceTable.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreHorizontal,
  FileText,
  Download,
  CheckCircle,  // ✅ Ajouté
  XCircle,      // ✅ Ajouté
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Invoice } from '@/types/invoice.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ... reste du code inchangé
interface InvoiceTableProps {
  data: Invoice[];
  isLoading?: boolean;
  onGeneratePDF?: (id: string) => void;
  onMarkAsPaid?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function InvoiceTable({
  data,
  isLoading,
  onGeneratePDF,
  onMarkAsPaid,
  onCancel,
}: InvoiceTableProps) {
  const router = useRouter();

  const handleView = (id: string) => {
    router.push(`/dashboard/invoices/${id}`);
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'N° Facture',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('invoiceNumber')}</div>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) => (
        <div>{row.getValue('clientName')}</div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const amount = row.getValue('total') as number;
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.getValue('status') as Invoice['status'];
        return <InvoiceStatusBadge status={status} />;
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Échéance',
      cell: ({ row }) => {
        const date = row.getValue('dueDate') as Date;
        return format(new Date(date), 'PPP', { locale: fr });
      },
    },
    {
      accessorKey: 'issuedDate',
      header: 'Date d\'émission',
      cell: ({ row }) => {
        const date = row.getValue('issuedDate') as Date;
        return format(new Date(date), 'PPP', { locale: fr });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleView(invoice.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </DropdownMenuItem>
              {onGeneratePDF && (
                <DropdownMenuItem onClick={() => onGeneratePDF(invoice.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger PDF
                </DropdownMenuItem>
              )}
              {invoice.status === 'pending' && onMarkAsPaid && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onMarkAsPaid(invoice.id)}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marquer comme payée
                  </DropdownMenuItem>
                </>
              )}
              {(invoice.status === 'draft' || invoice.status === 'pending') && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(invoice.id)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">Aucune facture</h3>
        <p className="text-sm text-muted-foreground">
          Commencez par créer votre première facture
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/invoices/create')}>
          Créer une facture
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} facture(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}