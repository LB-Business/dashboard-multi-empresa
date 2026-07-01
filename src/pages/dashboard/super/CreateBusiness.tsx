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

const businessTypeOptions = [
  { value: "concesionaria", label: "Concesionaria" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "barberia", label: "Barbería" },
  { value: "tienda_ropa", label: "Tienda de ropa" },
  { value: "tienda_comida", label: "Tienda de comida" },
  { value: "lavadero_autos", label: "Lavadero de autos" },
  { value: "otro", label: "Otro" },
];

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    businessType: "",
  });

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => businessesService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Negocio creado exitosamente");
      navigate("/dashboard/businesses");
    },
    onError: (err: any) =>
      toast.error(err.message || "Error al crear negocio"),
  });

  return (
    <div>
      <DashboardTopbar
        title="Nuevo negocio"
        subtitle="Crear un nuevo negocio en la plataforma"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/businesses")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Button>

            <Button
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creando..." : "Crear negocio"}
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Información del negocio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input
                placeholder="Ej: Café Central"
                value={form.name}
                onChange={set("name")}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex items-center rounded-md border border-border bg-secondary">
                <span className="px-3 text-xs text-muted-foreground border-r border-border">
                  app.com/
                </span>
                <Input
                  placeholder="cafe-central"
                  value={form.slug}
                  onChange={set("slug")}
                  className="border-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <Label>Tipo de negocio</Label>
            <select
              value={form.businessType}
              onChange={set("businessType")}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">Seleccionar tipo de negocio</option>
              {businessTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Luego podés crear y asignar un owner desde el panel de owners.
          </p>
        </div>
      </div>
    </div>
  );
}