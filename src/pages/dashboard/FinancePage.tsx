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
  type CurrencyCode,
  type FinanceMovement,
  type FinanceTotals,
} from "@/services/finance.service";

type FinanceMovementWithMeta = FinanceMovement & {
  meta?: Record<string, any>;
  productId?: string | null;
  sourceId?: string | null;
  currency?: CurrencyCode | null;
};

function formatCurrency(value?: number | null, currency: CurrencyCode = "ARS") {
  const amount = Number(value ?? 0);

  if (currency === "USD") {
    return `USD ${amount.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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
    case "product_extra_expense_created":
      return "Gasto producto";
    case "vehicle_purchase":
      return "Compra";
    case "deposit_received":
      return "Seña";
    case "deposit_refunded":
      return "Devolución";
    case "product_sale":
    case "product_sold":
      return "Venta";
    case "consignment_settlement":
      return "Liquidación";
    case "product_created":
      return "Producto creado";
    case "product_updated":
      return "Producto actualizado";
    case "product_deleted":
      return "Producto eliminado";
    case "product_status_updated":
      return "Cambio de estado";
    case "product_inventory_updated":
      return "Inventario";
    default:
      return "Movimiento";
  }
}

function getMovementIcon(type?: string) {
  switch (type) {
    case "expense_manual":
      return Receipt;
    case "product_extra_expense":
    case "product_extra_expense_created":
      return Package;
    case "vehicle_purchase":
      return Car;
    case "deposit_received":
      return HandCoins;
    case "deposit_refunded":
      return TrendingDown;
    case "product_sale":
    case "product_sold":
      return TrendingUp;
    case "consignment_settlement":
      return ArrowRightLeft;
    case "product_created":
    case "product_updated":
    case "product_deleted":
    case "product_status_updated":
    case "product_inventory_updated":
      return Package;
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

function emptyTotals(): FinanceTotals {
  return {
    income: 0,
    expenses: 0,
    balance: 0,
    salesIncome: 0,
    depositsIncome: 0,
    manualExpenses: 0,
    productExtraExpenses: 0,
    vehiclePurchases: 0,
    consignmentSettlements: 0,
  };
}

function getMeta(item: FinanceMovement) {
  return (item as FinanceMovementWithMeta).meta ?? {};
}

function getKeyValue(value: any) {
  if (value === undefined || value === null || value === "") return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (value.id) return String(value.id);
    if (value._id) return String(value._id);
  }

  return "";
}

function getMovementProductKey(item: FinanceMovement) {
  const movement = item as FinanceMovementWithMeta;
  const meta = getMeta(item);

  return (
    getKeyValue(movement.productId) ||
    getKeyValue(movement.sourceId) ||
    getKeyValue(meta.productId) ||
    getKeyValue(meta.sourceId) ||
    ""
  );
}

function getCurrencyFromValue(value: any): CurrencyCode | null {
  if (value === "ARS" || value === "USD") {
    return value;
  }

  return null;
}

function getMovementCurrency(item: FinanceMovement): CurrencyCode {
  const movement = item as FinanceMovementWithMeta;
  const meta = getMeta(item);

  return (
    getCurrencyFromValue(movement.currency) ||
    getCurrencyFromValue(meta.currency) ||
    getCurrencyFromValue(meta.previousReservation?.depositCurrency) ||
    getCurrencyFromValue(meta.reservation?.depositCurrency) ||
    "ARS"
  );
}

function isSaleMovement(type?: string) {
  return type === "product_sale" || type === "product_sold";
}

function isProductExtraExpenseMovement(type?: string) {
  return (
    type === "product_extra_expense" ||
    type === "product_extra_expense_created"
  );
}

function calculateTotalsByCurrency(
  movements: FinanceMovement[],
  currency: CurrencyCode,
): FinanceTotals {
  const totals = emptyTotals();

  for (const movement of movements) {
    if (getMovementCurrency(movement) !== currency) continue;

    const amount = Number(movement.amount ?? 0);

    if (movement.direction === "in") totals.income += amount;
    if (movement.direction === "out") totals.expenses += amount;

    if (isSaleMovement(movement.type)) {
      totals.salesIncome += amount;
      continue;
    }

    if (isProductExtraExpenseMovement(movement.type)) {
      totals.productExtraExpenses += amount;
      continue;
    }

    switch (movement.type) {
      case "deposit_received":
        totals.depositsIncome += amount;
        break;
      case "expense_manual":
        totals.manualExpenses += amount;
        break;
      case "vehicle_purchase":
        totals.vehiclePurchases += amount;
        break;
      case "consignment_settlement":
        totals.consignmentSettlements += amount;
        break;
    }
  }

  totals.balance = totals.income - totals.expenses;

  return totals;
}

function calculateRefundsByCurrency(
  movements: FinanceMovement[],
  currency: CurrencyCode,
) {
  return movements.reduce((acc, movement) => {
    if (getMovementCurrency(movement) !== currency) return acc;
    if (movement.type !== "deposit_refunded") return acc;

    return acc + Number(movement.amount ?? 0);
  }, 0);
}

function calculateActiveDepositsByCurrency(
  movements: FinanceMovement[],
  currency: CurrencyCode,
  soldProductIds: Set<string>,
) {
  const byProduct = new Map<string, number>();
  let withoutProductKey = 0;

  for (const movement of movements) {
    if (getMovementCurrency(movement) !== currency) continue;

    const productKey = getMovementProductKey(movement);
    const amount = Number(movement.amount ?? 0);

    if (movement.type === "deposit_received") {
      if (productKey && soldProductIds.has(productKey)) continue;

      if (productKey) {
        byProduct.set(productKey, (byProduct.get(productKey) ?? 0) + amount);
      } else {
        withoutProductKey += amount;
      }
    }

    if (movement.type === "deposit_refunded") {
      if (productKey) {
        byProduct.set(productKey, (byProduct.get(productKey) ?? 0) - amount);
      } else {
        withoutProductKey -= amount;
      }
    }
  }

  let total = Math.max(withoutProductKey, 0);

  byProduct.forEach((value) => {
    total += Math.max(value, 0);
  });

  return total;
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

  const soldProductIds = useMemo(() => {
    const ids = new Set<string>();

    movementList.forEach((item) => {
      if (isSaleMovement(item.type)) {
        const productKey = getMovementProductKey(item);

        if (productKey) {
          ids.add(productKey);
        }
      }
    });

    return ids;
  }, [movementList]);

  const accountingMovements = useMemo(() => {
    return movementList.filter((item) => {
      if (item.type !== "deposit_received") return true;

      const productKey = getMovementProductKey(item);

      if (!productKey) return true;

      return !soldProductIds.has(productKey);
    });
  }, [movementList, soldProductIds]);

  const absorbedDeposits = useMemo(() => {
    return movementList.filter((item) => {
      if (item.type !== "deposit_received") return false;

      const productKey = getMovementProductKey(item);

      if (!productKey) return false;

      return soldProductIds.has(productKey);
    });
  }, [movementList, soldProductIds]);

  const refundMovements = useMemo(() => {
    return accountingMovements.filter(
      (item) => item.type === "deposit_refunded",
    );
  }, [accountingMovements]);

  const arsTotals = useMemo(
    () => calculateTotalsByCurrency(accountingMovements, "ARS"),
    [accountingMovements],
  );

  const usdTotals = useMemo(
    () => calculateTotalsByCurrency(accountingMovements, "USD"),
    [accountingMovements],
  );

  const arsRefunds = useMemo(
    () => calculateRefundsByCurrency(accountingMovements, "ARS"),
    [accountingMovements],
  );

  const usdRefunds = useMemo(
    () => calculateRefundsByCurrency(accountingMovements, "USD"),
    [accountingMovements],
  );

  const arsActiveDeposits = useMemo(
    () => calculateActiveDepositsByCurrency(accountingMovements, "ARS", soldProductIds),
    [accountingMovements, soldProductIds],
  );

  const usdActiveDeposits = useMemo(
    () => calculateActiveDepositsByCurrency(accountingMovements, "USD", soldProductIds),
    [accountingMovements, soldProductIds],
  );

  const arsStats = summary?.productStatsByCurrency?.ARS ?? {
    estimatedProfit: summary?.productStats?.estimatedProfit ?? 0,
    realProfit: summary?.productStats?.realProfit ?? 0,
  };

  const usdStats = summary?.productStatsByCurrency?.USD ?? {
    estimatedProfit: 0,
    realProfit: 0,
  };

  const hasUsdData =
    usdTotals.income !== 0 ||
    usdTotals.expenses !== 0 ||
    usdTotals.balance !== 0 ||
    usdTotals.salesIncome !== 0 ||
    usdTotals.vehiclePurchases !== 0 ||
    usdActiveDeposits !== 0 ||
    usdRefunds !== 0 ||
    usdStats.estimatedProfit !== 0 ||
    usdStats.realProfit !== 0 ||
    accountingMovements.some((item) => getMovementCurrency(item) === "USD");

  const publishedCount = Number(summary?.productStats?.publishedCount ?? 0);
  const soldCount = Number(summary?.productStats?.soldCount ?? 0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return accountingMovements;

    return accountingMovements.filter((item: FinanceMovement) => {
      return (
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.productName ?? "").toLowerCase().includes(q) ||
        (item.type ?? "").toLowerCase().includes(q) ||
        getMovementCurrency(item).toLowerCase().includes(q)
      );
    });
  }, [accountingMovements, search]);

  return (
    <div>
      <DashboardTopbar
        title="Finance"
        subtitle="Resumen financiero del negocio"
      />

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

            {absorbedDeposits.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Hay {absorbedDeposits.length} seña
                {absorbedDeposits.length === 1 ? "" : "s"} absorbida
                {absorbedDeposits.length === 1 ? "" : "s"} por ventas finales.
                No se suman como ingreso separado porque la venta ya representa
                el total del producto.
              </div>
            )}

            {refundMovements.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Hay {refundMovements.length} devolución
                {refundMovements.length === 1 ? "" : "es"} de seña registrada
                {refundMovements.length === 1 ? "" : "s"}. Se muestran como
                egresos para compensar la seña recibida.
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Resumen en pesos argentinos
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                  title="Balance ARS"
                  value={formatCurrency(arsTotals.balance, "ARS")}
                  icon={Wallet}
                />

                <StatsCard
                  title="Ingresos ARS"
                  value={formatCurrency(arsTotals.income, "ARS")}
                  icon={TrendingUp}
                />

                <StatsCard
                  title="Egresos ARS"
                  value={formatCurrency(arsTotals.expenses, "ARS")}
                  icon={TrendingDown}
                />

                <StatsCard
                  title="Ventas ARS"
                  value={formatCurrency(arsTotals.salesIncome, "ARS")}
                  icon={Package}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                  title="Señas activas ARS"
                  value={formatCurrency(arsActiveDeposits, "ARS")}
                  icon={HandCoins}
                />

                <StatsCard
                  title="Devoluciones ARS"
                  value={formatCurrency(arsRefunds, "ARS")}
                  icon={TrendingDown}
                />

                <StatsCard
                  title="Gastos manuales ARS"
                  value={formatCurrency(arsTotals.manualExpenses, "ARS")}
                  icon={Receipt}
                />

                <StatsCard
                  title="Gastos productos ARS"
                  value={formatCurrency(arsTotals.productExtraExpenses, "ARS")}
                  icon={Package}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                  title="Compras vehículos ARS"
                  value={formatCurrency(arsTotals.vehiclePurchases, "ARS")}
                  icon={Car}
                />

                <StatsCard
                  title="Ganancia estimada ARS"
                  value={formatCurrency(arsStats.estimatedProfit, "ARS")}
                  icon={TrendingUp}
                />

                <StatsCard
                  title="Ganancia real ARS"
                  value={formatCurrency(arsStats.realProfit, "ARS")}
                  icon={Wallet}
                />

                <StatsCard
                  title="Publicados"
                  value={publishedCount}
                  icon={Package}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                  title="Vendidos"
                  value={soldCount}
                  icon={TrendingUp}
                />
              </div>
            </div>

            {hasUsdData && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resumen en dólares
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatsCard
                    title="Balance USD"
                    value={formatCurrency(usdTotals.balance, "USD")}
                    icon={Wallet}
                  />

                  <StatsCard
                    title="Ingresos USD"
                    value={formatCurrency(usdTotals.income, "USD")}
                    icon={TrendingUp}
                  />

                  <StatsCard
                    title="Egresos USD"
                    value={formatCurrency(usdTotals.expenses, "USD")}
                    icon={TrendingDown}
                  />

                  <StatsCard
                    title="Ventas USD"
                    value={formatCurrency(usdTotals.salesIncome, "USD")}
                    icon={Package}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatsCard
                    title="Señas activas USD"
                    value={formatCurrency(usdActiveDeposits, "USD")}
                    icon={HandCoins}
                  />

                  <StatsCard
                    title="Devoluciones USD"
                    value={formatCurrency(usdRefunds, "USD")}
                    icon={TrendingDown}
                  />

                  <StatsCard
                    title="Compras vehículos USD"
                    value={formatCurrency(usdTotals.vehiclePurchases, "USD")}
                    icon={Car}
                  />

                  <StatsCard
                    title="Liquidaciones USD"
                    value={formatCurrency(
                      usdTotals.consignmentSettlements,
                      "USD",
                    )}
                    icon={ArrowRightLeft}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatsCard
                    title="Ganancia estimada USD"
                    value={formatCurrency(usdStats.estimatedProfit, "USD")}
                    icon={TrendingUp}
                  />

                  <StatsCard
                    title="Ganancia real USD"
                    value={formatCurrency(usdStats.realProfit, "USD")}
                    icon={Wallet}
                  />
                </div>
              </div>
            )}

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
                        Moneda
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
                      const currency = getMovementCurrency(item);

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

                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px]">
                              {getMovementTypeLabel(item.type)}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-foreground font-mono text-xs">
                            {item.amount != null
                              ? formatCurrency(item.amount, currency)
                              : "-"}
                          </td>

                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="outline" className="text-[10px]">
                              {currency}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {formatDate(item.date)}
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