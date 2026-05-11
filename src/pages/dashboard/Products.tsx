import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Package,
  ChevronDown,
  ChevronRight,
  HandCoins,
  BadgeDollarSign,
  Pencil,
  RotateCcw,
  Car,
  Trash2,
  Shirt,
  Boxes,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productsService,
  type Product,
  type ProductStatus,
  type Currency,
  type ProductVariant,
} from "@/services/products.service";
import { toast } from "sonner";

function getStatusLabel(status?: string) {
  switch (status) {
    case "published":
      return "Publicado";
    case "reserved":
      return "Señado";
    case "sold":
      return "Vendido";
    case "archived":
      return "Archivado";
    case "out_of_stock":
      return "Sin stock";
    case "draft":
    default:
      return "Borrador";
  }
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "outline" {
  switch (status) {
    case "published":
      return "default";
    case "reserved":
      return "secondary";
    case "sold":
      return "outline";
    case "archived":
    case "out_of_stock":
      return "outline";
    case "draft":
    default:
      return "secondary";
  }
}

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString("es-AR")}`;
}

function formatMoneyWithCurrency(
  value?: number | null,
  currency?: Currency | null,
) {
  if (value === null || value === undefined) return "-";
  return `${currency ?? "ARS"} ${Number(value).toLocaleString("es-AR")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR");
}

function formatKms(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("es-AR")} km`;
}

function todayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

function getProductTypeLabel(type?: string) {
  switch (type) {
    case "auto":
      return "Auto";
    case "ropa":
      return "Ropa";
    case "general":
    default:
      return "General";
  }
}

function getDocumentTypeLabel(type?: string) {
  switch (type) {
    case "cedula":
      return "Cédula";
    case "titulo":
      return "Título";
    case "formulario_08":
      return "Formulario 08";
    case "verificacion_policial":
      return "Verificación policial";
    case "informe_dominio":
      return "Informe dominio";
    case "seguro":
      return "Seguro";
    case "vendedor":
      return "Documento vendedor";
    case "comprador":
      return "Documento comprador";
    case "otro":
    default:
      return "Otro";
  }
}

function getDocumentViewUrl(url?: string | null) {
  return url || "#";
}

function getDocumentDownloadUrl(url?: string | null) {
  return url || "#";
}

function getProductSummary(product: Product) {
  if (product.productType === "auto") {
    return [
      product.vehicleDetails?.year ? String(product.vehicleDetails.year) : null,
      product.vehicleDetails?.kms != null
        ? formatKms(product.vehicleDetails.kms)
        : null,
      product.vehicleDetails?.plate || null,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  if (product.productType === "ropa") {
    const variantsCount = product.variants?.length ?? 0;
    const totalStock =
      product.variants?.reduce(
        (acc, variant) => acc + Number(variant.stock || 0),
        0,
      ) ??
      product.stock ??
      0;

    return `${variantsCount} variante${
      variantsCount === 1 ? "" : "s"
    } • stock ${totalStock}`;
  }

  return product.category || "-";
}

function getTotalVariantStock(product: Product) {
  return (
    product.variants?.reduce(
      (acc, variant) => acc + Number(variant.stock || 0),
      0,
    ) ??
    product.stock ??
    0
  );
}

function getVariantLabel(variant?: ProductVariant | null) {
  const label = [variant?.size, variant?.color].filter(Boolean).join(" • ");
  if (label) return label;
  return variant?.sku || "Variante";
}

function getReservationDeposit(product?: Product | null) {
  return Number(product?.reservation?.depositAmount ?? 0);
}

function getPendingPayment(product: Product | null, finalPriceValue: string) {
  const finalPrice = Number(finalPriceValue || 0);
  const deposit = getReservationDeposit(product);

  return Math.max(finalPrice - deposit, 0);
}

function hasActiveDeposit(product?: Product | null) {
  return getReservationDeposit(product) > 0;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>(
    "all",
  );
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [soldFrom, setSoldFrom] = useState("");
  const [soldTo, setSoldTo] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price_desc" | "price_asc"
  >("newest");

  const [reserveOpen, setReserveOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<Currency>("ARS");
  const [depositDate, setDepositDate] = useState(todayLocalDate());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationNotes, setReservationNotes] = useState("");

  const [soldDate, setSoldDate] = useState(todayLocalDate());
  const [soldPrice, setSoldPrice] = useState("");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<string>("");
  const [sellQuantity, setSellQuantity] = useState("1");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: productsService.getAll,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        status: ProductStatus;
        isPublished?: boolean;
        reservation?: {
          depositAmount?: number;
          depositCurrency?: Currency;
          depositDate?: string;
          customerName?: string;
          customerPhone?: string;
          notes?: string;
        };
        finalSalePrice?: number;
        soldAt?: string;
        clearReservation?: boolean;
        variantIndex?: number;
        quantity?: number;
      };
    }) => productsService.updateStatus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });

      if (
        variables.payload.status === "published" &&
        variables.payload.clearReservation
      ) {
        toast.success("Se devolvió la seña y el producto volvió a publicado");
      } else if (variables.payload.status === "reserved") {
        toast.success("Producto marcado como señado");
      } else if (variables.payload.status === "sold") {
        if (
          variables.payload.variantIndex !== undefined &&
          (variables.payload.quantity ?? 1) >= 1
        ) {
          toast.success("Venta registrada y stock actualizado");
        } else {
          toast.success("Producto marcado como vendido");
        }
      } else if (variables.payload.status === "published") {
        toast.success("Producto vuelto a publicado");
      } else {
        toast.success("Estado actualizado");
      }

      setReserveOpen(false);
      setSellOpen(false);
      setSelectedProduct(null);
      setSelectedVariantIndex("");
      setSellQuantity("1");
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo actualizar el producto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado correctamente");
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo eliminar el producto");
    },
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? [...products] : [];
    const q = search.toLowerCase().trim();

    const filteredList = list.filter((p) => {
      const matchesSearch =
        !q ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.slug ?? "").toLowerCase().includes(q) ||
        (p.vehicleDetails?.brand ?? "").toLowerCase().includes(q) ||
        (p.vehicleDetails?.model ?? "").toLowerCase().includes(q) ||
        (p.vehicleDetails?.version ?? "").toLowerCase().includes(q) ||
        (p.vehicleDetails?.plate ?? "").toLowerCase().includes(q) ||
        (p.documents ?? []).some(
          (document) =>
            (document.label ?? "").toLowerCase().includes(q) ||
            (document.type ?? "").toLowerCase().includes(q) ||
            (document.fileName ?? "").toLowerCase().includes(q),
        ) ||
        (p.variants ?? []).some(
          (variant) =>
            (variant.size ?? "").toLowerCase().includes(q) ||
            (variant.color ?? "").toLowerCase().includes(q) ||
            (variant.sku ?? "").toLowerCase().includes(q),
        );

      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;

      const createdAtTime = p.createdAt
        ? new Date(p.createdAt).getTime()
        : null;
      const soldAtTime = p.soldAt ? new Date(p.soldAt).getTime() : null;

      const createdFromTime = createdFrom
        ? new Date(`${createdFrom}T00:00:00`).getTime()
        : null;
      const createdToTime = createdTo
        ? new Date(`${createdTo}T23:59:59`).getTime()
        : null;

      const soldFromTime = soldFrom
        ? new Date(`${soldFrom}T00:00:00`).getTime()
        : null;
      const soldToTime = soldTo
        ? new Date(`${soldTo}T23:59:59`).getTime()
        : null;

      const matchesCreatedFrom =
        createdFromTime === null ||
        (createdAtTime !== null && createdAtTime >= createdFromTime);

      const matchesCreatedTo =
        createdToTime === null ||
        (createdAtTime !== null && createdAtTime <= createdToTime);

      const matchesSoldFrom =
        soldFromTime === null ||
        (soldAtTime !== null && soldAtTime >= soldFromTime);

      const matchesSoldTo =
        soldToTime === null ||
        (soldAtTime !== null && soldAtTime <= soldToTime);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCreatedFrom &&
        matchesCreatedTo &&
        matchesSoldFrom &&
        matchesSoldTo
      );
    });

    filteredList.sort((a, b) => {
      if (sortBy === "price_desc") {
        return Number(b.salePrice ?? 0) - Number(a.salePrice ?? 0);
      }

      if (sortBy === "price_asc") {
        return Number(a.salePrice ?? 0) - Number(b.salePrice ?? 0);
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortBy === "oldest") {
        return aCreated - bCreated;
      }

      return bCreated - aCreated;
    });

    return filteredList;
  }, [
    products,
    search,
    statusFilter,
    createdFrom,
    createdTo,
    soldFrom,
    soldTo,
    sortBy,
  ]);

  const toggleExpand = (productId: string) => {
    setExpandedId((prev) => (prev === productId ? null : productId));
  };

  const openReserveDialog = (product: Product) => {
    setSelectedProduct(product);
    setDepositAmount(
      product.reservation?.depositAmount != null
        ? String(product.reservation.depositAmount)
        : "",
    );
    setDepositCurrency(
      product.reservation?.depositCurrency ?? product.currency ?? "ARS",
    );
    setDepositDate(
      product.reservation?.depositDate?.slice(0, 10) ?? todayLocalDate(),
    );
    setCustomerName(product.reservation?.customerName ?? "");
    setCustomerPhone(product.reservation?.customerPhone ?? "");
    setReservationNotes(product.reservation?.notes ?? "");
    setReserveOpen(true);
  };

  const openSellDialog = (product: Product) => {
    setSelectedProduct(product);
    setSoldDate(product.soldAt?.slice(0, 10) ?? todayLocalDate());
    setSoldPrice(
      product.finance?.finalSalePrice != null
        ? String(product.finance.finalSalePrice)
        : String(product.salePrice ?? ""),
    );

    const hasVariants = (product.variants?.length ?? 0) > 0;
    if (hasVariants) {
      const firstAvailableIndex = product.variants?.findIndex(
        (variant) => Number(variant.stock ?? 0) > 0,
      );

      setSelectedVariantIndex(
        firstAvailableIndex !== undefined && firstAvailableIndex >= 0
          ? String(firstAvailableIndex)
          : "",
      );
    } else {
      setSelectedVariantIndex("");
    }

    setSellQuantity("1");
    setSellOpen(true);
  };

  const handleReserveSubmit = () => {
    const productId = selectedProduct?.id ?? selectedProduct?._id;
    if (!productId) {
      toast.error("No se encontró el producto");
      return;
    }

    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error("Ingresá un monto de seña válido");
      return;
    }

    statusMutation.mutate({
      id: productId,
      payload: {
        status: "reserved",
        isPublished: false,
        reservation: {
          depositAmount: Number(depositAmount),
          depositCurrency,
          depositDate: toIsoFromDateInput(depositDate),
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          notes: reservationNotes.trim() || undefined,
        },
      },
    });
  };

  const handleSellSubmit = () => {
    const productId = selectedProduct?.id ?? selectedProduct?._id;
    if (!productId || !selectedProduct) {
      toast.error("No se encontró el producto");
      return;
    }

    if (!soldPrice || Number(soldPrice) <= 0) {
      toast.error("Ingresá un precio final válido");
      return;
    }

    const hasVariants = (selectedProduct.variants?.length ?? 0) > 0;

    if (hasVariants) {
      if (selectedVariantIndex === "") {
        toast.error("Seleccioná una variante");
        return;
      }

      const variantIndex = Number(selectedVariantIndex);
      const variant = selectedProduct.variants?.[variantIndex];

      if (!variant) {
        toast.error("La variante seleccionada no existe");
        return;
      }

      const quantity = Number(sellQuantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        toast.error("Ingresá una cantidad válida");
        return;
      }

      if (quantity > Number(variant.stock ?? 0)) {
        toast.error("La cantidad supera el stock disponible de la variante");
        return;
      }

      statusMutation.mutate({
        id: productId,
        payload: {
          status: "sold",
          isPublished: false,
          soldAt: toIsoFromDateInput(soldDate),
          finalSalePrice: Number(soldPrice),
          clearReservation: true,
          reservation: {
            depositAmount: 0,
            depositCurrency:
              selectedProduct.reservation?.depositCurrency ??
              selectedProduct.currency,
            depositDate: undefined,
            customerName:
              selectedProduct.reservation?.customerName ?? undefined,
            customerPhone:
              selectedProduct.reservation?.customerPhone ?? undefined,
            notes: selectedProduct.reservation?.notes ?? undefined,
          },
        },
      });

      return;
    }

    statusMutation.mutate({
      id: productId,
      payload: {
        status: "sold",
        isPublished: false,
        soldAt: toIsoFromDateInput(soldDate),
        finalSalePrice: Number(soldPrice),
      },
    });
  };

  const handleBackToPublished = (product: Product) => {
    const productId = product.id ?? product._id;
    if (!productId) {
      toast.error("No se encontró el producto");
      return;
    }

    statusMutation.mutate({
      id: productId,
      payload: {
        status: "published",
        isPublished: true,
      },
    });
  };

  const handleReturnDepositAndPublish = (product: Product) => {
    const productId = product.id ?? product._id;
    if (!productId) {
      toast.error("No se encontró el producto");
      return;
    }

    statusMutation.mutate({
      id: productId,
      payload: {
        status: "published",
        isPublished: true,
        clearReservation: true,
      },
    });
  };

  const handleDeleteProduct = (product: Product) => {
    const productId = product.id ?? product._id;
    if (!productId) {
      toast.error("No se encontró el producto");
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(productId);
  };

  const selectedVariant =
    selectedProduct &&
    selectedVariantIndex !== "" &&
    (selectedProduct.variants?.[Number(selectedVariantIndex)] ?? null);

  return (
    <div>
      <DashboardTopbar
        title="Products"
        subtitle="Administrá tus productos"
        actions={
          <Button size="sm" onClick={() => navigate("/dashboard/products/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo producto
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-secondary border-border text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | ProductStatus)
            }
            className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="reserved">Señado</option>
            <option value="sold">Vendido</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
            <option value="out_of_stock">Sin stock</option>
          </select>

          <Input
            type="date"
            value={createdFrom}
            onChange={(e) => setCreatedFrom(e.target.value)}
            className="h-9 bg-secondary border-border text-sm"
          />

          <Input
            type="date"
            value={createdTo}
            onChange={(e) => setCreatedTo(e.target.value)}
            className="h-9 bg-secondary border-border text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <Input
            type="date"
            value={soldFrom}
            onChange={(e) => setSoldFrom(e.target.value)}
            className="h-9 bg-secondary border-border text-sm"
          />

          <Input
            type="date"
            value={soldTo}
            onChange={(e) => setSoldTo(e.target.value)}
            className="h-9 bg-secondary border-border text-sm"
          />

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | "newest"
                  | "oldest"
                  | "price_desc"
                  | "price_asc",
              )
            }
            className="flex h-9 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="newest">Más nuevos</option>
            <option value="oldest">Más viejos</option>
            <option value="price_desc">Precio mayor a menor</option>
            <option value="price_asc">Precio menor a mayor</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCreatedFrom("");
              setCreatedTo("");
              setSoldFrom("");
              setSoldTo("");
              setSortBy("newest");
            }}
          >
            Limpiar filtros
          </Button>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin productos"
            description="Creá tu primer producto para empezar."
            actionLabel="Nuevo producto"
            onAction={() => navigate("/dashboard/products/new")}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Resumen
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const productId = product.id ?? product._id ?? "";
                  const imageUrl =
                    product.coverImage?.url ?? product.images?.[0]?.url ?? null;
                  const isExpanded = expandedId === productId;

                  const stockLabel =
                    product.productType === "auto"
                      ? "-"
                      : product.productType === "ropa"
                        ? String(getTotalVariantStock(product))
                        : String(product.stock ?? 0);

                  return (
                    <Fragment key={productId || product.slug || product.name}>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(productId)}
                            className="rounded p-1 hover:bg-accent transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (productId) {
                                navigate(`/dashboard/products/${productId}`);
                              }
                            }}
                            className="flex items-center gap-3 text-left"
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-8 w-8 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                                {product.productType === "auto" ? (
                                  <Car className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : product.productType === "ropa" ? (
                                  <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="text-foreground font-medium truncate block">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate block">
                                {getProductSummary(product)}
                              </span>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {getProductSummary(product)}
                        </td>

                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                          {formatMoney(product.salePrice)}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {stockLabel}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={getStatusVariant(product.status)}
                            className="text-[10px]"
                          >
                            {getStatusLabel(product.status)}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 rounded hover:bg-accent transition-colors"
                                type="button"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  if (productId) {
                                    navigate(
                                      `/dashboard/products/${productId}`,
                                    );
                                  }
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              {product.status !== "reserved" &&
                                product.status !== "sold" && (
                                  <DropdownMenuItem
                                    onClick={() => openReserveDialog(product)}
                                  >
                                    <HandCoins className="mr-2 h-4 w-4" />
                                    Marcar como señado
                                  </DropdownMenuItem>
                                )}

                              {product.status === "reserved" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openReserveDialog(product)}
                                  >
                                    <HandCoins className="mr-2 h-4 w-4" />
                                    Editar seña
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleReturnDepositAndPublish(product)
                                    }
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Devolver seña y republicar
                                  </DropdownMenuItem>
                                </>
                              )}

                              {product.status !== "sold" && (
                                <DropdownMenuItem
                                  onClick={() => openSellDialog(product)}
                                >
                                  <BadgeDollarSign className="mr-2 h-4 w-4" />
                                  Marcar como vendido
                                </DropdownMenuItem>
                              )}

                              {product.status !== "published" &&
                                product.status !== "reserved" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleBackToPublished(product)
                                    }
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Volver a publicado
                                  </DropdownMenuItem>
                                )}

                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                    Información general
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Estado
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {getStatusLabel(product.status)}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Tipo
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {getProductTypeLabel(
                                          product.productType,
                                        )}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Creado
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {formatDate(product.createdAt)}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Publicado
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {formatDate(product.publishedAt)}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Fecha de seña
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {formatDate(
                                          product.reservation?.depositDate,
                                        )}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-border p-3">
                                      <p className="text-xs text-muted-foreground">
                                        Fecha de venta
                                      </p>
                                      <p className="text-foreground font-medium">
                                        {formatDate(product.soldAt)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    Documentos
                                  </p>

                                  {(product.documents?.length ?? 0) === 0 ? (
                                    <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                                      No hay documentos cargados.
                                    </div>
                                  ) : (
                                    <div className="rounded-md border border-border p-3">
                                      <div className="space-y-3">
                                        {product.documents?.map(
                                          (document, index) => {
                                            const documentName =
                                              document.fileName ||
                                              document.label ||
                                              "documento";

                                            return (
                                              <div
                                                key={`${document.publicId}-${index}`}
                                                className="flex flex-col gap-3 rounded-md border border-border/70 bg-background/40 p-3 md:flex-row md:items-center md:justify-between"
                                              >
                                                <div className="min-w-0 flex items-start gap-3">
                                                  <div className="rounded-md bg-secondary p-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                  </div>

                                                  <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                      {document.label ||
                                                        document.fileName ||
                                                        "Documento"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {getDocumentTypeLabel(
                                                        document.type,
                                                      )}
                                                      {document.fileName
                                                        ? ` • ${document.fileName}`
                                                        : ""}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                      Subido:{" "}
                                                      {formatDate(
                                                        document.uploadedAt,
                                                      )}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex shrink-0 gap-2">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                  >
                                                    <a
                                                      href={getDocumentViewUrl(
                                                        document.url,
                                                      )}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                    >
                                                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                                      Ver
                                                    </a>
                                                  </Button>

                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                  >
                                                    <a
                                                      href={getDocumentDownloadUrl(
                                                        document.url,
                                                      )}
                                                      download={
                                                        document.fileName ||
                                                        document.label ||
                                                        "documento"
                                                      }
                                                      target="_blank"
                                                      rel="noreferrer"
                                                    >
                                                      <Download className="mr-1.5 h-3.5 w-3.5" />
                                                      Descargar
                                                    </a>
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {product.reservation && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                      Datos de la seña
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Monto seña
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoneyWithCurrency(
                                            product.reservation.depositAmount,
                                            product.reservation.depositCurrency,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Cliente
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.reservation.customerName ||
                                            "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Teléfono
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.reservation.customerPhone ||
                                            "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Registrada
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatDateTime(
                                            product.reservation.depositDate,
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    {product.reservation.notes ? (
                                      <div className="rounded-md border border-border p-3 mt-3">
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Notas
                                        </p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                          {product.reservation.notes}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                {product.productType === "auto" && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                      <Car className="h-3.5 w-3.5" />
                                      Datos del auto
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Marca
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.brand || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Modelo
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.model || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Versión
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.version ||
                                            "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Año
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.year || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          KMS
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatKms(
                                            product.vehicleDetails?.kms,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Combustible
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.fuelType ||
                                            "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Transmisión
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails
                                            ?.transmission || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Color
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.color || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Patente
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.vehicleDetails?.plate || "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {product.productType === "ropa" && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                      <Shirt className="h-3.5 w-3.5" />
                                      Variantes de ropa
                                    </p>

                                    {(product.variants?.length ?? 0) === 0 ? (
                                      <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                                        No hay variantes cargadas.
                                      </div>
                                    ) : (
                                      <div className="rounded-md border border-border p-3">
                                        <div className="space-y-2">
                                          {product.variants?.map(
                                            (variant, index) => (
                                              <div
                                                key={`${
                                                  variant.sku || "variant"
                                                }-${index}`}
                                                className="flex items-center justify-between gap-4 text-sm border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
                                              >
                                                <div className="min-w-0">
                                                  <p className="text-foreground font-medium">
                                                    {getVariantLabel(variant)}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {variant.sku || "Sin SKU"}
                                                  </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                  <p className="text-foreground font-medium">
                                                    {variant.salePrice != null
                                                      ? formatMoney(
                                                          variant.salePrice,
                                                        )
                                                      : formatMoney(
                                                          product.salePrice,
                                                        )}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Stock: {variant.stock ?? 0}
                                                  </p>
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {product.productType === "general" && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                      <Boxes className="h-3.5 w-3.5" />
                                      Datos del producto
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Categoría
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.category || "-"}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Stock
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {product.stock ?? 0}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Tags
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {(product.tags ?? []).length > 0
                                            ? product.tags?.join(", ")
                                            : "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {product.finance && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                      Finanzas
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Costo
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.costPrice,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Venta estimada
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.estimatedSalePrice,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Venta final
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.finalSalePrice,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Gastos extra
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.extraExpensesTotal,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Ganancia estimada
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.estimatedProfit,
                                          )}
                                        </p>
                                      </div>

                                      <div className="rounded-md border border-border p-3">
                                        <p className="text-xs text-muted-foreground">
                                          Ganancia real
                                        </p>
                                        <p className="text-foreground font-medium">
                                          {formatMoney(
                                            product.finance.realProfit,
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    {(product.finance.extraExpenseItems ?? [])
                                      .length > 0 && (
                                      <div className="rounded-md border border-border p-3 mt-3">
                                        <p className="text-xs text-muted-foreground mb-2">
                                          Detalle de gastos extra
                                        </p>

                                        <div className="space-y-2">
                                          {(
                                            product.finance.extraExpenseItems ??
                                            []
                                          ).map((item, index) => (
                                            <div
                                              key={`${item.label}-${index}`}
                                              className="flex items-center justify-between text-sm"
                                            >
                                              <div>
                                                <p className="text-foreground font-medium">
                                                  {item.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {formatDate(item.expenseDate)}
                                                </p>
                                              </div>
                                              <span className="text-foreground">
                                                {formatMoney(item.amount)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {product.finance.internalNotes ? (
                                      <div className="rounded-md border border-border p-3 mt-3">
                                        <p className="text-xs text-muted-foreground mb-1">
                                          Notas internas
                                        </p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                          {product.finance.internalNotes}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Marcar como señado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input value={selectedProduct?.name ?? ""} disabled />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Monto de la seña</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <select
                  value={depositCurrency}
                  onChange={(e) =>
                    setDepositCurrency(e.target.value as Currency)
                  }
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha de seña</Label>
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre del cliente</Label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono del cliente</Label>
              <Input
                placeholder="Ej: 11 1234 5678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones sobre la seña..."
                value={reservationNotes}
                onChange={(e) => setReservationNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReserveOpen(false)}
              disabled={statusMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReserveSubmit}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "Guardando..." : "Guardar seña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar venta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input value={selectedProduct?.name ?? ""} disabled />
            </div>

            {(selectedProduct?.variants?.length ?? 0) > 0 && (
              <>
                <div className="space-y-2">
                  <Label>Variante</Label>
                  <select
                    value={selectedVariantIndex}
                    onChange={(e) => setSelectedVariantIndex(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Seleccionar variante</option>
                    {selectedProduct?.variants?.map((variant, index) => (
                      <option
                        key={`${variant.sku || "variant"}-${index}`}
                        value={String(index)}
                        disabled={Number(variant.stock ?? 0) <= 0}
                      >
                        {getVariantLabel(variant)} — stock {variant.stock ?? 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    max={
                      selectedVariant
                        ? Number(selectedVariant.stock ?? 0)
                        : undefined
                    }
                    placeholder="1"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                  />
                </div>

                {selectedVariant && (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                    <p className="text-muted-foreground">
                      Variante seleccionada:
                    </p>
                    <p className="text-foreground font-medium">
                      {getVariantLabel(selectedVariant)}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      SKU: {selectedVariant.sku || "Sin SKU"} • Stock
                      disponible: {selectedVariant.stock ?? 0}
                    </p>
                  </div>
                )}
              </>
            )}
            {hasActiveDeposit(selectedProduct) && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Este auto tiene una seña cargada
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Seña recibida</span>
                    <span className="font-medium text-foreground">
                      {formatMoneyWithCurrency(
                        selectedProduct?.reservation?.depositAmount,
                        selectedProduct?.reservation?.depositCurrency ??
                          selectedProduct?.currency,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Total de venta
                    </span>
                    <span className="font-medium text-foreground">
                      {formatMoneyWithCurrency(
                        Number(soldPrice || 0),
                        selectedProduct?.currency,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                    <span className="text-muted-foreground">Falta pagar</span>
                    <span className="font-semibold text-foreground">
                      {formatMoneyWithCurrency(
                        getPendingPayment(selectedProduct, soldPrice),
                        selectedProduct?.currency,
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Al registrar la venta, la seña queda en $0 para que no siga
                  apareciendo como seña activa.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Precio final de venta</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de venta</Label>
              <Input
                type="date"
                value={soldDate}
                onChange={(e) => setSoldDate(e.target.value)}
              />
            </div>

            <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
              {(selectedProduct?.variants?.length ?? 0) > 0 ? (
                <>
                  Se venderá la variante seleccionada y se descontará su stock.
                  Si era la última unidad disponible del producto, pasará a{" "}
                  <span className="text-foreground font-medium">sin stock</span>
                  .
                </>
              ) : (
                <>
                  Este cambio marcará el producto como{" "}
                  <span className="text-foreground font-medium">vendido</span>,
                  guardará el total real de la venta y limpiará la seña activa.
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSellOpen(false)}
              disabled={statusMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSellSubmit}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? "Guardando..." : "Registrar venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
