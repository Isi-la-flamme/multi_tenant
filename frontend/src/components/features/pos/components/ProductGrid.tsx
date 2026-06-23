// src/components/features/pos/components/ProductGrid.tsx
'use client';

import { useState } from 'react';
import { POSProduct } from '@/types/pos.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Barcode, Package, AlertCircle } from 'lucide-react';

interface ProductGridProps {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ProductGrid({ products, onAddToCart, isLoading, error }: ProductGridProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  // ✅ Fonction pour formater le prix en toute sécurité
  const formatPrice = (price: any): string => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    if (typeof price === 'string') {
      const num = parseFloat(price);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    return '0.00';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">Erreur de chargement</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Aucun produit disponible</h3>
        <p className="text-sm text-muted-foreground">
          Créez des produits dans la section Produits
        </p>
        <Button className="mt-4" onClick={() => window.location.href = '/dashboard/products'}>
          Aller aux produits
        </Button>
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
        {filteredProducts.map((product) => {
          const price = formatPrice(product.price);
          const stock = typeof product.stock === 'number' ? product.stock : parseInt(product.stock) || 0;
          
          return (
            <Card
              key={product.id}
              className={`cursor-pointer p-4 transition-all hover:shadow-lg hover:scale-105 ${
                stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => stock > 0 && onAddToCart(product)}
            >
              <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
                📦
              </div>
              <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                {price} €
              </p>
              <p className={`text-xs ${stock > 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
                {stock > 0 ? `Stock: ${stock}` : 'Rupture de stock'}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}