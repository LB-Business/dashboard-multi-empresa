export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ACCESS_TOKEN_KEY = "lb_access_token";
const REFRESH_TOKEN_KEY = "lb_refresh_token";
const USER_KEY = "lb_user";

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return (
        data?.message ||
        data?.error ||
        data?.detail ||
        `Error ${res.status}`
      );
    }

    const text = await res.text();
    return text || `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

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

    // Compatibilidad con nombres viejos
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private buildHeaders(options: RequestInit = {}): Record<string, string> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // IMPORTANTE:
    // Si es FormData NO seteamos Content-Type.
    // El navegador lo agrega solo con el boundary correcto.
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = this.buildHeaders(options);

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      const refreshed = await this.tryRefresh();

      if (refreshed) {
        const retryHeaders = this.buildHeaders(options);

        const retryRes = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
          credentials: "include",
        });

        if (!retryRes.ok) {
          const message = await readErrorMessage(retryRes);

          console.error("API retry error:", {
            endpoint,
            status: retryRes.status,
            statusText: retryRes.statusText,
            message,
          });

          throw new ApiError(retryRes.status, message);
        }

        if (retryRes.status === 204) {
          return {} as T;
        }

        return retryRes.json();
      }

      this.clearAuth();
      window.location.href = "/login";
      throw new ApiError(401, "Sesión expirada");
    }

    if (!res.ok) {
      const message = await readErrorMessage(res);

      console.error("API error:", {
        endpoint,
        status: res.status,
        statusText: res.statusText,
        message,
      });

      throw new ApiError(res.status, message);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();

      if (data.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);

        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: "GET",
    });
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

  delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  async upload<T>(
    endpoint: string,
    file: File,
    fieldName = "file",
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    console.log("Uploading file:", {
      endpoint,
      fieldName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      apiUrl: API_URL,
    });

    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();