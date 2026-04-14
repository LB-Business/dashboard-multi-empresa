import { api } from "@/lib/api";

export interface Expense {
  _id: string;
  title: string;
  category?: string;
  type: "fixed" | "extra";
  amount: number;
  date: string;
  paid: boolean;
  status?: string;
  businessId: string;
  createdAt: string;
}

export interface ExpenseSummary {
  total: number;
  fixed: number;
  extra: number;
  paid: number;
  pending: number;
}

export interface CreateExpensePayload {
  title: string;
  category?: string;
  type: "fixed" | "extra";
  amount: number;
  date?: string;
  paid?: boolean;
}

export const expensesService = {
  getAll: () => api.get<Expense[]>("/expenses"),
  getSummary: () => api.get<ExpenseSummary>("/expenses/summary"),
  getById: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (payload: CreateExpensePayload) => api.post<Expense>("/expenses", payload),
  update: (id: string, payload: Partial<CreateExpensePayload>) => api.patch<Expense>(`/expenses/${id}`, payload),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};
