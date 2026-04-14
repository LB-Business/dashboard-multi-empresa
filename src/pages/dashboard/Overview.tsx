import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LoadingState, ErrorState } from "@/components/dashboard/States";
import { Package, Receipt, CalendarDays, TrendingUp, Clock, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import { expensesService } from "@/services/expenses.service";
import { calendarService } from "@/services/calendar.service";

export default function OverviewPage() {
  const products = useQuery({ queryKey: ["products"], queryFn: productsService.getAll });
  const summary = useQuery({ queryKey: ["expenses-summary"], queryFn: expensesService.getSummary });
  const upcoming = useQuery({ queryKey: ["calendar-upcoming"], queryFn: calendarService.getUpcoming });

  const isLoading = products.isLoading || summary.isLoading || upcoming.isLoading;
  const isError = products.isError && summary.isError && upcoming.isError;

  return (
    <div>
      <DashboardTopbar title="Overview" subtitle="Resumen general de tu negocio" />
      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => { products.refetch(); summary.refetch(); upcoming.refetch(); }} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Productos" value={products.data?.length ?? 0} icon={Package} />
              <StatsCard
                title="Gastos del mes"
                value={summary.data ? `$${summary.data.total.toLocaleString()}` : "$0"}
                icon={Receipt}
              />
              <StatsCard
                title="Gastos fijos"
                value={summary.data ? `$${summary.data.fixed.toLocaleString()}` : "$0"}
                icon={TrendingUp}
              />
              <StatsCard
                title="Próximos eventos"
                value={upcoming.data?.length ?? 0}
                description="Esta semana"
                icon={CalendarDays}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Events */}
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Próximos eventos</h2>
                </div>
                <div className="divide-y divide-border">
                  {(upcoming.data ?? []).slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                  {(!upcoming.data || upcoming.data.length === 0) && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin eventos próximos</div>
                  )}
                </div>
              </div>

              {/* Recent products */}
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Últimos productos</h2>
                </div>
                <div className="divide-y divide-border">
                  {(products.data ?? []).slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toLocaleString()}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.category || "-"}</span>
                    </div>
                  ))}
                  {(!products.data || products.data.length === 0) && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin productos aún</div>
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
