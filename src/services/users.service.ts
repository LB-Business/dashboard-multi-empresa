import { api } from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  businessId?: string;
  business?: { _id: string; name: string };
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface CreateUserBySuperAdminPayload extends CreateUserPayload {
  businessId: string;
}

export const usersService = {
  getAll: () => api.get<User[]>("/users"),
  getAllGlobal: () => api.get<User[]>("/users/all"),
  getByBusiness: (businessId: string) => api.get<User[]>(`/users/business/${businessId}`),
  create: (payload: CreateUserPayload) => api.post<User>("/users", payload),
  createBySuperAdmin: (payload: CreateUserBySuperAdminPayload) => api.post<User>("/users/by-super-admin", payload),
  update: (id: string, payload: Partial<CreateUserPayload>) => api.patch<User>(`/users/${id}`, payload),
  updateBySuperAdmin: (id: string, payload: Partial<CreateUserPayload>) => api.patch<User>(`/users/${id}/by-super-admin`, payload),
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  updateStatusBySuperAdmin: (id: string, status: string) => api.patch(`/users/${id}/status/by-super-admin`, { status }),
  resetPassword: (id: string, password: string) => api.patch(`/users/${id}/reset-password`, { password }),
};
