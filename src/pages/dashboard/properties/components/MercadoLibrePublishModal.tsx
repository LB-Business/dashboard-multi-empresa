import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyLocationMapPicker } from "./PropertyLocationMapPicker";
import {
  CreatePropertyPayload,
  propertiesService,
  Property,
  PropertyCurrency,
  PropertyOperationType,
  PropertyType,
  PublishPropertyMercadoLibrePayload,
} from "@/services/properties.service";
import {
  buildMercadoLibreAttributeFromValue,
  categoryHasSubtypes,
  getCategoryLabel,
  getDefaultExtraAttributeValue,
  getKnownCategoryId,
  getRequiredBaseAttributes,
  getRequiredExtraAttributes,
  ML_OPERATION_OPTIONS,
  ML_PROPERTY_TYPE_OPTIONS,
  ML_SUBTYPE_OPTIONS,
} from "../utils/mercadolibreRealEstateCatalog";
import type {
  MercadoLibreRequiredAttribute,
  MlPropertyType,
  MlSaleSubtype,
} from "../utils/mercadolibreRealEstateCatalog";

type ListingTypeId = "silver" | "gold" | "gold_premium";
type ConditionType = "new" | "used";
type MercadoLibrePublishModalProps = {
  open: boolean;
  property: Property | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const listingTypeOptions: {
  value: ListingTypeId;
  label: string;
  description: string;
}[] = [
  {
    value: "silver",
    label: "Silver / Plata",
    description: "Paquete base. Suele requerir pago para activarse.",
  },
  {
    value: "gold",
    label: "Gold / Básico destacado",
    description: "Más destaque que silver. Puede requerir paquete contratado.",
  },
  {
    value: "gold_premium",
    label: "Gold Premium",
    description: "Máximo destaque. Puede requerir paquete contratado.",
  },
];

function getPropertyId(property: Property | null) {
  return property?._id || property?.id || "";
}

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  if (!normalized.trim()) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInputNumber(value?: number | null) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function inferMlPropertyType(propertyType?: PropertyType | string | null): MlPropertyType {
  if (propertyType === "casa") return "casa";
  if (propertyType === "departamento") return "departamento";
  if (propertyType === "terreno") return "terreno";
  if (propertyType === "local") return "local";
  if (propertyType === "oficina") return "oficina";
  if (propertyType === "galpon") return "galpon";
  if (propertyType === "campo") return "campo";
  if (propertyType === "duplex") return "casa";
  if (propertyType === "ph") return "ph";
  return "otro";
}

function mapMlPropertyTypeToCrmPropertyType(
  propertyType: MlPropertyType,
): PropertyType {
  if (propertyType === "casa") return "casa";
  if (propertyType === "departamento") return "departamento";
  if (propertyType === "terreno") return "terreno";
  if (propertyType === "local") return "local";
  if (propertyType === "oficina") return "oficina";
  if (propertyType === "galpon") return "galpon";
  if (propertyType === "campo") return "campo";
  if (propertyType === "ph") return "ph";

  // Estos tipos todavía no existen en el schema del CRM.
  // Para no romper el backend, se guardan como "otro".
  if (propertyType === "quinta") return "campo";

  return "otro";
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

export function MercadoLibrePublishModal({
  open,
  property,
  onOpenChange,
  onSuccess,
}: MercadoLibrePublishModalProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [mlPropertyType, setMlPropertyType] = useState<MlPropertyType>("casa");
  const [operationType, setOperationType] =
    useState<PropertyOperationType>("venta");
  const [saleSubtype, setSaleSubtype] =
    useState<MlSaleSubtype>("propiedad_individual");
  const [listingTypeId, setListingTypeId] = useState<ListingTypeId>("silver");
  const [condition, setCondition] = useState<ConditionType>("used");
  const [currency, setCurrency] = useState<PropertyCurrency>("ARS");
  const [price, setPrice] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [manualCategoryId, setManualCategoryId] = useState("");
  const [extraAttributeValues, setExtraAttributeValues] = useState<Record<string, string>>({});

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Buenos Aires");
  const [country, setCountry] = useState("Argentina");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [totalArea, setTotalArea] = useState("");
  const [coveredArea, setCoveredArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [garages, setGarages] = useState("");
  const [age, setAge] = useState("");
  const [floors, setFloors] = useState("");

  useEffect(() => {
    if (!open || !property) return;

    setTitle(property.title || "");
    setMlPropertyType(inferMlPropertyType(property.propertyType));
    setOperationType(property.operationType || "venta");
    setSaleSubtype("propiedad_individual");
    setListingTypeId(
      property.ml?.listingTypeId === "gold" ||
        property.ml?.listingTypeId === "gold_premium" ||
        property.ml?.listingTypeId === "silver"
        ? property.ml.listingTypeId
        : "silver",
    );
    setCondition("used");
    setCurrency(property.currency || "ARS");
    setPrice(toInputNumber(property.price));
    setTestMode(false);
    setManualCategoryId(property.ml?.categoryId || "");

    const address = property.address ?? {};
    setStreet(address.street || "");
    setNumber(address.number || "");
    setNeighborhood(address.neighborhood || "");
    setCity(address.city || "");
    setState(address.state || "Buenos Aires");
    setCountry(address.country || "Argentina");
    setLatitude(toInputNumber(address.latitude));
    setLongitude(toInputNumber(address.longitude));

    const features = property.features ?? {};
    setTotalArea(toInputNumber(features.totalArea));
    setCoveredArea(toInputNumber(features.coveredArea));
    setRooms(toInputNumber(features.rooms));
    setBedrooms(toInputNumber(features.bedrooms));
    setBathrooms(toInputNumber(features.bathrooms));
    setGarages(toInputNumber(features.garages ?? 0));
    setAge(toInputNumber(features.age));
    setFloors(toInputNumber(features.floors));
  }, [open, property]);

  useEffect(() => {
    if (operationType === "venta" && saleSubtype === "emprendimiento") {
      setCondition("new");
    }
  }, [operationType, saleSubtype]);

  const autoCategoryId = useMemo(
    () => getKnownCategoryId(mlPropertyType, operationType, saleSubtype),
    [mlPropertyType, operationType, saleSubtype],
  );

  const categoryId = manualCategoryId.trim() || autoCategoryId;
  const propertyId = getPropertyId(property);
  const hasSubtypes = categoryHasSubtypes(mlPropertyType, operationType);

  const requiredBaseAttributes = useMemo(
    () => getRequiredBaseAttributes(categoryId),
    [categoryId],
  );

  const requiredBaseAttributeIds = useMemo(
    () => new Set(requiredBaseAttributes.map((attr) => attr.id)),
    [requiredBaseAttributes],
  );

  const requiredExtraAttributes = useMemo(
    () => getRequiredExtraAttributes(categoryId),
    [categoryId],
  );

  useEffect(() => {
    if (!open) return;

    setExtraAttributeValues((prev) => {
      const next: Record<string, string> = {};

      requiredExtraAttributes.forEach((attr) => {
        next[attr.id] =
          prev[attr.id] ??
          getDefaultExtraAttributeValue(attr, title || property?.title || "");
      });

      return next;
    });
  }, [open, property?.title, requiredExtraAttributes, title]);

  const validation = useMemo(() => {
    const parsedPrice = parseNumber(price);
    const parsedLatitude = parseNumber(latitude);
    const parsedLongitude = parseNumber(longitude);
    const parsedTotalArea = parseNumber(totalArea);
    const parsedCoveredArea = parseNumber(coveredArea);
    const parsedRooms = parseNumber(rooms);
    const parsedBedrooms = parseNumber(bedrooms);
    const parsedBathrooms = parseNumber(bathrooms);
    const parsedGarages = garages.trim() === "" ? 0 : parseNumber(garages);

    const baseValueById: Record<string, { label: string; ok: boolean }> = {
      TOTAL_AREA: {
        label: "Metros totales",
        ok: !!parsedTotalArea && parsedTotalArea > 0,
      },
      COVERED_AREA: {
        label: "Metros cubiertos",
        ok: !!parsedCoveredArea && parsedCoveredArea > 0,
      },
      ROOMS: {
        label: "Ambientes",
        ok: !!parsedRooms && parsedRooms > 0,
      },
      BEDROOMS: {
        label: "Dormitorios",
        ok: !!parsedBedrooms && parsedBedrooms > 0,
      },
      FULL_BATHROOMS: {
        label: "Baños",
        ok: !!parsedBathrooms && parsedBathrooms > 0,
      },
      PARKING_LOTS: {
        label: "Cocheras, puede ser 0",
        ok: parsedGarages !== undefined && parsedGarages >= 0,
      },
    };

    const requiredBaseChecks = requiredBaseAttributes.map((attr) => {
      const base = baseValueById[attr.id];

      return {
        label: base?.label || attr.name,
        ok: base?.ok ?? true,
      };
    });

    const requiredExtraChecks = requiredExtraAttributes.map((attr) => ({
      label: attr.name,
      ok: !!String(extraAttributeValues[attr.id] ?? "").trim(),
    }));

    const checks = [
      {
        label: "Título",
        ok: !!title.trim(),
      },
      {
        label: "Imagen mínimo 1",
        ok: !!property?.images?.length,
      },
      {
        label: "Categoría hoja Mercado Libre",
        ok: !!categoryId.trim(),
      },
      {
        label: "Precio mayor a cero",
        ok: !!parsedPrice && parsedPrice > 0,
      },
      ...requiredBaseChecks,
      ...requiredExtraChecks,
      {
        label: "Barrio, ciudad y provincia",
        ok: !!neighborhood.trim() && !!city.trim() && !!state.trim(),
      },
      {
        label: "Latitud y longitud",
        ok: parsedLatitude !== undefined && parsedLongitude !== undefined,
      },
    ];

    return {
      checks,
      canPublish: checks.every((check) => check.ok),
    };
  }, [
    bathrooms,
    bedrooms,
    categoryId,
    city,
    coveredArea,
    extraAttributeValues,
    garages,
    latitude,
    longitude,
    neighborhood,
    price,
    property?.images?.length,
    requiredBaseAttributes,
    requiredExtraAttributes,
    rooms,
    state,
    title,
    totalArea,
  ]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!property || !propertyId) {
        throw new Error("No se pudo resolver la propiedad.");
      }

      if (property.ml?.itemId) {
        throw new Error("Esta propiedad ya tiene una publicación en Mercado Libre.");
      }

      if (!validation.canPublish) {
        throw new Error("Completá los datos obligatorios antes de publicar.");
      }

      const parsedPrice = parseNumber(price) ?? 0;
      const parsedLatitude = parseNumber(latitude);
      const parsedLongitude = parseNumber(longitude);
      const parsedTotalArea = parseNumber(totalArea);
      const parsedCoveredArea = parseNumber(coveredArea);
      const parsedRooms = parseNumber(rooms);
      const parsedBedrooms = parseNumber(bedrooms);
      const parsedBathrooms = parseNumber(bathrooms);
      const parsedGarages = garages.trim() === "" ? 0 : parseNumber(garages);
      const parsedAge = parseNumber(age);
      const parsedFloors = parseNumber(floors);

      const updatePayload: Partial<CreatePropertyPayload> = {
        propertyType: mapMlPropertyTypeToCrmPropertyType(mlPropertyType),
        operationType,
        price: parsedPrice,
        currency,
        address: {
          street: street.trim() || undefined,
          number: number.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          country: country.trim() || "Argentina",
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          showExactLocation: property.address?.showExactLocation ?? true,
        },
        features: {
          ...(property.features ?? {}),
          totalArea: parsedTotalArea,
          coveredArea: parsedCoveredArea,
          rooms: parsedRooms,
          bedrooms: parsedBedrooms,
          bathrooms: parsedBathrooms,
          garages: parsedGarages,
          age: parsedAge,
          floors: parsedFloors,
          hasPool: !!property.features?.hasPool,
          hasGrill: !!property.features?.hasGrill,
          hasGarden: !!property.features?.hasGarden,
          hasSecurity: !!property.features?.hasSecurity,
          hasElevator: !!property.features?.hasElevator,
          hasBalcony: !!property.features?.hasBalcony,
          hasTerrace: !!property.features?.hasTerrace,
        },
      };

      await propertiesService.update(propertyId, updatePayload);

      const location = {
        address_line:
          [street, number, neighborhood, city, state, country]
            .map((item) => item.trim())
            .filter(Boolean)
            .join(", ") || "Dirección a consultar",
        neighborhood: {
          id: "",
          name: neighborhood.trim(),
        },
        city: {
          id: "",
          name: city.trim(),
        },
        state: {
          id: "",
          name: state.trim(),
        },
        country: {
          id: "AR",
          name: country.trim() || "Argentina",
        },
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      };

      const extraAttributes = requiredExtraAttributes
        .map((attr) =>
          buildMercadoLibreAttributeFromValue(
            attr,
            extraAttributeValues[attr.id] || "",
          ),
        )
        .filter(Boolean) as any[];

      const payload: PublishPropertyMercadoLibrePayload = {
        categoryId: categoryId.trim(),
        listingTypeId,
        condition,
        currencyId: currency,
        price: parsedPrice,
        title: title.trim(),
        testMode,
        location,
        attributes: extraAttributes.length ? extraAttributes : undefined,
      };

      return propertiesService.publishToMercadoLibre(propertyId, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });

      if (res.needsPayment) {
        toast.warning(
          "Mercado Libre creó la publicación, pero requiere pago para activarse.",
        );
      } else {
        toast.success("Propiedad publicada en Mercado Libre");
      }

      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      console.error("Error publicando en Mercado Libre:", err);

      const message =
        err?.data?.data?.cause?.[0]?.message ||
        err?.data?.cause?.[0]?.message ||
        err?.response?.data?.data?.cause?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo publicar en Mercado Libre";

      toast.error(message);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Publicar en Mercado Libre
            </h2>
            <p className="text-sm text-muted-foreground">
              Revisá la categoría, el paquete y los datos obligatorios antes de publicar.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            disabled={publishMutation.isPending}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {property?.ml?.itemId ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-700">
                Esta propiedad ya tiene una publicación en Mercado Libre: {property.ml.itemId}
              </div>
            ) : null}

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tipo de publicación
                </h3>
                <p className="text-xs text-muted-foreground">
                  Esto define la categoría hoja que se envía a Mercado Libre.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de inmueble</Label>
                  <select
                    value={mlPropertyType}
                    onChange={(e) => setMlPropertyType(e.target.value as MlPropertyType)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    {ML_PROPERTY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Operación</Label>
                  <select
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value as PropertyOperationType)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    {ML_OPERATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Subtipo</Label>
                  <select
                    value={saleSubtype}
                    onChange={(e) => setSaleSubtype(e.target.value as MlSaleSubtype)}
                    disabled={!hasSubtypes}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-60"
                  >
                    {ML_SUBTYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!hasSubtypes ? (
                    <p className="text-xs text-muted-foreground">
                      Esta categoría no usa subtipo.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground">Categoría detectada</p>
                <p className="font-medium text-foreground">
                  {autoCategoryId || "Sin categoría automática"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getCategoryLabel(autoCategoryId)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Category ID manual</Label>
                <Input
                  value={manualCategoryId}
                  onChange={(e) => setManualCategoryId(e.target.value)}
                  placeholder={autoCategoryId || "Ej: MLA401685"}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Si completás este campo, pisa la categoría automática.
                  Sirve para casos especiales o categorías nuevas.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Paquete y datos de publicación
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Paquete de publicación</Label>
                  <select
                    value={listingTypeId}
                    onChange={(e) => setListingTypeId(e.target.value as ListingTypeId)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    {listingTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {listingTypeOptions.find((option) => option.value === listingTypeId)?.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Condición</Label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ConditionType)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="used">Usada</option>
                    <option value="new">Nueva</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_160px] gap-3">
                <div className="space-y-1.5">
                  <Label>Título ML</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-secondary border-border"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/60 caracteres. El backend también corta a 60.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Precio</Label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-secondary border-border"
                    inputMode="decimal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as PropertyCurrency)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="h-4 w-4"
                />
                Agregar texto de prueba al título. Ojo: con cuenta real igual puede crear publicación real.
              </label>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Datos técnicos obligatorios
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumberField label={`M² totales${requiredBaseAttributeIds.has("TOTAL_AREA") ? " *" : ""}`} value={totalArea} onChange={setTotalArea} />
                <NumberField label={`M² cubiertos${requiredBaseAttributeIds.has("COVERED_AREA") ? " *" : ""}`} value={coveredArea} onChange={setCoveredArea} />
                <NumberField label={`Ambientes${requiredBaseAttributeIds.has("ROOMS") ? " *" : ""}`} value={rooms} onChange={setRooms} />
                <NumberField label={`Dormitorios${requiredBaseAttributeIds.has("BEDROOMS") ? " *" : ""}`} value={bedrooms} onChange={setBedrooms} />
                <NumberField label={`Baños${requiredBaseAttributeIds.has("FULL_BATHROOMS") ? " *" : ""}`} value={bathrooms} onChange={setBathrooms} />
                <NumberField label={`Cocheras${requiredBaseAttributeIds.has("PARKING_LOTS") ? " *" : ""}`} value={garages} onChange={setGarages} />
                <NumberField label="Antigüedad" value={age} onChange={setAge} />
                <NumberField label="Plantas" value={floors} onChange={setFloors} />
              </div>

              <p className="text-xs text-muted-foreground">
                Estos campos se guardan también en la propiedad antes de enviarla a Mercado Libre.
              </p>
            </div>

            {requiredExtraAttributes.length ? (
              <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Datos extra requeridos por Mercado Libre
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cambian según la categoría seleccionada. Se envían como attributes a Mercado Libre.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredExtraAttributes.map((attr) => (
                    <MercadoLibreAttributeField
                      key={attr.id}
                      attr={attr}
                      value={extraAttributeValues[attr.id] || ""}
                      onChange={(value) =>
                        setExtraAttributeValues((prev) => ({
                          ...prev,
                          [attr.id]: value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Ubicación obligatoria
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField label="Calle" value={street} onChange={setStreet} />
                <TextField label="Número" value={number} onChange={setNumber} />
                <TextField label="Barrio" value={neighborhood} onChange={setNeighborhood} />
                <TextField label="Ciudad" value={city} onChange={setCity} />
                <TextField label="Provincia" value={state} onChange={setState} />
                <TextField label="País" value={country} onChange={setCountry} />
              </div>

              <PropertyLocationMapPicker
                street={street}
                number={number}
                neighborhood={neighborhood}
                city={city}
                state={state}
                country={country}
                latitude={latitude}
                longitude={longitude}
                onLatitudeChange={setLatitude}
                onLongitudeChange={setLongitude}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Checklist ML
              </h3>

              <div className="space-y-2">
                {validation.checks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    {check.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={check.ok ? "text-foreground" : "text-yellow-700"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {property?.ml?.itemId ? (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estado ML</p>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getMercadoLibreStatusClass(
                        property.ml.status,
                      )}`}
                    >
                      {getMercadoLibreStatusLabel(property.ml.status)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Item: <span className="text-foreground">{property.ml.itemId}</span>
                </p>

                {property.ml.permalink ? (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={property.ml.permalink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Ver publicación
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Resumen de envío
              </h3>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Categoría: <span className="text-foreground">{categoryId || "Falta"}</span>
                </p>
                <p>
                  Ruta: <span className="text-foreground">{getCategoryLabel(categoryId)}</span>
                </p>
                <p>
                  Paquete: <span className="text-foreground">{listingTypeId}</span>
                </p>
                <p>
                  Moneda: <span className="text-foreground">{currency}</span>
                </p>
                <p>
                  Precio: <span className="text-foreground">{price || "Falta"}</span>
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => publishMutation.mutate()}
                disabled={
                  publishMutation.isPending ||
                  !validation.canPublish ||
                  !!property?.ml?.itemId
                }
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Confirmar y publicar"
                )}
              </Button>

              {!validation.canPublish ? (
                <p className="text-xs text-muted-foreground">
                  Completá los ítems pendientes del checklist para habilitar la publicación.
                </p>
              ) : null}

              {property?.ml?.itemId ? (
                <p className="text-xs text-muted-foreground">
                  Esta propiedad ya está vinculada a Mercado Libre. No se puede publicar de nuevo desde este modal.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function MercadoLibreAttributeField({
  attr,
  value,
  onChange,
}: {
  attr: MercadoLibreRequiredAttribute;
  value: string;
  onChange: (value: string) => void;
}) {
  if (attr.valueType === "list" || attr.valueType === "boolean") {
    return (
      <div className="space-y-1.5">
        <Label>{attr.name} *</Label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
        >
          <option value="">Seleccionar</option>
          {(attr.values ?? []).map((option) => (
            <option key={option.id || option.name} value={option.id || option.name}>
              {option.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{attr.id}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>{attr.name} *</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border-border"
        inputMode={attr.valueType === "number" || attr.valueType === "number_unit" ? "decimal" : "text"}
        placeholder={attr.valueType === "number_unit" ? `Número en ${attr.defaultUnit || attr.allowedUnits?.[0]?.name || "unidad"}` : undefined}
      />
      <p className="text-xs text-muted-foreground">{attr.id}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border-border"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border-border"
        inputMode="decimal"
      />
    </div>
  );
}
