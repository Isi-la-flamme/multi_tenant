// src/app/(dashboard)/products/page.tsx
'use client';

import { useState } from 'react';
import { useProducts, useDeleteProduct, useUpdateStock } from '@/components/features/products/hooks/useProducts';
import { ProductTable } from '@/components/features/products/components/ProductTable';
import { ProductFilters } from '@/components/features/products/components/ProductFilters';
import { ProductFilters as ProductFiltersType } from '@/types/product.types';

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFiltersType>({});
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch } = useProducts(filters, page, limit);
  const deleteProduct = useDeleteProduct();
  const updateStock = useUpdateStock();

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
    refetch();
  };

  const handleUpdateStock = async (id: string, quantity: number) => {
    await updateStock.mutateAsync({ id, quantity });
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
        <p className="text-muted-foreground">
          Gérez votre catalogue de produits
        </p>
      </div>

      {/* Filtres */}
      <ProductFilters
        filters={filters}
        onFilterChange={setFilters}
        categories={['Électronique', 'Vêtements', 'Maison', 'Jardin', 'Sports', 'Livres']}
      />

      {/* Tableau */}
      <ProductTable
        data={data?.data || []}
        isLoading={isLoading}
        onDelete={handleDelete}
        onUpdateStock={handleUpdateStock}
      />
    </div>
  );
}