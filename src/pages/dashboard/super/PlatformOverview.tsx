import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Building2, Users, Activity, TrendingUp } from "lucide-react";

const recentActivity = [
  { id: 1, action: "Negocio creado", detail: "Café Central — owner@cafe.com", time: "Hace 1 hora" },
  { id: 2, action: "Owner registrado", detail: "Laura González — laura@tienda.com", time: "Hace 3 horas" },
  { id: 3, action: "Negocio desactivado", detail: "Ropa Express", time: "Ayer" },
  { id: 4, action: "Plan actualizado", detail: "Café Central → Pro", time: "Hace 2 días" },
];

export default function PlatformOverview() {
  return (
    <div>
      <DashboardTopbar title="Platform Overview" subtitle="Resumen general de la plataforma" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Negocios activos" value={34} description="+2 esta semana" icon={Building2} />
          <StatsCard title="Usuarios totales" value={156} description="En toda la plataforma" icon={Users} />
          <StatsCard title="Negocios nuevos (mes)" value={8} description="vs 5 mes anterior" icon={TrendingUp} />
          <StatsCard title="Actividad hoy" value={47} description="Acciones registradas" icon={Activity} />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Actividad reciente de la plataforma</h2>
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
      </div>
    </div>
  );
}
