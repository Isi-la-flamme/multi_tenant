// src/components/features/products/components/ProductForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types/product.types';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  category: z.string().min(1, 'La catégorie est requise'),
  stock: z.number().min(0, 'Le stock doit être positif'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  categories?: string[];
}

export function ProductForm({
  product,
  onSubmit,
  isLoading = false,
  categories = ['Électronique', 'Vêtements', 'Maison', 'Jardin', 'Sports', 'Livres', 'Autre'],
}: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
    },
  });

  // Remplir le formulaire si édition
  useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('price', product.price);
      setValue('category', product.category);
      setValue('stock', product.stock);
    }
  }, [product, setValue]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      toast.success(
        isEditing
          ? 'Produit mis à jour avec succès'
          : 'Produit créé avec succès'
      );
      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Une erreur est survenue'
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? 'Modifiez les informations du produit'
            : 'Créez un nouveau produit pour votre catalogue'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              placeholder="Ex: Smartphone XYZ"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Description détaillée du produit..."
              rows={4}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Prix et Catégorie */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="99.99"
                {...register('price', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={watch('category') || ''}
                onValueChange={(value) => setValue('category', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock">Quantité en stock *</Label>
            <Input
              id="stock"
              type="number"
              placeholder="0"
              {...register('stock', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.stock && (
              <p className="text-sm text-red-600">{errors.stock.message}</p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || (isEditing && !isDirty)}
            >
              {isLoading
                ? isEditing
                  ? 'Mise à jour...'
                  : 'Création...'
                : isEditing
                ? 'Mettre à jour'
                : 'Créer le produit'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard/products')}
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}