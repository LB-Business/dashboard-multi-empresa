import { api } from "@/lib/api";

export type CalendarVisualType =
  | "reminder"
  | "appointment"
  | "meeting"
  | "task"
  | "deadline";

export interface CalendarEvent {
  id?: string;
  _id?: string;
  businessId: string;
  title: string;
  description?: string | null;
  type: CalendarVisualType;
  status: "pending" | "completed" | "canceled";
  startAt: string;
  endAt?: string | null;
  allDay: boolean;
  reminderMinutesBefore?: number | null;
  assignedUserId?: string | null;
  source?:
    | "calendar"
    | "public_booking"
    | "expense_calendar"
    | "product_calendar";
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  readOnly?: boolean;
  meta?: {
    sourceType?: string;
    expenseId?: string;
    expenseTitle?: string;
    expenseCategory?: string | null;
    expenseAmount?: number;
    expenseCurrency?: string;
    expensePaymentStatus?: "paid" | "pending";
    expenseType?: "fixed" | "extra";
    expenseDate?: string;
    dueDate?: string | null;
    isRecurring?: boolean;
    recurrence?: "daily" | "weekly" | "monthly" | "yearly" | null;
    recurrenceEndDate?: string | null;
    occurrenceIndex?: number;
    productId?: string;
    amount?: number;
    currency?: string;
    label?: string;
    [key: string]: unknown;
  };
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  type: "reminder" | "appointment" | "meeting" | "task" | "deadline";
  status?: "pending" | "completed" | "canceled";
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  reminderMinutesBefore?: number;
  assignedUserId?: string;
  contactName?: string;
  contactPhone?: string;
  location?: string;
  notes?: string;
}

export interface GetCalendarParams {
  type?: CalendarVisualType;
  status?: "pending" | "completed" | "canceled";
  assignedUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  calendarEnabled?: boolean;
}

export interface AvailabilityRange {
  start: string;
  end: string;
}

export interface WeeklyAvailability {
  monday: AvailabilityRange[];
  tuesday: AvailabilityRange[];
  wednesday: AvailabilityRange[];
  thursday: AvailabilityRange[];
  friday: AvailabilityRange[];
  saturday: AvailabilityRange[];
  sunday: AvailabilityRange[];
}

export interface CalendarDateOverride {
  date: string;
  isClosed: boolean;
  ranges: AvailabilityRange[];
}

export interface CalendarSettings {
  id?: string;
  _id?: string;
  businessId?: string;
  publicBookingEnabled: boolean;
  timezone: string;
  slotDurationMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  weeklyAvailability: WeeklyAvailability;
  dateOverrides: CalendarDateOverride[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCalendarSettingsPayload {
  publicBookingEnabled?: boolean;
  timezone?: string;
  slotDurationMinutes?: number;
  minAdvanceMinutes?: number;
  maxAdvanceDays?: number;
  weeklyAvailability?: WeeklyAvailability;
  dateOverrides?: CalendarDateOverride[];
}

function buildQuery(params?: Record<string, unknown>) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const calendarService = {
  getAll: (params?: GetCalendarParams) =>
    api.get<CalendarEvent[]>(`/calendar${buildQuery(params)}`),

  getUpcoming: () => api.get<CalendarEvent[]>("/calendar/upcoming"),

  getById: (id: string) => api.get<CalendarEvent>(`/calendar/${id}`),

  create: (payload: CreateEventPayload) =>
    api.post<CalendarEvent>("/calendar", payload),

  update: (id: string, payload: Partial<CreateEventPayload>) =>
    api.patch<CalendarEvent>(`/calendar/${id}`, payload),

  delete: (id: string) => api.delete(`/calendar/${id}`),

  getSettings: () => api.get<CalendarSettings>("/calendar/settings"),

  updateSettings: (payload: UpdateCalendarSettingsPayload) =>
    api.put<CalendarSettings>("/calendar/settings", payload),
};