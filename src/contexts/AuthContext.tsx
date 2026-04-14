import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AuthUser, AuthState, UserRole } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo — replace with real API calls
const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  "super@platform.com": {
    id: "u1",
    name: "Platform Admin",
    email: "super@platform.com",
    role: "SUPER_ADMIN",
    password: "admin123",
  },
  "owner@negocio.com": {
    id: "u2",
    name: "Yamil Batte",
    email: "owner@negocio.com",
    role: "OWNER",
    businessId: "b1",
    businessName: "Mi Negocio",
    password: "owner123",
  },
  "admin@negocio.com": {
    id: "u3",
    name: "Laura González",
    email: "admin@negocio.com",
    role: "ADMIN",
    businessId: "b1",
    businessName: "Mi Negocio",
    password: "admin123",
  },
  "editor@negocio.com": {
    id: "u4",
    name: "Martín López",
    email: "editor@negocio.com",
    role: "EDITOR",
    businessId: "b1",
    businessName: "Mi Negocio",
    password: "editor123",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }));

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000));

    const mockUser = MOCK_USERS[email];
    if (!mockUser || mockUser.password !== password) {
      setState((s) => ({ ...s, isLoading: false }));
      throw new Error("Credenciales inválidas");
    }

    const { password: _, ...user } = mockUser;
    setState({
      user,
      token: "mock-jwt-token",
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
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
