// src/components/features/wallet/components/WalletDeposit.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDeposit } from '../hooks/useWallet';
import { toast } from 'sonner';

const depositSchema = z.object({
  amount: z.number()
    .min(1, 'Le montant minimum est de 1 €')
    .max(10000, 'Le montant maximum est de 10 000 €'),
  method: z.enum(['bank_transfer', 'card', 'crypto']),
  reference: z.string().optional(),
});

type DepositFormData = z.infer<typeof depositSchema>;

export function WalletDeposit() {
  const [open, setOpen] = useState(false);
  const deposit = useDeposit();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      method: 'card',
      reference: '',
    },
  });

  const method = watch('method');

  const onSubmit = async (data: DepositFormData) => {
    try {
      await deposit.mutateAsync(data);
      setOpen(false);
      reset();
    } catch (error) {
      // Erreur déjà gérée par le hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          Effectuer un dépôt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Effectuer un dépôt</DialogTitle>
          <DialogDescription>
            Ajoutez des fonds à votre portefeuille
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              disabled={deposit.isPending}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Méthode de paiement *</Label>
            <Select
              value={watch('method') || ''}
              onValueChange={(value) => setValue('method', value as any)}
              disabled={deposit.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Carte bancaire</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                <SelectItem value="crypto">Cryptomonnaie</SelectItem>
              </SelectContent>
            </Select>
            {errors.method && (
              <p className="text-sm text-red-600">{errors.method.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence (optionnelle)</Label>
            <Input
              id="reference"
              placeholder="Référence du paiement"
              {...register('reference')}
              disabled={deposit.isPending}
            />
          </div>

          {method === 'crypto' && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              ⚠️ Les transactions en cryptomonnaie peuvent prendre jusqu'à 24h.
            </div>
          )}

          {method === 'bank_transfer' && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              💳 Un RIB vous sera envoyé par email pour effectuer le virement.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={deposit.isPending}>
              {deposit.isPending ? 'Traitement...' : 'Confirmer le dépôt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}