import { api } from "@/lib/api";

export type PropertyOperationType =
  | "venta"
  | "alquiler"
  | "alquiler_temporario";

export type PropertyType =
  | "casa"
  | "departamento"
  | "terreno"
  | "local"
  | "oficina"
  | "galpon"
  | "campo"
  | "duplex"
  | "ph"
  | "otro";

export type PropertyStatus =
  | "draft"
  | "published"
  | "paused"
  | "sold"
  | "rented"
  | "archived";

export type PropertyCurrency = "ARS" | "USD";

export interface PropertyImage {
  url: string;
  publicId: string;
  order: number;
  isCover: boolean;
}

export interface PropertyDocument {
  label: string;
  type: string;
  url: string;
  publicId: string;
  fileName?: string | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
}

export interface PropertyAddress {
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showExactLocation?: boolean;
}

export interface PropertyFeatures {
  totalArea?: number | null;
  coveredArea?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  age?: number | null;
  floors?: number | null;
  hasPool?: boolean;
  hasGrill?: boolean;
  hasGarden?: boolean;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
}

export interface PropertyMercadoLibre {
  itemId?: string | null;
  status?: string | null;
  permalink?: string | null;
  categoryId?: string | null;
  listingTypeId?: string | null;
  lastSyncAt?: string | null;
  publishedAt?: string | null;
  pausedAt?: string | null;
  errorMessage?: string | null;
}

export interface Property {
  id?: string;
  _id?: string;
  businessId: string;

  title: string;
  slug: string;
  description?: string | null;

  operationType: PropertyOperationType;
  propertyType: PropertyType;
  status: PropertyStatus;

  showOnLanding: boolean;

  price: number;
  currency: PropertyCurrency;
  expenses?: number;

  acceptsFinancing?: boolean;
  acceptsExchange?: boolean;

  address?: PropertyAddress;
  features?: PropertyFeatures;

  images?: PropertyImage[];
  documents?: PropertyDocument[];

  ml?: PropertyMercadoLibre;

  internalNotes?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePropertyPayload {
  title: string;
  slug?: string;
  description?: string;

  operationType?: PropertyOperationType;
  propertyType?: PropertyType;
  status?: PropertyStatus;

  showOnLanding?: boolean;

  price?: number;
  currency?: PropertyCurrency;
  expenses?: number;

  acceptsFinancing?: boolean;
  acceptsExchange?: boolean;

  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    showExactLocation?: boolean;
  };

  features?: {
    totalArea?: number;
    coveredArea?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    garages?: number;
    age?: number;
    floors?: number;
    hasPool?: boolean;
    hasGrill?: boolean;
    hasGarden?: boolean;
    hasSecurity?: boolean;
    hasElevator?: boolean;
    hasBalcony?: boolean;
    hasTerrace?: boolean;
  };

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

  internalNotes?: string;
}

export interface PropertiesFilters {
  status?: string;
  operationType?: string;
  propertyType?: string;
  showOnLanding?: string;
  search?: string;
}

export interface PublishPropertyMercadoLibrePayload {
  categoryId: string;
  listingTypeId?: "silver" | "gold" | "gold_premium";
  buyingMode?: "buy_it_now" | "classified" | "auction";
  title?: string;
  price?: number;
  currencyId?: "ARS" | "USD";
  condition?: "new" | "used";
  testMode?: boolean;
  force?: boolean;
  location?: any;
  attributes?: any[];
}

export interface PublishPropertyMercadoLibreResponse {
  ok: boolean;
  needsPayment?: boolean;
  property?: Property;
  mercadoLibre?: {
    id?: string;
    status?: string;
    permalink?: string;
    categoryId?: string;
    listingTypeId?: string;
  };
  sentPayload?: any;
}

function buildQuery(filters?: PropertiesFilters) {
  const params = new URLSearchParams();

  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const propertiesService = {
  getAll: (filters?: PropertiesFilters) =>
    api.get<Property[]>(`/properties${buildQuery(filters)}`),

  getById: (id: string) => api.get<Property>(`/properties/${id}`),

  create: (payload: CreatePropertyPayload) =>
    api.post<Property>("/properties", payload),

  update: (id: string, payload: Partial<CreatePropertyPayload>) =>
    api.patch<Property>(`/properties/${id}`, payload),

  updateStatus: (id: string, status: PropertyStatus) =>
    api.patch<Property>(`/properties/${id}/status`, { status }),

  updateShowOnLanding: (id: string, showOnLanding: boolean) =>
    api.patch<Property>(`/properties/${id}/show-on-landing`, {
      showOnLanding,
    }),

  publishToMercadoLibre: (
    id: string,
    payload: PublishPropertyMercadoLibrePayload,
  ) =>
    api.post<PublishPropertyMercadoLibreResponse>(
      `/properties/${id}/mercadolibre/publish`,
      payload,
    ),

  delete: (id: string) => api.delete<{ ok: boolean }>(`/properties/${id}`),
};