import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Product, ProductFilters, CreateProductDTO, UpdateProductDTO } from '@/types/product.types';
import { PaginatedResponse } from '@/types/common.types';

export const productService = {
  getAll: async (filters?: ProductFilters, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.minPrice && { minPrice: String(filters.minPrice) }),
      ...(filters?.maxPrice && { maxPrice: String(filters.maxPrice) }),
      ...(filters?.inStock !== undefined && { inStock: String(filters.inStock) }),
    });
    
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      `${API_ENDPOINTS.PRODUCTS.GET_ALL}?${params.toString()}`
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<Product>(
      API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)
    );
    return data;
  },

  create: async (product: CreateProductDTO) => {
    const { data } = await apiClient.post<Product>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      product
    );
    return data;
  },

  update: async (id: string, product: UpdateProductDTO) => {
    const { data } = await apiClient.put<Product>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      product
    );
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
  },

  updateStock: async (id: string, quantity: number) => {
    const { data } = await apiClient.patch<Product>(
      API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id),
      { quantity }
    );
    return data;
  },
};