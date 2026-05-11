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
import {
  Copy,
  ExternalLink,
  Plus,
  X,
  Trash2,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  calendarService,
  type CalendarEvent,
  type CalendarVisualType,
  type CreateEventPayload,
} from "@/services/calendar.service";
import { businessesService } from "@/services/businesses.service";

type EventType = CalendarVisualType;

const eventTypes: Record<
  EventType,
  { label: string; short: string; bg: string; dot: string; border: string }
> = {
  reminder: {
    label: "Recordatorio",
    short: "Record.",
    bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    dot: "#60a5fa",
    border: "#3b82f6",
  },
  appointment: {
    label: "Turno",
    short: "Turno",
    bg: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
    dot: "#2dd4bf",
    border: "#14b8a6",
  },
  meeting: {
    label: "Reunión",
    short: "Reunión",
    bg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    dot: "#a78bfa",
    border: "#8b5cf6",
  },
  task: {
    label: "Tarea",
    short: "Tarea",
    bg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    dot: "#34d399",
    border: "#10b981",
  },
  deadline: {
    label: "Vencimiento",
    short: "Vence",
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

function toDatetimeLocalValue(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function datetimeLocalToIso(value: string) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined) return null;
  return `${currency ?? "ARS"} ${Number(amount).toLocaleString("es-AR")}`;
}

function getEventId(event: CalendarEvent) {
  return event._id ?? event.id ?? "";
}

function getEventTheme(type?: string) {
  return eventTypes[(type || "reminder") as EventType] ?? eventTypes.reminder;
}

function getEventLabel(type?: string) {
  return getEventTheme(type).label;
}

function getEventShortLabel(event: { title?: string; extendedProps?: any }) {
  const type = (event.extendedProps?.type || "reminder") as EventType;
  const source = event.extendedProps?.source;

  if (source === "product_calendar") {
    const meta = event.extendedProps?.meta ?? {};
    if (meta.sourceType === "vehicle_purchase") return "Compra";
    if (meta.sourceType === "product_sale") return "Venta";
    if (meta.sourceType === "product_created") return "Creado";
    if (meta.sourceType === "product_published") return "Publicado";
    return "Producto";
  }

  if (source === "expense_calendar") return "Gasto";

  return eventTypes[type]?.short ?? "Evento";
}

function getDefaultStartDate() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return toDatetimeLocalValue(date);
}

function getDefaultEndDate(startValue: string) {
  const date = new Date(startValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setHours(date.getHours() + 1);
  return toDatetimeLocalValue(date);
}

function emptyNewEventForm(): CreateEventPayload {
  const startAt = getDefaultStartDate();

  return {
    title: "",
    description: "",
    type: "reminder",
    status: "pending",
    startAt,
    endAt: getDefaultEndDate(startAt),
    allDay: false,
    contactName: "",
    contactPhone: "",
    location: "",
    notes: "",
  };
}

export default function CalendarPage() {
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEventForm, setNewEventForm] =
    useState<CreateEventPayload>(emptyNewEventForm());

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

  const { data: business } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      calendarService.create({
        ...payload,
        startAt: datetimeLocalToIso(payload.startAt),
        endAt: payload.endAt ? datetimeLocalToIso(payload.endAt) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento creado");
      setNewEventOpen(false);
      setNewEventForm(emptyNewEventForm());
    },
    onError: () => {
      toast.error("No se pudo crear el evento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Evento eliminado");
      setSelectedEvent(null);
    },
    onError: () => {
      toast.error("No se pudo eliminar el evento");
    },
  });

  const allEvents = useMemo(() => {
    const list = Array.isArray(eventsRaw) ? eventsRaw : [];

    return list.map((e: CalendarEvent) => ({
      id: getEventId(e),
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
      (event: any) => filter === "all" || event.extendedProps?.type === filter,
    );
  }, [allEvents, filter]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];

    return filteredEvents.filter((event: any) => {
      const localDate = formatLocalDateKey(event.start);
      return localDate === selectedDate;
    });
  }, [filteredEvents, selectedDate]);

  const sidebarEvents = selectedDate ? selectedDayEvents : filteredEvents;

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start?.toISOString(),
      end: clickInfo.event.end?.toISOString(),
      allDay: clickInfo.event.allDay,
      extendedProps: clickInfo.event.extendedProps,
    });
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
    const label = getEventShortLabel({
      title: eventInfo.event.title,
      extendedProps: eventInfo.event.extendedProps,
    });

    return (
      <div
        className="w-full rounded-md px-1.5 py-1 text-white shadow-sm"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
        title={eventInfo.event.title}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: theme.dot }}
          />
          <span className="truncate text-[10px] font-bold leading-none">
            {label}
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

  const openNewEvent = () => {
    setNewEventForm(emptyNewEventForm());
    setNewEventOpen(true);
  };

  const createEvent = () => {
    if (!newEventForm.title.trim()) {
      toast.error("Escribí un título para el evento");
      return;
    }

    if (!newEventForm.startAt) {
      toast.error("Elegí una fecha de inicio");
      return;
    }

    createMutation.mutate({
      ...newEventForm,
      title: newEventForm.title.trim(),
      description: newEventForm.description?.trim() || undefined,
      contactName: newEventForm.contactName?.trim() || undefined,
      contactPhone: newEventForm.contactPhone?.trim() || undefined,
      location: newEventForm.location?.trim() || undefined,
      notes: newEventForm.notes?.trim() || undefined,
    });
  };

  const eventMeta = selectedEvent?.extendedProps?.meta ?? {};
  const selectedSource = selectedEvent?.extendedProps?.source;
  const selectedReadOnly = !!selectedEvent?.extendedProps?.readOnly;
  const canDeleteSelected =
    selectedEvent && !selectedReadOnly && selectedSource === "calendar";

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
          margin-bottom: 2px !important;
        }

        .fc .fc-event-main {
          padding: 0 !important;
        }

        .fc .fc-daygrid-more-link {
          display: none !important;
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
          onClick={openNewEvent}
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
                    window.open(
                      publicBookingUrl,
                      "_blank",
                      "noopener,noreferrer",
                    );
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
          <aside className="w-[360px] shrink-0 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">
              Filtros
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setFilter("all")}
                className={`h-11 rounded-2xl text-sm font-semibold ${
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
                  className={`h-11 rounded-2xl text-sm font-semibold ${
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

              {sidebarEvents.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-slate-400">
                  No hay eventos
                </div>
              ) : (
                <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                  {sidebarEvents.map((event: any) => {
                    const eventType = (event.extendedProps?.type ||
                      "reminder") as EventType;
                    const theme = eventTypes[eventType] ?? eventTypes.reminder;
                    const source = event.extendedProps?.source;
                    const meta = event.extendedProps?.meta ?? {};

                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-left transition hover:bg-[#181818]"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: theme.dot }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              {source === "product_calendar"
                                ? "Producto"
                                : source === "expense_calendar"
                                  ? "Gasto"
                                  : getEventLabel(eventType)}
                            </p>

                            <p className="mt-1 text-sm font-semibold leading-snug text-white">
                              {event.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(event.start)}
                            </p>

                            {meta.amount != null ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {formatMoney(
                                  Number(meta.amount ?? 0),
                                  String(meta.currency ?? "ARS"),
                                )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
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
                <p className="text-slate-300">
                  No se pudo cargar el calendario
                </p>
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
                dayMaxEvents={false}
                eventMaxStack={10}
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

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {selectedSource === "product_calendar"
                    ? "Evento de producto"
                    : selectedSource === "expense_calendar"
                      ? "Evento de gasto"
                      : getEventLabel(selectedEvent.extendedProps?.type)}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {selectedEvent.title}
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  Fecha
                </div>
                <p className="mt-1 text-white">
                  {formatDateTime(selectedEvent.start)}
                </p>
                {selectedEvent.end ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Hasta: {formatDateTime(selectedEvent.end)}
                  </p>
                ) : null}
              </div>

              {selectedEvent.extendedProps?.description ? (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="h-4 w-4" />
                    Descripción
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-white">
                    {selectedEvent.extendedProps.description}
                  </p>
                </div>
              ) : null}

              {selectedEvent.extendedProps?.location ? (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </div>
                  <p className="mt-1 text-white">
                    {selectedEvent.extendedProps.location}
                  </p>
                </div>
              ) : null}

              {(selectedEvent.extendedProps?.contactName ||
                selectedEvent.extendedProps?.contactPhone ||
                selectedEvent.extendedProps?.contactEmail) && (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <p className="text-slate-400">Contacto</p>
                  {selectedEvent.extendedProps?.contactName ? (
                    <p className="mt-1 text-white">
                      {selectedEvent.extendedProps.contactName}
                    </p>
                  ) : null}
                  {selectedEvent.extendedProps?.contactPhone ? (
                    <p className="mt-1 flex items-center gap-2 text-white">
                      <Phone className="h-4 w-4 text-slate-500" />
                      {selectedEvent.extendedProps.contactPhone}
                    </p>
                  ) : null}
                  {selectedEvent.extendedProps?.contactEmail ? (
                    <p className="mt-1 flex items-center gap-2 text-white">
                      <Mail className="h-4 w-4 text-slate-500" />
                      {selectedEvent.extendedProps.contactEmail}
                    </p>
                  ) : null}
                </div>
              )}

              {(eventMeta.amount != null ||
                eventMeta.expenseAmount != null) && (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <p className="text-slate-400">Importe</p>
                  <p className="mt-1 text-white">
                    {formatMoney(
                      Number(eventMeta.amount ?? eventMeta.expenseAmount ?? 0),
                      String(
                        eventMeta.currency ??
                          eventMeta.expenseCurrency ??
                          "ARS",
                      ),
                    )}
                  </p>
                </div>
              )}

              {selectedEvent.extendedProps?.notes ? (
                <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                  <p className="text-slate-400">Notas</p>
                  <p className="mt-1 whitespace-pre-wrap text-white">
                    {selectedEvent.extendedProps.notes}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {canDeleteSelected ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  onClick={() => {
                    if (!selectedEvent?.id) return;
                    if (window.confirm("¿Eliminar este evento?")) {
                      deleteMutation.mutate(selectedEvent.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              ) : null}

              <Button
                type="button"
                className="bg-white text-black hover:bg-slate-200"
                onClick={() => setSelectedEvent(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {newEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Nuevo evento
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Crear evento manual
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setNewEventOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Título
                  </label>
                  <Input
                    value={newEventForm.title}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Ej: Reunión con cliente"
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Tipo</label>
                  <select
                    value={newEventForm.type}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        type: e.target.value as EventType,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white"
                  >
                    {(Object.keys(eventTypes) as EventType[]).map((key) => (
                      <option key={key} value={key}>
                        {eventTypes[key].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Estado
                  </label>
                  <select
                    value={newEventForm.status ?? "pending"}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        status: e.target.value as
                          | "pending"
                          | "completed"
                          | "canceled",
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completado</option>
                    <option value="canceled">Cancelado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Inicio
                  </label>
                  <Input
                    type="datetime-local"
                    value={newEventForm.startAt}
                    onChange={(e) => {
                      const startAt = e.target.value;
                      setNewEventForm((prev) => ({
                        ...prev,
                        startAt,
                        endAt: getDefaultEndDate(startAt),
                      }));
                    }}
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Fin</label>
                  <Input
                    type="datetime-local"
                    value={newEventForm.endAt ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        endAt: e.target.value,
                      }))
                    }
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Descripción
                  </label>
                  <Textarea
                    value={newEventForm.description ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Detalle del evento..."
                    className="min-h-[90px] border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Contacto
                  </label>
                  <Input
                    value={newEventForm.contactName ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    placeholder="Nombre"
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Teléfono
                  </label>
                  <Input
                    value={newEventForm.contactPhone ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        contactPhone: e.target.value,
                      }))
                    }
                    placeholder="549..."
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white">
                    Ubicación
                  </label>
                  <Input
                    value={newEventForm.location ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Ej: Local / Agencia / Google Meet"
                    className="border-white/10 bg-[#111111] text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-white">Notas</label>
                  <Textarea
                    value={newEventForm.notes ?? ""}
                    onChange={(e) =>
                      setNewEventForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Notas internas..."
                    className="min-h-[80px] border-white/10 bg-[#111111] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#0b0b0b] p-6">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-[#161616] text-white hover:bg-[#222222]"
                  onClick={() => setNewEventOpen(false)}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  className="bg-white text-black hover:bg-slate-200"
                  onClick={createEvent}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar evento"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}