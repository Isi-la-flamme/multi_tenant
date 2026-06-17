// src/components/features/wallet/components/WalletWithdraw.tsx
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
import { useWithdraw, useWalletBalance } from '../hooks/useWallet';
import { toast } from 'sonner';

// ✅ Schéma simplifié avec des champs optionnels
const withdrawSchema = z.object({
  method: z.enum(['bank_transfer', 'crypto']),
  amount: z.number()
    .min(1, 'Le montant minimum est de 1 €')
    .max(10000, 'Le montant maximum est de 10 000 €'),
  accountDetails: z.object({
    iban: z.string().optional(),
    bic: z.string().optional(),
    holder: z.string().optional(),
    address: z.string().optional(),
    network: z.string().optional(),
  }),
}).refine((data) => {
  if (data.method === 'bank_transfer') {
    return data.accountDetails.iban && data.accountDetails.bic && data.accountDetails.holder;
  }
  if (data.method === 'crypto') {
    return data.accountDetails.address && data.accountDetails.network;
  }
  return false;
}, {
  message: 'Veuillez remplir tous les champs requis pour cette méthode',
  path: ['accountDetails'],
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

export function WalletWithdraw() {
  const [open, setOpen] = useState(false);
  const withdraw = useWithdraw();
  const { data: wallet } = useWalletBalance();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      method: 'bank_transfer',
      amount: 0,
      accountDetails: {
        iban: '',
        bic: '',
        holder: '',
        address: '',
        network: '',
      },
    },
  });

  const method = watch('method');

  const onSubmit = async (data: WithdrawFormData) => {
    // Vérifier si le solde est suffisant
    if (wallet && data.amount > wallet.availableBalance) {
      toast.error('Solde insuffisant');
      return;
    }

    try {
      // Nettoyer les données pour n'envoyer que ce qui est nécessaire
      const submitData = {
        amount: data.amount,
        method: data.method,
        accountDetails: data.method === 'bank_transfer'
          ? {
              iban: data.accountDetails.iban || '',
              bic: data.accountDetails.bic || '',
              holder: data.accountDetails.holder || '',
            }
          : {
              address: data.accountDetails.address || '',
              network: data.accountDetails.network || '',
            },
      };

      await withdraw.mutateAsync(submitData as any);
      setOpen(false);
      reset();
    } catch (error) {
      // Erreur déjà gérée par le hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Effectuer un retrait
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Effectuer un retrait</DialogTitle>
          <DialogDescription>
            Retirez des fonds de votre portefeuille
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
              disabled={withdraw.isPending}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
            {wallet && (
              <p className="text-xs text-muted-foreground">
                Solde disponible : {wallet.availableBalance.toFixed(2)} €
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Méthode de retrait *</Label>
            <Select
              value={method || ''}
              onValueChange={(value: 'bank_transfer' | 'crypto') => {
                setValue('method', value);
                // Réinitialiser les détails du compte selon la méthode
                if (value === 'bank_transfer') {
                  setValue('accountDetails.iban', '');
                  setValue('accountDetails.bic', '');
                  setValue('accountDetails.holder', '');
                  setValue('accountDetails.address', '');
                  setValue('accountDetails.network', '');
                } else {
                  setValue('accountDetails.iban', '');
                  setValue('accountDetails.bic', '');
                  setValue('accountDetails.holder', '');
                  setValue('accountDetails.address', '');
                  setValue('accountDetails.network', '');
                }
              }}
              disabled={withdraw.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                <SelectItem value="crypto">Cryptomonnaie</SelectItem>
              </SelectContent>
            </Select>
            {errors.method && (
              <p className="text-sm text-red-600">{errors.method.message}</p>
            )}
          </div>

          {method === 'bank_transfer' && (
            <div className="space-y-2 rounded-lg border p-4">
              <Label>Coordonnées bancaires</Label>
              <Input
                placeholder="IBAN"
                {...register('accountDetails.iban')}
                disabled={withdraw.isPending}
              />
              {errors.accountDetails?.iban && (
                <p className="text-sm text-red-600">
                  {errors.accountDetails.iban.message}
                </p>
              )}
              <Input
                placeholder="BIC/SWIFT"
                {...register('accountDetails.bic')}
                disabled={withdraw.isPending}
              />
              {errors.accountDetails?.bic && (
                <p className="text-sm text-red-600">
                  {errors.accountDetails.bic.message}
                </p>
              )}
              <Input
                placeholder="Titulaire du compte"
                {...register('accountDetails.holder')}
                disabled={withdraw.isPending}
              />
              {errors.accountDetails?.holder && (
                <p className="text-sm text-red-600">
                  {errors.accountDetails.holder.message}
                </p>
              )}
            </div>
          )}

          {method === 'crypto' && (
            <div className="space-y-2 rounded-lg border p-4">
              <Label>Adresse crypto</Label>
              <Input
                placeholder="Adresse du portefeuille"
                {...register('accountDetails.address')}
                disabled={withdraw.isPending}
              />
              {errors.accountDetails?.address && (
                <p className="text-sm text-red-600">
                  {errors.accountDetails.address.message}
                </p>
              )}
              <Input
                placeholder="Réseau (ex: ERC20, BSC)"
                {...register('accountDetails.network')}
                disabled={withdraw.isPending}
              />
              {errors.accountDetails?.network && (
                <p className="text-sm text-red-600">
                  {errors.accountDetails.network.message}
                </p>
              )}
            </div>
          )}

          {errors.accountDetails && typeof errors.accountDetails === 'object' && 'message' in errors.accountDetails && (
            <p className="text-sm text-red-600">{String(errors.accountDetails.message)}</p>
          )}

          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            ⏱️ Les retraits peuvent prendre jusqu'à 48h ouvrées.
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={withdraw.isPending}>
              {withdraw.isPending ? 'Traitement...' : 'Confirmer le retrait'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}