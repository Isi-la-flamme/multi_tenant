// src/lib/api/services/pos.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { POSProduct, POSCart, POSCartItem, POSSale, POSStats, CreatePOSSaleDTO } from '@/types/pos.types';
import { PaginatedResponse } from '@/types/common.types';

type ApiEnvelope<T> = {
  status: string;
  data: T;
};

export const posService = {
  // ============================================
  // Produits pour le POS
  // ============================================
  getProducts: async (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    const { data } = await apiClient.get<ApiEnvelope<POSProduct[]>>(
      `/pos/products?${params.toString()}`
    );
    return {
      data: data.data,
      total: data.data.length,
      page: 1,
      limit: data.data.length,
      totalPages: 1,
    } satisfies PaginatedResponse<POSProduct>;
  },

  getProductByBarcode: async (barcode: string) => {
    const { data } = await apiClient.get<ApiEnvelope<POSProduct>>(`/pos/products/barcode/${barcode}`);
    return data.data;
  },

  // ============================================
  // Panier (Cart)
  // ============================================
  createCart: async () => {
    const { data } = await apiClient.post<ApiEnvelope<POSCart>>('/pos/cart');
    return data.data;
  },

  getCart: async (cartId: string) => {
    const { data } = await apiClient.get<ApiEnvelope<POSCart>>(`/pos/cart/${cartId}`);
    return data.data;
  },

  addToCart: async (cartId: string, productId: string, quantity: number = 1) => {
    const { data } = await apiClient.post<ApiEnvelope<POSCart>>(
      `/pos/cart/${cartId}/items`,
      { productId, quantity }
    );
    return data.data;
  },

  updateCartItem: async (cartId: string, itemId: string, quantity: number) => {
    const { data } = await apiClient.put<ApiEnvelope<POSCart>>(
      `/pos/cart/${cartId}/items/${itemId}`,
      { quantity }
    );
    return data.data;
  },

  removeFromCart: async (cartId: string, itemId: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<POSCart>>(
      `/pos/cart/${cartId}/items/${itemId}`
    );
    return data.data;
  },

  clearCart: async (cartId: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<POSCart>>(`/pos/cart/${cartId}`);
    return data.data;
  },

  // ============================================
  // Ventes (Checkout)
  // ============================================
  checkout: async (saleData: CreatePOSSaleDTO) => {
    const { data } = await apiClient.post<ApiEnvelope<POSSale>>('/pos/checkout', saleData);
    return data.data;
  },

  getSales: async (page = 1, limit = 20, startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const { data } = await apiClient.get<ApiEnvelope<PaginatedResponse<POSSale>>>(
      `/pos/sales?${params.toString()}`
    );
    return data.data;
  },

  getSale: async (id: string) => {
    const { data } = await apiClient.get<ApiEnvelope<POSSale>>(`/pos/sales/${id}`);
    return data.data;
  },

  refundSale: async (id: string, reason?: string) => {
    const { data } = await apiClient.post<ApiEnvelope<POSSale>>(
      `/pos/sales/${id}/refund`,
      { reason }
    );
    return data.data;
  },

  // ============================================
  // Statistiques
  // ============================================
  getStats: async () => {
    const { data } = await apiClient.get<ApiEnvelope<POSStats>>('/pos/stats');
    return data.data;
  },
};
