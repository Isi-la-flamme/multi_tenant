// src/components/features/wallet/components/WalletTransactions.tsx
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
import { WalletTransaction } from '@/types/wallet.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface WalletTransactionsProps {
  transactions?: WalletTransaction[];
  isLoading?: boolean;
}

const typeConfig = {
  deposit: {
    label: 'Dépôt',
    icon: ArrowDown,
    className: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950',
  },
  withdrawal: {
    label: 'Retrait',
    icon: ArrowUp,
    className: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950',
  },
  payment: {
    label: 'Paiement',
    icon: CreditCard,
    className: 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950',
  },
  refund: {
    label: 'Remboursement',
    icon: RefreshCw,
    className: 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-950',
  },
  fee: {
    label: 'Frais',
    icon: AlertCircle,
    className: 'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950',
  },
};

const statusConfig = {
  pending: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  completed: {
    label: 'Terminé',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  failed: {
    label: 'Échoué',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  cancelled: {
    label: 'Annulé',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
};

export function WalletTransactions({ transactions, isLoading }: WalletTransactionsProps) {
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
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const type = typeConfig[transaction.type] || typeConfig.payment;
            const status = statusConfig[transaction.status] || statusConfig.pending;
            const Icon = type.icon;
            const isPositive = transaction.type === 'deposit' || transaction.type === 'refund';

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
                    {transaction.reference.slice(0, 8)}...
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                    {isPositive ? '+' : '-'}
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(Math.abs(transaction.amount))}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={status.className}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}