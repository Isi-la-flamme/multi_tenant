// src/components/features/pos/components/CheckoutModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { POSCart, POSPayment } from '@/types/pos.types';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: POSCart | null;  // ✅ Permettre null
  onConfirm: (payment: POSPayment) => void;
  isLoading?: boolean;
}

export function CheckoutModal({
  open,
  onOpenChange,
  cart,
  onConfirm,
  isLoading,
}: CheckoutModalProps) {
  const [method, setMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [cashReceived, setCashReceived] = useState(0);

  // ✅ Vérifier que cart existe
  if (!cart) {
    return null;
  }

  const handleConfirm = () => {
    const payment: POSPayment = {
      method,
      amount: cart.total,
      cashAmount: method === 'cash' ? cashReceived : undefined,
      change: method === 'cash' && cashReceived >= cart.total ? cashReceived - cart.total : 0,
    };
    onConfirm(payment);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>💳 Paiement</DialogTitle>
          <DialogDescription>
            Total à payer : {cart.total.toFixed(2)} €
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Méthode de paiement</Label>
            <Select
              value={method}
              onValueChange={(value: 'cash' | 'card' | 'credit') => setMethod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💰 Espèces</SelectItem>
                <SelectItem value="card">💳 Carte bancaire</SelectItem>
                <SelectItem value="credit">🏦 Crédit client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === 'cash' && (
            <div>
              <Label>Montant reçu</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Montant reçu"
                value={cashReceived}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
              />
              {cashReceived >= cart.total && (
                <p className="mt-1 text-sm text-green-600">
                  Rendu : {(cashReceived - cart.total).toFixed(2)} €
                </p>
              )}
              {cashReceived > 0 && cashReceived < cart.total && (
                <p className="mt-1 text-sm text-red-600">
                  Montant insuffisant
                </p>
              )}
            </div>
          )}

          {method === 'credit' && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <p>💡 Le montant sera débité du crédit du client</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={
                isLoading ||
                (method === 'cash' && cashReceived < cart.total)
              }
            >
              {isLoading ? 'Traitement...' : 'Confirmer le paiement'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}