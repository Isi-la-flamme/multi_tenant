import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { Product, ProductFilters, CreateProductDTO, UpdateProductDTO } from '@/types/product.types';
import { PaginatedResponse } from '@/types/common.types';

type ProductsApiEnvelope = {
  status: string;
  data: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
};

type ProductApiEnvelope = {
  status: string;
  data: {
    product: Product;
  };
};

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
    
    const { data } = await apiClient.get<ProductsApiEnvelope>(
      `${API_ENDPOINTS.PRODUCTS.GET_ALL}?${params.toString()}`
    );
    const pagination = data.data.pagination;
    return {
      data: data.data.products,
      total: pagination.total,
      page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    } satisfies PaginatedResponse<Product>;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ProductApiEnvelope>(
      API_ENDPOINTS.PRODUCTS.GET_BY_ID(id)
    );
    return data.data.product;
  },

  create: async (product: CreateProductDTO) => {
    const { data } = await apiClient.post<ProductApiEnvelope>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      product
    );
    return data.data.product;
  },

  update: async (id: string, product: UpdateProductDTO) => {
    const { data } = await apiClient.put<ProductApiEnvelope>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      product
    );
    return data.data.product;
  },

  delete: async (id: string) => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
  },

  updateStock: async (id: string, quantity: number) => {
    const { data } = await apiClient.patch<ProductApiEnvelope>(
      API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id),
      { quantity }
    );
    return data.data.product;
  },
};
