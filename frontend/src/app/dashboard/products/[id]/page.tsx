// src/app/(dashboard)/products/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProduct } from '@/components/features/products/hooks/useProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="mb-4" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">Produit non trouvé</h3>
        <p className="text-sm text-muted-foreground">
          Le produit que vous recherchez n'existe pas
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/products')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push('/dashboard/products')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <CardDescription className="mt-1">
                Catégorie : {product.category}
              </CardDescription>
            </div>
            <Button onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold">Description</h3>
            <p className="mt-1 text-muted-foreground">{product.description}</p>
          </div>

          {/* Informations */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Prix</h3>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(product.price)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Stock</h3>
              <div className="mt-1">
                <Badge
                  variant={product.stock <= 0 ? 'destructive' : 'default'}
                  className={
                    product.stock <= 0
                      ? 'bg-red-500'
                      : product.stock < 10
                      ? 'bg-yellow-500'
                      : ''
                  }
                >
                  {product.stock <= 0
                    ? 'Rupture de stock'
                    : product.stock < 10
                    ? `Stock bas (${product.stock})`
                    : `${product.stock} unités`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>
              Créé le : {format(new Date(product.createdAt), 'PPP', { locale: fr })}
            </p>
            {product.updatedAt && (
              <p>
                Dernière modification :{' '}
                {format(new Date(product.updatedAt), 'PPP', { locale: fr })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}