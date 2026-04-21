import { api } from "@/lib/api";

export interface Business {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  publicEmail?: string | null;
  address?: string | null;
  description?: string | null;
  domain?: string | null;
  businessType?: string | null;
  currency?: string;
  timezone?: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  plan?: string;
  ownerUserId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBusinessPayload {
  name: string;
  slug: string;
  logoUrl?: string;
  contactPhone?: string;
  publicEmail?: string;
  address?: string;
  description?: string;
  domain?: string;
  businessType?: string;
  currency?: string;
  timezone?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateBusinessPayload {
  name?: string;
  slug?: string;
  logoUrl?: string;
  contactPhone?: string;
  publicEmail?: string;
  address?: string;
  description?: string;
  domain?: string;
  businessType?: string;
  currency?: string;
  timezone?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateMyBusinessProfilePayload {
  name?: string;
  slug?: string;
  logoUrl?: string;
  contactPhone?: string;
  publicEmail?: string;
  address?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const businessesService = {
  getAll: () => api.get<Business[]>("/businesses"),

  create: (payload: CreateBusinessPayload) =>
    api.post<Business>("/businesses", payload),

  update: (id: string, payload: UpdateBusinessPayload) =>
    api.patch<Business>(`/businesses/${id}`, payload),

  updateStatus: (id: string, isActive: boolean) =>
    api.patch<Business>(`/businesses/${id}/status`, { isActive }),

  getMyBusiness: () => api.get<Business>("/businesses/me"),

  updateMyBusinessProfile: (payload: UpdateMyBusinessProfilePayload) =>
    api.patch<Business>("/businesses/me/profile", payload),
};