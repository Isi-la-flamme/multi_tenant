import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { DashboardStats, ChartData, RecentActivity } from '@/types/dashboard.types';

export const dashboardService = {
  getStats: async () => {
    const { data } = await apiClient.get<DashboardStats>(
      API_ENDPOINTS.DASHBOARD.GET_STATS
    );
    return data;
  },

  getChartData: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const { data } = await apiClient.get<ChartData>(
      `${API_ENDPOINTS.DASHBOARD.GET_CHART_DATA}?period=${period}`
    );
    return data;
  },

  getRecentActivity: async (limit = 10) => {
    const { data } = await apiClient.get<RecentActivity[]>(
      `${API_ENDPOINTS.DASHBOARD.GET_RECENT_ACTIVITY}?limit=${limit}`
    );
    return data;
  },
};