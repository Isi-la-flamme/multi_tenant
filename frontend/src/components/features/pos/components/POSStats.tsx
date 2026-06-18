// src/components/features/pos/components/POSStats.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POSStats } from '@/types/pos.types';
import { Euro, ShoppingBag, Package, TrendingUp } from 'lucide-react';

interface POSStatsProps {
  stats?: POSStats;
  isLoading?: boolean;
}

export function POSStatsComponent({ stats, isLoading }: POSStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-12 bg-gray-200 dark:bg-gray-700" />
            <CardContent className="h-8 bg-gray-200 dark:bg-gray-700" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Ventes du jour',
      value: stats.totalSales,
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalRevenue.toFixed(2)} €`,
      icon: Euro,
      color: 'text-green-600',
    },
    {
      title: 'Articles vendus',
      value: stats.totalItemsSold,
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Panier moyen',
      value: `${stats.averageTicket.toFixed(2)} €`,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}