import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { LoadingState } from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  CircleHelp,
  Trash2,
  FileText,
  ExternalLink,
  Home,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  propertiesService,
  CreatePropertyPayload,
  PropertyStatus,
  PropertyOperationType,
  PropertyType,
  Property,
} from "@/services/properties.service";
import { uploadsService } from "@/services/uploads.service";
import { toast } from "sonner";
import { MercadoLibrePublishModal } from "./components/MercadoLibrePublishModal";

type PropertyImageForm = {
  url: string;
  publicId: string;
  order?: number;
  isCover?: boolean;
};

type PropertyDocumentForm = {
  label: string;
  type: string;
  url: string;
  publicId: string;
  fileName?: string;
  mimeType?: string;
  uploadedAt?: string;
};

const DOCUMENT_TYPE_OPTIONS = [
  { value: "escritura", label: "Escritura" },
  { value: "boleto", label: "Boleto" },
  { value: "reserva", label: "Reserva" },
  { value: "plano", label: "Plano" },
  { value: "impuesto_municipal", label: "Impuesto municipal" },
  { value: "expensas", label: "Expensas" },
  { value: "reglamento", label: "Reglamento" },
  { value: "autorizacion_venta", label: "Autorización de venta" },
  { value: "dni_propietario", label: "DNI propietario" },
  { value: "otro", label: "Otro" },
];

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value?: number | null) {
  return moneyFormatter.format(Number(value ?? 0));
}

function toRawMoneyString(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(value).replace(".", ",");
}

function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/\./g, "").replace(/[^\d,]/g, "");
  if (!cleaned) return 0;

  const parts = cleaned.split(",");
  const integerPart = (parts[0] || "0").replace(/^0+(?=\d)/, "") || "0";
  const decimalPart = (parts[1] || "").slice(0, 2);

  const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumberInput(raw: string): number | undefined {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeImages(images: PropertyImageForm[]) {
  if (!images.length) return [];

  const hasCover = images.some((img) => img.isCover);

  return images.map((img, index) => ({
    ...img,
    order: index,
    isCover: hasCover ? !!img.isCover : index === 0,
  }));
}

function normalizeDocuments(documents: PropertyDocumentForm[]) {
  return documents
    .map((document) => ({
      label: document.label?.trim() || "Documento",
      type: document.type?.trim() || "otro",
      url: document.url,
      publicId: document.publicId,
      fileName: document.fileName?.trim() || undefined,
      mimeType: document.mimeType?.trim() || undefined,
      uploadedAt: document.uploadedAt || new Date().toISOString(),
    }))
    .filter((document) => document.url && document.publicId);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function getDocumentTypeLabel(type?: string) {
  return (
    DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    "Documento"
  );
}

function getDocumentDefaultLabel(file: File) {
  const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
  return name.trim() || "Documento";
}

function FieldLabel({
  children,
  info,
}: {
  children: React.ReactNode;
  info?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{children}</Label>
      {info ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Información sobre ${children}`}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-black text-white border border-border text-xs"
          >
            {info}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

function createInitialForm(): CreatePropertyPayload {
  return {
    title: "",
    slug: "",
    description: "",
    operationType: "venta",
    propertyType: "casa",
    status: "draft",
    showOnLanding: false,
    price: 0,
    currency: "USD",
    expenses: 0,
    acceptsFinancing: false,
    acceptsExchange: false,
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "Buenos Aires",
      country: "Argentina",
      latitude: undefined,
      longitude: undefined,
      showExactLocation: false,
    },
    features: {
      totalArea: undefined,
      coveredArea: undefined,
      rooms: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      garages: undefined,
      age: undefined,
      floors: undefined,
      hasPool: false,
      hasGrill: false,
      hasGarden: false,
      hasSecurity: false,
      hasElevator: false,
      hasBalcony: false,
      hasTerrace: false,
    },
    images: [],
    documents: [],
    internalNotes: "",
  };
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
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  }

  if (status === "payment_required") {
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  }

  if (status === "paused") {
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  }

  return "bg-secondary text-muted-foreground border-border";
}

export default function PropertyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const initialImagePublicIdsRef = useRef<Set<string>>(new Set());
  const uploadedThisSessionRef = useRef<Set<string>>(new Set());
  const removedExistingImagesRef = useRef<Set<string>>(new Set());

  const initialDocumentPublicIdsRef = useRef<Set<string>>(new Set());
  const uploadedDocumentsThisSessionRef = useRef<Set<string>>(new Set());
  const removedExistingDocumentsRef = useRef<Set<string>>(new Set());

  const hasCommittedRef = useRef(false);

  const [form, setForm] = useState<CreatePropertyPayload>(createInitialForm);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [expensesInput, setExpensesInput] = useState("");
  const [isMercadoLibreModalOpen, setIsMercadoLibreModalOpen] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertiesService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existing) return;

    const mappedImages =
      existing.images?.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        order: img.order ?? index,
        isCover: img.isCover ?? index === 0,
      })) ?? [];

    const mappedDocuments =
      existing.documents?.map((document) => ({
        label: document.label ?? "Documento",
        type: document.type ?? "otro",
        url: document.url,
        publicId: document.publicId,
        fileName: document.fileName ?? undefined,
        mimeType: document.mimeType ?? undefined,
        uploadedAt: document.uploadedAt ?? undefined,
      })) ?? [];

    const normalizedImages = normalizeImages(mappedImages);
    const normalizedDocuments = normalizeDocuments(mappedDocuments);

    setForm({
      title: existing.title ?? "",
      slug: existing.slug ?? "",
      description: existing.description ?? "",
      operationType: existing.operationType ?? "venta",
      propertyType: existing.propertyType ?? "casa",
      status: existing.status ?? "draft",
      showOnLanding: existing.showOnLanding ?? false,
      price: existing.price ?? 0,
      currency: existing.currency ?? "USD",
      expenses: existing.expenses ?? 0,
      acceptsFinancing: existing.acceptsFinancing ?? false,
      acceptsExchange: existing.acceptsExchange ?? false,
      address: {
        street: existing.address?.street ?? "",
        number: existing.address?.number ?? "",
        neighborhood: existing.address?.neighborhood ?? "",
        city: existing.address?.city ?? "",
        state: existing.address?.state ?? "Buenos Aires",
        country: existing.address?.country ?? "Argentina",
        latitude: existing.address?.latitude ?? undefined,
        longitude: existing.address?.longitude ?? undefined,
        showExactLocation: existing.address?.showExactLocation ?? false,
      },
      features: {
        totalArea: existing.features?.totalArea ?? undefined,
        coveredArea: existing.features?.coveredArea ?? undefined,
        rooms: existing.features?.rooms ?? undefined,
        bedrooms: existing.features?.bedrooms ?? undefined,
        bathrooms: existing.features?.bathrooms ?? undefined,
        garages: existing.features?.garages ?? undefined,
        age: existing.features?.age ?? undefined,
        floors: existing.features?.floors ?? undefined,
        hasPool: existing.features?.hasPool ?? false,
        hasGrill: existing.features?.hasGrill ?? false,
        hasGarden: existing.features?.hasGarden ?? false,
        hasSecurity: existing.features?.hasSecurity ?? false,
        hasElevator: existing.features?.hasElevator ?? false,
        hasBalcony: existing.features?.hasBalcony ?? false,
        hasTerrace: existing.features?.hasTerrace ?? false,
      },
      images: normalizedImages,
      documents: normalizedDocuments,
      internalNotes: existing.internalNotes ?? "",
    });

    setPriceInput(existing.price ? formatMoney(existing.price) : "");
    setExpensesInput(existing.expenses ? formatMoney(existing.expenses) : "");

    initialImagePublicIdsRef.current = new Set(
      normalizedImages.map((img) => img.publicId),
    );
    initialDocumentPublicIdsRef.current = new Set(
      normalizedDocuments.map((document) => document.publicId),
    );

    removedExistingImagesRef.current = new Set();
    uploadedThisSessionRef.current = new Set();
    removedExistingDocumentsRef.current = new Set();
    uploadedDocumentsThisSessionRef.current = new Set();

    setSlugTouched(true);
  }, [existing]);

  useEffect(() => {
    if (isEditing) return;
    if (slugTouched) return;

    const generatedSlug = slugify(form.title || "");

    setForm((prev) => {
      if (prev.slug === generatedSlug) return prev;
      return {
        ...prev,
        slug: generatedSlug,
      };
    });
  }, [form.title, slugTouched, isEditing]);

  useEffect(() => {
    return () => {
      if (hasCommittedRef.current) return;

      const pendingImagePublicIds = Array.from(uploadedThisSessionRef.current);
      const pendingDocumentPublicIds = Array.from(
        uploadedDocumentsThisSessionRef.current,
      );

      if (pendingImagePublicIds.length > 0) {
        void Promise.allSettled(
          pendingImagePublicIds.map((publicId) =>
            uploadsService.deleteImage(publicId),
          ),
        );
      }

      if (pendingDocumentPublicIds.length > 0) {
        void Promise.allSettled(
          pendingDocumentPublicIds.map((publicId) =>
            uploadsService.deleteDocument(publicId),
          ),
        );
      }
    };
  }, []);

  const updateAddress = (
    field: keyof NonNullable<CreatePropertyPayload["address"]>,
    value: string | number | boolean | undefined,
  ) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...(prev.address ?? {}),
        [field]: value,
      },
    }));
  };

  const updateFeature = (
    field: keyof NonNullable<CreatePropertyPayload["features"]>,
    value: number | boolean | undefined,
  ) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...(prev.features ?? {}),
        [field]: value,
      },
    }));
  };

  const handlePriceFocus = () => {
    setPriceInput(toRawMoneyString(form.price));
  };

  const handlePriceChange = (raw: string) => {
    setPriceInput(raw);
    setForm((prev) => ({
      ...prev,
      price: parseMoneyInput(raw),
    }));
  };

  const handlePriceBlur = () => {
    if (!priceInput.trim()) {
      setPriceInput("");
      setForm((prev) => ({ ...prev, price: 0 }));
      return;
    }

    const parsed = parseMoneyInput(priceInput);
    setForm((prev) => ({ ...prev, price: parsed }));
    setPriceInput(formatMoney(parsed));
  };

  const handleExpensesFocus = () => {
    setExpensesInput(toRawMoneyString(form.expenses));
  };

  const handleExpensesChange = (raw: string) => {
    setExpensesInput(raw);
    setForm((prev) => ({
      ...prev,
      expenses: parseMoneyInput(raw),
    }));
  };

  const handleExpensesBlur = () => {
    if (!expensesInput.trim()) {
      setExpensesInput("");
      setForm((prev) => ({ ...prev, expenses: 0 }));
      return;
    }

    const parsed = parseMoneyInput(expensesInput);
    setForm((prev) => ({ ...prev, expenses: parsed }));
    setExpensesInput(formatMoney(parsed));
  };


  const mutation = useMutation({
    mutationFn: () => {
      const title = form.title.trim();
      const slug = slugify(form.slug || title);

      if (!title) {
        throw new Error("Cargá el título de la propiedad.");
      }

      if (!slug) {
        throw new Error("El slug es obligatorio.");
      }

      const payload: CreatePropertyPayload = {
        ...form,
        title,
        slug,
        description: form.description?.trim() || "",
        operationType: form.operationType ?? "venta",
        propertyType: form.propertyType ?? "casa",
        status: form.status ?? "draft",
        showOnLanding: !!form.showOnLanding,
        price: Number(form.price ?? 0),
        currency: form.currency ?? "USD",
        expenses: Number(form.expenses ?? 0),
        acceptsFinancing: !!form.acceptsFinancing,
        acceptsExchange: !!form.acceptsExchange,
        address: {
          street: form.address?.street?.trim() || undefined,
          number: form.address?.number?.trim() || undefined,
          neighborhood: form.address?.neighborhood?.trim() || undefined,
          city: form.address?.city?.trim() || undefined,
          state: form.address?.state?.trim() || undefined,
          country: form.address?.country?.trim() || "Argentina",
          latitude: form.address?.latitude,
          longitude: form.address?.longitude,
          showExactLocation: !!form.address?.showExactLocation,
        },
        features: {
          totalArea: form.features?.totalArea,
          coveredArea: form.features?.coveredArea,
          rooms: form.features?.rooms,
          bedrooms: form.features?.bedrooms,
          bathrooms: form.features?.bathrooms,
          garages: form.features?.garages,
          age: form.features?.age,
          floors: form.features?.floors,
          hasPool: !!form.features?.hasPool,
          hasGrill: !!form.features?.hasGrill,
          hasGarden: !!form.features?.hasGarden,
          hasSecurity: !!form.features?.hasSecurity,
          hasElevator: !!form.features?.hasElevator,
          hasBalcony: !!form.features?.hasBalcony,
          hasTerrace: !!form.features?.hasTerrace,
        },
        images: normalizeImages((form.images ?? []) as PropertyImageForm[]),
        documents: normalizeDocuments(
          (form.documents ?? []) as PropertyDocumentForm[],
        ),
        internalNotes: form.internalNotes?.trim() || "",
      };

      return isEditing
        ? propertiesService.update(id!, payload)
        : propertiesService.create(payload);
    },

    onSuccess: async () => {
      hasCommittedRef.current = true;

      const removedOldImages = Array.from(removedExistingImagesRef.current);
      const removedOldDocuments = Array.from(removedExistingDocumentsRef.current);

      if (removedOldImages.length > 0) {
        const results = await Promise.allSettled(
          removedOldImages.map((publicId) =>
            uploadsService.deleteImage(publicId),
          ),
        );

        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed > 0) {
          toast.warning(
            `${failed} imagen(es) viejas no se pudieron borrar de Cloudinary`,
          );
        }
      }

      if (removedOldDocuments.length > 0) {
        const results = await Promise.allSettled(
          removedOldDocuments.map((publicId) =>
            uploadsService.deleteDocument(publicId),
          ),
        );

        const failed = results.filter((r) => r.status === "rejected").length;

        if (failed > 0) {
          toast.warning(
            `${failed} documento(s) viejo(s) no se pudieron borrar de Cloudinary`,
          );
        }
      }

      removedExistingImagesRef.current.clear();
      uploadedThisSessionRef.current.clear();
      removedExistingDocumentsRef.current.clear();
      uploadedDocumentsThisSessionRef.current.clear();

      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", id] });

      toast.success(isEditing ? "Propiedad actualizada" : "Propiedad creada");
      navigate("/dashboard/properties");
    },

    onError: (err: any) => {
      toast.error(err?.message || "Error al guardar");
    },
  });

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    const selectedFiles = Array.from(files);

    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith("image/"),
    );

    if (invalidFiles.length > 0) {
      toast.error("Solo podés subir archivos de imagen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadedImages: PropertyImageForm[] = [];

      for (const file of selectedFiles) {
        const res = await uploadsService.uploadImage(file);

        uploadedImages.push({
          url: res.url,
          publicId: res.publicId,
          order: 0,
          isCover: false,
        });

        uploadedThisSessionRef.current.add(res.publicId);
      }

      setForm((prev) => {
        const existingImages = prev.images ?? [];
        const merged = normalizeImages([...existingImages, ...uploadedImages]);

        return {
          ...prev,
          images: merged,
        };
      });

      toast.success(`${uploadedImages.length} imagen(es) subida(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    const selectedFiles = Array.from(files);

    setUploadingDocument(true);

    try {
      const uploadedDocuments: PropertyDocumentForm[] = [];

      for (const file of selectedFiles) {
        const res = await uploadsService.uploadDocument(file);

        uploadedDocuments.push({
          label: getDocumentDefaultLabel(file),
          type: "otro",
          url: res.url,
          publicId: res.publicId,
          fileName: res.fileName ?? file.name,
          mimeType: res.mimeType ?? file.type,
          uploadedAt: res.uploadedAt ?? new Date().toISOString(),
        });

        uploadedDocumentsThisSessionRef.current.add(res.publicId);
      }

      setForm((prev) => ({
        ...prev,
        documents: normalizeDocuments([
          ...((prev.documents ?? []) as PropertyDocumentForm[]),
          ...uploadedDocuments,
        ]),
      }));

      toast.success(`${uploadedDocuments.length} documento(s) subido(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Error al subir documento");
    } finally {
      setUploadingDocument(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const removeImage = async (index: number) => {
    const currentImages = form.images ?? [];
    const imageToRemove = currentImages[index];

    if (!imageToRemove) return;

    setForm((prev) => {
      const nextImages = normalizeImages(
        (prev.images ?? []).filter((_, i) => i !== index),
      );

      return {
        ...prev,
        images: nextImages,
      };
    });

    const publicId = imageToRemove.publicId;

    if (uploadedThisSessionRef.current.has(publicId)) {
      uploadedThisSessionRef.current.delete(publicId);

      try {
        await uploadsService.deleteImage(publicId);
        toast.success("Imagen eliminada");
      } catch (err: any) {
        toast.error(
          err?.message || "No se pudo borrar la imagen de Cloudinary",
        );
      }

      return;
    }

    if (initialImagePublicIdsRef.current.has(publicId)) {
      removedExistingImagesRef.current.add(publicId);
      toast.success("Imagen quitada de la propiedad");
    }
  };

  const removeDocument = async (index: number) => {
    const currentDocuments = (form.documents ?? []) as PropertyDocumentForm[];
    const documentToRemove = currentDocuments[index];

    if (!documentToRemove) return;

    setForm((prev) => ({
      ...prev,
      documents: normalizeDocuments(
        ((prev.documents ?? []) as PropertyDocumentForm[]).filter(
          (_, i) => i !== index,
        ),
      ),
    }));

    const publicId = documentToRemove.publicId;

    if (uploadedDocumentsThisSessionRef.current.has(publicId)) {
      uploadedDocumentsThisSessionRef.current.delete(publicId);

      try {
        await uploadsService.deleteDocument(publicId);
        toast.success("Documento eliminado");
      } catch (err: any) {
        toast.error(
          err?.message || "No se pudo borrar el documento de Cloudinary",
        );
      }

      return;
    }

    if (initialDocumentPublicIdsRef.current.has(publicId)) {
      removedExistingDocumentsRef.current.add(publicId);
      toast.success("Documento quitado de la propiedad");
    }
  };

  const updateDocument = (
    index: number,
    field: keyof PropertyDocumentForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      documents: normalizeDocuments(
        ((prev.documents ?? []) as PropertyDocumentForm[]).map((document, i) =>
          i === index ? { ...document, [field]: value } : document,
        ),
      ),
    }));
  };

  const setCoverImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: normalizeImages(
        (prev.images ?? []).map((img, i) => ({
          ...img,
          isCover: i === index,
        })),
      ),
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setForm((prev) => {
      const current = [...(prev.images ?? [])];

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return prev;
      }

      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);

      return {
        ...prev,
        images: normalizeImages(current),
      };
    });
  };

  const mercadoLibreModalProperty: Property | null = existing
    ? ({
        ...existing,
        title: form.title || existing.title,
        slug: form.slug || existing.slug,
        description: form.description ?? existing.description,
        operationType: form.operationType ?? existing.operationType,
        propertyType: form.propertyType ?? existing.propertyType,
        status: form.status ?? existing.status,
        showOnLanding: !!form.showOnLanding,
        price: Number(form.price ?? existing.price ?? 0),
        currency: form.currency ?? existing.currency,
        expenses: Number(form.expenses ?? existing.expenses ?? 0),
        acceptsFinancing: !!form.acceptsFinancing,
        acceptsExchange: !!form.acceptsExchange,
        address: form.address ?? existing.address,
        features: form.features ?? existing.features,
        images: (form.images as any) ?? existing.images,
        documents: (form.documents as any) ?? existing.documents,
        internalNotes: form.internalNotes ?? existing.internalNotes,
        ml: existing.ml,
      } as Property)
    : null;

  if (isEditing && isLoading) return <LoadingState />;

  return (
    <div>
      <DashboardTopbar
        title={isEditing ? "Editar propiedad" : "Nueva propiedad"}
        subtitle="Formulario inmobiliario separado del módulo de productos"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/properties")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Button>

            <Button
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-6xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary p-2">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Información principal
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Estos datos se usan para el CRM, la landing pública y luego para Mercado Libre.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Título</FieldLabel>
              <Input
                placeholder="Ej: Casa moderna en Canning"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel info="Se genera automático desde el título, pero podés editarlo. Se usa para la URL pública.">
                Slug
              </FieldLabel>
              <Input
                placeholder="casa-moderna-en-canning"
                value={form.slug ?? ""}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }));
                }}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Estado</FieldLabel>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as PropertyStatus,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
                <option value="paused">Pausada</option>
                <option value="sold">Vendida</option>
                <option value="rented">Alquilada</option>
                <option value="archived">Archivada</option>
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Operación</FieldLabel>
              <select
                value={form.operationType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    operationType: e.target.value as PropertyOperationType,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="alquiler_temporario">Alquiler temporario</option>
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Tipo de propiedad</FieldLabel>
              <select
                value={form.propertyType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    propertyType: e.target.value as PropertyType,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
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
            </div>

            <div className="space-y-2">
              <FieldLabel>Visible en landing</FieldLabel>
              <select
                value={form.showOnLanding ? "true" : "false"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    showOnLanding: e.target.value === "true",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="false">No mostrar</option>
                <option value="true">Mostrar en landing</option>
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Moneda</FieldLabel>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    currency: e.target.value as "ARS" | "USD",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Precio</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={priceInput}
                onFocus={handlePriceFocus}
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Expensas</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={expensesInput}
                onFocus={handleExpensesFocus}
                onChange={(e) => handleExpensesChange(e.target.value)}
                onBlur={handleExpensesBlur}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={!!form.acceptsFinancing}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    acceptsFinancing: e.target.checked,
                  }))
                }
              />
              Acepta financiación
            </label>

            <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={!!form.acceptsExchange}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    acceptsExchange: e.target.checked,
                  }))
                }
              />
              Acepta permuta
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Descripción</h2>

          <Textarea
            placeholder="Descripción comercial de la propiedad..."
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="bg-secondary border-border min-h-[140px]"
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Ubicación</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <FieldLabel>Calle</FieldLabel>
              <Input
                placeholder="Ej: Mariano Castex"
                value={form.address?.street ?? ""}
                onChange={(e) => updateAddress("street", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Número</FieldLabel>
              <Input
                placeholder="499"
                value={form.address?.number ?? ""}
                onChange={(e) => updateAddress("number", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Barrio / Zona</FieldLabel>
              <Input
                placeholder="Ej: Canning"
                value={form.address?.neighborhood ?? ""}
                onChange={(e) => updateAddress("neighborhood", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Ciudad</FieldLabel>
              <Input
                placeholder="Ej: Ezeiza"
                value={form.address?.city ?? ""}
                onChange={(e) => updateAddress("city", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Provincia</FieldLabel>
              <Input
                placeholder="Buenos Aires"
                value={form.address?.state ?? ""}
                onChange={(e) => updateAddress("state", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>País</FieldLabel>
              <Input
                placeholder="Argentina"
                value={form.address?.country ?? ""}
                onChange={(e) => updateAddress("country", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Latitud</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="-34.856..."
                value={form.address?.latitude ?? ""}
                onChange={(e) =>
                  updateAddress("latitude", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Longitud</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="-58.506..."
                value={form.address?.longitude ?? ""}
                onChange={(e) =>
                  updateAddress("longitude", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground w-fit">
            <input
              type="checkbox"
              checked={!!form.address?.showExactLocation}
              onChange={(e) =>
                updateAddress("showExactLocation", e.target.checked)
              }
            />
            Mostrar ubicación exacta en la landing
          </label>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Características
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <FieldLabel>Metros totales</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="420"
                value={form.features?.totalArea ?? ""}
                onChange={(e) =>
                  updateFeature("totalArea", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Metros cubiertos</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="180"
                value={form.features?.coveredArea ?? ""}
                onChange={(e) =>
                  updateFeature("coveredArea", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Ambientes</FieldLabel>
              <Input
                type="number"
                placeholder="5"
                value={form.features?.rooms ?? ""}
                onChange={(e) =>
                  updateFeature("rooms", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Dormitorios</FieldLabel>
              <Input
                type="number"
                placeholder="3"
                value={form.features?.bedrooms ?? ""}
                onChange={(e) =>
                  updateFeature("bedrooms", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Baños</FieldLabel>
              <Input
                type="number"
                placeholder="2"
                value={form.features?.bathrooms ?? ""}
                onChange={(e) =>
                  updateFeature("bathrooms", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Cocheras</FieldLabel>
              <Input
                type="number"
                placeholder="2"
                value={form.features?.garages ?? ""}
                onChange={(e) =>
                  updateFeature("garages", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Antigüedad</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={form.features?.age ?? ""}
                onChange={(e) =>
                  updateFeature("age", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Plantas / pisos</FieldLabel>
              <Input
                type="number"
                placeholder="2"
                value={form.features?.floors ?? ""}
                onChange={(e) =>
                  updateFeature("floors", parseNumberInput(e.target.value))
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              ["hasPool", "Pileta"],
              ["hasGrill", "Parrilla"],
              ["hasGarden", "Jardín"],
              ["hasSecurity", "Seguridad"],
              ["hasElevator", "Ascensor"],
              ["hasBalcony", "Balcón"],
              ["hasTerrace", "Terraza"],
            ].map(([field, label]) => (
              <label
                key={field}
                className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
              >
                <input
                  type="checkbox"
                  checked={!!form.features?.[field as keyof typeof form.features]}
                  onChange={(e) =>
                    updateFeature(
                      field as keyof NonNullable<
                        CreatePropertyPayload["features"]
                      >,
                      e.target.checked,
                    )
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Imágenes</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            )}

            <p className="text-sm text-muted-foreground">
              {uploading
                ? "Optimizando y subiendo..."
                : "Arrastrá imágenes acá o hacé click para subir"}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG o WEBP hasta 10MB. La app reduce cada imagen por debajo
              de 1MB antes de subirla.
            </p>
          </div>

          {(form.images?.length ?? 0) > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                Arrastrá las imágenes para cambiar el orden.
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.images!.map((img, i) => (
                  <div
                    key={`${img.publicId}-${i}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex === null) return;
                      moveImage(dragIndex, i);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`relative group rounded-lg overflow-hidden aspect-square border transition ${
                      dragIndex === i
                        ? "border-primary opacity-60"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => void removeImage(i)}
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCoverImage(i)}
                      className="absolute bottom-1 left-1 text-[9px] bg-background/80 text-foreground px-1.5 py-0.5 rounded font-medium"
                    >
                      {img.isCover ? "Cover" : "Hacer cover"}
                    </button>

                    <div className="absolute top-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[9px] text-foreground font-medium">
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Documentos internos
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Guardá escritura, planos, autorizaciones, impuestos o documentos del propietario. No se muestran en la landing pública.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => documentInputRef.current?.click()}
              disabled={uploadingDocument}
            >
              {uploadingDocument ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              Subir documento
            </Button>
          </div>

          <input
            ref={documentInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleDocumentUpload}
          />

          {(form.documents?.length ?? 0) === 0 ? (
            <div
              onClick={() => documentInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            >
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Todavía no cargaste documentos.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG o WEBP hasta 10MB.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {((form.documents ?? []) as PropertyDocumentForm[]).map(
                (document, index) => (
                  <div
                    key={`${document.publicId}-${index}`}
                    className="rounded-lg border border-border bg-background/30 p-3 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="rounded-md bg-secondary p-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {document.label || "Documento"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {document.fileName || document.publicId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                          title="Abrir documento"
                        >
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void removeDocument(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Eliminar documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Nombre visible
                        </Label>
                        <Input
                          placeholder="Ej: Escritura"
                          value={document.label}
                          onChange={(e) =>
                            updateDocument(index, "label", e.target.value)
                          }
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Tipo
                        </Label>
                        <select
                          value={document.type}
                          onChange={(e) =>
                            updateDocument(index, "type", e.target.value)
                          }
                          className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                        >
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">
                        {getDocumentTypeLabel(document.type)}
                      </span>
                      {document.mimeType ? ` · ${document.mimeType}` : ""}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Mercado Libre
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Publicá esta propiedad en Mercado Libre y controlá el estado de
                la publicación.
              </p>
            </div>

            {existing?.ml?.status ? (
              <span
                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getMercadoLibreStatusClass(
                  existing.ml.status,
                )}`}
              >
                {getMercadoLibreStatusLabel(existing.ml.status)}
              </span>
            ) : null}
          </div>

          {!isEditing ? (
            <div className="rounded-md border border-border bg-secondary/40 px-3 py-3 text-sm text-muted-foreground">
              Primero guardá la propiedad. Después vas a poder publicarla en
              Mercado Libre.
            </div>
          ) : existing?.ml?.itemId ? (
            <div className="rounded-md border border-border bg-secondary/40 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Item ML</p>
                  <p className="font-medium text-foreground">
                    {existing.ml.itemId}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Paquete</p>
                  <p className="font-medium text-foreground">
                    {existing.ml.listingTypeId || "Sin dato"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Categoría</p>
                  <p className="font-medium text-foreground">
                    {existing.ml.categoryId || "Sin dato"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="font-medium text-foreground">
                    {getMercadoLibreStatusLabel(existing.ml.status)}
                  </p>
                </div>
              </div>

              {existing.ml.errorMessage ? (
                <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700">
                  {existing.ml.errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {existing.ml.permalink ? (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={existing.ml.permalink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Ver publicación
                    </a>
                  </Button>
                ) : null}

                {existing.ml.status === "payment_required" &&
                existing.ml.permalink ? (
                  <Button type="button" size="sm" asChild>
                    <a
                      href={existing.ml.permalink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pagar / activar en Mercado Libre
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-secondary/40 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Configurar publicación
                </p>
                <p className="text-sm text-muted-foreground">
                  Abrí el asistente para elegir tipo de inmueble, operación,
                  categoría, paquete de publicación y completar los datos
                  obligatorios para Mercado Libre.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsMercadoLibreModalOpen(true)}
                disabled={mutation.isPending}
              >
                Publicar en Mercado Libre
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Notas internas
          </h2>

          <Textarea
            placeholder="Notas internas de la propiedad..."
            value={form.internalNotes ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                internalNotes: e.target.value,
              }))
            }
            className="bg-secondary border-border min-h-[120px]"
          />
        </div>
      </div>

      <MercadoLibrePublishModal
        open={isMercadoLibreModalOpen}
        property={mercadoLibreModalProperty}
        onOpenChange={setIsMercadoLibreModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["properties"] });
          queryClient.invalidateQueries({ queryKey: ["property", id] });
        }}
      />
    </div>
  );
}