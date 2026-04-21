import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { publicBookingsService } from "@/services/public-bookings.service";

function todayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLong(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PublicBookingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(todayLocalDate());
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: settings,
    isLoading: isLoadingSettings,
    isError: isSettingsError,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["public-booking-settings", businessSlug],
    queryFn: () => publicBookingsService.getSettings(businessSlug || ""),
    enabled: !!businessSlug,
  });

  const {
    data: availability,
    isLoading: isLoadingAvailability,
    isError: isAvailabilityError,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ["public-booking-availability", businessSlug, selectedDate],
    queryFn: () =>
      publicBookingsService.getAvailability(businessSlug || "", selectedDate),
    enabled: !!businessSlug,
  });

  const createBookingMutation = useMutation({
    mutationFn: () =>
      publicBookingsService.createBooking(businessSlug || "", {
        date: selectedDate,
        startTime: selectedStartTime,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success("Turno reservado correctamente");
      setSelectedStartTime("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setNotes("");
      queryClient.invalidateQueries({
        queryKey: ["public-booking-availability", businessSlug, selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["public-booking-settings", businessSlug],
      });

      if (data?.booking?.bookingStartTime) {
        setSelectedStartTime("");
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo reservar el turno");
    },
  });

  const availableSlots = useMemo(() => {
    return (availability?.slots ?? []).filter((slot) => slot.available);
  }, [availability]);

  const handleSubmit = () => {
    if (!selectedStartTime) {
      toast.error("Seleccioná un horario");
      return;
    }

    if (!contactName.trim()) {
      toast.error("Ingresá tu nombre");
      return;
    }

    if (!contactPhone.trim()) {
      toast.error("Ingresá tu teléfono");
      return;
    }

    createBookingMutation.mutate();
  };

  if (!businessSlug) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No se encontró el negocio para este enlace.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingSettings || isLoadingAvailability;
  const errorMessage =
    (settingsError as Error | undefined)?.message ||
    (availabilityError as Error | undefined)?.message ||
    "No se pudo cargar la agenda";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            {isLoadingSettings ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-16 w-16 rounded-2xl bg-secondary" />
                <div className="h-6 w-40 rounded bg-secondary" />
                <div className="h-4 w-full rounded bg-secondary" />
                <div className="h-4 w-3/4 rounded bg-secondary" />
              </div>
            ) : isSettingsError ? (
              <div className="space-y-4">
                <h1 className="text-xl font-semibold">No se pudo cargar</h1>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button onClick={() => refetchSettings()}>Reintentar</Button>
              </div>
            ) : (
              <>
                {settings?.business.logoUrl ? (
                  <img
                    src={settings.business.logoUrl}
                    alt={settings.business.name}
                    className="h-16 w-16 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl border border-border bg-secondary flex items-center justify-center">
                    <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  </div>
                )}

                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  {settings?.business.name}
                </h1>

                {settings?.business.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {settings.business.description}
                  </p>
                ) : null}

                <div className="mt-6 space-y-3 text-sm">
                  {settings?.business.contactPhone ? (
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>{settings.business.contactPhone}</span>
                    </div>
                  ) : null}

                  {settings?.business.publicEmail ? (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>{settings.business.publicEmail}</span>
                    </div>
                  ) : null}

                  {settings?.business.address ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>{settings.business.address}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
                  <p className="text-sm font-medium">Duración del turno</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {settings?.booking.slotDurationMinutes ?? 30} minutos
                  </p>
                </div>
              </>
            )}
          </aside>

          <main className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-8 w-56 rounded bg-secondary" />
                <div className="h-10 w-56 rounded bg-secondary" />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-12 rounded-xl bg-secondary" />
                  ))}
                </div>
              </div>
            ) : isSettingsError || isAvailabilityError ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">No se pudo cargar la agenda</h2>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button
                  onClick={() => {
                    refetchSettings();
                    refetchAvailability();
                  }}
                >
                  Reintentar
                </Button>
              </div>
            ) : settings && !settings.booking.enabled ? (
              <div className="rounded-2xl border border-border bg-secondary/30 p-6">
                <h2 className="text-xl font-semibold">Turnos no disponibles</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Este negocio todavía no tiene habilitada la reserva online.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Reservá tu turno
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elegí una fecha, seleccioná un horario disponible y completá tus datos.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="booking-date">Fecha</Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedStartTime("");
                    }}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground capitalize">
                    {formatDateLong(selectedDate)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Horarios disponibles</h3>
                  </div>

                  {availableSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-sm text-muted-foreground">
                      No hay horarios disponibles para esta fecha.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedStartTime === slot.startTime;

                        return (
                          <Button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className="h-12 rounded-xl"
                            onClick={() => setSelectedStartTime(slot.startTime)}
                          >
                            {slot.startTime}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Nombre</Label>
                      <Input
                        id="contact-name"
                        placeholder="Tu nombre"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Teléfono</Label>
                      <Input
                        id="contact-phone"
                        placeholder="Tu teléfono"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="Tu email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="booking-notes">Notas</Label>
                      <Textarea
                        id="booking-notes"
                        placeholder="Contanos algo importante sobre tu turno"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[152px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <p className="text-sm font-medium">Resumen</p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Fecha: {formatDateLong(selectedDate)}</p>
                    <p>Horario: {selectedStartTime || "Sin seleccionar"}</p>
                    <p>
                      Duración: {settings?.booking.slotDurationMinutes ?? 30} minutos
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      createBookingMutation.isPending ||
                      !selectedStartTime ||
                      !contactName.trim() ||
                      !contactPhone.trim()
                    }
                    className="h-11 rounded-xl px-6"
                  >
                    {createBookingMutation.isPending
                      ? "Reservando..."
                      : "Confirmar turno"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Al reservar, el turno queda registrado en la agenda del negocio.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}