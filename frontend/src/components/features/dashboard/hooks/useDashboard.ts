import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api/services';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useChartData = (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['chart-data', period],
    queryFn: () => dashboardService.getChartData(period),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};