import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsBlock } from "@/components/dashboard/SettingsBlock";
import { LoadingState, ErrorState } from "@/components/dashboard/States";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  businessesService,
  UpdateMyBusinessProfilePayload,
} from "@/services/businesses.service";
import {
  calendarService,
  type WeeklyAvailability,
  type UpdateCalendarSettingsPayload,
} from "@/services/calendar.service";
import { uploadsService } from "@/services/uploads.service";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayConfig = {
  enabled: boolean;
  start: string;
  end: string;
};

type WeeklyForm = Record<DayKey, DayConfig>;

const dayLabels: Record<DayKey, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

function buildEmptyWeeklyForm(): WeeklyForm {
  return {
    monday: { enabled: false, start: "09:00", end: "18:00" },
    tuesday: { enabled: false, start: "09:00", end: "18:00" },
    wednesday: { enabled: false, start: "09:00", end: "18:00" },
    thursday: { enabled: false, start: "09:00", end: "18:00" },
    friday: { enabled: false, start: "09:00", end: "18:00" },
    saturday: { enabled: false, start: "09:00", end: "13:00" },
    sunday: { enabled: false, start: "09:00", end: "13:00" },
  };
}

function weeklyAvailabilityToForm(
  weeklyAvailability?: WeeklyAvailability | null
): WeeklyForm {
  const base = buildEmptyWeeklyForm();

  if (!weeklyAvailability) return base;

  (Object.keys(base) as DayKey[]).forEach((day) => {
    const firstRange = weeklyAvailability[day]?.[0];

    if (firstRange) {
      base[day] = {
        enabled: true,
        start: firstRange.start || base[day].start,
        end: firstRange.end || base[day].end,
      };
    }
  });

  return base;
}

function formToWeeklyAvailability(form: WeeklyForm): WeeklyAvailability {
  return {
    monday: form.monday.enabled
      ? [{ start: form.monday.start, end: form.monday.end }]
      : [],
    tuesday: form.tuesday.enabled
      ? [{ start: form.tuesday.start, end: form.tuesday.end }]
      : [],
    wednesday: form.wednesday.enabled
      ? [{ start: form.wednesday.start, end: form.wednesday.end }]
      : [],
    thursday: form.thursday.enabled
      ? [{ start: form.thursday.start, end: form.thursday.end }]
      : [],
    friday: form.friday.enabled
      ? [{ start: form.friday.start, end: form.friday.end }]
      : [],
    saturday: form.saturday.enabled
      ? [{ start: form.saturday.start, end: form.saturday.end }]
      : [],
    sunday: form.sunday.enabled
      ? [{ start: form.sunday.start, end: form.sunday.end }]
      : [],
  };
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: business,
    isLoading: businessLoading,
    isError: businessError,
    refetch: refetchBusiness,
  } = useQuery({
    queryKey: ["my-business"],
    queryFn: businessesService.getMyBusiness,
  });

  const {
    data: calendarSettings,
    isLoading: calendarLoading,
    isError: calendarError,
    refetch: refetchCalendarSettings,
  } = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: calendarService.getSettings,
  });

  const [form, setForm] = useState<UpdateMyBusinessProfilePayload>({});
  const [calendarForm, setCalendarForm] =
    useState<UpdateCalendarSettingsPayload>({
      publicBookingEnabled: false,
      timezone: "America/Argentina/Buenos_Aires",
      slotDurationMinutes: 30,
      minAdvanceMinutes: 0,
      maxAdvanceDays: 30,
    });

  const [weeklyForm, setWeeklyForm] = useState<WeeklyForm>(
    buildEmptyWeeklyForm()
  );

  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || "",
        slug: business.slug || "",
        logoUrl: business.logoUrl || "",
        contactPhone: business.contactPhone || "",
        publicEmail: business.publicEmail || "",
        address: business.address || "",
        description: business.description || "",
        primaryColor: business.primaryColor || "#FFFFFF",
        secondaryColor: business.secondaryColor || "#1A1A1A",
      });
    }
  }, [business]);

  useEffect(() => {
    if (calendarSettings) {
      setCalendarForm({
        publicBookingEnabled: calendarSettings.publicBookingEnabled,
        timezone: calendarSettings.timezone || "America/Argentina/Buenos_Aires",
        slotDurationMinutes: calendarSettings.slotDurationMinutes ?? 30,
        minAdvanceMinutes: calendarSettings.minAdvanceMinutes ?? 0,
        maxAdvanceDays: calendarSettings.maxAdvanceDays ?? 30,
      });

      setWeeklyForm(
        weeklyAvailabilityToForm(calendarSettings.weeklyAvailability)
      );
    }
  }, [calendarSettings]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateMyBusinessProfilePayload) =>
      businessesService.updateMyBusinessProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
      toast.success("Configuración guardada");
      setSavingField(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar");
      setSavingField(null);
    },
  });

  const calendarMutation = useMutation({
    mutationFn: (payload: UpdateCalendarSettingsPayload) =>
      calendarService.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-settings"] });
      toast.success("Configuración del calendario guardada");
      setSavingField(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar configuración del calendario");
      setSavingField(null);
    },
  });

  const saveField = (
    field: keyof UpdateMyBusinessProfilePayload,
    value: unknown
  ) => {
    setSavingField(field);
    mutation.mutate({ [field]: value } as UpdateMyBusinessProfilePayload);
  };

  const saveCalendarField = (
    field: keyof UpdateCalendarSettingsPayload,
    value: unknown
  ) => {
    setSavingField(`calendar-${String(field)}`);
    calendarMutation.mutate({
      [field]: value,
    } as UpdateCalendarSettingsPayload);
  };

  const saveWeeklyAvailability = () => {
    for (const day of Object.keys(weeklyForm) as DayKey[]) {
      const item = weeklyForm[day];

      if (item.enabled && item.start >= item.end) {
        toast.error(`Revisá los horarios de ${dayLabels[day]}`);
        return;
      }
    }

    setSavingField("calendar-weeklyAvailability");
    calendarMutation.mutate({
      weeklyAvailability: formToWeeklyAvailability(weeklyForm),
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSavingField("logoUrl");

    try {
      const res = await uploadsService.uploadImage(file);

      mutation.mutate({ logoUrl: res.url });

      setForm((f) => ({
        ...f,
        logoUrl: res.url,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || "Error al subir logo");
      setSavingField(null);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const publicBookingUrl = form.slug
    ? `${window.location.origin}/${form.slug}/turnos`
    : "";

  const isLoading = businessLoading || calendarLoading;
  const isError = businessError || calendarError;

  if (isLoading) {
    return (
      <>
        <DashboardTopbar title="Settings" />
        <LoadingState />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <DashboardTopbar title="Settings" />
        <ErrorState
          onRetry={() => {
            refetchBusiness();
            refetchCalendarSettings();
          }}
        />
      </>
    );
  }

  return (
    <div>
      <DashboardTopbar
        title="Settings"
        subtitle="Configuración de tu negocio"
      />

      <div className="p-6 max-w-4xl space-y-6">
        <SettingsBlock
          title="Business Name"
          description="Este es el nombre visible de tu negocio. Por ejemplo, el nombre de tu empresa o tienda."
          footerNote="Usá máximo 120 caracteres."
          onSave={() => saveField("name", form.name)}
          saving={savingField === "name"}
        >
          <Input
            value={form.name || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
              }))
            }
            className="bg-secondary border-border max-w-md"
          />
        </SettingsBlock>

        <SettingsBlock
          title="Business Logo"
          description="Subí el logo de tu negocio. Se mostrará en el dashboard."
          footerNote="PNG o JPG, máximo 2MB."
          onSave={() => fileInputRef.current?.click()}
          saving={savingField === "logoUrl"}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />

          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors overflow-hidden"
            >
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Hacé click para subir un logo
              </p>
              <p className="text-xs text-muted-foreground">
                Tamaño recomendado: 256x256px
              </p>
            </div>
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Contact WhatsApp"
          description="Número de contacto público de tu negocio."
          footerNote="Incluí el código de país."
          onSave={() => saveField("contactPhone", form.contactPhone)}
          saving={savingField === "contactPhone"}
        >
          <Input
            value={form.contactPhone || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                contactPhone: e.target.value,
              }))
            }
            className="bg-secondary border-border max-w-md"
          />
        </SettingsBlock>

        <SettingsBlock
          title="Public Email"
          description="Email de contacto público que se mostrará a tus clientes."
          onSave={() => saveField("publicEmail", form.publicEmail)}
          saving={savingField === "publicEmail"}
        >
          <Input
            value={form.publicEmail || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                publicEmail: e.target.value,
              }))
            }
            className="bg-secondary border-border max-w-md"
          />
        </SettingsBlock>

        <SettingsBlock
          title="Address"
          description="Dirección física de tu negocio."
          onSave={() => saveField("address", form.address)}
          saving={savingField === "address"}
        >
          <Input
            value={form.address || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                address: e.target.value,
              }))
            }
            className="bg-secondary border-border max-w-md"
          />
        </SettingsBlock>

        <SettingsBlock
          title="Description"
          description="Descripción corta de tu negocio para mostrar en páginas públicas."
          footerNote="Usá máximo 500 caracteres."
          onSave={() => saveField("description", form.description)}
          saving={savingField === "description"}
        >
          <Input
            value={form.description || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                description: e.target.value,
              }))
            }
            className="bg-secondary border-border max-w-md"
          />
        </SettingsBlock>

        <SettingsBlock
          title="Turnos online"
          description="Activá o desactivá la reserva pública desde el link de turnos."
          footerNote="Cuando está activo, tus clientes pueden reservar desde el link público."
          onSave={() =>
            saveCalendarField(
              "publicBookingEnabled",
              !!calendarForm.publicBookingEnabled
            )
          }
          saving={savingField === "calendar-publicBookingEnabled"}
        >
          <select
            value={calendarForm.publicBookingEnabled ? "true" : "false"}
            onChange={(e) =>
              setCalendarForm((prev) => ({
                ...prev,
                publicBookingEnabled: e.target.value === "true",
              }))
            }
            className="flex h-10 w-full max-w-md rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="true">Activado</option>
            <option value="false">Desactivado</option>
          </select>

          <p className="text-xs text-muted-foreground mt-2 break-all">
            Link público:{" "}
            {publicBookingUrl || `${window.location.origin}/mi-negocio/turnos`}
          </p>
        </SettingsBlock>

        <SettingsBlock
          title="Configuración general de agenda"
          description="Definí duración de turnos y anticipación."
          footerNote="Estos valores afectan la disponibilidad pública."
          onSave={() => {
            setSavingField("calendar-general");

            calendarMutation.mutate({
              publicBookingEnabled: !!calendarForm.publicBookingEnabled,
              timezone:
                calendarForm.timezone || "America/Argentina/Buenos_Aires",
              slotDurationMinutes: Number(
                calendarForm.slotDurationMinutes ?? 30
              ),
              minAdvanceMinutes: Number(calendarForm.minAdvanceMinutes ?? 0),
              maxAdvanceDays: Number(calendarForm.maxAdvanceDays ?? 30),
            });
          }}
          saving={savingField === "calendar-general"}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm">Timezone</label>
              <Input
                value={calendarForm.timezone || ""}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Duración del turno (minutos)</label>
              <Input
                type="number"
                min="5"
                value={Number(calendarForm.slotDurationMinutes ?? 30)}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    slotDurationMinutes: Number(e.target.value || 30),
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Anticipación mínima (minutos)</label>
              <Input
                type="number"
                min="0"
                value={Number(calendarForm.minAdvanceMinutes ?? 0)}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    minAdvanceMinutes: Number(e.target.value || 0),
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Máximo de días a futuro</label>
              <Input
                type="number"
                min="1"
                value={Number(calendarForm.maxAdvanceDays ?? 30)}
                onChange={(e) =>
                  setCalendarForm((prev) => ({
                    ...prev,
                    maxAdvanceDays: Number(e.target.value || 30),
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Horarios disponibles"
          description="Elegí en qué días y horarios querés recibir turnos."
          footerNote="Por ahora te lo dejo con un rango por día. Después, si querés, te agrego múltiples franjas por día."
          onSave={saveWeeklyAvailability}
          saving={savingField === "calendar-weeklyAvailability"}
        >
          <div className="space-y-4">
            {(Object.keys(weeklyForm) as DayKey[]).map((day) => {
              const item = weeklyForm[day];

              return (
                <div
                  key={day}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[180px_120px_1fr_1fr] gap-3 items-center">
                    <div className="font-medium">{dayLabels[day]}</div>

                    <select
                      value={item.enabled ? "true" : "false"}
                      onChange={(e) =>
                        setWeeklyForm((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            enabled: e.target.value === "true",
                          },
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                    >
                      <option value="false">Cerrado</option>
                      <option value="true">Abierto</option>
                    </select>

                    <Input
                      type="time"
                      value={item.start}
                      disabled={!item.enabled}
                      onChange={(e) =>
                        setWeeklyForm((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            start: e.target.value,
                          },
                        }))
                      }
                      className="bg-secondary border-border disabled:opacity-60"
                    />

                    <Input
                      type="time"
                      value={item.end}
                      disabled={!item.enabled}
                      onChange={(e) =>
                        setWeeklyForm((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day],
                            end: e.target.value,
                          },
                        }))
                      }
                      className="bg-secondary border-border disabled:opacity-60"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsBlock>
      </div>
    </div>
  );
}