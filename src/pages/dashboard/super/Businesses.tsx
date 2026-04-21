import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService } from "@/services/businesses.service";
import { toast } from "sonner";

const businessTypeOptions = [
  { value: "concesionaria", label: "Concesionaria" },
  { value: "barberia", label: "Barbería" },
  { value: "tienda_ropa", label: "Tienda de ropa" },
  { value: "tienda_comida", label: "Tienda de comida" },
  { value: "lavadero_autos", label: "Lavadero de autos" },
  { value: "otro", label: "Otro" },
];

function getBusinessTypeLabel(value?: string | null) {
  return (
    businessTypeOptions.find((option) => option.value === value)?.label ||
    value ||
    "-"
  );
}

export default function BusinessesPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: businesses, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessesService.getAll,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      businessesService.updateStatus(id, !isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Estado actualizado");
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo actualizar el estado");
    },
  });

  const updateBusinessType = useMutation({
    mutationFn: ({
      id,
      businessType,
    }: {
      id: string;
      businessType: string;
    }) => businessesService.update(id, { businessType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Tipo de negocio actualizado");
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo actualizar el tipo de negocio");
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return (businesses ?? []).filter((b) => {
      if (!q) return true;

      return (
        (b.name || "").toLowerCase().includes(q) ||
        (b.slug || "").toLowerCase().includes(q) ||
        (b.businessType || "").toLowerCase().includes(q)
      );
    });
  }, [businesses, search]);

  return (
    <div>
      <DashboardTopbar
        title="Businesses"
        subtitle="Todos los negocios de la plataforma"
        actions={
          <Button
            size="sm"
            onClick={() => navigate("/dashboard/businesses/new")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo negocio
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar negocios..."
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
            icon={Building2}
            title="Sin negocios"
            description="Creá el primer negocio de la plataforma."
            actionLabel="Nuevo negocio"
            onAction={() => navigate("/dashboard/businesses/new")}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Negocio
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((biz) => {
                  const businessId = biz._id ?? biz.id ?? "";

                  return (
                    <tr
                      key={businessId}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                            {biz.logoUrl ? (
                              <img
                                src={biz.logoUrl}
                                alt={biz.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>

                          <div>
                            <span className="text-foreground font-medium">
                              {biz.name}
                            </span>
                            <p className="text-xs text-muted-foreground font-mono">
                              /{biz.slug}
                            </p>
                            <p className="text-xs text-muted-foreground lg:hidden">
                              {getBusinessTypeLabel(biz.businessType)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden lg:table-cell">
                        <select
                          value={biz.businessType || ""}
                          onChange={(e) =>
                            updateBusinessType.mutate({
                              id: businessId,
                              businessType: e.target.value,
                            })
                          }
                          className="flex h-9 min-w-[220px] rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                          disabled={updateBusinessType.isPending || !businessId}
                        >
                          <option value="">Seleccionar tipo</option>
                          {businessTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={biz.isActive ? "default" : "secondary"}
                          className="text-[10px] cursor-pointer"
                          onClick={() => {
                            if (!businessId) return;
                            toggleStatus.mutate({
                              id: businessId,
                              isActive: !!biz.isActive,
                            });
                          }}
                        >
                          {biz.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!businessId}
                          onClick={() =>
                            navigate(
                              `/dashboard/create-owner?businessId=${businessId}`,
                            )
                          }
                        >
                          <UserPlus className="h-4 w-4 mr-1.5" />
                          Crear owner
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}