// src/components/features/invoices/components/InvoiceForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateInvoiceDTO, InvoiceItem } from '@/types/invoice.types';

// ✅ Définir le schéma avec des valeurs par défaut
const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Le nom du produit est requis'),
  description: z.string().min(1, 'La description est requise'),
  quantity: z.number().min(1, 'La quantité doit être d\'au moins 1'),
  unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
});

// ✅ S'assurer que taxRate est requis avec une valeur par défaut
const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  clientName: z.string().min(1, 'Le nom du client est requis'),
  items: z.array(invoiceItemSchema).min(1, 'Ajoutez au moins un article'),
  dueDate: z.string().min(1, 'La date d\'échéance est requise'),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSubmit: (data: CreateInvoiceDTO) => Promise<void>;
  isLoading?: boolean;
  clients?: { id: string; name: string }[];
}

export function InvoiceForm({
  onSubmit,
  isLoading = false,
  clients = [],
}: InvoiceFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: '',
      clientName: '',
      items: [{ productId: '', productName: '', description: '', quantity: 1, unitPrice: 0 }],
      dueDate: '',
      notes: '',
      taxRate: 20, // ✅ Valeur par défaut
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const taxRate = watch('taxRate') ?? 20;

  // Calculer les totaux
  const subtotal = items?.reduce((sum, item) => {
    return sum + (item?.quantity || 0) * (item?.unitPrice || 0);
  }, 0) || 0;

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleFormSubmit = async (data: InvoiceFormData) => {
    try {
      // ✅ Nettoyer les données pour correspondre à CreateInvoiceDTO
      const invoiceData: CreateInvoiceDTO = {
        clientId: data.clientId,
        items: data.items.map((item) => ({
          productId: item.productId || '',
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        dueDate: new Date(data.dueDate),
        notes: data.notes || '',
        taxRate: data.taxRate,
      };

      await onSubmit(invoiceData);
      toast.success('Facture créée avec succès');
      router.push('/dashboard/invoices');
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Erreur lors de la création de la facture'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
          <CardDescription>
            Sélectionnez ou saisissez les informations du client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select
                value={watch('clientId') || ''}
                onValueChange={(value) => {
                  setValue('clientId', value);
                  const client = clients.find(c => c.id === value);
                  if (client) {
                    setValue('clientName', client.name);
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-600">{errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Nom du client</Label>
              <Input
                id="clientName"
                placeholder="Nom du client"
                {...register('clientName')}
                disabled={isLoading}
              />
              {errors.clientName && (
                <p className="text-sm text-red-600">{errors.clientName.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Ajoutez les produits ou services facturés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-medium">Article {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom du produit</Label>
                  <Input
                    placeholder="Nom du produit"
                    {...register(`items.${index}.productName`)}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.productName && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.productName?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Description"
                    {...register(`items.${index}.description`)}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Prix unitaire (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.items?.[index]?.unitPrice && (
                    <p className="text-sm text-red-600">
                      {errors.items[index]?.unitPrice?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2 text-right text-sm text-muted-foreground">
                Total: {(items?.[index]?.quantity || 0) * (items?.[index]?.unitPrice || 0)} €
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({ productId: '', productName: '', description: '', quantity: 1, unitPrice: 0 })}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un article
          </Button>

          {errors.items && (
            <p className="text-sm text-red-600">{errors.items.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Totaux et informations */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                disabled={isLoading}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                placeholder="20"
                defaultValue={20}
                {...register('taxRate', { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.taxRate && (
                <p className="text-sm text-red-600">{errors.taxRate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnelles)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              rows={2}
              {...register('notes')}
              disabled={isLoading}
            />
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({taxRate}%)</span>
                <span>{taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-blue-600">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? 'Création en cours...' : 'Créer la facture'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/dashboard/invoices')}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}