import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserCircle,
  MoreHorizontal,
  Users,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService, type User } from "@/services/users.service";
import { toast } from "sonner";

function getUserId(user: User) {
  return user.id ?? user._id ?? "";
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "EDITOR":
      return "Editor";
    default:
      return role || "-";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR");
}

function generatePassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$#";
  let password = "";

  for (let i = 0; i < 12; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
}

export default function AllUsersPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ["all-users"],
    queryFn: usersService.getAllGlobal,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersService.resetPassword(id, password),
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo cambiar la contraseña");
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = users ?? [];

    if (!q) return list;

    return list.filter((user) => {
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        String(user.businessId ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const openResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;

    const userId = getUserId(selectedUser);

    if (!userId) {
      toast.error("No se encontró el ID del usuario");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    resetPasswordMutation.mutate({
      id: userId,
      password: newPassword,
    });
  };

  return (
    <div>
      <DashboardTopbar
        title="All Users"
        subtitle="Usuarios de toda la plataforma"
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border text-sm"
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios"
            description="No hay usuarios registrados en la plataforma."
          />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Business ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Último login
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const userId = getUserId(user);

                  return (
                    <tr
                      key={userId || user.email}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-foreground font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground md:hidden truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {user.email}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        <span className="font-mono text-xs">
                          {user.businessId || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="relative group">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-accent transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>

                          <div className="absolute right-0 top-7 z-20 hidden min-w-[210px] rounded-md border border-border bg-popover p-1 shadow-lg group-hover:block">
                            <button
                              type="button"
                              onClick={() => openResetPassword(user)}
                              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                            >
                              <KeyRound className="h-4 w-4" />
                              Cambiar contraseña
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Cambiar contraseña
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Usuario:{" "}
                <span className="text-foreground">{selectedUser.email}</span>
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10 bg-secondary border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="bg-secondary border-border"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const password = generatePassword();
                  setNewPassword(password);
                  setConfirmPassword(password);
                  setShowPassword(true);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Generar contraseña segura
              </button>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                Al guardar, se invalida el refresh token del usuario. La próxima
                vez deberá iniciar sesión con la nueva contraseña.
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowPassword(false);
                }}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
                disabled={resetPasswordMutation.isPending}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {resetPasswordMutation.isPending
                  ? "Guardando..."
                  : "Guardar contraseña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}