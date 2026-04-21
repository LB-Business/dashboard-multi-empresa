import { api } from "@/lib/api";

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "OWNER" | "ADMIN" | "EDITOR";
  isActive: boolean;
  businessId?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "EDITOR";
}

export interface CreateUserBySuperAdminPayload {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "ADMIN" | "EDITOR";
  businessId: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "EDITOR";
}

export interface UpdateUserBySuperAdminPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "OWNER" | "ADMIN" | "EDITOR";
  businessId?: string;
}

export const usersService = {
  getAll: () => api.get<User[]>("/users"),

  getAllGlobal: () => api.get<User[]>("/users/all"),

  getByBusiness: (businessId: string) =>
    api.get<User[]>(`/users/business/${businessId}`),

  create: (payload: CreateUserPayload) =>
    api.post<User>("/users", payload),

  createBySuperAdmin: (payload: CreateUserBySuperAdminPayload) =>
    api.post<User>("/users/by-super-admin", payload),

  update: (id: string, payload: Partial<UpdateUserPayload>) =>
    api.patch<User>(`/users/${id}`, payload),

  updateBySuperAdmin: (
    id: string,
    payload: Partial<UpdateUserBySuperAdminPayload>
  ) => api.patch<User>(`/users/${id}/by-super-admin`, payload),

  updateStatus: (id: string, isActive: boolean) =>
    api.patch<User>(`/users/${id}/status`, { isActive }),

  updateStatusBySuperAdmin: (id: string, isActive: boolean) =>
    api.patch<User>(`/users/${id}/status/by-super-admin`, { isActive }),

  resetPassword: (id: string, newPassword: string) =>
    api.patch(`/users/${id}/reset-password`, { newPassword }),
};