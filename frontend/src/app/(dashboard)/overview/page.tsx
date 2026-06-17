// src/app/(dashboard)/overview/page.tsx
'use client';

import { useDashboardStats, useChartData, useRecentActivity } from '@/components/features/dashboard/hooks/useDashboard';
import { StatsCard } from '@/components/features/dashboard/components/StatsCard';
import { RevenueChart } from '@/components/features/dashboard/components/RevenueChart';
import { RecentActivities } from '@/components/features/dashboard/components/RecentActivities';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useChartData('month');
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(10);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre activité et statistiques
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chiffre d'affaires"
          value={`${stats?.totalRevenue?.toFixed(2) || '0'} €`}
          icon={DollarSign}
          change={stats?.revenueChange}
        />
        <StatsCard
          title="Commandes"
          value={stats?.totalOrders || 0}
          icon={ShoppingBag}
          change={stats?.ordersChange}
        />
        <StatsCard
          title="Clients"
          value={stats?.totalCustomers || 0}
          icon={Users}
          change={stats?.customersChange}
        />
        <StatsCard
          title="Produits"
          value={stats?.totalProducts || 0}
          icon={Package}
          change={stats?.productsChange}
        />
      </div>

      {/* Graphique */}
      <RevenueChart data={chartData} isLoading={chartLoading} />

      {/* Activités récentes */}
      <RecentActivities activities={activities} isLoading={activitiesLoading} />
    </div>
  );
}