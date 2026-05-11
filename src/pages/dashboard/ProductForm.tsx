

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
  Plus,
  Trash2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsService,
  CreateProductPayload,
  ProductType,
} from "@/services/products.service";
import { businessesService } from "@/services/businesses.service";
import { uploadsService } from "@/services/uploads.service";
import { toast } from "sonner";

type ProductImageForm = {
  url: string;
  publicId: string;
  order?: number;
  isCover?: boolean;
};

type ProductDocumentForm = {
  label: string;
  type: string;
  url: string;
  publicId: string;
  fileName?: string;
  mimeType?: string;
  uploadedAt?: string;
};

type ProductVariantForm = {
  size: string;
  color: string;
  sku: string;
  salePrice?: number;
  stock: number;
};

type ProductListItem = {
  id?: string;
  _id?: string;
  category?: string | null;
};

const DOCUMENT_TYPE_OPTIONS = [
  { value: "cedula", label: "Cédula" },
  { value: "titulo", label: "Título" },
  { value: "formulario_08", label: "Formulario 08" },
  { value: "verificacion_policial", label: "Verificación policial" },
  { value: "informe_dominio", label: "Informe dominio" },
  { value: "seguro", label: "Seguro" },
  { value: "vendedor", label: "Documento vendedor" },
  { value: "comprador", label: "Documento comprador" },
  { value: "otro", label: "Otro" },
];

function createEmptyVariant(): ProductVariantForm {
  return {
    size: "",
    color: "",
    sku: "",
    salePrice: undefined,
    stock: 0,
  };
}

function ensureAtLeastOneVariant(
  variants?: ProductVariantForm[],
): ProductVariantForm[] {
  if (!variants || variants.length === 0) {
    return [createEmptyVariant()];
  }

  return variants;
}

function normalizeCategoryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueCategories(values: string[]) {
  return Array.from(
    new Set(values.map(normalizeCategoryLabel).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatMoney(value?: number | null) {
  return moneyFormatter.format(Number(value ?? 0));
}

function formatInteger(value?: number | null) {
  return integerFormatter.format(Number(value ?? 0));
}

function toRawMoneyString(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(value).replace(".", ",");
}

function toRawIntegerString(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(Math.trunc(value));
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

function parseIntegerInput(raw: string): number {
  const cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return 0;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeImages(images: ProductImageForm[]) {
  if (!images.length) return [];

  const hasCover = images.some((img) => img.isCover);

  return images.map((img, index) => ({
    ...img,
    order: index,
    isCover: hasCover ? !!img.isCover : index === 0,
  }));
}

function normalizeDocuments(documents: ProductDocumentForm[]) {
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

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

function todayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function resolveProductTypeByBusinessType(
  businessType?: string | null,
): ProductType | null {
  if (businessType === "concesionaria") return "auto";
  if (businessType === "tienda_ropa") return "ropa";
  return null;
}

function buildAutoName(vehicleDetails?: CreateProductPayload["vehicleDetails"]) {
  const parts = [
    vehicleDetails?.brand?.trim(),
    vehicleDetails?.model?.trim(),
    vehicleDetails?.version?.trim(),
    vehicleDetails?.year ? String(vehicleDetails.year).trim() : "",
  ].filter(Boolean);

  return parts.join(" ").trim();
}

function buildAutoTags(
  form: CreateProductPayload,
  effectiveProductType: ProductType,
) {
  if (effectiveProductType === "auto") {
    return Array.from(
      new Set(
        [
          form.vehicleDetails?.brand,
          form.vehicleDetails?.model,
          form.vehicleDetails?.version,
          form.vehicleDetails?.year ? String(form.vehicleDetails.year) : "",
          form.vehicleDetails?.fuelType,
          form.vehicleDetails?.transmission,
          form.vehicleDetails?.color,
          form.category,
          "auto",
        ]
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    );
  }

  return Array.from(
    new Set(
      [form.name, form.category, effectiveProductType]
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );
}

function normalizeProductsResponse(response: unknown): ProductListItem[] {
  if (Array.isArray(response)) return response as ProductListItem[];

  const maybeObject = response as
    | {
        data?: ProductListItem[];
        items?: ProductListItem[];
        products?: ProductListItem[];
        docs?: ProductListItem[];
      }
    | undefined;

  if (Array.isArray(maybeObject?.data)) return maybeObject.data;
  if (Array.isArray(maybeObject?.items)) return maybeObject.items;
  if (Array.isArray(maybeObject?.products)) return maybeObject.products;
  if (Array.isArray(maybeObject?.docs)) return maybeObject.docs;

  return [];
}

export default function ProductFormPage() {
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

  const [form, setForm] = useState<CreateProductPayload>({
    name: "",
    slug: "",
    productType: "general",
    description: "",
    salePrice: 0,
    currency: "ARS",
    stock: 0,
    category: "",
    tags: [],
    images: [],
    documents: [],
    variants: [],
    status: "draft",
    isPublished: false,
    vehicleDetails: {},
    ownership: {
      ownershipType: "owned",
      purchasePrice: undefined,
      purchaseDate: undefined,
      ownerExpectedAmount: undefined,
      consignorName: "",
      consignorPhone: "",
    },
    extraExpenseItems: [],
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [salePriceInput, setSalePriceInput] = useState("");
  const [kmsInput, setKmsInput] = useState("");
  const [costPriceInput, setCostPriceInput] = useState("");
  const [estimatedSalePriceInput, setEstimatedSalePriceInput] = useState("");
  const [finalSalePriceInput, setFinalSalePriceInput] = useState("");
  const [ownerExpectedAmountInput, setOwnerExpectedAmountInput] = useState("");
  const [extraExpenseInputs, setExtraExpenseInputs] = useState<string[]>([]);

  const { data: business } = useQuery({
    queryKey: ["my-business"],
    queryFn: businessesService.getMyBusiness,
  });

  const forcedProductType = useMemo(
    () => resolveProductTypeByBusinessType(business?.businessType),
    [business?.businessType],
  );

  const effectiveProductType =
    forcedProductType ?? (form.productType ?? "general");
  const showManualProductTypeSelector = !forcedProductType;
  const isAutoBusiness = effectiveProductType === "auto";
  const isRopaBusiness = effectiveProductType === "ropa";
  const ownershipType = form.ownership?.ownershipType ?? "owned";
  const isConsignment = isAutoBusiness && ownershipType === "consignment";
  const isOwnedVehicle = isAutoBusiness && ownershipType === "owned";

  const cachedProductsForCategories = useMemo(() => {
    const possibleKeys = [
      ["products"],
      ["products", "list"],
      ["dashboard-products"],
    ];

    for (const key of possibleKeys) {
      const cached = queryClient.getQueryData(key);
      const normalized = normalizeProductsResponse(cached);

      if (normalized.length > 0) {
        return normalized;
      }
    }

    return [];
  }, [queryClient]);

  const categoryOptions = useMemo(() => {
    return uniqueCategories([
      ...cachedProductsForCategories.map((product) => product.category ?? ""),
      form.category ?? "",
    ]);
  }, [cachedProductsForCategories, form.category]);

  const addCategory = () => {
    const clean = normalizeCategoryLabel(newCategory);

    if (!clean) {
      toast.error("Escribí el nombre de la categoría.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      category: clean,
    }));

    setNewCategory("");
    toast.success("Categoría seleccionada. Se guardará cuando guardes el producto.");
  };

  const totalVariantStock = useMemo(() => {
    return (form.variants ?? []).reduce(
      (acc, variant) => acc + Number(variant.stock || 0),
      0,
    );
  }, [form.variants]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!forcedProductType) return;

    setForm((prev) => {
      if (prev.productType === forcedProductType) return prev;

      return {
        ...prev,
        productType: forcedProductType,
        stock:
          forcedProductType === "auto"
            ? 1
            : forcedProductType === "ropa"
              ? (prev.variants ?? []).reduce(
                  (acc, variant) => acc + Number(variant.stock || 0),
                  0,
                )
              : prev.stock ?? 0,
        variants:
          forcedProductType === "ropa"
            ? ensureAtLeastOneVariant(prev.variants as ProductVariantForm[])
            : [],
        vehicleDetails:
          forcedProductType === "auto" ? prev.vehicleDetails ?? {} : {},
        ownership:
          forcedProductType === "auto"
            ? prev.ownership ?? { ownershipType: "owned" }
            : undefined,
        name:
          forcedProductType === "auto"
            ? buildAutoName(prev.vehicleDetails ?? {})
            : prev.name,
      };
    });
  }, [forcedProductType]);

  useEffect(() => {
    if (isAutoBusiness) {
      setForm((prev) => {
        const generatedName = buildAutoName(prev.vehicleDetails);
        const generatedSlug = slugify(generatedName);

        if (
          prev.stock === 1 &&
          (prev.variants?.length ?? 0) === 0 &&
          prev.name === generatedName &&
          prev.slug === generatedSlug
        ) {
          return prev;
        }

        return {
          ...prev,
          name: generatedName,
          slug: generatedSlug,
          stock: 1,
          variants: [],
        };
      });
      return;
    }

    if (isRopaBusiness) {
      setForm((prev) => {
        if (prev.stock === totalVariantStock) return prev;
        return {
          ...prev,
          stock: totalVariantStock,
        };
      });
    }
  }, [
    isAutoBusiness,
    isRopaBusiness,
    totalVariantStock,
    form.vehicleDetails?.brand,
    form.vehicleDetails?.model,
    form.vehicleDetails?.version,
    form.vehicleDetails?.year,
  ]);

  useEffect(() => {
    if (existing) {
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

      const nextProductType =
        forcedProductType ?? existing.productType ?? "general";
      const nextVehicleDetails =
        nextProductType === "auto" ? existing.vehicleDetails ?? {} : {};
      const generatedAutoName = buildAutoName(nextVehicleDetails);
      const generatedAutoSlug = slugify(generatedAutoName);

      setForm({
        name:
          nextProductType === "auto"
            ? generatedAutoName
            : existing.name ?? "",
        slug:
          nextProductType === "auto"
            ? generatedAutoSlug
            : existing.slug ?? "",
        productType: nextProductType,
        description: existing.description ?? "",
        salePrice: existing.salePrice ?? 0,
        currency: existing.currency ?? "ARS",
        stock:
          nextProductType === "auto"
            ? 1
            : nextProductType === "ropa"
              ? existing.stock ?? 0
              : existing.stock ?? 0,
        category: existing.category ?? "",
        tags: existing.tags ?? [],
        images: normalizedImages,
        documents: normalizedDocuments,
        variants:
          nextProductType === "ropa"
            ? ensureAtLeastOneVariant(
                existing.variants?.map((variant) => ({
                  size: variant.size ?? "",
                  color: variant.color ?? "",
                  sku: variant.sku ?? "",
                  salePrice: variant.salePrice ?? undefined,
                  stock: variant.stock ?? 0,
                })) ?? [],
              )
            : [],
        vehicleDetails: nextVehicleDetails,
        ownership:
          nextProductType === "auto"
            ? existing.ownership ?? { ownershipType: "owned" }
            : undefined,
        status: existing.status ?? "draft",
        isPublished: existing.isPublished ?? false,
        costPrice: existing.finance?.costPrice ?? undefined,
        estimatedSalePrice: existing.finance?.estimatedSalePrice ?? undefined,
        finalSalePrice: existing.finance?.finalSalePrice ?? undefined,
        extraExpenseItems:
          existing.finance?.extraExpenseItems?.map((item) => ({
            label: item.label,
            amount: item.amount,
            expenseDate: item.expenseDate ?? undefined,
          })) ?? [],
        internalNotes: existing.finance?.internalNotes ?? "",
      });

      setSalePriceInput(
        existing.salePrice ? formatMoney(existing.salePrice) : "",
      );
      setKmsInput(
        existing.vehicleDetails?.kms
          ? formatInteger(existing.vehicleDetails.kms)
          : "",
      );
      setCostPriceInput(
        existing.finance?.costPrice ? formatMoney(existing.finance.costPrice) : "",
      );
      setEstimatedSalePriceInput(
        existing.finance?.estimatedSalePrice
          ? formatMoney(existing.finance.estimatedSalePrice)
          : "",
      );
      setFinalSalePriceInput(
        existing.finance?.finalSalePrice
          ? formatMoney(existing.finance.finalSalePrice)
          : "",
      );
      setOwnerExpectedAmountInput(
        existing.ownership?.ownerExpectedAmount
          ? formatMoney(existing.ownership.ownerExpectedAmount)
          : "",
      );
      setExtraExpenseInputs(
        (existing.finance?.extraExpenseItems ?? []).map((item) =>
          item.amount ? formatMoney(item.amount) : "",
        ),
      );

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
    } else {
      setSalePriceInput("");
      setKmsInput("");
      setCostPriceInput("");
      setEstimatedSalePriceInput("");
      setFinalSalePriceInput("");
      setOwnerExpectedAmountInput("");
      setExtraExpenseInputs([]);
    }
  }, [existing, forcedProductType]);

  useEffect(() => {
    if (isEditing) return;
    if (isAutoBusiness) return;
    if (slugTouched) return;

    const generatedSlug = slugify(form.name || "");

    setForm((prev) => {
      if (prev.slug === generatedSlug) return prev;
      return {
        ...prev,
        slug: generatedSlug,
      };
    });
  }, [form.name, slugTouched, isEditing, isAutoBusiness]);

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

  const extraExpensesTotal = useMemo(() => {
    return (form.extraExpenseItems ?? []).reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0,
    );
  }, [form.extraExpenseItems]);

  const setText =
    (field: keyof CreateProductPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const setNumber =
    (field: keyof CreateProductPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]: value === "" ? 0 : Number(value),
      }));
    };

  const setVehicleText =
    (field: keyof NonNullable<CreateProductPayload["vehicleDetails"]>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => {
        const nextVehicleDetails = {
          ...(prev.vehicleDetails ?? {}),
          [field]: e.target.value,
        };

        const generatedName =
          effectiveProductType === "auto"
            ? buildAutoName(nextVehicleDetails)
            : prev.name;

        return {
          ...prev,
          vehicleDetails: nextVehicleDetails,
          name: effectiveProductType === "auto" ? generatedName : prev.name,
          slug:
            effectiveProductType === "auto"
              ? slugify(generatedName)
              : prev.slug,
        };
      });
    };

  const setVehicleNumber =
    (field: keyof NonNullable<CreateProductPayload["vehicleDetails"]>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => {
        const nextVehicleDetails = {
          ...(prev.vehicleDetails ?? {}),
          [field]: value === "" ? undefined : Number(value),
        };

        const generatedName =
          effectiveProductType === "auto"
            ? buildAutoName(nextVehicleDetails)
            : prev.name;

        return {
          ...prev,
          vehicleDetails: nextVehicleDetails,
          name: effectiveProductType === "auto" ? generatedName : prev.name,
          slug:
            effectiveProductType === "auto"
              ? slugify(generatedName)
              : prev.slug,
        };
      });
    };

  const handleSalePriceFocus = () => {
    setSalePriceInput(toRawMoneyString(form.salePrice));
  };

  const handleSalePriceChange = (raw: string) => {
    setSalePriceInput(raw);
    setForm((prev) => ({
      ...prev,
      salePrice: parseMoneyInput(raw),
    }));
  };

  const handleSalePriceBlur = () => {
    if (!salePriceInput.trim()) {
      setSalePriceInput("");
      setForm((prev) => ({ ...prev, salePrice: 0 }));
      return;
    }

    const parsed = parseMoneyInput(salePriceInput);
    setForm((prev) => ({ ...prev, salePrice: parsed }));
    setSalePriceInput(formatMoney(parsed));
  };

  const handleKmsFocus = () => {
    setKmsInput(toRawIntegerString(form.vehicleDetails?.kms));
  };

  const handleKmsChange = (raw: string) => {
    setKmsInput(raw);
    const parsed = parseIntegerInput(raw);
    setForm((prev) => ({
      ...prev,
      vehicleDetails: {
        ...(prev.vehicleDetails ?? {}),
        kms: parsed,
      },
    }));
  };

  const handleKmsBlur = () => {
    if (!kmsInput.trim()) {
      setKmsInput("");
      setForm((prev) => ({
        ...prev,
        vehicleDetails: {
          ...(prev.vehicleDetails ?? {}),
          kms: undefined,
        },
      }));
      return;
    }

    const parsed = parseIntegerInput(kmsInput);
    setForm((prev) => ({
      ...prev,
      vehicleDetails: {
        ...(prev.vehicleDetails ?? {}),
        kms: parsed,
      },
    }));
    setKmsInput(formatInteger(parsed));
  };

  const handleCostPriceFocus = () => {
    setCostPriceInput(toRawMoneyString(form.costPrice));
  };

  const handleCostPriceChange = (raw: string) => {
    const parsed = parseMoneyInput(raw);

    setCostPriceInput(raw);
    setForm((prev) => ({
      ...prev,
      costPrice: parsed,
      ownership:
        effectiveProductType === "auto"
          ? {
              ...(prev.ownership ?? { ownershipType: "owned" }),
              purchasePrice:
                (prev.ownership?.ownershipType ?? "owned") === "owned"
                  ? parsed
                  : prev.ownership?.purchasePrice,
            }
          : prev.ownership,
    }));
  };

  const handleCostPriceBlur = () => {
    if (!costPriceInput.trim()) {
      setCostPriceInput("");
      setForm((prev) => ({ ...prev, costPrice: undefined }));
      return;
    }

    const parsed = parseMoneyInput(costPriceInput);
    setForm((prev) => ({
      ...prev,
      costPrice: parsed,
      ownership:
        effectiveProductType === "auto"
          ? {
              ...(prev.ownership ?? { ownershipType: "owned" }),
              purchasePrice:
                (prev.ownership?.ownershipType ?? "owned") === "owned"
                  ? parsed
                  : prev.ownership?.purchasePrice,
            }
          : prev.ownership,
    }));
    setCostPriceInput(formatMoney(parsed));
  };

  const handleEstimatedSalePriceFocus = () => {
    setEstimatedSalePriceInput(toRawMoneyString(form.estimatedSalePrice));
  };

  const handleEstimatedSalePriceChange = (raw: string) => {
    setEstimatedSalePriceInput(raw);
    setForm((prev) => ({
      ...prev,
      estimatedSalePrice: parseMoneyInput(raw),
    }));
  };

  const handleEstimatedSalePriceBlur = () => {
    if (!estimatedSalePriceInput.trim()) {
      setEstimatedSalePriceInput("");
      setForm((prev) => ({ ...prev, estimatedSalePrice: undefined }));
      return;
    }

    const parsed = parseMoneyInput(estimatedSalePriceInput);
    setForm((prev) => ({ ...prev, estimatedSalePrice: parsed }));
    setEstimatedSalePriceInput(formatMoney(parsed));
  };

  const handleFinalSalePriceFocus = () => {
    setFinalSalePriceInput(toRawMoneyString(form.finalSalePrice));
  };

  const handleFinalSalePriceChange = (raw: string) => {
    setFinalSalePriceInput(raw);
    setForm((prev) => ({
      ...prev,
      finalSalePrice: parseMoneyInput(raw),
    }));
  };

  const handleFinalSalePriceBlur = () => {
    if (!finalSalePriceInput.trim()) {
      setFinalSalePriceInput("");
      setForm((prev) => ({ ...prev, finalSalePrice: undefined }));
      return;
    }

    const parsed = parseMoneyInput(finalSalePriceInput);
    setForm((prev) => ({ ...prev, finalSalePrice: parsed }));
    setFinalSalePriceInput(formatMoney(parsed));
  };

  const setOwnershipType = (value: "owned" | "consignment") => {
    setForm((prev) => ({
      ...prev,
      ownership:
        value === "owned"
          ? {
              ...(prev.ownership ?? {}),
              ownershipType: "owned",
              purchasePrice: prev.costPrice ?? prev.ownership?.purchasePrice,
              ownerExpectedAmount: undefined,
              consignorName: "",
              consignorPhone: "",
            }
          : {
              ...(prev.ownership ?? {}),
              ownershipType: "consignment",
              purchasePrice: undefined,
              purchaseDate: undefined,
              ownerExpectedAmount: prev.ownership?.ownerExpectedAmount,
              consignorName: prev.ownership?.consignorName ?? "",
              consignorPhone: prev.ownership?.consignorPhone ?? "",
            },
    }));

    if (value === "consignment") {
      setCostPriceInput("");
      setForm((prev) => ({ ...prev, costPrice: undefined }));
    }
  };

  const setOwnershipText =
    (field: "consignorName" | "consignorPhone") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        ownership: {
          ...(prev.ownership ?? { ownershipType: "consignment" }),
          [field]: e.target.value,
        },
      }));
    };

  const setOwnershipPurchaseDate = (value: string) => {
    setForm((prev) => ({
      ...prev,
      ownership: {
        ...(prev.ownership ?? { ownershipType: "owned" }),
        ownershipType: "owned",
        purchaseDate: value ? toIsoFromDateInput(value) : undefined,
      },
    }));
  };

  const handleOwnerExpectedAmountFocus = () => {
    setOwnerExpectedAmountInput(
      toRawMoneyString(form.ownership?.ownerExpectedAmount),
    );
  };

  const handleOwnerExpectedAmountChange = (raw: string) => {
    const parsed = parseMoneyInput(raw);

    setOwnerExpectedAmountInput(raw);
    setForm((prev) => ({
      ...prev,
      ownership: {
        ...(prev.ownership ?? { ownershipType: "consignment" }),
        ownershipType: "consignment",
        ownerExpectedAmount: parsed,
      },
    }));
  };

  const handleOwnerExpectedAmountBlur = () => {
    if (!ownerExpectedAmountInput.trim()) {
      setOwnerExpectedAmountInput("");
      setForm((prev) => ({
        ...prev,
        ownership: {
          ...(prev.ownership ?? { ownershipType: "consignment" }),
          ownershipType: "consignment",
          ownerExpectedAmount: undefined,
        },
      }));
      return;
    }

    const parsed = parseMoneyInput(ownerExpectedAmountInput);

    setForm((prev) => ({
      ...prev,
      ownership: {
        ...(prev.ownership ?? { ownershipType: "consignment" }),
        ownershipType: "consignment",
        ownerExpectedAmount: parsed,
      },
    }));

    setOwnerExpectedAmountInput(formatMoney(parsed));
  };

  const addExtraExpenseItem = () => {
    setForm((prev) => ({
      ...prev,
      extraExpenseItems: [
        ...(prev.extraExpenseItems ?? []),
        {
          label: "",
          amount: 0,
          expenseDate: toIsoFromDateInput(todayLocalDate()),
        },
      ],
    }));
    setExtraExpenseInputs((prev) => [...prev, ""]);
  };

  const updateExtraExpenseItemLabel = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      extraExpenseItems: (prev.extraExpenseItems ?? []).map((item, i) =>
        i === index ? { ...item, label: value } : item,
      ),
    }));
  };

  const updateExtraExpenseItemDate = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      extraExpenseItems: (prev.extraExpenseItems ?? []).map((item, i) =>
        i === index
          ? {
              ...item,
              expenseDate: value ? toIsoFromDateInput(value) : undefined,
            }
          : item,
      ),
    }));
  };

  const handleExtraExpenseFocus = (index: number) => {
    const currentValue = form.extraExpenseItems?.[index]?.amount;
    setExtraExpenseInputs((prev) => {
      const next = [...prev];
      next[index] = toRawMoneyString(currentValue);
      return next;
    });
  };

  const handleExtraExpenseChange = (index: number, raw: string) => {
    setExtraExpenseInputs((prev) => {
      const next = [...prev];
      next[index] = raw;
      return next;
    });

    setForm((prev) => ({
      ...prev,
      extraExpenseItems: (prev.extraExpenseItems ?? []).map((item, i) =>
        i === index
          ? {
              ...item,
              amount: parseMoneyInput(raw),
            }
          : item,
      ),
    }));
  };

  const handleExtraExpenseBlur = (index: number) => {
    const raw = extraExpenseInputs[index] ?? "";

    if (!raw.trim()) {
      setExtraExpenseInputs((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });

      setForm((prev) => ({
        ...prev,
        extraExpenseItems: (prev.extraExpenseItems ?? []).map((item, i) =>
          i === index ? { ...item, amount: 0 } : item,
        ),
      }));
      return;
    }

    const parsed = parseMoneyInput(raw);

    setForm((prev) => ({
      ...prev,
      extraExpenseItems: (prev.extraExpenseItems ?? []).map((item, i) =>
        i === index ? { ...item, amount: parsed } : item,
      ),
    }));

    setExtraExpenseInputs((prev) => {
      const next = [...prev];
      next[index] = formatMoney(parsed);
      return next;
    });
  };

  const removeExtraExpenseItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      extraExpenseItems: (prev.extraExpenseItems ?? []).filter(
        (_, i) => i !== index,
      ),
    }));
    setExtraExpenseInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...ensureAtLeastOneVariant(prev.variants as ProductVariantForm[]),
        createEmptyVariant(),
      ],
    }));
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariantForm,
    value: string | number | undefined,
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants ?? []).map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => {
      const current = ensureAtLeastOneVariant(
        prev.variants as ProductVariantForm[],
      );

      if (current.length <= 1) {
        toast.info("El producto de ropa necesita al menos una variante.");

        return {
          ...prev,
          variants: [createEmptyVariant()],
        };
      }

      return {
        ...prev,
        variants: current.filter((_, i) => i !== index),
      };
    });
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (effectiveProductType === "ropa") {
        if (!normalizeCategoryLabel(form.category ?? "")) {
          throw new Error("Seleccioná o creá una categoría antes de guardar.");
        }

        const clothingVariants = ensureAtLeastOneVariant(
          form.variants as ProductVariantForm[],
        );

        const hasMissingSize = clothingVariants.some(
          (variant) => !variant.size?.trim(),
        );

        if (hasMissingSize) {
          throw new Error("Cargá el talle en todas las variantes.");
        }

        const hasInvalidStock = clothingVariants.some(
          (variant) =>
            !Number.isFinite(Number(variant.stock)) || Number(variant.stock) < 0,
        );

        if (hasInvalidStock) {
          throw new Error("El stock de cada talle tiene que ser 0 o mayor.");
        }

        if (form.isPublished && totalVariantStock <= 0) {
          throw new Error(
            "Para publicar el producto, cargá stock en al menos un talle.",
          );
        }
      }

      if (effectiveProductType === "auto") {
        const autoName = buildAutoName(form.vehicleDetails);

        if (!autoName) {
          throw new Error("Cargá al menos marca y modelo del vehículo.");
        }

        if (form.ownership?.ownershipType === "consignment") {
          if (!Number(form.ownership?.ownerExpectedAmount ?? 0)) {
            throw new Error("Cargá el monto a entregar al dueño consignante.");
          }
        }
      }

      const generatedName =
        effectiveProductType === "auto"
          ? buildAutoName(form.vehicleDetails)
          : form.name;

      const generatedSlug =
        effectiveProductType === "auto"
          ? slugify(generatedName)
          : slugify(form.slug || generatedName || "");

      const payload: CreateProductPayload = {
        ...form,
        name: generatedName,
        slug: generatedSlug,
        tags: buildAutoTags(
          {
            ...form,
            name: generatedName,
            slug: generatedSlug,
          },
          effectiveProductType,
        ),
        productType: effectiveProductType,
        stock:
          effectiveProductType === "auto"
            ? 1
            : effectiveProductType === "ropa"
              ? totalVariantStock
              : form.stock ?? 0,
        images: normalizeImages((form.images ?? []) as ProductImageForm[]),
        documents: normalizeDocuments(
          (form.documents ?? []) as ProductDocumentForm[],
        ),
        variants:
          effectiveProductType === "ropa"
            ? ensureAtLeastOneVariant(form.variants as ProductVariantForm[])
                .map((variant) => ({
                  size: variant.size.trim(),
                  color: variant.color?.trim() || undefined,
                  sku: variant.sku?.trim() || undefined,
                  salePrice:
                    variant.salePrice !== undefined &&
                    variant.salePrice !== null &&
                    !Number.isNaN(Number(variant.salePrice))
                      ? Number(variant.salePrice)
                      : undefined,
                  stock: Number(variant.stock || 0),
                }))
                .filter((variant) => variant.size && variant.stock >= 0)
            : undefined,
        extraExpenseItems: (form.extraExpenseItems ?? [])
          .map((item) => ({
            label: item.label.trim(),
            amount: Number(item.amount || 0),
            expenseDate: item.expenseDate || undefined,
          }))
          .filter((item) => item.label && item.amount >= 0),
        vehicleDetails:
          effectiveProductType === "auto" ? form.vehicleDetails : undefined,
        ownership:
          effectiveProductType === "auto"
            ? form.ownership?.ownershipType === "consignment"
              ? {
                  ownershipType: "consignment",
                  ownerExpectedAmount: Number(
                    form.ownership?.ownerExpectedAmount ?? 0,
                  ),
                  consignorName:
                    form.ownership?.consignorName?.trim() || undefined,
                  consignorPhone:
                    form.ownership?.consignorPhone?.trim() || undefined,
                }
              : {
                  ownershipType: "owned",
                  purchasePrice:
                    form.costPrice !== undefined
                      ? Number(form.costPrice)
                      : form.ownership?.purchasePrice,
                  purchaseDate: form.ownership?.purchaseDate || undefined,
                }
            : undefined,
      };

      return isEditing
        ? productsService.update(id!, payload)
        : productsService.create(payload);
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

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-movements"] });

      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      navigate("/dashboard/products");
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const uploadedImages: ProductImageForm[] = [];

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const uploadedDocuments: ProductDocumentForm[] = [];

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
          ...((prev.documents ?? []) as ProductDocumentForm[]),
          ...uploadedDocuments,
        ]),
      }));

      toast.success(`${uploadedDocuments.length} documento(s) subido(s)`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(
          err?.message || "No se pudo borrar la imagen de Cloudinary",
        );
      }

      return;
    }

    if (initialImagePublicIdsRef.current.has(publicId)) {
      removedExistingImagesRef.current.add(publicId);
      toast.success("Imagen quitada del producto");
    }
  };

  const removeDocument = async (index: number) => {
    const currentDocuments = (form.documents ?? []) as ProductDocumentForm[];
    const documentToRemove = currentDocuments[index];

    if (!documentToRemove) return;

    setForm((prev) => ({
      ...prev,
      documents: normalizeDocuments(
        ((prev.documents ?? []) as ProductDocumentForm[]).filter(
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(
          err?.message || "No se pudo borrar el documento de Cloudinary",
        );
      }

      return;
    }

    if (initialDocumentPublicIdsRef.current.has(publicId)) {
      removedExistingDocumentsRef.current.add(publicId);
      toast.success("Documento quitado del producto");
    }
  };

  const updateDocument = (
    index: number,
    field: keyof ProductDocumentForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      documents: normalizeDocuments(
        ((prev.documents ?? []) as ProductDocumentForm[]).map((document, i) =>
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

  if (isEditing && isLoading) return <LoadingState />;

  return (
    <div>
      <DashboardTopbar
        title={isEditing ? "Editar producto" : "Nuevo producto"}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/products")}
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

      <div className="p-6 max-w-5xl space-y-6">
        {isAutoBusiness && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">
                Datos del vehículo
              </h2>
              <p className="text-xs text-muted-foreground">
                El nombre, slug y tags se generan automáticamente con estos datos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <FieldLabel>Marca</FieldLabel>
                <Input
                  placeholder="Ej: Peugeot"
                  value={form.vehicleDetails?.brand ?? ""}
                  onChange={setVehicleText("brand")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Modelo</FieldLabel>
                <Input
                  placeholder="Ej: 208"
                  value={form.vehicleDetails?.model ?? ""}
                  onChange={setVehicleText("model")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Versión</FieldLabel>
                <Input
                  placeholder="Ej: Allure"
                  value={form.vehicleDetails?.version ?? ""}
                  onChange={setVehicleText("version")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Año</FieldLabel>
                <Input
                  type="number"
                  placeholder="2022"
                  value={form.vehicleDetails?.year ?? ""}
                  onChange={setVehicleNumber("year")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>KMS</FieldLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="36.000"
                  value={kmsInput}
                  onFocus={handleKmsFocus}
                  onChange={(e) => handleKmsChange(e.target.value)}
                  onBlur={handleKmsBlur}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Combustible</FieldLabel>
                <Input
                  placeholder="Nafta"
                  value={form.vehicleDetails?.fuelType ?? ""}
                  onChange={setVehicleText("fuelType")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Transmisión</FieldLabel>
                <Input
                  placeholder="Manual"
                  value={form.vehicleDetails?.transmission ?? ""}
                  onChange={setVehicleText("transmission")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Color</FieldLabel>
                <Input
                  placeholder="Negro"
                  value={form.vehicleDetails?.color ?? ""}
                  onChange={setVehicleText("color")}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Patente</FieldLabel>
                <Input
                  placeholder="AB123CD"
                  value={form.vehicleDetails?.plate ?? ""}
                  onChange={setVehicleText("plate")}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Vista previa:</span>{" "}
              {buildAutoName(form.vehicleDetails) || "Todavía no hay nombre generado"}
            </div>
          </div>
        )}

        {!isAutoBusiness && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Información básica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  placeholder={
                    isRopaBusiness
                      ? "Ej: Remera Oversize Negra"
                      : "Nombre del producto"
                  }
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel info="Se genera automáticamente desde el nombre. Podés editarlo si querés usar otro identificador corto para la URL o para organizar mejor tus productos.">
                  Slug
                </FieldLabel>
                <Input
                  placeholder="nombre-del-producto"
                  value={form.slug}
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
                <FieldLabel info="El tipo se define automáticamente según el tipo de negocio cuando corresponde.">
                  Tipo
                </FieldLabel>

                {showManualProductTypeSelector ? (
                  <select
                    value={form.productType ?? "general"}
                    onChange={(e) =>
                      setForm((prev) => {
                        const nextType = e.target.value as ProductType;

                        return {
                          ...prev,
                          productType: nextType,
                          vehicleDetails:
                            nextType === "auto" ? prev.vehicleDetails ?? {} : {},
                          variants:
                            nextType === "ropa"
                              ? ensureAtLeastOneVariant(
                                  prev.variants as ProductVariantForm[],
                                )
                              : [],
                          stock:
                            nextType === "auto"
                              ? 1
                              : nextType === "ropa"
                                ? (prev.variants ?? []).reduce(
                                    (acc, variant) =>
                                      acc + Number(variant.stock || 0),
                                    0,
                                  )
                                : prev.stock ?? 0,
                        };
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="general">General</option>
                    <option value="auto">Auto</option>
                    <option value="ropa">Ropa</option>
                  </select>
                ) : (
                  <Input
                    value={
                      effectiveProductType === "auto"
                        ? "Auto"
                        : effectiveProductType === "ropa"
                          ? "Ropa"
                          : "General"
                    }
                    readOnly
                    className="bg-secondary border-border"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Descripción
          </h2>

          <Textarea
            placeholder={
              isAutoBusiness
                ? "Descripción del vehículo..."
                : isRopaBusiness
                  ? "Descripción de la prenda..."
                  : "Descripción del producto..."
            }
            value={form.description}
            onChange={setText("description")}
            className="bg-secondary border-border min-h-[120px]"
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Categoría</h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <FieldLabel info="Las categorías se toman de los productos ya guardados en este negocio. Si escribís una nueva, se guarda cuando guardás el producto.">
                Categoría del producto
              </FieldLabel>

              <select
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="">
                  {categoryOptions.length > 0
                    ? "Seleccionar categoría"
                    : "Todavía no hay categorías guardadas"}
                </option>

                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Nueva categoría</FieldLabel>
              <Input
                placeholder={
                  isRopaBusiness
                    ? "Ej: Zapatillas"
                    : isAutoBusiness
                      ? "Ej: SUV"
                      : "Nueva categoría"
                }
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                className="bg-secondary border-border"
              />
            </div>

            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Las categorías salen de los productos ya guardados. Si creás una nueva, queda disponible cuando guardes este producto.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Precio</h2>

          <div
            className={`grid grid-cols-1 ${
              isAutoBusiness ? "md:grid-cols-2" : "md:grid-cols-4"
            } gap-4`}
          >
            <div className="space-y-2">
              <FieldLabel>Precio de venta base</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={salePriceInput}
                onFocus={handleSalePriceFocus}
                onChange={(e) => handleSalePriceChange(e.target.value)}
                onBlur={handleSalePriceBlur}
                className="bg-secondary border-border"
              />
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
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {!isAutoBusiness && !isRopaBusiness && (
              <div className="space-y-2">
                <FieldLabel>Stock</FieldLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={setNumber("stock")}
                  className="bg-secondary border-border"
                />
              </div>
            )}

            {isRopaBusiness && (
              <div className="space-y-2">
                <FieldLabel>Stock total</FieldLabel>
                <Input
                  value={String(totalVariantStock)}
                  readOnly
                  aria-readonly="true"
                  className="bg-muted/40 border-border text-muted-foreground cursor-not-allowed"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <FieldLabel>Estado</FieldLabel>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as CreateProductPayload["status"],
                    isPublished: e.target.value === "published",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="reserved">Señado</option>
                <option value="sold">Vendido</option>
                <option value="archived">Archivado</option>
                <option value="out_of_stock">Sin stock</option>
              </select>
            </div>

            <div className="space-y-2">
              <FieldLabel>Publicado</FieldLabel>
              <select
                value={form.isPublished ? "true" : "false"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isPublished: e.target.value === "true",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
        </div>

        {isRopaBusiness && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Variantes por talle
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Cargá un renglón por cada talle. El stock total se calcula solo con la suma de estos stocks.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar talle
              </Button>
            </div>

            {(form.variants?.length ?? 0) === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                El producto necesita al menos una variante con talle y stock.
              </div>
            ) : (
              <div className="space-y-3">
                {form.variants?.map((variant, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-background/30 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Talle #{index + 1}
                      </p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Eliminar talle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_150px_160px] gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Talle *
                        </Label>
                        <Input
                          placeholder="Ej: 40, 41, M, L"
                          value={variant.size ?? ""}
                          onChange={(e) =>
                            updateVariant(index, "size", e.target.value)
                          }
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Color
                        </Label>
                        <Input
                          placeholder="Ej: Negro"
                          value={variant.color ?? ""}
                          onChange={(e) =>
                            updateVariant(index, "color", e.target.value)
                          }
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          SKU opcional
                        </Label>
                        <Input
                          placeholder="Ej: J4-BC-40"
                          value={variant.sku ?? ""}
                          onChange={(e) =>
                            updateVariant(index, "sku", e.target.value)
                          }
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Stock *
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "stock",
                              Number(e.target.value || 0),
                            )
                          }
                          className="bg-secondary border-border"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Precio específico
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Usa precio base"
                          value={variant.salePrice ?? ""}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "salePrice",
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                Documentos
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Guardá archivos internos como cédula, título, 08, verificación policial o informe de dominio. No se muestran en la landing pública.
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
              {((form.documents ?? []) as ProductDocumentForm[]).map(
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

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Nombre visible
                        </Label>
                        <Input
                          placeholder="Ej: Cédula verde"
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
          <h2 className="text-sm font-semibold text-foreground">
            Finanzas internas y gastos
          </h2>

          {isAutoBusiness && (
            <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FieldLabel info="Propia: el auto es de la agencia. Consignación: el auto es de un dueño y se liquida un monto acordado al venderlo.">
                    Tipo de unidad
                  </FieldLabel>
                  <select
                    value={ownershipType}
                    onChange={(e) =>
                      setOwnershipType(e.target.value as "owned" | "consignment")
                    }
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="owned">Propia</option>
                    <option value="consignment">Consignación</option>
                  </select>
                </div>

                {isOwnedVehicle && (
                  <>
                    <div className="space-y-2">
                      <FieldLabel>Fecha de compra</FieldLabel>
                      <Input
                        type="date"
                        value={toDateInputValue(form.ownership?.purchaseDate)}
                        onChange={(e) => setOwnershipPurchaseDate(e.target.value)}
                        className="bg-secondary border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel>Costo de compra</FieldLabel>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={costPriceInput}
                        onFocus={handleCostPriceFocus}
                        onChange={(e) => handleCostPriceChange(e.target.value)}
                        onBlur={handleCostPriceBlur}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </>
                )}

                {isConsignment && (
                  <>
                    <div className="space-y-2">
                      <FieldLabel>Dueño consignante</FieldLabel>
                      <Input
                        placeholder="Ej: Juan Pérez"
                        value={form.ownership?.consignorName ?? ""}
                        onChange={setOwnershipText("consignorName")}
                        className="bg-secondary border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <FieldLabel>Teléfono del dueño</FieldLabel>
                      <Input
                        placeholder="Ej: 5491112345678"
                        value={form.ownership?.consignorPhone ?? ""}
                        onChange={setOwnershipText("consignorPhone")}
                        className="bg-secondary border-border"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <FieldLabel info="Es el monto fijo que se le entrega al dueño cuando se vende el auto. La diferencia queda como ganancia de la agencia.">
                        Monto a entregar al dueño
                      </FieldLabel>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={ownerExpectedAmountInput}
                        onFocus={handleOwnerExpectedAmountFocus}
                        onChange={(e) =>
                          handleOwnerExpectedAmountChange(e.target.value)
                        }
                        onBlur={handleOwnerExpectedAmountBlur}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                La moneda de compra, venta o liquidación la define el campo Moneda del producto. Los gastos extra se cargan siempre en pesos argentinos.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel>Venta estimada</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={estimatedSalePriceInput}
                onFocus={handleEstimatedSalePriceFocus}
                onChange={(e) =>
                  handleEstimatedSalePriceChange(e.target.value)
                }
                onBlur={handleEstimatedSalePriceBlur}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Venta final</FieldLabel>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={finalSalePriceInput}
                onFocus={handleFinalSalePriceFocus}
                onChange={(e) => handleFinalSalePriceChange(e.target.value)}
                onBlur={handleFinalSalePriceBlur}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {!isAutoBusiness && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <FieldLabel>Costo</FieldLabel>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={costPriceInput}
                  onFocus={handleCostPriceFocus}
                  onChange={(e) => handleCostPriceChange(e.target.value)}
                  onBlur={handleCostPriceBlur}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <FieldLabel info="Podés cargar varios gastos por separado, por ejemplo batería, lavado o pulido. El total se calcula automáticamente.">
              Gastos extra
            </FieldLabel>

            <div className="space-y-3">
              {(form.extraExpenseItems ?? []).map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_180px_170px_48px] gap-3"
                >
                  <Input
                    placeholder="Ej: Batería"
                    value={item.label}
                    onChange={(e) =>
                      updateExtraExpenseItemLabel(index, e.target.value)
                    }
                    className="bg-secondary border-border"
                  />

                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={extraExpenseInputs[index] ?? ""}
                    onFocus={() => handleExtraExpenseFocus(index)}
                    onChange={(e) =>
                      handleExtraExpenseChange(index, e.target.value)
                    }
                    onBlur={() => handleExtraExpenseBlur(index)}
                    className="bg-secondary border-border"
                  />

                  <Input
                    type="date"
                    value={toDateInputValue(item.expenseDate) || todayLocalDate()}
                    onChange={(e) =>
                      updateExtraExpenseItemDate(index, e.target.value)
                    }
                    className="bg-secondary border-border"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeExtraExpenseItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addExtraExpenseItem}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Agregar gasto
              </Button>

              <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total gastos extra: </span>
                <span className="font-medium text-foreground">
                  ${formatMoney(extraExpensesTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>Notas internas</FieldLabel>
            <Textarea
              placeholder="Notas internas del producto..."
              value={form.internalNotes ?? ""}
              onChange={setText("internalNotes")}
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}