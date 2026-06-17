// src/components/features/credits/components/CreditTable.tsx
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  MoreHorizontal,
  Users,  // ✅ Ajout de l'import Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Credit } from '@/types/credit.types';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditTableProps {
  data: Credit[];
  isLoading?: boolean;
}

export function CreditTable({ data, isLoading }: CreditTableProps) {
  const router = useRouter();

  const handleView = (clientId: string) => {
    router.push(`/dashboard/credits/clients/${clientId}`);
  };

  const columns: ColumnDef<Credit>[] = [
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('clientName')}</div>
      ),
    },
    {
      accessorKey: 'totalCredit',
      header: 'Crédit Total',
      cell: ({ row }) => {
        const amount = row.getValue('totalCredit') as number;
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);
      },
    },
    {
      accessorKey: 'usedCredit',
      header: 'Utilisé',
      cell: ({ row }) => {
        const amount = row.getValue('usedCredit') as number;
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(amount);
      },
    },
    {
      accessorKey: 'availableCredit',
      header: 'Disponible',
      cell: ({ row }) => {
        const amount = row.getValue('availableCredit') as number;
        return (
          <span className="font-medium text-green-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(amount)}
          </span>
        );
      },
    },
    {
      id: 'usage',
      header: 'Utilisation',
      cell: ({ row }) => {
        const total = row.original.totalCredit;
        const used = row.original.usedCredit;
        const percentage = total > 0 ? (used / total) * 100 : 0;
        
        return (
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="h-2 w-20" />
            <span className="text-xs text-muted-foreground">
              {percentage.toFixed(0)}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variants: Record<string, { label: string; className: string }> = {
          active: {
            label: 'Actif',
            className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          },
          suspended: {
            label: 'Suspendu',
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          },
          closed: {
            label: 'Fermé',
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
          },
        };

        const variant = variants[status] || variants.active;

        return <Badge className={variant.className}>{variant.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const credit = row.original;

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
              <DropdownMenuItem onClick={() => handleView(credit.clientId)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir le détail
              </DropdownMenuItem>
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
        <Users className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">Aucun crédit client</h3>
        <p className="text-sm text-muted-foreground">
          Aucun crédit n'a été attribué pour le moment
        </p>
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
          {table.getFilteredRowModel().rows.length} client(s)
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