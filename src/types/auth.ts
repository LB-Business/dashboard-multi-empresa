export type UserRole = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "EDITOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string;
  businessName?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  OWNER: 3,
  ADMIN: 2,
  EDITOR: 1,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

// Route access per role
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    "/dashboard",
    "/dashboard/businesses",
    "/dashboard/businesses/new",
    "/dashboard/all-users",
    "/dashboard/create-owner",
    "/dashboard/global-settings",
  ],
  OWNER: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/products/new",
    "/dashboard/expenses",
    "/dashboard/calendar",
    "/dashboard/users",
    "/dashboard/settings",
  ],
  ADMIN: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/products/new",
    "/dashboard/expenses",
    "/dashboard/calendar",
  ],
  EDITOR: [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/products/new",
    "/dashboard/calendar",
  ],
};

export function canAccessRoute(role: UserRole, path: string): boolean {
  const routes = ROLE_ROUTES[role];
  // Check exact or starts-with for dynamic routes like /products/:id
  return routes.some((r) => path === r || path.startsWith(r + "/"));
}
