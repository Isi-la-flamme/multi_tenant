// src/types/pos.types.ts

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  barcode?: string;
}

export interface POSCartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  barcode?: string;
}

export interface POSCart {
  id: string;
  items: POSCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  customerId?: string;
  customerName?: string;
}

export interface POSPayment {
  method: 'cash' | 'card' | 'credit' | 'mixed';
  amount: number;
  cashAmount?: number;
  cardAmount?: number;
  creditAmount?: number;
  change?: number;
}

export interface POSSale {
  id: string;
  invoiceNumber: string;
  cart: POSCart;
  payment: POSPayment;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  createdAt: Date;
  cashierId: string;
  cashierName: string;
  tenantId: string;
}

export interface POSStats {
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  averageTicket: number;
  lastSale?: POSSale;
}

export interface CreatePOSSaleDTO {
  cart: POSCart;
  payment: POSPayment;
  customerId?: string;
  customerName?: string;
}