// src/app/(dashboard)/products/create/page.tsx
'use client';

import { ProductForm } from '@/components/features/products/components/ProductForm';
import { useCreateProduct } from '@/components/features/products/hooks/useProducts';
import { CreateProductDTO } from '@/types/product.types';

export default function CreateProductPage() {
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: CreateProductDTO) => {
    await createProduct.mutateAsync(data);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createProduct.isPending}
      />
    </div>
  );
}