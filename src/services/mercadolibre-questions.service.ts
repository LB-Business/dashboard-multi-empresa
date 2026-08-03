import { api } from "@/lib/api";

export type MercadoLibreQuestionStatus =
  | "UNANSWERED"
  | "ANSWERED"
  | "CLOSED_UNANSWERED"
  | "UNDER_REVIEW"
  | "BANNED"
  | "DISABLED"
  | "ALL";

export interface MercadoLibreQuestionProperty {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  status?: string;
  price?: number;
  currency?: "ARS" | "USD";
  ml?: {
    itemId?: string | null;
    permalink?: string | null;
    status?: string | null;
  };
}

export interface MercadoLibreQuestion {
  id?: string;
  _id?: string;

  businessId?: string;
  propertyId?: string | null;

  mlQuestionId: string | number;
  mlItemId: string;

  text: string;
  status: MercadoLibreQuestionStatus | string;

  buyerId?: string | number | null;
  buyerNickname?: string | null;

  answerText?: string | null;
  answeredAt?: string | null;

  dateCreated?: string | null;
  createdAt?: string;
  updatedAt?: string;

  permalink?: string | null;
  property?: MercadoLibreQuestionProperty | null;

  raw?: any;
}

export interface ListMercadoLibreQuestionsFilters {
  status?: MercadoLibreQuestionStatus | string;
  itemId?: string;
  propertyId?: string;
  search?: string;
  sync?: boolean;
}

export interface SyncMercadoLibreQuestionsPayload {
  status?: MercadoLibreQuestionStatus | string;
  itemId?: string;
}

export interface SyncMercadoLibreQuestionsResponse {
  ok: boolean;
  total?: number;
  synced?: number;
  questions?: MercadoLibreQuestion[];
  message?: string;
}

export type MercadoLibreQuestionsListResponse =
  | MercadoLibreQuestion[]
  | {
      ok?: boolean;
      total?: number;
      questions?: MercadoLibreQuestion[];
      data?: MercadoLibreQuestion[];
      message?: string;
    };

export interface AnswerMercadoLibreQuestionResponse {
  ok: boolean;
  question?: MercadoLibreQuestion;
  mercadoLibre?: any;
  message?: string;
}

function buildQuery(filters?: ListMercadoLibreQuestionsFilters) {
  const params = new URLSearchParams();

  if (!filters) return "";

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const stringValue = String(value).trim();

    if (!stringValue) return;

    params.set(key, stringValue);
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const mercadoLibreQuestionsService = {
  getAll: (filters?: ListMercadoLibreQuestionsFilters) =>
    api.get<MercadoLibreQuestionsListResponse>(
      `/mercadolibre/questions${buildQuery(filters)}`,
    ),

  sync: (payload?: SyncMercadoLibreQuestionsPayload) =>
    api.post<SyncMercadoLibreQuestionsResponse>(
      "/mercadolibre/questions/sync",
      payload ?? {},
    ),

  getById: (questionId: string | number) =>
    api.get<MercadoLibreQuestion>(`/mercadolibre/questions/${questionId}`),

  answer: (questionId: string | number, text: string) =>
    api.post<AnswerMercadoLibreQuestionResponse>(
      `/mercadolibre/questions/${questionId}/answer`,
      {
        text,
      },
    ),
};