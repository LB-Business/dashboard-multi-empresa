import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import {
  MercadoLibreQuestion,
  MercadoLibreQuestionsListResponse,
  MercadoLibreQuestionStatus,
  mercadoLibreQuestionsService,
} from "@/services/mercadolibre-questions.service";

const STATUS_OPTIONS: { label: string; value: MercadoLibreQuestionStatus }[] = [
  { label: "Sin responder", value: "UNANSWERED" },
  { label: "Respondidas", value: "ANSWERED" },
  { label: "Todas", value: "ALL" },
];

function normalizeQuestions(
  data?: MercadoLibreQuestionsListResponse,
): MercadoLibreQuestion[] {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.questions)) return data.questions;

  if (Array.isArray(data.data)) return data.data;

  return [];
}

function getQuestionKey(question: MercadoLibreQuestion) {
  return String(question.mlQuestionId || question.id || question._id || "");
}

function getQuestionStatusLabel(status?: string) {
  switch (status) {
    case "UNANSWERED":
      return "Sin responder";
    case "ANSWERED":
      return "Respondida";
    case "CLOSED_UNANSWERED":
      return "Cerrada sin responder";
    case "UNDER_REVIEW":
      return "En revisión";
    case "BANNED":
      return "Bloqueada";
    case "DISABLED":
      return "Deshabilitada";
    default:
      return status || "Sin estado";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getPropertyTitle(question: MercadoLibreQuestion) {
  return (
    question.property?.title ||
    question.raw?.property?.title ||
    question.raw?.item?.title ||
    question.raw?.title ||
    "Propiedad no vinculada"
  );
}

function getPropertyId(question: MercadoLibreQuestion) {
  return (
    question.propertyId ||
    question.property?._id ||
    question.property?.id ||
    ""
  );
}

function getPermalink(question: MercadoLibreQuestion) {
  return (
    question.permalink ||
    question.property?.ml?.permalink ||
    question.raw?.item?.permalink ||
    question.raw?.permalink ||
    null
  );
}

function isQuestionAnswered(question: MercadoLibreQuestion) {
  return question.status === "ANSWERED" || !!question.answerText;
}

export default function MercadoLibreQuestionsPage() {
  const queryClient = useQueryClient();

  const [status, setStatus] =
    useState<MercadoLibreQuestionStatus>("UNANSWERED");
  const [search, setSearch] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const query = useQuery({
    queryKey: ["mercadolibre-questions", status],
    queryFn: () =>
      mercadoLibreQuestionsService.getAll({
        status,
      }),
  });

  const questions = useMemo(
    () => normalizeQuestions(query.data),
    [query.data],
  );

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return questions;

    return questions.filter((question) => {
      const propertyTitle = getPropertyTitle(question).toLowerCase();
      const text = String(question.text || "").toLowerCase();
      const mlItemId = String(question.mlItemId || "").toLowerCase();
      const mlQuestionId = String(question.mlQuestionId || "").toLowerCase();
      const buyerNickname = String(question.buyerNickname || "").toLowerCase();

      return (
        propertyTitle.includes(term) ||
        text.includes(term) ||
        mlItemId.includes(term) ||
        mlQuestionId.includes(term) ||
        buyerNickname.includes(term)
      );
    });
  }, [questions, search]);

  const pendingCount = questions.filter(
    (question) => !isQuestionAnswered(question),
  ).length;

  const answeredCount = questions.filter((question) =>
    isQuestionAnswered(question),
  ).length;

  const syncMutation = useMutation({
    mutationFn: () =>
      mercadoLibreQuestionsService.sync({
        status,
      }),
    onSuccess: () => {
      setErrorMessage("");
      queryClient.invalidateQueries({
        queryKey: ["mercadolibre-questions"],
      });
    },
    onError: (err: any) => {
      console.error("Error sincronizando preguntas ML:", err);
      setErrorMessage(
        err?.message || "No se pudieron sincronizar las preguntas.",
      );
    },
  });

  const answerMutation = useMutation({
    mutationFn: ({
      questionId,
      text,
    }: {
      questionId: string | number;
      text: string;
    }) => mercadoLibreQuestionsService.answer(questionId, text),
    onSuccess: (_, variables) => {
      setErrorMessage("");
      setAnswerDrafts((prev) => ({
        ...prev,
        [String(variables.questionId)]: "",
      }));

      queryClient.invalidateQueries({
        queryKey: ["mercadolibre-questions"],
      });
    },
    onError: (err: any) => {
      console.error("Error respondiendo pregunta ML:", err);
      setErrorMessage(err?.message || "No se pudo responder la pregunta.");
    },
  });

  const handleAnswer = (question: MercadoLibreQuestion) => {
    const questionId = getQuestionKey(question);
    const text = answerDrafts[questionId]?.trim();

    if (!questionId) {
      setErrorMessage("No se pudo resolver el ID de la pregunta.");
      return;
    }

    if (!text) {
      setErrorMessage("Escribí una respuesta antes de enviar.");
      return;
    }

    if (text.length > 2000) {
      setErrorMessage("La respuesta no puede superar los 2000 caracteres.");
      return;
    }

    answerMutation.mutate({
      questionId,
      text,
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">
                Preguntas Mercado Libre
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Consultas recibidas en publicaciones de Mercado Libre vinculadas
              al CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                syncMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total cargadas
            </p>
            <p className="mt-2 text-2xl font-semibold">{questions.length}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Sin responder
            </p>
            <p className="mt-2 text-2xl font-semibold text-yellow-500">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Respondidas
            </p>
            <p className="mt-2 text-2xl font-semibold text-green-500">
              {answeredCount}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[220px_1fr]">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as MercadoLibreQuestionStatus)
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscar
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por propiedad, pregunta, comprador, publicación o ID..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none"
              />
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Cargando preguntas...
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-500">
            No se pudieron cargar las preguntas. Revisá que el backend esté
            corriendo y que existan los endpoints de Mercado Libre Questions.
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="text-base font-medium">No hay preguntas todavía</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tocá “Sincronizar” cuando tengas una publicación con preguntas en
              Mercado Libre.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const questionId = getQuestionKey(question);
              const answered = isQuestionAnswered(question);
              const permalink = getPermalink(question);
              const propertyId = getPropertyId(question);
              const draft = answerDrafts[questionId] || "";

              return (
                <article
                  key={questionId}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            answered
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          {answered ? (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          {getQuestionStatusLabel(question.status)}
                        </span>

                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                          Pregunta #{question.mlQuestionId}
                        </span>

                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                          Publicación {question.mlItemId}
                        </span>
                      </div>

                      <h2 className="truncate text-base font-semibold">
                        {getPropertyTitle(question)}
                      </h2>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {propertyId
                          ? `Propiedad CRM: ${propertyId}`
                          : "Todavía no se pudo vincular con una propiedad del CRM"}
                      </p>

                      {question.buyerNickname ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Comprador: {question.buyerNickname}
                        </p>
                      ) : null}

                      <div className="mt-4 rounded-xl border border-border bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Pregunta
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          {question.text || "Sin texto"}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Recibida:{" "}
                          {formatDate(
                            question.dateCreated || question.createdAt || null,
                          )}
                        </p>
                      </div>

                      {question.answerText ? (
                        <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-green-500">
                            Respuesta enviada
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {question.answerText}
                          </p>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Respondida: {formatDate(question.answeredAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={draft}
                            onChange={(e) =>
                              setAnswerDrafts((prev) => ({
                                ...prev,
                                [questionId]: e.target.value,
                              }))
                            }
                            placeholder="Escribí la respuesta para Mercado Libre..."
                            rows={4}
                            maxLength={2000}
                            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none"
                          />

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                              {draft.length}/2000 caracteres
                            </p>

                            <button
                              type="button"
                              onClick={() => handleAnswer(question)}
                              disabled={answerMutation.isPending}
                              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Responder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-48">
                      {permalink ? (
                        <a
                          href={permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-secondary"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver publicación
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}