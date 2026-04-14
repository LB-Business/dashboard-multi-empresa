import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Package, Receipt, CalendarDays, TrendingUp, Clock, Activity } from "lucide-react";

const recentActivity = [
  { id: 1, action: "Producto creado", detail: "Remera Oversize Negra", time: "Hace 2 horas" },
  { id: 2, action: "Gasto registrado", detail: "Alquiler - $150,000", time: "Hace 5 horas" },
  { id: 3, action: "Evento agregado", detail: "Reunión con proveedor", time: "Ayer" },
  { id: 4, action: "Producto actualizado", detail: "Pantalón Cargo Beige", time: "Hace 2 días" },
];

const upcomingEvents = [
  { id: 1, title: "Pago alquiler", date: "15 Abr", type: "vencimiento" },
  { id: 2, title: "Reunión con proveedor", date: "16 Abr", type: "reunión" },
  { id: 3, title: "Entrega de pedidos", date: "18 Abr", type: "tarea" },
];

export default function OverviewPage() {
  return (
    <div>
      <DashboardTopbar title="Overview" subtitle="Resumen general de tu negocio" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Productos" value={124} description="+3 esta semana" icon={Package} />
          <StatsCard title="Gastos del mes" value="$485,000" description="12 registros" icon={Receipt} />
          <StatsCard title="Gastos fijos" value="$320,000" description="5 items" icon={TrendingUp} />
          <StatsCard title="Próximos eventos" value={7} description="Esta semana" icon={CalendarDays} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Actividad reciente</h2>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Próximos eventos</h2>
            </div>
            <div className="divide-y divide-border">
              {upcomingEvents.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
