import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Clock, Video, CheckSquare, AlertTriangle } from "lucide-react";
import { useState } from "react";

const eventTypes = {
  reminder: { label: "Recordatorio", icon: Clock, color: "text-blue-400" },
  meeting: { label: "Reunión", icon: Video, color: "text-purple-400" },
  task: { label: "Tarea", icon: CheckSquare, color: "text-green-400" },
  deadline: { label: "Vencimiento", icon: AlertTriangle, color: "text-warning" },
};

const mockEvents = [
  { id: "1", title: "Pago de alquiler", date: "15 Abr 2026", time: "09:00", type: "deadline" as const, status: "pending" },
  { id: "2", title: "Reunión con proveedor telas", date: "16 Abr 2026", time: "14:00", type: "meeting" as const, status: "confirmed" },
  { id: "3", title: "Preparar pedidos mayoristas", date: "17 Abr 2026", time: "10:00", type: "task" as const, status: "pending" },
  { id: "4", title: "Renovar certificado SSL", date: "18 Abr 2026", time: "-", type: "reminder" as const, status: "pending" },
  { id: "5", title: "Entrega de mercadería", date: "20 Abr 2026", time: "11:00", type: "task" as const, status: "confirmed" },
  { id: "6", title: "Vencimiento patente", date: "30 Abr 2026", time: "-", type: "deadline" as const, status: "pending" },
];

export default function CalendarPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? mockEvents : mockEvents.filter((e) => e.type === filter);

  return (
    <div>
      <DashboardTopbar
        title="Calendar"
        subtitle="Agenda y eventos del negocio"
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nuevo evento</Button>}
      />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {[{ key: "all", label: "Todos" }, ...Object.entries(eventTypes).map(([key, val]) => ({ key, label: val.label }))].map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((event) => {
            const typeInfo = eventTypes[event.type];
            const Icon = typeInfo.icon;
            return (
              <div key={event.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors animate-fade-in">
                <div className={`shrink-0 ${typeInfo.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />{event.date}
                    </span>
                    {event.time !== "-" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{event.time}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{typeInfo.label}</Badge>
                  <Badge variant={event.status === "confirmed" ? "default" : "secondary"} className="text-[10px]">
                    {event.status === "confirmed" ? "Confirmado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
