import { API_URL, ApiError } from "@/lib/api";

export interface PublicBookingBusiness {
  name: string;
  slug: string;
  logoUrl?: string | null;
  contactPhone?: string | null;
  publicEmail?: string | null;
  address?: string | null;
  description?: string | null;
  timezone?: string | null;
}

export interface PublicBookingSettingsResponse {
  business: PublicBookingBusiness;
  booking: {
    enabled: boolean;
    timezone: string;
    slotDurationMinutes: number;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
  };
}

export interface PublicAvailabilitySlot {
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface PublicAvailabilityResponse {
  business: {
    name: string;
    slug: string;
    timezone: string;
  };
  date: string;
  slotDurationMinutes: number;
  slots: PublicAvailabilitySlot[];
}

export interface CreatePublicBookingPayload {
  date: string;
  startTime: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes?: string;
}

export interface PublicBookingResponse {
  message: string;
  booking: {
    _id: string;
    businessId: string;
    title: string;
    type: string;
    status: string;
    startAt: string;
    endAt: string | null;
    source: string;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    bookingDate: string | null;
    bookingStartTime: string | null;
    bookingEndTime: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

async function publicRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.message || `Error ${res.status}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const publicBookingsService = {
  getSettings: (slug: string) =>
    publicRequest<PublicBookingSettingsResponse>(`/public/${slug}/turnos/settings`),

  getAvailability: (slug: string, date: string) =>
    publicRequest<PublicAvailabilityResponse>(
      `/public/${slug}/turnos/disponibilidad?date=${encodeURIComponent(date)}`,
    ),

  createBooking: (slug: string, payload: CreatePublicBookingPayload) =>
    publicRequest<PublicBookingResponse>(`/public/${slug}/turnos`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};