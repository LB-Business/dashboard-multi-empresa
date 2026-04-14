import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Receipt,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  UserPlus,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  icon: LucideIcon;
  path: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // SUPER_ADMIN items
  { title: "Platform Overview", icon: Globe, path: "/dashboard", roles: ["SUPER_ADMIN"] },
  { title: "Businesses", icon: Building2, path: "/dashboard/businesses", roles: ["SUPER_ADMIN"] },
  { title: "All Users", icon: Users, path: "/dashboard/all-users", roles: ["SUPER_ADMIN"] },
  { title: "Create Owner", icon: UserPlus, path: "/dashboard/create-owner", roles: ["SUPER_ADMIN"] },
  { title: "Global Settings", icon: Shield, path: "/dashboard/global-settings", roles: ["SUPER_ADMIN"] },

  // Business dashboard items
  { title: "Overview", icon: LayoutDashboard, path: "/dashboard", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Products", icon: Package, path: "/dashboard/products", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Expenses", icon: Receipt, path: "/dashboard/expenses", roles: ["OWNER", "ADMIN"] },
  { title: "Calendar", icon: CalendarDays, path: "/dashboard/calendar", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Users", icon: Users, path: "/dashboard/users", roles: ["OWNER"] },
  { title: "Settings", icon: Settings, path: "/dashboard/settings", roles: ["OWNER"] },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role;
  const visibleItems = navItems.filter((item) => role && item.roles.includes(role));

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {role === "SUPER_ADMIN" ? (
          <Shield className="h-5 w-5 shrink-0 text-foreground" />
        ) : (
          <Building2 className="h-5 w-5 shrink-0 text-foreground" />
        )}
        {!collapsed && (
          <span className="ml-2.5 text-sm font-semibold text-foreground truncate">
            {role === "SUPER_ADMIN" ? "Platform Admin" : user?.businessName || "Dashboard"}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="px-4 py-2 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{role.replace("_", " ")}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.path + item.title}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex w-full items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
          </button>
        ))}
      </nav>

      {/* Footer - user info */}
      <div className="border-t border-border p-3 space-y-1">
        {!collapsed && user && (
          <div className="px-2.5 py-1.5">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
