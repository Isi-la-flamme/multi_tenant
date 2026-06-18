// src/lib/api/services/pos.service.ts
import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { POSProduct, POSCart, POSCartItem, POSSale, POSStats, CreatePOSSaleDTO } from '@/types/pos.types';
import { PaginatedResponse } from '@/types/common.types';

export const posService = {
  // ============================================
  // Produits pour le POS
  // ============================================
  getProducts: async (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
    const { data } = await apiClient.get<PaginatedResponse<POSProduct>>(
      `/pos/products?${params.toString()}`
    );
    return data;
  },

  getProductByBarcode: async (barcode: string) => {
    const { data } = await apiClient.get<POSProduct>(`/pos/products/barcode/${barcode}`);
    return data;
  },

  // ============================================
  // Panier (Cart)
  // ============================================
  createCart: async () => {
    const { data } = await apiClient.post<POSCart>('/pos/cart');
    return data;
  },

  getCart: async (cartId: string) => {
    const { data } = await apiClient.get<POSCart>(`/pos/cart/${cartId}`);
    return data;
  },

  addToCart: async (cartId: string, productId: string, quantity: number = 1) => {
    const { data } = await apiClient.post<POSCart>(
      `/pos/cart/${cartId}/items`,
      { productId, quantity }
    );
    return data;
  },

  updateCartItem: async (cartId: string, itemId: string, quantity: number) => {
    const { data } = await apiClient.put<POSCart>(
      `/pos/cart/${cartId}/items/${itemId}`,
      { quantity }
    );
    return data;
  },

  removeFromCart: async (cartId: string, itemId: string) => {
    const { data } = await apiClient.delete<POSCart>(
      `/pos/cart/${cartId}/items/${itemId}`
    );
    return data;
  },

  clearCart: async (cartId: string) => {
    const { data } = await apiClient.delete<POSCart>(`/pos/cart/${cartId}`);
    return data;
  },

  // ============================================
  // Ventes (Checkout)
  // ============================================
  checkout: async (saleData: CreatePOSSaleDTO) => {
    const { data } = await apiClient.post<POSSale>('/pos/checkout', saleData);
    return data;
  },

  getSales: async (page = 1, limit = 20, startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const { data } = await apiClient.get<PaginatedResponse<POSSale>>(
      `/pos/sales?${params.toString()}`
    );
    return data;
  },

  getSale: async (id: string) => {
    const { data } = await apiClient.get<POSSale>(`/pos/sales/${id}`);
    return data;
  },

  refundSale: async (id: string, reason?: string) => {
    const { data } = await apiClient.post<POSSale>(
      `/pos/sales/${id}/refund`,
      { reason }
    );
    return data;
  },

  // ============================================
  // Statistiques
  // ============================================
  getStats: async () => {
    const { data } = await apiClient.get<POSStats>('/pos/stats');
    return data;
  },
};