import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { businessesService } from "@/services/businesses.service";
import { toast } from "sonner";

export default function CreateOwnerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const businessIdFromQuery = searchParams.get("businessId") || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessId: "",
  });

  useEffect(() => {
    if (businessIdFromQuery) {
      setForm((prev) => ({ ...prev, businessId: businessIdFromQuery }));
    }
  }, [businessIdFromQuery]);

  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessesService.getAll,
  });

  const selectedBusiness = (businesses ?? []).find(
    (business) => (business._id ?? business.id) === form.businessId,
  );

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      usersService.createBySuperAdmin({
        ...form,
        role: "OWNER",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Owner creado exitosamente");
      navigate("/dashboard/all-users");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al crear owner");
    },
  });

  return (
    <div>
      <DashboardTopbar
        title="Crear Owner"
        subtitle="Registrar un nuevo owner para un negocio existente"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Button>

            <Button
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creando..." : "Crear owner"}
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Datos del owner
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                placeholder="Nombre del owner"
                value={form.name}
                onChange={set("name")}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="owner@email.com"
                value={form.email}
                onChange={set("email")}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contraseña temporal</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              className="bg-secondary border-border max-w-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Asignar a negocio
          </h2>

          <div className="space-y-2 max-w-md">
            <Label>Negocio</Label>
            <select
              value={form.businessId}
              onChange={set("businessId")}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              disabled={isLoadingBusinesses}
            >
              <option value="">
                {isLoadingBusinesses
                  ? "Cargando negocios..."
                  : "Seleccionar negocio"}
              </option>
              {(businesses ?? []).map((business) => (
                <option
                  key={business._id ?? business.id}
                  value={business._id ?? business.id}
                >
                  {business.name} ({business.slug})
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              Elegí el negocio al que se asignará este owner.
            </p>

            {selectedBusiness ? (
              <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                Negocio seleccionado:{" "}
                <span className="text-foreground font-medium">
                  {selectedBusiness.name}
                </span>{" "}
                ({selectedBusiness.slug})
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}