import { api } from "@/lib/api";

export type MovementDirection = "in" | "out" | "neutral";

export type MovementType =
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "product_status_updated"
  | "product_sold"
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "expense_paid"
  | "expense_pending"
  | string;

export interface Movement {
  id: string;
  type: MovementType;
  title: string;
  description?: string | null;
  meta?: Record<string, any>;
  amount?: number | null;
  direction?: MovementDirection;
  date?: string | null;
  businessId?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export const movementsService = {
  getAll: (month?: string) =>
    api.get<Movement[]>(month ? `/movements?month=${month}` : "/movements"),
};