import { api } from "@/lib/api";

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  tags?: string[];
  images?: string[];
  status: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  tags?: string[];
  images?: string[];
  status?: string;
}

export const productsService = {
  getAll: () => api.get<Product[]>("/products"),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (payload: CreateProductPayload) => api.post<Product>("/products", payload),
  update: (id: string, payload: Partial<CreateProductPayload>) => api.patch<Product>(`/products/${id}`, payload),
  updateStatus: (id: string, status: string) => api.patch(`/products/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/products/${id}`),
};
