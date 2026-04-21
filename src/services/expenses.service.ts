import { api } from "@/lib/api";

export type ExpenseType = "fixed" | "extra";
export type ExpenseCurrency = "ARS" | "USD";
export type PaymentStatus = "paid" | "pending";
export type ExpenseSource = "expense" | "product_extra";
export type ExpenseRecurrence = "daily" | "weekly" | "monthly" | "yearly";

export interface Expense {
  id?: string;
  _id?: string;
  businessId: string;
  title: string;
  category?: string | null;
  description?: string | null;
  type: ExpenseType;
  amount: number;
  currency: ExpenseCurrency;
  expenseDate?: string | null;
  dueDate?: string | null;
  isRecurring?: boolean;
  recurrence?: ExpenseRecurrence | null;
  recurrenceEndDate?: string | null;
  calendarEnabled?: boolean;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  source?: ExpenseSource;
  sourceExpenseId?: string;
  sourceProductId?: string;
  productName?: string | null;
  expenseLabel?: string | null;
  readOnly?: boolean;
}

export interface ExpenseSummary {
  totalAmount?: number;
  fixedAmount?: number;
  extraAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  total?: number;
  fixed?: number;
  extra?: number;
  paid?: number;
  pending?: number;
}

export interface CreateExpensePayload {
  title: string;
  category?: string;
  description?: string;
  type: ExpenseType;
  amount: number;
  currency: ExpenseCurrency;
  expenseDate?: string;
  dueDate?: string;
  isRecurring?: boolean;
  recurrence?: ExpenseRecurrence;
  recurrenceEndDate?: string;
  calendarEnabled?: boolean;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface GetExpensesParams {
  month?: string;
  type?: ExpenseType;
  paymentStatus?: PaymentStatus;
  calendarEnabled?: boolean;
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

export const expensesService = {
  getAll: (params?: GetExpensesParams) =>
    api.get<Expense[]>(`/expenses${buildQuery(params)}`),

  getSummary: (params?: Pick<GetExpensesParams, "month" | "type" | "paymentStatus">) =>
    api.get<ExpenseSummary>(`/expenses/summary${buildQuery(params)}`),

  getById: (id: string) => api.get<Expense>(`/expenses/${id}`),

  create: (payload: CreateExpensePayload) =>
    api.post<Expense>("/expenses", payload),

  update: (id: string, payload: Partial<CreateExpensePayload>) =>
    api.patch<Expense>(`/expenses/${id}`, payload),

  delete: (id: string) => api.delete(`/expenses/${id}`),
};