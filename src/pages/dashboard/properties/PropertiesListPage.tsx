import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { LoadingState } from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  propertiesService,
  Property,
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
} from "@/services/properties.service";
import { toast } from "sonner";
import { MercadoLibrePublishModal } from "./components/MercadoLibrePublishModal";

const statusLabels: Record<PropertyStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  paused: "Pausada",
  sold: "Vendida",
  rented: "Alquilada",
  archived: "Archivada",
};

const operationLabels: Record<PropertyOperationType, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporario: "Alquiler temporario",
};

const propertyTypeLabels: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local: "Local",
  oficina: "Oficina",
  galpon: "Galpón",
  campo: "Campo",
  duplex: "Dúplex",
  ph: "PH",
  otro: "Otro",
};

function getPropertyId(property: Property) {
  return property._id || property.id || "";
}

function getCoverImage(property: Property) {
  const images = property.images ?? [];
  return images.find((img) => img.isCover) || images[0];
}

function formatMoney(value?: number | null, currency?: string | null) {
  const safeValue = Number(value ?? 0);

  if (!safeValue) return "Sin precio";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "ARS" ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function getLocation(property: Property) {
  const address = property.address ?? {};

  return [address.neighborhood, address.city, address.state]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getMercadoLibreStatusLabel(status?: string | null) {
  if (!status) return "Sin publicar";
  if (status === "active") return "Activa";
  if (status === "paused") return "Pausada";
  if (status === "payment_required") return "Requiere pago";
  if (status === "under_review") return "En revisión";
  if (status === "closed") return "Finalizada";
  return status;
}

function getMercadoLibreStatusClass(status?: string | null) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (status === "payment_required") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-600";
  }

  if (status === "paused") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-500";
  }

  return "border-border bg-secondary text-muted-foreground";
}

export default function PropertiesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [operationType, setOperationType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [showOnLanding, setShowOnLanding] = useState("");
  const [propertyToPublish, setPropertyToPublish] = useState<Property | null>(null);

  const filters = useMemo(
    () => ({
      search,
      status,
      operationType,
      propertyType,
      showOnLanding,
    }),
    [search, status, operationType, propertyType, showOnLanding],
  );

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => propertiesService.getAll(filters),
  });

  const toggleLandingMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      propertiesService.updateShowOnLanding(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Visibilidad en landing actualizada");
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo actualizar la landing");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Propiedad eliminada");
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo eliminar la propiedad");
    },
  });

  const handleDelete = (property: Property) => {
    const id = getPropertyId(property);

    if (!id) {
      toast.error("No se pudo resolver el ID de la propiedad");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la propiedad "${property.title}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(id);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setOperationType("");
    setPropertyType("");
    setShowOnLanding("");
  };

  return (
    <div>
      <DashboardTopbar
        title="Propiedades"
        subtitle="Administrá las propiedades de la inmobiliaria"
        actions={
          <Button size="sm" onClick={() => navigate("/dashboard/properties/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva propiedad
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, zona o ciudad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-secondary border-border pl-9"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
              <option value="paused">Pausada</option>
              <option value="sold">Vendida</option>
              <option value="rented">Alquilada</option>
              <option value="archived">Archivada</option>
            </select>

            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todas las operaciones</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temporario">Alquiler temporario</option>
            </select>

            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los tipos</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="terreno">Terreno</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
              <option value="galpon">Galpón</option>
              <option value="campo">Campo</option>
              <option value="duplex">Dúplex</option>
              <option value="ph">PH</option>
              <option value="otro">Otro</option>
            </select>

            <select
              value={showOnLanding}
              onChange={(e) => setShowOnLanding(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
            >
              <option value="">Landing: todas</option>
              <option value="true">Visible</option>
              <option value="false">Oculta</option>
            </select>

            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : properties.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">
              Todavía no hay propiedades
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Creá la primera propiedad para empezar a alimentar el CRM y después la landing pública.
            </p>

            <Button
              className="mt-5"
              onClick={() => navigate("/dashboard/properties/new")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva propiedad
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {properties.map((property) => {
              const id = getPropertyId(property);
              const cover = getCoverImage(property);
              const location = getLocation(property);
              const hasMercadoLibreItem = !!property.ml?.itemId;
              const mlStatus = property.ml?.status;

              return (
                <div
                  key={id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="h-44 sm:h-auto sm:w-56 bg-secondary shrink-0">
                      {cover?.url ? (
                        <img
                          src={cover.url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Building2 className="h-9 w-9 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {property.title}
                          </h3>

                          <p className="text-sm text-muted-foreground mt-1">
                            {propertyTypeLabels[property.propertyType] ||
                              property.propertyType}{" "}
                            ·{" "}
                            {operationLabels[property.operationType] ||
                              property.operationType}
                          </p>

                          {location ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              {location}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="rounded-full border border-border bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                            {statusLabels[property.status] || property.status}
                          </span>

                          {hasMercadoLibreItem ? (
                            <span
                              className={`rounded-full border px-2 py-1 text-[11px] ${getMercadoLibreStatusClass(
                                mlStatus,
                              )}`}
                            >
                              ML: {getMercadoLibreStatusLabel(mlStatus)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-foreground">
                          {formatMoney(property.price, property.currency)}
                        </span>

                        {property.expenses ? (
                          <span className="text-xs text-muted-foreground">
                            Expensas: {formatMoney(property.expenses, property.currency)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {property.features?.totalArea ? (
                          <span className="rounded-md bg-secondary px-2 py-1">
                            {property.features.totalArea} m² totales
                          </span>
                        ) : null}

                        {property.features?.coveredArea ? (
                          <span className="rounded-md bg-secondary px-2 py-1">
                            {property.features.coveredArea} m² cubiertos
                          </span>
                        ) : null}

                        {property.features?.bedrooms ? (
                          <span className="rounded-md bg-secondary px-2 py-1">
                            {property.features.bedrooms} dormitorios
                          </span>
                        ) : null}

                        {property.features?.bathrooms ? (
                          <span className="rounded-md bg-secondary px-2 py-1">
                            {property.features.bathrooms} baños
                          </span>
                        ) : null}
                      </div>

                      {hasMercadoLibreItem ? (
                        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              Mercado Libre:{" "}
                              <span className="text-foreground">
                                {property.ml?.itemId}
                              </span>
                            </span>

                            {property.ml?.permalink ? (
                              <Button type="button" variant="outline" size="sm" asChild>
                                <a
                                  href={property.ml.permalink}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1.5" />
                                  Ver ML
                                </a>
                              </Button>
                            ) : null}
                          </div>

                          {property.ml?.errorMessage ? (
                            <p className="text-yellow-600">
                              {property.ml.errorMessage}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={property.showOnLanding ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              toggleLandingMutation.mutate({
                                id,
                                value: !property.showOnLanding,
                              })
                            }
                            disabled={toggleLandingMutation.isPending}
                          >
                            {property.showOnLanding ? (
                              <>
                                <Eye className="h-4 w-4 mr-1.5" />
                                En landing
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 mr-1.5" />
                                Oculta
                              </>
                            )}
                          </Button>

                          {!hasMercadoLibreItem ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPropertyToPublish(property)}
                            >
                              <Send className="h-4 w-4 mr-1.5" />
                              Publicar en ML
                            </Button>
                          ) : property.ml?.permalink ? (
                            <Button type="button" variant="outline" size="sm" asChild>
                              <a
                                href={property.ml.permalink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1.5" />
                                Ver publicación
                              </a>
                            </Button>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/properties/${id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(property)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MercadoLibrePublishModal
        open={!!propertyToPublish}
        property={propertyToPublish}
        onOpenChange={(open) => {
          if (!open) setPropertyToPublish(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }}
      />
    </div>
  );
}
