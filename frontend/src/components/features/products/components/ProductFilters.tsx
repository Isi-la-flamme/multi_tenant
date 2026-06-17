// src/components/features/products/components/ProductFilters.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductFilters as ProductFiltersType } from '@/types/product.types';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFilterChange: (filters: ProductFiltersType) => void;
  categories?: string[];
}

export function ProductFilters({
  filters,
  onFilterChange,
  categories = [],
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFiltersType>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: ProductFiltersType = {};
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex items-center gap-4">
      {/* Barre de recherche rapide */}
      <div className="flex-1">
        <Input
          placeholder="Rechercher un produit..."
          value={localFilters.search || ''}
          onChange={(e) => {
            const newFilters = { ...localFilters, search: e.target.value || undefined };
            setLocalFilters(newFilters);
            onFilterChange(newFilters);
          }}
          className="max-w-sm"
        />
      </div>

      {/* Filtres avancés */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
            <SheetDescription>
              Affinez votre recherche de produits
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Catégorie */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={localFilters.category || ''}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, category: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prix minimum */}
            <div className="space-y-2">
              <Label>Prix minimum</Label>
              <Input
                type="number"
                placeholder="0"
                value={localFilters.minPrice || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Prix maximum */}
            <div className="space-y-2">
              <Label>Prix maximum</Label>
              <Input
                type="number"
                placeholder="1000"
                value={localFilters.maxPrice || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label>Disponibilité</Label>
              <Select
                value={localFilters.inStock !== undefined ? String(localFilters.inStock) : ''}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    inStock: value ? value === 'true' : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les produits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les produits</SelectItem>
                  <SelectItem value="true">En stock</SelectItem>
                  <SelectItem value="false">Rupture de stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleApply}>
                Appliquer
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                Réinitialiser
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bouton créer */}
      <Button onClick={() => window.location.href = '/dashboard/products/create'}>
        Nouveau produit
      </Button>
    </div>
  );
}