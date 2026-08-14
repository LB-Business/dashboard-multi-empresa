import { api } from "@/lib/api";

export interface MercadoLibreAccount {
  _id?: string;
  mlUserId: number;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  siteId?: string;
  isActive: boolean;
  connectedAt?: string;
  lastTokenRefreshAt?: string;
  lastSyncAt?: string;
}

export interface MercadoLibreAuthUrlResponse {
  url: string;
}

export interface MercadoLibreDisconnectResponse {
  ok: boolean;
}

export const mercadoLibreService = {
  getAccount: () =>
    api.get<MercadoLibreAccount | null>("/mercadolibre/account"),

  getAuthUrl: () =>
    api.get<MercadoLibreAuthUrlResponse>("/mercadolibre/auth-url"),

  disconnect: () =>
    api.delete<MercadoLibreDisconnectResponse>("/mercadolibre/account"),
};