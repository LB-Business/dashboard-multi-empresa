import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ArrowLeftRight,
  Package,
  Receipt,
  TrendingUp,
  Wallet,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  movementsService,
  type Movement,
} from "@/services/movements.service";

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString("es-AR")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR");
}

function getMovementTypeLabel(type?: string) {
  switch (type) {
    case "product_created":
      return "Producto creado";
    case "product_updated":
      return "Producto editado";
    case "product_deleted":
      return "Producto eliminado";
    case "product_status_updated":
      return "Estado producto";
    case "product_sold":
      return "Producto vendido";
    case "expense_created":
      return "Gasto creado";
    case "expense_updated":
      return "Gasto editado";
    case "expense_deleted":
      return "Gasto eliminado";
    case "expense_paid":
      return "Gasto pagado";
    case "expense_pending":
      return "Gasto pendiente";
    default:
      return type || "Movimiento";
  }
}

function getMovementIcon(type?: string) {
  switch (type) {
    case "product_created":
    case "product_updated":
    case "product_deleted":
    case "product_status_updated":
      return Package;
    case "product_sold":
      return TrendingUp;
    case "expense_created":
    case "expense_updated":
      return Receipt;
    case "expense_deleted":
      return Trash2;
    case "expense_paid":
      return CheckCircle2;
    case "expense_pending":
      return Clock3;
    default:
      return ArrowLeftRight;
  }
}

function getDirectionVariant(
  direction?: string
): "default" | "secondary" | "outline" {
  switch (direction) {
    case "in":
      return "default";
    case "out":
      return "secondary";
    default:
      return "outline";
  }
}

function getDirectionLabel(direction?: string) {
  switch (direction) {
    case "in":
      return "Ingreso";
    case "out":
      return "Salida";
    default:
      return "Neutral";
  }
}

function getMonthInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(getMonthInputValue());

  const {
    data: movements,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["movements-page", month],
    queryFn: () => movementsService.getAll(month),
  });

  const movementList = Array.isArray(movements) ? movements : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return movementList;

    return movementList.filter((item: Movement) => {
      return (
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.type ?? "").toLowerCase().includes(q) ||
        JSON.stringify(item.meta ?? {}).toLowerCase().includes(q)
      );
    });
  }, [movementList, search]);

  return (
    <div>
      <DashboardTopbar
        title="Movements"
        subtitle="Historial real de acciones del negocio"
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mes</label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-[220px] bg-secondary border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar movimientos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 bg-secondary border-border text-sm"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="Sin movimientos"
                description="No hay movimientos registrados para este período."
              />
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Movimiento
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Tipo
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Dirección
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filtered.map((item) => {
                      const Icon = getMovementIcon(item.type);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-md bg-secondary p-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-foreground font-medium">
                                  {item.title}
                                </p>
                                {item.description ? (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px]">
                              {getMovementTypeLabel(item.type)}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-foreground font-mono text-xs">
                            {formatCurrency(item.amount)}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {formatDate(item.date ?? item.createdAt)}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant={getDirectionVariant(item.direction)}
                              className="text-[10px]"
                            >
                              {getDirectionLabel(item.direction)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}