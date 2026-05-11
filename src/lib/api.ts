export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ACCESS_TOKEN_KEY = "lb_access_token";
const REFRESH_TOKEN_KEY = "lb_refresh_token";
const USER_KEY = "lb_user";

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private clearAuth() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      const refreshed = await this.tryRefresh();

      if (refreshed) {
        const retryToken = this.getToken();

        const retryHeaders: Record<string, string> = {
          ...((options.headers as Record<string, string>) || {}),
        };

        if (!(options.body instanceof FormData)) {
          retryHeaders["Content-Type"] = "application/json";
        }

        if (retryToken) {
          retryHeaders["Authorization"] = `Bearer ${retryToken}`;
        }

        const retryRes = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
        });

        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new ApiError(retryRes.status, err.message || "Request failed");
        }

        if (retryRes.status === 204) {
          return {} as T;
        }

        return retryRes.json();
      }

      this.clearAuth();
      window.location.href = "/login";
      throw new ApiError(401, "Session expired");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || `Error ${res.status}`);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
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
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }

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
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  async upload<T>(endpoint: string, file: File, fieldName = "file"): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();