// src/components/features/dashboard/components/StatsCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'par rapport au mois dernier',
  className,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="mt-1 text-xs">
            <span
              className={cn(
                'font-medium',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                change === 0 && 'text-gray-500'
              )}
            >
              {isPositive && '↑ '}
              {isNegative && '↓ '}
              {Math.abs(change)}%
            </span>
            <span className="text-muted-foreground"> {changeLabel}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}