import { api } from "@/lib/api";

export type ProductType = "general" | "auto" | "ropa";

export type ProductStatus =
  | "draft"
  | "published"
  | "reserved"
  | "sold"
  | "archived"
  | "out_of_stock";

export type Currency = "ARS" | "USD";

export interface ProductImage {
  url: string;
  publicId: string;
  order: number;
  isCover: boolean;
}

export interface ProductDocument {
  label: string;
  type: string;
  url: string;
  publicId: string;
  fileName?: string | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
}

export interface ProductVariant {
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  salePrice?: number | null;
  stock: number;
}

export interface ProductExtraExpenseItem {
  label: string;
  amount: number;
  expenseDate?: string | null;
}

export interface ProductVehicleDetails {
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  kms?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  color?: string | null;
  plate?: string | null;
}

export interface ProductReservation {
  depositAmount?: number | null;
  depositCurrency?: Currency | null;
  depositDate?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
}

export interface ProductOwnership {
  ownershipType?: "owned" | "consignment";
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  ownerExpectedAmount?: number | null;
  consignorName?: string | null;
  consignorPhone?: string | null;
}

export interface ProductFinance {
  costPrice?: number | null;
  estimatedSalePrice?: number | null;
  finalSalePrice?: number | null;
  extraExpenseItems?: ProductExtraExpenseItem[];
  extraExpensesTotal?: number;
  internalNotes?: string | null;
  estimatedProfit?: number | null;
  realProfit?: number | null;
  estimatedProfitByCurrency?: {
    ARS: number;
    USD: number;
  };
  realProfitByCurrency?: {
    ARS: number;
    USD: number;
  };
}

export interface Product {
  id?: string;
  _id?: string;
  businessId: string;
  name: string;
  slug: string;
  productType: ProductType;
  description?: string | null;
  salePrice: number;
  currency: Currency;
  stock: number;
  category?: string | null;
  tags?: string[];
  coverImage?: ProductImage | null;
  images?: ProductImage[];
  documents?: ProductDocument[];
  variants?: ProductVariant[];
  vehicleDetails?: ProductVehicleDetails | null;
  ownership?: ProductOwnership | null;
  reservation?: ProductReservation | null;
  status: ProductStatus;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  soldAt?: string | null;
  finance?: ProductFinance;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  productType?: ProductType;
  description?: string;
  salePrice: number;
  currency: Currency;
  stock?: number;
  category?: string;
  tags?: string[];

  images?: {
    url: string;
    publicId: string;
    order?: number;
    isCover?: boolean;
  }[];

  documents?: {
    label: string;
    type: string;
    url: string;
    publicId: string;
    fileName?: string;
    mimeType?: string;
    uploadedAt?: string;
  }[];

  variants?: {
    size?: string;
    color?: string;
    sku?: string;
    salePrice?: number;
    stock: number;
  }[];

  vehicleDetails?: {
    brand?: string;
    model?: string;
    version?: string;
    year?: number;
    kms?: number;
    fuelType?: string;
    transmission?: string;
    color?: string;
    plate?: string;
  };

  ownership?: {
    ownershipType?: "owned" | "consignment";
    purchasePrice?: number;
    purchaseDate?: string;
    ownerExpectedAmount?: number;
    consignorName?: string;
    consignorPhone?: string;
  };

  reservation?: {
    depositAmount?: number;
    depositCurrency?: Currency;
    depositDate?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  };

  status?: ProductStatus;
  isPublished?: boolean;
  soldAt?: string;
  costPrice?: number;
  estimatedSalePrice?: number;
  finalSalePrice?: number;

  extraExpenseItems?: {
    label: string;
    amount: number;
    expenseDate?: string;
  }[];

  internalNotes?: string;
}

export interface UpdateProductStatusPayload {
  status: ProductStatus;
  isPublished?: boolean;
  reservation?: {
    depositAmount?: number;
    depositCurrency?: Currency;
    depositDate?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  };
  finalSalePrice?: number;
  soldAt?: string;
  clearReservation?: boolean;
  variantIndex?: number;
  quantity?: number;
}

export const productsService = {
  getAll: () => api.get<Product[]>("/products"),

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (payload: CreateProductPayload) =>
    api.post<Product>("/products", payload),

  update: (id: string, payload: Partial<CreateProductPayload>) =>
    api.patch<Product>(`/products/${id}`, payload),

  updateStatus: (id: string, payload: UpdateProductStatusPayload) =>
    api.patch<Product>(`/products/${id}/status`, payload),

  delete: (id: string) => api.delete(`/products/${id}`),
};