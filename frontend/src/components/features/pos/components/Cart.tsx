// src/components/features/pos/components/Cart.tsx
'use client';

import { POSCart, POSCartItem } from '@/types/pos.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartProps {
  cart: POSCart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onCheckout,
  isLoading,
}: CartProps) {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <ShoppingCart className="h-16 w-16 mb-4" />
        <p>Panier vide</p>
        <p className="text-sm">Ajoutez des produits</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Liste des articles */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border p-2"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.unitPrice.toFixed(2)} €
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium">{item.total.toFixed(2)} €</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="border-t p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Sous-total</span>
          <span>{cart.subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>TVA ({cart.taxRate}%)</span>
          <span>{cart.tax.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-green-600">{cart.total.toFixed(2)} €</span>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={onCheckout} disabled={isLoading}>
            {isLoading ? 'Paiement...' : '💳 Payer'}
          </Button>
        </div>
      </div>
    </div>
  );
}