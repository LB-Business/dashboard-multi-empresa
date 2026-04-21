import { api } from "@/lib/api";

export type FinanceMovementDirection = "in" | "out";
export type FinanceMovementType =
  | "expense_manual"
  | "product_extra_expense"
  | "vehicle_purchase"
  | "deposit_received"
  | "deposit_refunded"
  | "product_sale"
  | "consignment_settlement";

export interface FinanceMovement {
  id: string;
  date: string; // ISO string
  direction: FinanceMovementDirection;
  type: FinanceMovementType;
  title: string;
  description?: string | null;
  amount: number;
  currency: "ARS" | "USD";
  source: "expense" | "product";
  sourceId: string;
  productId?: string;
  productName?: string | null;
  expenseId?: string;
  paymentStatus?: "paid" | "pending";
  meta?: Record<string, unknown>;
}

export interface FinanceSummary {
  period: {
    month: string;
    start: string;
    end: string;
  };
  totals: {
    income: number;
    expenses: number;
    balance: number;
    salesIncome: number;
    depositsIncome: number;
    manualExpenses: number;
    productExtraExpenses: number;
    vehiclePurchases: number;
    consignmentSettlements: number;
  };
  productStats: {
    publishedCount: number;
    reservedCount: number;
    soldCount: number;
    ownedCount: number;
    consignmentCount: number;
    estimatedProfit: number;
    realProfit: number;
  };
}

export const financeService = {
  /**
   * Obtiene el resumen financiero del mes indicado
   * Si no se pasa month, devuelve el mes actual
   */
  getSummary: (month?: string) =>
    api.get<FinanceSummary>(
      month ? `/finance/summary?month=${month}` : "/finance/summary"
    ),

  /**
   * Obtiene todos los movimientos financieros del mes indicado
   * Cada movimiento tiene tipo, dirección, monto, fuente y metadatos
   */
  getMovements: (month?: string) =>
    api.get<FinanceMovement[]>(
      month ? `/finance/movements?month=${month}` : "/finance/movements"
    ),
};