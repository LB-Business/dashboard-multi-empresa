import { api } from "@/lib/api";

export interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "reminder" | "meeting" | "task" | "deadline";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  businessId: string;
  createdAt: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "reminder" | "meeting" | "task" | "deadline";
  status?: string;
}

export const calendarService = {
  getAll: () => api.get<CalendarEvent[]>("/calendar"),
  getUpcoming: () => api.get<CalendarEvent[]>("/calendar/upcoming"),
  getById: (id: string) => api.get<CalendarEvent>(`/calendar/${id}`),
  create: (payload: CreateEventPayload) => api.post<CalendarEvent>("/calendar", payload),
  update: (id: string, payload: Partial<CreateEventPayload>) => api.patch<CalendarEvent>(`/calendar/${id}`, payload),
  delete: (id: string) => api.delete(`/calendar/${id}`),
};
