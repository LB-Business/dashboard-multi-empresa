// Base URL for the API — change this to your production URL when deploying
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      // Try refresh
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${this.getToken()}`;
        const retryRes = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new ApiError(retryRes.status, err.message || "Request failed");
        }
        return retryRes.json();
      }
      // Refresh failed — clear auth
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new ApiError(401, "Session expired");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || `Error ${res.status}`);
    }

    // Handle empty responses (204)
    if (res.status === 204) return {} as T;
    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async upload<T>(endpoint: string, file: File, fieldName = "file"): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.request<T>(endpoint, { method: "POST", body: formData });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();
