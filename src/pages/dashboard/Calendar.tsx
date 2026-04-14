import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { LoadingState, ErrorState, EmptyState } from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Clock, Video, CheckSquare, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarService } from "@/services/calendar.service";
import { toast } from "sonner";

const eventTypes = {
  reminder: { label: "Recordatorio", icon: Clock, color: "text-blue-400" },
  meeting: { label: "Reunión", icon: Video, color: "text-purple-400" },
  task: { label: "Tarea", icon: CheckSquare, color: "text-green-400" },
  deadline: { label: "Vencimiento", icon: AlertTriangle, color: "text-warning" },
};

export default function CalendarPage() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar"],
    queryFn: calendarService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento eliminado");
    },
  });

  const filtered = filter === "all"
    ? (events ?? [])
    : (events ?? []).filter((e) => e.type === filter);

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

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin eventos" description="Creá tu primer evento para organizar tu agenda." />
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => {
              const typeKey = event.type as keyof typeof eventTypes;
              const typeInfo = eventTypes[typeKey] || eventTypes.reminder;
              const Icon = typeInfo.icon;
              return (
                <div key={event._id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors animate-fade-in">
                  <div className={`shrink-0 ${typeInfo.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {event.time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{event.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{typeInfo.label}</Badge>
                    <Badge variant={event.status === "confirmed" || event.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">
                      {event.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
