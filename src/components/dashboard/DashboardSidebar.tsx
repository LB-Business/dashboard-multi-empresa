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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Products", icon: Package, path: "/dashboard/products" },
  { title: "Expenses", icon: Receipt, path: "/dashboard/expenses" },
  { title: "Calendar", icon: CalendarDays, path: "/dashboard/calendar" },
  { title: "Users", icon: Users, path: "/dashboard/users" },
  { title: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
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
        <Building2 className="h-5 w-5 shrink-0 text-foreground" />
        {!collapsed && (
          <span className="ml-2.5 text-sm font-semibold text-foreground truncate">
            Mi Negocio
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.path}
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

      {/* Footer */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => navigate("/login")}
          className="flex w-full items-center rounded-md px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
