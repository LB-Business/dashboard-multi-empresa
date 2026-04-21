import { useMemo, useRef, useState } from "react";
import FullCalendar, {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  calendarService,
  type CalendarEvent,
  type CalendarVisualType,
} from "@/services/calendar.service";
import { businessesService } from "@/services/businesses.service";

type EventType = CalendarVisualType;

const eventTypes: Record<
  EventType,
  { label: string; bg: string; dot: string; border: string }
> = {
  reminder: {
    label: "Recordatorio",
    bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    dot: "#60a5fa",
    border: "#3b82f6",
  },
  appointment: {
    label: "Turno",
    bg: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
    dot: "#2dd4bf",
    border: "#14b8a6",
  },
  meeting: {
    label: "Reunión",
    bg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    dot: "#a78bfa",
    border: "#8b5cf6",
  },
  task: {
    label: "Tarea",
    bg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    dot: "#34d399",
    border: "#10b981",
  },
  deadline: {
    label: "Vencimiento",
    bg: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
    dot: "#fb923c",
    border: "#f97316",
  },
};

function formatLocalDateKey(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatMoney(
  amount?: number | null,
  currency?: string | null
): string | null {
  if (amount === null || amount === undefined) return null;
  return `${currency ?? "ARS"} ${Number(amount).toLocaleString("es-AR")}`;
}

export default function CalendarPage() {
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  });

  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();

  const {
    data: business,
  } = useQuery({
    queryKey: ["my-business"],
    queryFn: businessesService.getMyBusiness,
  });

  const publicBookingUrl = business?.slug
    ? `${window.location.origin}/${business.slug}/turnos`
    : "";

  const {
    data: eventsRaw,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "calendar",
      visibleRange.start.toISOString(),
      visibleRange.end.toISOString(),
    ],
    queryFn: () =>
      calendarService.getAll({
        dateFrom: visibleRange.start.toISOString(),
        dateTo: visibleRange.end.toISOString(),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento eliminado");
    },
    onError: () => {
      toast.error("No se pudo eliminar el evento");
    },
  });

  const allEvents = useMemo(() => {
    const list = Array.isArray(eventsRaw) ? eventsRaw : [];

    return list.map((e: CalendarEvent) => ({
      id: e._id ?? e.id ?? "",
      title: e.title,
      start: e.startAt,
      end: e.endAt ?? undefined,
      allDay: e.allDay ?? false,
      extendedProps: {
        type: e.type,
        status: e.status,
        source: e.source ?? "calendar",
        contactName: e.contactName,
        contactPhone: e.contactPhone,
        contactEmail: e.contactEmail,
        location: e.location,
        notes: e.notes,
        readOnly: e.readOnly ?? false,
        description: e.description ?? null,
        meta: e.meta ?? {},
      },
    }));
  }, [eventsRaw]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(
      (event: any) => filter === "all" || event.extendedProps?.type === filter
    );
  }, [allEvents, filter]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];

    return filteredEvents.filter((event: any) => {
      const rawDate = event.start;
      const localDate = formatLocalDateKey(rawDate);
      return localDate === selectedDate;
    });
  }, [filteredEvents, selectedDate]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const source = clickInfo.event.extendedProps.source;
    const readOnly = !!clickInfo.event.extendedProps.readOnly;

    if (readOnly || source === "expense_calendar" || source === "product_calendar") {
      if (source === "expense_calendar") {
        toast.info("Este evento viene de Expenses. Se gestiona desde esa sección.");
        return;
      }

      if (source === "product_calendar") {
        toast.info("Este evento viene de Products. Se gestiona desde esa sección.");
        return;
      }

      toast.info("Este evento no se elimina desde Calendar.");
      return;
    }

    if (
      window.confirm(`¿Querés eliminar el evento "${clickInfo.event.title}"?`)
    ) {
      deleteMutation.mutate(clickInfo.event.id);
    }
  };

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
  };

  const handleDatesSet = (info: DatesSetArg) => {
    setVisibleRange({
      start: info.start,
      end: info.end,
    });
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const eventType = (eventInfo.event.extendedProps.type ||
      "reminder") as EventType;
    const theme = eventTypes[eventType] ?? eventTypes.reminder;

    return (
      <div
        className="w-full rounded-lg px-2 py-1 text-white shadow-sm"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: theme.dot }}
          />
          <span className="truncate text-[11px] font-medium">
            {eventInfo.timeText ? `${eventInfo.timeText} ` : ""}
            {eventInfo.event.title}
          </span>
        </div>
      </div>
    );
  };

  const copyPublicLink = async () => {
    if (!publicBookingUrl) {
      toast.error("No se pudo generar el link de turnos");
      return;
    }

    try {
      await navigator.clipboard.writeText(publicBookingUrl);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`
        .fc {
          --fc-border-color: rgba(255,255,255,0.08);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-list-event-hover-bg-color: rgba(255,255,255,0.03);
          --fc-today-bg-color: rgba(255,255,255,0.03);
          --fc-now-indicator-color: #60a5fa;
          color: #f8fafc;
        }

        .fc .fc-scrollgrid,
        .fc .fc-scrollgrid-section > *,
        .fc .fc-daygrid-body,
        .fc .fc-daygrid-body table,
        .fc .fc-col-header,
        .fc .fc-col-header table {
          background: transparent !important;
        }

        .fc .fc-toolbar.fc-header-toolbar {
          margin-bottom: 1rem;
          gap: 0.75rem;
        }

        .fc .fc-toolbar-title {
          font-size: 2rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.03em;
        }

        .fc .fc-button {
          background: #161616 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: #f8fafc !important;
          box-shadow: none !important;
          padding: 0.65rem 0.9rem !important;
          border-radius: 0.95rem !important;
          text-transform: lowercase;
          font-weight: 600;
        }

        .fc .fc-button:hover {
          background: #222222 !important;
        }

        .fc .fc-button.fc-button-active {
          background: #2c2c2c !important;
          border-color: rgba(255,255,255,0.14) !important;
        }

        .fc .fc-button:disabled {
          opacity: 0.5;
        }

        .fc-theme-standard th {
          background: #111111 !important;
          color: #cbd5e1 !important;
          font-weight: 600;
          font-size: 0.82rem;
          padding: 0.9rem 0.4rem;
          border-color: rgba(255,255,255,0.08) !important;
        }

        .fc .fc-col-header-cell-cushion {
          color: #cbd5e1 !important;
          text-decoration: none;
          padding: 0.35rem 0;
        }

        .fc .fc-daygrid-day,
        .fc .fc-timegrid-slot,
        .fc .fc-timegrid-axis,
        .fc .fc-scrollgrid,
        .fc .fc-scrollgrid-section > * {
          background: transparent !important;
        }

        .fc .fc-daygrid-day-frame {
          min-height: 124px;
          padding: 0.35rem;
          background: #0a0a0a;
          cursor: pointer;
        }

        .fc .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background: #141414;
          transition: background 0.18s ease;
        }

        .fc .fc-daygrid-day-number {
          color: #f8fafc !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.4rem 0.45rem 0 0;
        }

        .fc .fc-day-other .fc-daygrid-day-number {
          color: #525252 !important;
        }

        .fc .fc-day-today .fc-daygrid-day-frame {
          background: #1a1a1a !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
        }

        .fc td,
        .fc th {
          border-color: rgba(255,255,255,0.08) !important;
        }

        .fc .fc-event {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }

        .fc .fc-event-main {
          padding: 0 !important;
        }

        .fc .fc-daygrid-more-link {
          color: #93c5fd;
          font-weight: 600;
        }

        .fc .fc-timegrid-slot-label-cushion,
        .fc .fc-timegrid-axis-cushion {
          color: #94a3b8;
        }

        .fc .fc-list-day-cushion {
          background: #111111 !important;
        }
      `}</style>

      <div className="flex items-center justify-between px-8 pt-8 pb-5">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Agenda y eventos del negocio
          </p>
        </div>

        <Button
          className="h-11 rounded-xl bg-white px-5 text-black hover:bg-slate-200"
          onClick={() => toast.info("Después armamos el alta manual con modal")}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      <div className="px-8 pb-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Link público de turnos
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Compartilo rápido por WhatsApp o donde quieras.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="max-w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-slate-200 break-all">
                {publicBookingUrl || "Cargando link..."}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-[#161616] text-white hover:bg-[#222222]"
                  onClick={copyPublicLink}
                  disabled={!publicBookingUrl}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>

                <Button
                  type="button"
                  className="bg-white text-black hover:bg-slate-200"
                  onClick={() => {
                    if (!publicBookingUrl) return;
                    window.open(publicBookingUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!publicBookingUrl}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="w-[300px] shrink-0 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              Filtros
            </h2>

            <div className="space-y-3">
              <Button
                onClick={() => setFilter("all")}
                className={`h-12 w-full rounded-2xl text-sm font-semibold ${
                  filter === "all"
                    ? "bg-white text-black hover:bg-slate-200"
                    : "bg-[#161616] text-white hover:bg-[#222222]"
                }`}
              >
                Todos
              </Button>

              {(Object.keys(eventTypes) as EventType[]).map((key) => (
                <Button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`h-12 w-full rounded-2xl text-sm font-semibold ${
                    filter === key
                      ? "bg-white text-black hover:bg-slate-200"
                      : "bg-[#161616] text-white hover:bg-[#222222]"
                  }`}
                >
                  {eventTypes[key].label}
                </Button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-semibold tracking-tight">
                {selectedDate
                  ? `Detalle ${selectedDate} (${selectedDayEvents.length})`
                  : `Eventos (${filteredEvents.length})`}
              </h3>

              {selectedDate ? (
                selectedDayEvents.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-slate-400">
                    No hay eventos para ese día
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {selectedDayEvents.map((event: any) => {
                      const eventType = (event.extendedProps?.type ||
                        "reminder") as EventType;
                      const theme = eventTypes[eventType] ?? eventTypes.reminder;
                      const eventDate = event.start;
                      const source = event.extendedProps?.source;
                      const meta = event.extendedProps?.meta ?? {};

                      return (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-white/8 bg-[#111111] px-4 py-3"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: theme.dot }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {event.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {eventDate
                                  ? new Date(eventDate).toLocaleString("es-AR")
                                  : ""}
                              </p>

                              {source === "expense_calendar" ? (
                                <>
                                  {formatMoney(
                                    Number(meta.expenseAmount ?? 0),
                                    String(meta.expenseCurrency ?? "ARS")
                                  ) ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Importe:{" "}
                                      {formatMoney(
                                        Number(meta.expenseAmount ?? 0),
                                        String(meta.expenseCurrency ?? "ARS")
                                      )}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-slate-500">
                                    Estado:{" "}
                                    {meta.expensePaymentStatus === "paid"
                                      ? "Pagado"
                                      : "Pendiente"}
                                  </p>
                                  {meta.recurrence ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Repite: {String(meta.recurrence)}
                                    </p>
                                  ) : null}
                                </>
                              ) : source === "product_calendar" ? (
                                <>
                                  {meta.amount != null ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Importe:{" "}
                                      {formatMoney(
                                        Number(meta.amount ?? 0),
                                        String(meta.currency ?? "ARS")
                                      )}
                                    </p>
                                  ) : null}
                                  {event.extendedProps?.contactName ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Cliente: {event.extendedProps.contactName}
                                    </p>
                                  ) : null}
                                  {event.extendedProps?.contactPhone ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Tel: {event.extendedProps.contactPhone}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  {event.extendedProps?.contactName ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Cliente: {event.extendedProps.contactName}
                                    </p>
                                  ) : null}
                                  {event.extendedProps?.contactPhone ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Tel: {event.extendedProps.contactPhone}
                                    </p>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : filteredEvents.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-slate-400">
                  No hay eventos
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {filteredEvents.map((event: any) => {
                    const eventType = (event.extendedProps?.type ||
                      "reminder") as EventType;
                    const theme = eventTypes[eventType] ?? eventTypes.reminder;
                    const eventDate = event.start;

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-white/8 bg-[#111111] px-4 py-3"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {event.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {eventDate
                                ? new Date(eventDate).toLocaleDateString("es-AR")
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
            {isLoading ? (
              <div className="flex h-[680px] items-center justify-center text-slate-400">
                Cargando calendario...
              </div>
            ) : isError ? (
              <div className="flex h-[680px] flex-col items-center justify-center gap-3 text-center">
                <p className="text-slate-300">No se pudo cargar el calendario</p>
                <Button
                  onClick={() => refetch()}
                  className="rounded-xl bg-white text-black hover:bg-slate-200"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                dayMaxEvents
                height="auto"
                events={filteredEvents}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={handleDatesSet}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}