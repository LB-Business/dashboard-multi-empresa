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
  Globe,
  UserPlus,
  Shield,
  Wallet,
  ArrowLeftRight,
  UserCircle,
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
  { title: "Platform Overview", icon: Globe, path: "/dashboard", roles: ["SUPER_ADMIN"] },
  { title: "Businesses", icon: Building2, path: "/dashboard/businesses", roles: ["SUPER_ADMIN"] },
  { title: "All Users", icon: Users, path: "/dashboard/all-users", roles: ["SUPER_ADMIN"] },
  { title: "Create Owner", icon: UserPlus, path: "/dashboard/create-owner", roles: ["SUPER_ADMIN"] },
  { title: "Global Settings", icon: Shield, path: "/dashboard/global-settings", roles: ["SUPER_ADMIN"] },

  { title: "Overview", icon: LayoutDashboard, path: "/dashboard", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Products", icon: Package, path: "/dashboard/products", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Expenses", icon: Receipt, path: "/dashboard/expenses", roles: ["OWNER", "ADMIN"] },
  { title: "Finance", icon: Wallet, path: "/dashboard/finance", roles: ["OWNER", "ADMIN"] },
  { title: "Movements", icon: ArrowLeftRight, path: "/dashboard/movements", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Calendar", icon: CalendarDays, path: "/dashboard/calendar", roles: ["OWNER", "ADMIN", "EDITOR"] },
  { title: "Users", icon: Users, path: "/dashboard/users", roles: ["OWNER"] },
  { title: "Settings", icon: Settings, path: "/dashboard/settings", roles: ["OWNER"] },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const role = user?.role;
  const visibleItems = navItems.filter(
    (item) => role && item.roles.includes(role),
  );

  const businessLogoUrl =
    (user as any)?.businessLogoUrl || (user as any)?.logoUrl || "";

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSettings = () => {
    setProfileOpen(false);
    navigate("/dashboard/settings");
  };

  const handleTopLogoClick = () => {
    if (collapsed) setCollapsed(false);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <button
          type="button"
          onClick={handleTopLogoClick}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary"
        >
          {role !== "SUPER_ADMIN" && businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt="Logo"
              className="h-full w-full object-cover"
            />
          ) : role === "SUPER_ADMIN" ? (
            <Shield className="h-4 w-4 text-foreground" />
          ) : (
            <Building2 className="h-4 w-4 text-foreground" />
          )}
        </button>

        {!collapsed && (
          <>
            <span className="ml-2.5 text-sm font-semibold text-foreground truncate">
              {role === "SUPER_ADMIN"
                ? "Platform Admin"
                : user?.businessName || "Dashboard"}
            </span>

            <button
              type="button"
              onClick={() => {
                setCollapsed(true);
                setProfileOpen(false);
              }}
              className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {!collapsed && role && (
        <div className="px-4 py-2 border-b border-border">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {role.replace("_", " ")}
          </span>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.path + item.title}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex w-full items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive(item.path)
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
            )}
            title={collapsed ? item.title : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-3 truncate">{item.title}</span>}
          </button>
        ))}
      </nav>

      <div className="relative border-t border-border p-3">
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm text-sidebar-foreground hover:bg-accent hover:text-foreground transition-colors",
            collapsed && "justify-center px-0",
            profileOpen && "bg-accent text-foreground",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
            {businessLogoUrl && role !== "SUPER_ADMIN" ? (
              <img
                src={businessLogoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {!collapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.name || "Usuario"}
              </p>
            </div>
          )}
        </button>

        {profileOpen && (
          <div
            className={cn(
              "absolute bottom-[72px] z-50 rounded-xl border border-border bg-popover p-1 shadow-xl",
              collapsed ? "left-3 w-48" : "left-3 right-3",
            )}
          >
            {role === "OWNER" && (
              <button
                type="button"
                onClick={handleSettings}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-accent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}