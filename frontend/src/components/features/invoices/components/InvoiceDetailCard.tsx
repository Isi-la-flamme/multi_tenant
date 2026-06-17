// src/components/features/invoices/components/InvoiceDetailCard.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types/invoice.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Printer } from 'lucide-react';

interface InvoiceDetailCardProps {
  invoice?: Invoice;
  isLoading?: boolean;
  onGeneratePDF?: (id: string) => void;
}

export function InvoiceDetailCard({
  invoice,
  isLoading,
  onGeneratePDF,
}: InvoiceDetailCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Facture non trouvée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
            <CardDescription className="mt-1">
              Client : {invoice.clientName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onGeneratePDF && (
              <Button variant="outline" size="sm" onClick={() => onGeneratePDF(invoice.id)}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Date d'émission</p>
            <p className="font-medium">
              {format(new Date(invoice.issuedDate), 'PPP', { locale: fr })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date d'échéance</p>
            <p className="font-medium">
              {format(new Date(invoice.dueDate), 'PPP', { locale: fr })}
            </p>
          </div>
          {invoice.paidDate && (
            <div>
              <p className="text-sm text-muted-foreground">Date de paiement</p>
              <p className="font-medium">
                {format(new Date(invoice.paidDate), 'PPP', { locale: fr })}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Articles */}
        <div>
          <h3 className="font-semibold">Articles</h3>
          <div className="mt-4 space-y-2">
            {invoice.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {item.quantity} × {item.unitPrice.toFixed(2)} €
                  </p>
                  <p className="font-medium">{item.total.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Totaux */}
        <div className="space-y-2 text-right">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{invoice.subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>TVA</span>
            <span>{invoice.tax.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total TTC</span>
            <span className="text-blue-600">{invoice.total.toFixed(2)} €</span>
          </div>
        </div>

        {invoice.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold">Notes</h3>
              <p className="mt-2 text-muted-foreground">{invoice.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}