import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/dashboard/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, TrendingUp, TrendingDown, CheckCircle, Clock, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { expensesService } from "@/services/expenses.service";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fixed" | "extra">("all");

  const { data: expenses, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: expensesService.getAll,
  });
  const { data: summary } = useQuery({
    queryKey: ["expenses-summary"],
    queryFn: expensesService.getSummary,
  });

  const filtered = (expenses ?? []).filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <DashboardTopbar
        title="Expenses"
        subtitle="Control de gastos del negocio"
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nuevo gasto</Button>}
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total del mes" value={summary ? `$${summary.total.toLocaleString()}` : "$0"} icon={Receipt} />
          <StatsCard title="Gastos fijos" value={summary ? `$${summary.fixed.toLocaleString()}` : "$0"} icon={TrendingUp} />
          <StatsCard title="Gastos extras" value={summary ? `$${summary.extra.toLocaleString()}` : "$0"} icon={TrendingDown} />
          <StatsCard
            title="Pagados"
            value={summary ? `$${summary.paid.toLocaleString()}` : "$0"}
            description={summary ? `Pendiente: $${summary.pending.toLocaleString()}` : undefined}
            icon={CheckCircle}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar gastos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 bg-secondary border-border text-sm" />
          </div>
          <div className="flex gap-1">
            {(["all", "fixed", "extra"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f)}>
                {f === "all" ? "Todos" : f === "fixed" ? "Fijos" : "Extras"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="Sin gastos" description="Registrá tu primer gasto para empezar a trackear." />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Gasto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((expense) => (
                  <tr key={expense._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{expense.title}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{expense.category || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">{expense.type === "fixed" ? "Fijo" : "Extra"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground font-mono text-xs">${expense.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(expense.date).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      {expense.paid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle className="h-3 w-3" />Pagado</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-warning"><Clock className="h-3 w-3" />Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
