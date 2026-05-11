import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type UserRole = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "EDITOR";

type AuthUser = {
  id: string;
  businessId: string;
  businessName: string;
  businessLogoUrl?: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type LoginResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type MeResponse = AuthUser | { user: AuthUser };

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ACCESS_TOKEN_KEY = "lb_access_token";
const REFRESH_TOKEN_KEY = "lb_refresh_token";
const USER_KEY = "lb_user";

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function normalizeMeResponse(data: MeResponse): AuthUser {
  if ("user" in data) {
    return data.user;
  }

  return data;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.message === "string") {
      if (
        data.message.toLowerCase().includes("invalid credentials") ||
        data.message.toLowerCase().includes("unauthorized")
      ) {
        return "Credenciales inválidas";
      }

      return data.message;
    }

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message[0];
    }

    return "Ocurrió un error";
  } catch {
    return "Ocurrió un error";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem(REFRESH_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!accessToken && !!user;

  const persistSession = useCallback(
    (nextUser: AuthUser, nextAccessToken: string, nextRefreshToken: string) => {
      setUser(nextUser);
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);

      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    },
    []
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      clearSession();
      return;
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        return;
      }

      const msg = await parseError(response);
      throw new Error(msg);
    }

    const rawData = (await response.json()) as MeResponse;
    const normalizedUser = normalizeMeResponse(rawData);

    setUser(normalizedUser);
    setAccessToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!response.ok) {
          const msg = await parseError(response);
          throw new Error(msg);
        }

        const data = (await response.json()) as LoginResponse;

        persistSession(data.user, data.accessToken, data.refreshToken);

        try {
          const meResponse = await fetch(`${API_URL}/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
            },
          });

          if (meResponse.ok) {
            const rawMeData = (await meResponse.json()) as MeResponse;
            const normalizedUser = normalizeMeResponse(rawMeData);

            setUser(normalizedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
          }
        } catch {
          // Si /auth/me falla, igual dejamos la sesión del login
        }
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // noop
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = getStoredUser();

    if (!token || !storedUser) return;

    refreshMe().catch(() => {
      clearSession();
    });
  }, [refreshMe, clearSession]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshMe,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}