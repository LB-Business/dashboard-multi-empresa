import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AuthUser, AuthState, UserRole } from "@/types/auth";
import { authService, AuthUserResponse } from "@/services/auth.service";
import { ApiError } from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapApiUser(u: AuthUserResponse): AuthUser {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    businessId: u.businessId || u.business?._id,
    businessName: u.business?.name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("accessToken"),
    isAuthenticated: false,
    isLoading: true, // start loading to check persisted session
  });

  // On mount, check if we have a stored token and fetch user
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authService
      .me()
      .then((apiUser) => {
        setState({
          user: mapApiUser(apiUser),
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem("accessToken", res.accessToken);
      if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);

      // If login response has user data, use it; otherwise fetch /auth/me
      let user: AuthUser;
      if (res.user) {
        user = mapApiUser(res.user);
      } else {
        const me = await authService.me();
        user = mapApiUser(me);
      }

      setState({
        user,
        token: res.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }));
      if (err instanceof ApiError) throw err;
      throw new Error("Error de conexión con el servidor");
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout().catch(() => {}); // fire and forget
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
