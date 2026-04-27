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

type ProductVariantForm = {
  size: string;
  color: string;
  sku: string;
  salePrice?: number;
  stock: number;
};

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
  ].filter(Boolean);

  return parts.join(" ").trim();
}

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialImagePublicIdsRef = useRef<Set<string>>(new Set());
  const uploadedThisSessionRef = useRef<Set<string>>(new Set());
  const removedExistingImagesRef = useRef<Set<string>>(new Set());
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
    variants: [],
    status: "draft",
    isPublished: false,
    vehicleDetails: {},
    extraExpenseItems: [],
  });

  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const [salePriceInput, setSalePriceInput] = useState("");
  const [kmsInput, setKmsInput] = useState("");
  const [costPriceInput, setCostPriceInput] = useState("");
  const [estimatedSalePriceInput, setEstimatedSalePriceInput] = useState("");
  const [finalSalePriceInput, setFinalSalePriceInput] = useState("");
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

  const categoryStorageKey = useMemo(() => {
    const businessId = (business as { id?: string } | undefined)?.id;
    const businessKey = business?.slug ?? businessId ?? "default";
    return `lb-business-product-categories-${businessKey}`;
  }, [business]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(categoryStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        setSavedCategories(
          parsed.filter((item) => typeof item === "string"),
        );
      }
    } catch {
      setSavedCategories([]);
    }
  }, [categoryStorageKey]);

  const categoryOptions = useMemo(() => {
    return uniqueCategories([
      ...savedCategories,
      form.category ?? "",
    ]);
  }, [savedCategories, form.category]);

  const saveCategoryToLocalStorage = (nextCategories: string[]) => {
    try {
      window.localStorage.setItem(
        categoryStorageKey,
        JSON.stringify(nextCategories),
      );
    } catch {
      // No bloqueamos el formulario si localStorage falla.
    }
  };

  const addCategory = () => {
    const clean = normalizeCategoryLabel(newCategory);

    if (!clean) {
      toast.error("Escribí el nombre de la categoría.");
      return;
    }

    const alreadyExists = savedCategories.some(
      (category) => category.toLowerCase() === clean.toLowerCase(),
    );

    const nextCategories = alreadyExists
      ? savedCategories
      : uniqueCategories([...savedCategories, clean]);

    setSavedCategories(nextCategories);
    saveCategoryToLocalStorage(nextCategories);

    setForm((prev) => ({
      ...prev,
      category: clean,
    }));

    setNewCategory("");
    toast.success(alreadyExists ? "Categoría seleccionada" : "Categoría creada");
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
        name:
          forcedProductType === "auto" && !nameTouched
            ? buildAutoName(prev.vehicleDetails ?? {})
            : prev.name,
      };
    });
  }, [forcedProductType, nameTouched]);

  useEffect(() => {
    if (isAutoBusiness) {
      setForm((prev) => {
        if (prev.stock === 1 && (prev.variants?.length ?? 0) === 0) return prev;
        return {
          ...prev,
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
  }, [isAutoBusiness, isRopaBusiness, totalVariantStock]);

  useEffect(() => {
    if (existing) {
      const mappedImages =
        existing.images?.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          order: img.order ?? index,
          isCover: img.isCover ?? index === 0,
        })) ?? [];

      const normalizedImages = normalizeImages(mappedImages);
      const nextProductType =
        forcedProductType ?? existing.productType ?? "general";

      setForm({
        name: existing.name ?? "",
        slug: existing.slug ?? "",
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
        vehicleDetails:
          nextProductType === "auto" ? existing.vehicleDetails ?? {} : {},
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
      setExtraExpenseInputs(
        (existing.finance?.extraExpenseItems ?? []).map((item) =>
          item.amount ? formatMoney(item.amount) : "",
        ),
      );

      initialImagePublicIdsRef.current = new Set(
        normalizedImages.map((img) => img.publicId),
      );
      removedExistingImagesRef.current = new Set();
      uploadedThisSessionRef.current = new Set();
      setSlugTouched(true);
      setNameTouched(true);
    } else {
      setSalePriceInput("");
      setKmsInput("");
      setCostPriceInput("");
      setEstimatedSalePriceInput("");
      setFinalSalePriceInput("");
      setExtraExpenseInputs([]);
    }
  }, [existing, forcedProductType]);

  useEffect(() => {
    if (isEditing) return;
    if (slugTouched) return;

    const generatedSlug = slugify(form.name || "");

    setForm((prev) => {
      if (prev.slug === generatedSlug) return prev;
      return {
        ...prev,
        slug: generatedSlug,
      };
    });
  }, [form.name, slugTouched, isEditing]);

  useEffect(() => {
    if (isEditing) return;
    if (!isAutoBusiness) return;
    if (nameTouched) return;

    const generatedName = buildAutoName(form.vehicleDetails);

    setForm((prev) => {
      if ((prev.name || "") === generatedName) return prev;
      return {
        ...prev,
        name: generatedName,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.vehicleDetails?.brand,
    form.vehicleDetails?.model,
    form.vehicleDetails?.version,
    isEditing,
    isAutoBusiness,
    nameTouched,
  ]);

  useEffect(() => {
    return () => {
      if (hasCommittedRef.current) return;

      const pendingPublicIds = Array.from(uploadedThisSessionRef.current);
      if (!pendingPublicIds.length) return;

      void Promise.allSettled(
        pendingPublicIds.map((publicId) =>
          uploadsService.deleteImage(publicId),
        ),
      );
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
      setForm((prev) => ({
        ...prev,
        vehicleDetails: {
          ...(prev.vehicleDetails ?? {}),
          [field]: e.target.value,
        },
      }));
    };

  const setVehicleNumber =
    (field: keyof NonNullable<CreateProductPayload["vehicleDetails"]>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        vehicleDetails: {
          ...(prev.vehicleDetails ?? {}),
          [field]: value === "" ? undefined : Number(value),
        },
      }));
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
    setCostPriceInput(raw);
    setForm((prev) => ({
      ...prev,
      costPrice: parseMoneyInput(raw),
    }));
  };

  const handleCostPriceBlur = () => {
    if (!costPriceInput.trim()) {
      setCostPriceInput("");
      setForm((prev) => ({ ...prev, costPrice: undefined }));
      return;
    }

    const parsed = parseMoneyInput(costPriceInput);
    setForm((prev) => ({ ...prev, costPrice: parsed }));
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

  const regenerateAutoName = () => {
    const generatedName = buildAutoName(form.vehicleDetails);
    setNameTouched(false);
    setForm((prev) => ({
      ...prev,
      name: generatedName,
    }));
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

      const payload: CreateProductPayload = {
        ...form,
        productType: effectiveProductType,
        stock:
          effectiveProductType === "auto"
            ? 1
            : effectiveProductType === "ropa"
              ? totalVariantStock
              : form.stock ?? 0,
        slug: slugify(form.slug || form.name || ""),
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
      };

      return isEditing
        ? productsService.update(id!, payload)
        : productsService.create(payload);
    },

    onSuccess: async () => {
      hasCommittedRef.current = true;

      const removedOldImages = Array.from(removedExistingImagesRef.current);

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

      removedExistingImagesRef.current.clear();
      uploadedThisSessionRef.current.clear();

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });

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
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Información básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FieldLabel>Nombre</FieldLabel>
              <Input
                placeholder={
                  isAutoBusiness
                    ? "Se completa automáticamente desde marca, modelo y versión"
                    : isRopaBusiness
                      ? "Ej: Remera Oversize Negra"
                      : "Nombre del producto"
                }
                value={form.name}
                onChange={(e) => {
                  setNameTouched(true);
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                }}
                className="bg-secondary border-border"
              />
              {isAutoBusiness && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={regenerateAutoName}
                  >
                    Usar marca/modelo/versión como nombre
                  </Button>
                </div>
              )}
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

          <div className="space-y-2">
            <FieldLabel>Descripción</FieldLabel>
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
              className="bg-secondary border-border min-h-[100px]"
            />
          </div>

          <div
            className={`grid grid-cols-1 ${
              isAutoBusiness ? "md:grid-cols-3" : "md:grid-cols-4"
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

            <div className="space-y-2">
              <FieldLabel info="No hay categorías default. Creá las categorías propias de este negocio y después elegilas desde el selector.">
                Categoría
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
                    : "Primero creá una categoría"}
                </option>

                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  placeholder={
                    isRopaBusiness
                      ? "Nueva categoría, ej: Zapatillas"
                      : isAutoBusiness
                        ? "Nueva categoría, ej: SUV"
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

                <Button type="button" variant="outline" onClick={addCategory}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Crear
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Las categorías se guardan localmente para este negocio y se reutilizan en próximos productos.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel info="Palabras clave opcionales para organizar y encontrar mejor el producto. Separalas con coma.">
              Tags
            </FieldLabel>
            <Input
              placeholder="Separados por coma"
              value={(form.tags || []).join(", ")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {isAutoBusiness && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Datos del auto
              </h2>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={regenerateAutoName}
              >
                Usar marca/modelo/versión como nombre
              </Button>
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
          <h2 className="text-sm font-semibold text-foreground">
            Finanzas internas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4">
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