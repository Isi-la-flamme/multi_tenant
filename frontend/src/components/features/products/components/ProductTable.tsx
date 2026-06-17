// src/components/features/products/components/ProductTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Eye,
} from 'lucide-react';
import { Product } from '@/types/product.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProductDeleteDialog } from './ProductDeleteDialog';
import { ProductStockDialog } from './ProductStockDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductTableProps {
  data: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onUpdateStock?: (id: string, quantity: number) => void;
}

export function ProductTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onUpdateStock,
}: ProductTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleView = (product: Product) => {
    router.push(`/dashboard/products/${product.id}`);
  };

  const handleEdit = (product: Product) => {
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleStockClick = (product: Product) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Nom du produit',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.getValue('category')}
        </Badge>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Prix',
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'));
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(price);
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number;
        return (
          <Badge
            variant={stock <= 0 ? 'destructive' : stock < 10 ? 'default' : 'secondary'}
            className={stock <= 0 ? 'bg-red-500' : stock < 10 ? 'bg-yellow-500' : ''}
          >
            {stock <= 0 ? 'Rupture' : stock < 10 ? `Stock bas (${stock})` : stock}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Créé le',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return format(new Date(date), 'PPP', { locale: fr });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;

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
              <DropdownMenuItem onClick={() => handleView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStockClick(product)}>
                <Package className="mr-2 h-4 w-4" />
                Mettre à jour le stock
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(product)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
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
    getFilteredRowModel: getFilteredRowModel(),
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
        <Package className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">Aucun produit</h3>
        <p className="text-sm text-muted-foreground">
          Commencez par créer votre premier produit
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/products/create')}>
          Créer un produit
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
          {table.getFilteredRowModel().rows.length} produit(s)
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

      {/* Dialogues */}
      <ProductDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onConfirm={() => {
          if (selectedProduct && onDelete) {
            onDelete(selectedProduct.id);
          }
        }}
      />

      <ProductStockDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={selectedProduct}
        onConfirm={(quantity: number) => {
          if (selectedProduct && onUpdateStock) {
            onUpdateStock(selectedProduct.id, quantity);
          }
        }}
      />
    </div>
  );
}