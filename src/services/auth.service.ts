import { api } from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUserResponse;
}

export interface AuthUserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  businessId?: string;
  business?: { _id: string; name: string; slug: string };
  status?: string;
}

export interface RegisterOwnerPayload {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessSlug: string;
}

export const authService = {
  login: (payload: LoginPayload) => api.post<LoginResponse>("/auth/login", payload),
  me: () => api.get<AuthUserResponse>("/auth/me"),
  logout: () => api.post("/auth/logout"),
  registerOwner: (payload: RegisterOwnerPayload) => api.post<LoginResponse>("/auth/register-owner", payload),
  refresh: (refreshToken: string) => api.post<{ accessToken: string; refreshToken?: string }>("/auth/refresh", { refreshToken }),
  bootstrapSuperAdmin: (payload: { email: string; password: string; name: string }) =>
    api.post("/auth/bootstrap-super-admin", payload),
};
