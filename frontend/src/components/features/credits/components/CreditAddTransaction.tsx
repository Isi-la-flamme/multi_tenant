// src/components/features/credits/components/CreditAddTransaction.tsx
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const transactionSchema = z.object({
  type: z.enum(['debit', 'credit', 'payment']),
  amount: z.number().min(0.01, 'Le montant doit être positif'),
  description: z.string().min(3, 'La description est requise'),
  reference: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface CreditAddTransactionProps {
  clientId: string;
  onSuccess?: () => void;
  isLoading?: boolean;
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

export function CreditAddTransaction({
  clientId,
  onSuccess,
  isLoading = false,
  onSubmit,
}: CreditAddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'credit',
      amount: 0,
      description: '',
      reference: '',
    },
  });

  const type = watch('type');

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmit(data);
      toast.success('Transaction ajoutée avec succès');
      reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de l\'ajout de la transaction'
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter une transaction</CardTitle>
        <CardDescription>
          Ajoutez une nouvelle transaction pour ce client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type de transaction *</Label>
              <Select
                value={watch('type') || ''}
                onValueChange={(value) => setValue('type', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Crédit (+)</SelectItem>
                  <SelectItem value="debit">Débit (-)</SelectItem>
                  <SelectItem value="payment">Paiement</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Description de la transaction..."
              rows={2}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence (optionnelle)</Label>
            <Input
              id="reference"
              placeholder="Facture #1234"
              {...register('reference')}
              disabled={isLoading}
            />
            {errors.reference && (
              <p className="text-sm text-red-600">{errors.reference.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Ajout en cours...' : 'Ajouter la transaction'}
          </Button>

          <p className="text-xs text-muted-foreground">
            {type === 'credit' && "➕ Ajoute du crédit au compte du client"}
            {type === 'debit' && "➖ Débite le compte du client"}
            {type === 'payment' && "💳 Enregistre un paiement du client"}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}