// src/components/features/credits/components/CreditTransactions.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditTransaction } from '@/types/credit.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDown, ArrowUp, CreditCard } from 'lucide-react';

interface CreditTransactionsProps {
  transactions?: CreditTransaction[];
  isLoading?: boolean;
}

const typeConfig = {
  debit: { label: 'Débit', icon: ArrowDown, className: 'text-red-600' },
  credit: { label: 'Crédit', icon: ArrowUp, className: 'text-green-600' },
  payment: { label: 'Paiement', icon: CreditCard, className: 'text-blue-600' },
};

export function CreditTransactions({ transactions, isLoading }: CreditTransactionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed">
        <CreditCard className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Aucune transaction</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const type = typeConfig[transaction.type] || typeConfig.payment;
            const Icon = type.icon;
            const isPositive = transaction.type === 'credit';

            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.createdAt), 'PPP', { locale: fr })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={type.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {type.label}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                    {transaction.reference}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {isPositive ? '+' : '-'}
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(transaction.amount)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}