import { api } from "@/lib/api";

export type MercadoLibreQuestionStatus =
  | "pending"
  | "answered"
  | "closed"
  | "unknown";

export interface MercadoLibreQuestion {
  id?: string;
  _id?: string;

  mlQuestionId: string;
  mlItemId?: string | null;

  businessId?: string;
  propertyId?: string | null;
  productId?: string | null;

  text: string;
  answer?: string | null;

  status: MercadoLibreQuestionStatus;

  buyerNickname?: string | null;
  itemTitle?: string | null;
  itemPermalink?: string | null;

  createdAt?: string;
  answeredAt?: string | null;
}

export const mercadoLibreQuestionsService = {
  getAll: () =>
    api.get<MercadoLibreQuestion[]>("/mercadolibre/questions"),

  answer: (questionId: string, text: string) =>
    api.post<MercadoLibreQuestion>(
      `/mercadolibre/questions/${questionId}/answer`,
      { text },
    ),
};