export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images?: string[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}