export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'payment' | 'credit' | 'invoice';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}