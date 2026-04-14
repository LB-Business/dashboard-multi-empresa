import { api } from "@/lib/api";

export interface Business {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: string;
  ownerId?: string;
  owner?: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface CreateBusinessPayload {
  name: string;
  slug: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
}

export interface UpdateBusinessPayload {
  name?: string;
  slug?: string;
  logo?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const businessesService = {
  getAll: () => api.get<Business[]>("/businesses"),
  create: (payload: CreateBusinessPayload) => api.post<Business>("/businesses", payload),
  update: (id: string, payload: UpdateBusinessPayload) => api.patch<Business>(`/businesses/${id}`, payload),
  updateStatus: (id: string, status: string) => api.patch(`/businesses/${id}/status`, { status }),
  getMyBusiness: () => api.get<Business>("/businesses/me"),
  updateMyBusiness: (payload: UpdateBusinessPayload) => api.patch<Business>("/businesses/me", payload),
};
