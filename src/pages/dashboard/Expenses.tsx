import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/dashboard/States";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  Search,
  TrendingUp,
  Wallet,
  Clock3,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  expensesService,
  type CreateExpensePayload,
  type Expense,
  type ExpenseSummary,
} from "@/services/expenses.service";
import { toast } from "sonner";

function getTypeLabel(type?: string) {
  switch (type) {
    case "fixed":
      return "Fijo";
    case "extra":
      return "Extra";
    default:
      return "-";
  }
}

function getPaymentStatusLabel(status?: string) {
  switch (status) {
    case "paid":
      return "Pagado";
    case "pending":
      return "Pendiente";
    default:
      return "-";
  }
}

function getPaymentStatusVariant(
  status?: string
): "default" | "secondary" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

function getRecurrenceLabel(recurrence?: string | null) {
  switch (recurrence) {
    case "daily":
      return "Diaria";
    case "weekly":
      return "Semanal";
    case "monthly":
      return "Mensual";
    case "yearly":
      return "Anual";
    default:
      return "-";
  }
}

function formatCurrency(value?: number) {
  return `$${Number(value ?? 0).toLocaleString("es-AR")}`;
}

function getSummaryNumber(
  summary: ExpenseSummary | undefined,
  primary: keyof ExpenseSummary,
  fallback: keyof ExpenseSummary
) {
  return Number(summary?.[primary] ?? summary?.[fallback] ?? 0);
}

function todayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(value?: string) {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00`).toISOString();
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR");
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState<CreateExpensePayload>({
    title: "",
    category: "",
    description: "",
    type: "fixed",
    amount: 0,
    currency: "ARS",
    expenseDate: todayLocalDate(),
    dueDate: "",
    isRecurring: false,
    recurrence: "monthly",
    recurrenceEndDate: "",
    calendarEnabled: true,
    paymentStatus: "pending",
    notes: "",
  });

  const {
    data: expenses,
    isLoading: expensesLoading,
    isError: expensesError,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expensesService.getAll(),
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["expenses-summary"],
    queryFn: () => expensesService.getSummary(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      expensesService.create(payload),
    onSuccess: () => {
      toast.success("Gasto creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });

      setForm({
        title: "",
        category: "",
        description: "",
        type: "fixed",
        amount: 0,
        currency: "ARS",
        expenseDate: todayLocalDate(),
        dueDate: "",
        isRecurring: false,
        recurrence: "monthly",
        recurrenceEndDate: "",
        calendarEnabled: true,
        paymentStatus: "pending",
        notes: "",
      });
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo crear el gasto");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateExpensePayload>;
    }) => expensesService.update(id, payload),
    onSuccess: (_data, variables) => {
      const nextStatus = variables.payload.paymentStatus;
      toast.success(
        nextStatus === "paid"
          ? "Gasto marcado como pagado"
          : "Gasto marcado como pendiente"
      );
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo actualizar el gasto");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: () => {
      toast.success("Gasto eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "No se pudo eliminar el gasto");
    },
  });

  const isLoading = expensesLoading || summaryLoading;
  const isError = expensesError || summaryError;

  const expenseList = Array.isArray(expenses) ? expenses : [];

  const filtered = useMemo(() => {
    return expenseList.filter((item) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.notes ?? "").toLowerCase().includes(q) ||
        (item.productName ?? "").toLowerCase().includes(q) ||
        (item.expenseLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [expenseList, search]);

  const handleCreateExpense = () => {
    if (!form.title.trim()) {
      toast.error("Poné un título para el gasto");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Poné un monto válido");
      return;
    }

    if (form.isRecurring && !form.recurrence) {
      toast.error("Seleccioná una frecuencia de repetición");
      return;
    }

    const payload: CreateExpensePayload = {
      ...form,
      title: form.title.trim(),
      category: form.category?.trim() || undefined,
      description: form.description?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      amount: Number(form.amount),
      expenseDate: toIsoFromDateInput(form.expenseDate),
      dueDate: form.dueDate ? toIsoFromDateInput(form.dueDate) : undefined,
      recurrence: form.isRecurring ? form.recurrence : undefined,
      recurrenceEndDate:
        form.isRecurring && form.recurrenceEndDate
          ? toIsoFromDateInput(form.recurrenceEndDate)
          : undefined,
      calendarEnabled: !!form.calendarEnabled,
    };

    createMutation.mutate(payload);
  };

  const handleTogglePaymentStatus = (expense: Expense) => {
    if (expense.readOnly || expense.source === "product_extra") {
      toast.error("Los gastos que vienen de productos se editan desde el producto");
      return;
    }

    const expenseId = expense.id ?? expense._id;
    if (!expenseId) {
      toast.error("No se encontró el id del gasto");
      return;
    }

    const nextStatus = expense.paymentStatus === "paid" ? "pending" : "paid";

    updateExpenseMutation.mutate({
      id: expenseId,
      payload: {
        paymentStatus: nextStatus,
      },
    });
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (expense.readOnly || expense.source === "product_extra") {
      toast.error("Los gastos que vienen de productos se eliminan desde el producto");
      return;
    }

    const expenseId = expense.id ?? expense._id;
    if (!expenseId) {
      toast.error("No se encontró el id del gasto");
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${expense.title}"?`
    );

    if (!confirmed) return;

    deleteExpenseMutation.mutate(expenseId);
  };

  return (
    <div>
      <DashboardTopbar
        title="Expenses"
        subtitle="Administrá y controlá los gastos del negocio"
        actions={
          <Button
            size="sm"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {showCreateForm ? "Cerrar" : "Nuevo gasto"}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            onRetry={() => {
              refetchExpenses();
              refetchSummary();
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatsCard
                title="Gasto total"
                value={formatCurrency(
                  getSummaryNumber(summary, "totalAmount", "total")
                )}
                icon={Receipt}
              />
              <StatsCard
                title="Gastos fijos"
                value={formatCurrency(
                  getSummaryNumber(summary, "fixedAmount", "fixed")
                )}
                icon={TrendingUp}
              />
              <StatsCard
                title="Pagados"
                value={formatCurrency(
                  getSummaryNumber(summary, "paidAmount", "paid")
                )}
                icon={Wallet}
              />
              <StatsCard
                title="Pendientes"
                value={formatCurrency(
                  getSummaryNumber(summary, "pendingAmount", "pending")
                )}
                icon={Clock3}
              />
            </div>

            {showCreateForm && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Nuevo gasto de empresa
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="Ej: Alquiler local"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input
                      placeholder="Ej: Alquiler"
                      value={form.category ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          type: e.target.value as "fixed" | "extra",
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                    >
                      <option value="fixed">Fijo</option>
                      <option value="extra">Extra</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.amount || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          amount:
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <select
                      value={form.currency}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          currency: e.target.value as "ARS" | "USD",
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha del gasto</Label>
                    <Input
                      type="date"
                      value={form.expenseDate?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          expenseDate: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vencimiento</Label>
                    <Input
                      type="date"
                      value={form.dueDate?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado de pago</Label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          paymentStatus: e.target.value as "paid" | "pending",
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>¿Se repite?</Label>
                    <select
                      value={form.isRecurring ? "true" : "false"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isRecurring: e.target.value === "true",
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                    >
                      <option value="false">No</option>
                      <option value="true">Sí</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <select
                      value={form.recurrence ?? "monthly"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          recurrence: e.target.value as
                            | "daily"
                            | "weekly"
                            | "monthly"
                            | "yearly",
                        }))
                      }
                      disabled={!form.isRecurring}
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground disabled:opacity-60"
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fin de recurrencia</Label>
                    <Input
                      type="date"
                      value={form.recurrenceEndDate?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          recurrenceEndDate: e.target.value,
                        }))
                      }
                      disabled={!form.isRecurring}
                      className="bg-secondary border-border disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>¿Mostrar en calendario?</Label>
                  <select
                    value={form.calendarEnabled ? "true" : "false"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        calendarEnabled: e.target.value === "true",
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Ej: Pago del alquiler de abril"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border min-h-[90px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Ej: Se pagó por transferencia"
                    value={form.notes ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="bg-secondary border-border min-h-[90px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateExpense}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending
                      ? "Guardando..."
                      : "Guardar gasto"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar gastos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 bg-secondary border-border text-sm"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Sin gastos"
                description="Todavía no hay gastos registrados para este negocio."
              />
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Gasto
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Categoría
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Vence
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Repite
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filtered.map((expense: Expense) => {
                      const expenseId = expense.id ?? expense._id ?? expense.title;
                      const isUpdatingThisRow =
                        updateExpenseMutation.isPending &&
                        updateExpenseMutation.variables?.id ===
                          (expense.id ?? expense._id);

                      const isDeletingThisRow =
                        deleteExpenseMutation.isPending &&
                        deleteExpenseMutation.variables ===
                          (expense.id ?? expense._id);

                      const isDerivedFromProduct =
                        expense.readOnly || expense.source === "product_extra";

                      return (
                        <tr
                          key={expenseId}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-foreground font-medium">
                                {expense.title}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {expense.calendarEnabled ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    Calendario
                                  </Badge>
                                ) : null}

                                {expense.source === "product_extra" ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    Desde producto
                                  </Badge>
                                ) : null}
                              </div>

                              {expense.description ? (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {expense.description}
                                </p>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {expense.category || "-"}
                          </td>

                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]">
                              {getTypeLabel(expense.type)}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-foreground font-mono text-xs">
                            {formatCurrency(expense.amount)}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                            {formatDate(expense.dueDate)}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                            {expense.isRecurring
                              ? getRecurrenceLabel(expense.recurrence)
                              : "-"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {expense.expenseDate
                              ? new Date(expense.expenseDate).toLocaleDateString(
                                  "es-AR"
                                )
                              : "-"}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant={getPaymentStatusVariant(
                                expense.paymentStatus
                              )}
                              className="text-[10px]"
                            >
                              {getPaymentStatusLabel(expense.paymentStatus)}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isUpdatingThisRow || isDeletingThisRow}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                {isDerivedFromProduct ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.error(
                                          "Este gasto viene de un producto. Editalo desde el producto."
                                        )
                                      }
                                    >
                                      <MoreHorizontal className="mr-2 h-4 w-4" />
                                      Gestionado desde producto
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.error(
                                          "Este gasto viene de un producto. Eliminá el gasto desde el producto."
                                        )
                                      }
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar desde producto
                                    </DropdownMenuItem>
                                  </>
                                ) : expense.paymentStatus === "pending" ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleTogglePaymentStatus(expense)
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Marcar como pagado
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handleDeleteExpense(expense)}
                                      className="text-red-500 focus:text-red-500"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleTogglePaymentStatus(expense)
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Marcar como pendiente
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handleDeleteExpense(expense)}
                                      className="text-red-500 focus:text-red-500"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}