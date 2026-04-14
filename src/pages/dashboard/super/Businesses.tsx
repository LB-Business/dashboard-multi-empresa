import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { LoadingState, ErrorState, EmptyState } from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService } from "@/services/businesses.service";
import { toast } from "sonner";

export default function BusinessesPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: businesses, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessesService.getAll,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      businessesService.updateStatus(id, status === "active" ? "inactive" : "active"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Estado actualizado");
    },
  });

  const filtered = (businesses ?? []).filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) || b.owner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <DashboardTopbar
        title="Businesses"
        subtitle="Todos los negocios de la plataforma"
        actions={
          <Button size="sm" onClick={() => navigate("/dashboard/businesses/new")}>
            <Plus className="h-4 w-4 mr-1.5" />Nuevo negocio
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar negocios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 bg-secondary border-border text-sm" />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="Sin negocios" description="Creá el primer negocio de la plataforma." actionLabel="Nuevo negocio" onAction={() => navigate("/dashboard/businesses/new")} />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Negocio</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((biz) => (
                  <tr key={biz._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                          {biz.logo ? <img src={biz.logo} alt="" className="w-full h-full rounded object-cover" /> : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">{biz.name}</span>
                          <p className="text-xs text-muted-foreground font-mono">/{biz.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{biz.owner?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={biz.status === "active" ? "default" : "secondary"}
                        className="text-[10px] cursor-pointer"
                        onClick={() => toggleStatus.mutate({ id: biz._id, status: biz.status })}
                      >
                        {biz.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 rounded hover:bg-accent transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
