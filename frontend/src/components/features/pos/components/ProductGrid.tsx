// src/components/features/pos/components/ProductGrid.tsx
'use client';

import { useState } from 'react';
import { POSProduct } from '@/types/pos.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Barcode } from 'lucide-react';

interface ProductGridProps {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  isLoading?: boolean;
}

export function ProductGrid({ products, onAddToCart, isLoading }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Barcode className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat)}
            className="whitespace-nowrap"
          >
            {cat === 'all' ? 'Tous' : cat}
          </Button>
        ))}
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer p-4 transition-all hover:shadow-lg hover:scale-105"
            onClick={() => onAddToCart(product)}
          >
            <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
              📦
            </div>
            <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {product.price.toFixed(2)} €
            </p>
            <p className="text-xs text-muted-foreground">
              Stock: {product.stock}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}