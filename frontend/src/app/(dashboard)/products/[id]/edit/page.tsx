// src/app/(dashboard)/products/[id]/edit/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/features/products/components/ProductForm';
import { useProduct, useUpdateProduct } from '@/components/features/products/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: product, isLoading, error } = useProduct(id);
  const updateProduct = useUpdateProduct();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    toast.error('Produit non trouvé');
    router.push('/dashboard/products');
    return null;
  }

  const handleSubmit = async (data: any) => {
    await updateProduct.mutateAsync({ id, data });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
      />
    </div>
  );
}