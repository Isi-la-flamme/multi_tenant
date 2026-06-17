// src/components/features/products/components/ProductStockDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/product.types';

interface ProductStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (quantity: number) => void;
  isLoading?: boolean;
}

export function ProductStockDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  isLoading = false,
}: ProductStockDialogProps) {
  const [quantity, setQuantity] = useState<number>(0);

  if (!product) return null;

  const handleConfirm = () => {
    if (quantity >= 0) {
      onConfirm(quantity);
      setQuantity(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre à jour le stock</DialogTitle>
          <DialogDescription>
            Modifier la quantité en stock pour le produit{' '}
            <span className="font-semibold">"{product.name}"</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Quantité actuelle</Label>
            <Input 
              id="stock"
              value={product.stock} 
              disabled 
              className="bg-gray-50 dark:bg-gray-800" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStock">Nouvelle quantité *</Label>
            <Input
              id="newStock"
              type="number"
              placeholder="Nouvelle quantité"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || quantity < 0}
          >
            {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}