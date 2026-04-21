import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Search,
  Package,
  HandCoins,
  Car,
  ArrowRightLeft,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  financeService,
  type FinanceMovement,
} from "@/services/finance.service";

function formatCurrency(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString("es-AR")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR");
}

function getMovementTypeLabel(type?: string) {
  switch (type) {
    case "expense_manual":
      return "Gasto manual";
    case "product_extra_expense":
      return "Gasto producto";
    case "vehicle_purchase":
      return "Compra";
    case "deposit_received":
      return "Seña";
    case "deposit_refunded":
      return "Devolución";
    case "product_sale":
      return "Venta";
    case "consignment_settlement":
      return "Liquidación";
    default:
      return "Movimiento";
  }
}

function getMovementIcon(type?: string) {
  switch (type) {
    case "expense_manual":
      return Receipt;
    case "product_extra_expense":
      return Package;
    case "vehicle_purchase":
      return Car;
    case "deposit_received":
      return HandCoins;
    case "product_sale":
      return TrendingUp;
    case "consignment_settlement":
      return ArrowRightLeft;
    default:
      return Wallet;
  }
}

function getDirectionVariant(direction?: string) {
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

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(getMonthInputValue());

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["finance-summary", month],
    queryFn: () => financeService.getSummary(month),
  });

  const {
    data: movements,
    isLoading: movementsLoading,
    isError: movementsError,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ["finance-movements", month],
    queryFn: () => financeService.getMovements(month),
  });

  const isLoading = summaryLoading || movementsLoading;
  const isError = summaryError || movementsError;

  const movementList = Array.isArray(movements) ? movements : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return movementList;
    return movementList.filter((item: FinanceMovement) => {
      return (
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.productName ?? "").toLowerCase().includes(q) ||
        (item.type ?? "").toLowerCase().includes(q)
      );
    });
  }, [movementList, search]);

  return (
    <div>
      <DashboardTopbar title="Finance" subtitle="Resumen financiero del negocio" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            onRetry={() => {
              refetchSummary();
              refetchMovements();
            }}
          />
        ) : (
          <>
            {/* Month selector */}
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

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard title="Balance" value={formatCurrency(summary?.totals.balance)} icon={Wallet} />
              <StatsCard title="Ingresos" value={formatCurrency(summary?.totals.income)} icon={TrendingUp} />
              <StatsCard title="Egresos" value={formatCurrency(summary?.totals.expenses)} icon={TrendingDown} />
              <StatsCard title="Ventas" value={formatCurrency(summary?.totals.salesIncome)} icon={Package} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard title="Señas" value={formatCurrency(summary?.totals.depositsIncome)} icon={HandCoins} />
              <StatsCard title="Gastos manuales" value={formatCurrency(summary?.totals.manualExpenses)} icon={Receipt} />
              <StatsCard title="Gastos productos" value={formatCurrency(summary?.totals.productExtraExpenses)} icon={Package} />
              <StatsCard title="Compras vehículos" value={formatCurrency(summary?.totals.vehiclePurchases)} icon={Car} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard title="Ganancia estimada" value={formatCurrency(summary?.productStats.estimatedProfit)} icon={TrendingUp} />
              <StatsCard title="Ganancia real" value={formatCurrency(summary?.productStats.realProfit)} icon={Wallet} />
              <StatsCard title="Publicados" value={Number(summary?.productStats.publishedCount ?? 0)} icon={Package} />
              <StatsCard title="Vendidos" value={Number(summary?.productStats.soldCount ?? 0)} icon={TrendingUp} />
            </div>

            {/* Search */}
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

            {/* Movements table */}
            {filtered.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Sin movimientos"
                description="No hay movimientos financieros para este período."
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
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 rounded-md bg-secondary p-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-foreground font-medium">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px]">{getMovementTypeLabel(item.type)}</Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground font-mono text-xs">{item.amount != null ? formatCurrency(item.amount) : "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(item.date)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={getDirectionVariant(item.direction)} className="text-[10px]">{getDirectionLabel(item.direction)}</Badge>
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