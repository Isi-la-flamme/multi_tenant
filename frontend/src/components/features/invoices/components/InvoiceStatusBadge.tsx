// src/components/features/invoices/components/InvoiceStatusBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  className?: string;
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    icon: FileText,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  paid: {
    label: 'Payée',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  overdue: {
    label: 'En retard',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}