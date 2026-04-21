import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LoadingState, ErrorState } from "@/components/dashboard/States";
import {
  Package,
  Receipt,
  CalendarDays,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import { expensesService } from "@/services/expenses.service";
import { calendarService } from "@/services/calendar.service";

export default function OverviewPage() {
  const products = useQuery({
    queryKey: ["products"],
    queryFn: productsService.getAll,
  });

  const summary = useQuery({
    queryKey: ["expenses-summary"],
    queryFn: () => expensesService.getSummary(),
  });

  const upcoming = useQuery({
    queryKey: ["calendar-upcoming"],
    queryFn: calendarService.getUpcoming,
  });

  const isLoading =
    products.isLoading || summary.isLoading || upcoming.isLoading;

  const isError = products.isError || summary.isError || upcoming.isError;

  const productList = Array.isArray(products.data) ? products.data : [];
  const upcomingList = Array.isArray(upcoming.data) ? upcoming.data : [];

  return (
    <div>
      <DashboardTopbar
        title="Overview"
        subtitle="Resumen general de tu negocio"
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            onRetry={() => {
              products.refetch();
              summary.refetch();
              upcoming.refetch();
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Productos"
                value={productList.length}
                icon={Package}
              />
              <StatsCard
                title="Gastos del mes"
                value={`$${Number(
                  summary.data?.totalAmount ?? summary.data?.total ?? 0
                ).toLocaleString("es-AR")}`}
                icon={Receipt}
              />
              <StatsCard
                title="Gastos fijos"
                value={`$${Number(
                  summary.data?.fixedAmount ?? summary.data?.fixed ?? 0
                ).toLocaleString("es-AR")}`}
                icon={TrendingUp}
              />
              <StatsCard
                title="Próximos eventos"
                value={upcomingList.length}
                description="Próximos"
                icon={CalendarDays}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Próximos eventos
                  </h2>
                </div>

                <div className="divide-y divide-border">
                  {upcomingList.slice(0, 5).map((item) => (
                    <div
                      key={item.id ?? item._id ?? item.title}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div>
                        <p className="text-sm text-foreground">{item.title ?? "-"}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.type ?? "-"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.startAt
                          ? new Date(item.startAt).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                            })
                          : "-"}
                      </span>
                    </div>
                  ))}

                  {upcomingList.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Sin eventos próximos
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Últimos productos
                  </h2>
                </div>

                <div className="divide-y divide-border">
                  {productList.slice(0, 5).map((item) => (
                    <div
                      key={item.id ?? item._id ?? item.name}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div>
                        <p className="text-sm text-foreground">{item.name ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(item.salePrice ?? 0).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.category || "-"}
                      </span>
                    </div>
                  ))}

                  {productList.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Sin productos aún
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}