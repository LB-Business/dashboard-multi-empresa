import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService } from "@/services/businesses.service";
import { toast } from "sonner";

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", slug: "", ownerName: "", ownerEmail: "", ownerPassword: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => businessesService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Negocio creado exitosamente");
      navigate("/dashboard/businesses");
    },
    onError: (err: any) => toast.error(err.message || "Error al crear negocio"),
  });

  return (
    <div>
      <DashboardTopbar
        title="Nuevo negocio"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/businesses")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />Volver
            </Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Creando..." : "Crear negocio"}
            </Button>
          </div>
        }
      />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input placeholder="Ej: Café Central" value={form.name} onChange={set("name")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex items-center rounded-md border border-border bg-secondary">
                <span className="px-3 text-xs text-muted-foreground border-r border-border">app.com/</span>
                <Input placeholder="cafe-central" value={form.slug} onChange={set("slug")} className="border-0 bg-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Owner del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del owner</Label>
              <Input placeholder="Nombre completo" value={form.ownerName} onChange={set("ownerName")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email del owner</Label>
              <Input type="email" placeholder="owner@email.com" value={form.ownerEmail} onChange={set("ownerEmail")} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contraseña temporal</Label>
            <Input type="password" placeholder="••••••••" value={form.ownerPassword} onChange={set("ownerPassword")} className="bg-secondary border-border max-w-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
