import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CircleCheck,
    Link2,
    RefreshCw,
    Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { mercadoLibreService } from "@/services/mercadolibre.service";

export function MercadoLibreSettings() {
    const queryClient = useQueryClient();

    const {
        data: account,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["mercadolibre-account"],
        queryFn: mercadoLibreService.getAccount,
        retry: false,
    });

    const connectMutation = useMutation({
        mutationFn: mercadoLibreService.getAuthUrl,
        onSuccess: ({ url }) => {
            if (!url) {
                toast.error("No se recibió la URL de Mercado Libre");
                return;
            }

            window.location.assign(url);
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "No se pudo conectar Mercado Libre"
            );
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: mercadoLibreService.disconnect,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["mercadolibre-account"],
            });

            toast.success("Cuenta de Mercado Libre desvinculada");
        },
        onError: (error: Error) => {
            toast.error(
                error.message || "No se pudo desvincular la cuenta"
            );
        },
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get("mercadolibre") !== "connected") {
            return;
        }

        toast.success(
            "Cuenta de Mercado Libre conectada correctamente"
        );

        queryClient.invalidateQueries({
            queryKey: ["mercadolibre-account"],
        });

        params.delete("mercadolibre");

        const remainingQuery = params.toString();
        const cleanUrl = `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""
            }`;

        window.history.replaceState({}, "", cleanUrl);
    }, [queryClient]);

    function handleDisconnect() {
        const confirmed = window.confirm(
            "¿Querés desvincular esta cuenta de Mercado Libre? Las publicaciones existentes no se eliminarán."
        );

        if (!confirmed) return;

        disconnectMutation.mutate();
    }

    const accountName =
        account?.nickname ||
        [account?.firstName, account?.lastName]
            .filter(Boolean)
            .join(" ") ||
        "Cuenta de Mercado Libre";

    const isProcessing =
        connectMutation.isPending ||
        disconnectMutation.isPending;

    return (
        <div className="settings-block animate-fade-in">
            <div className="settings-block-body space-y-5">
                <div>
                    <h2 className="text-base font-semibold">
                        Mercado Libre
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Administrá la cuenta utilizada para publicar propiedades
                        y responder preguntas.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />

                        <span className="text-sm text-muted-foreground">
                            Consultando conexión...
                        </span>
                    </div>
                ) : null}

                {!isLoading && isError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">
                            No se pudo consultar la cuenta de Mercado Libre.
                        </p>

                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-3 text-sm font-medium underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : null}

                {!isLoading && !isError && account ? (
                    <div className="rounded-lg border border-border bg-secondary/30 p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                                    <CircleCheck className="h-5 w-5" />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">
                                            {accountName}
                                        </p>

                                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                                            Conectada
                                        </span>
                                    </div>

                                    {account.email ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {account.email}
                                        </p>
                                    ) : null}

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Usuario ML: {account.mlUserId}
                                    </p>

                                    {account.connectedAt ? (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Conectada el{" "}
                                            {new Intl.DateTimeFormat("es-AR", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            }).format(new Date(account.connectedAt))}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">

                                <button
                                    type="button"
                                    onClick={handleDisconnect}
                                    disabled={isProcessing}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {disconnectMutation.isPending ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Unlink className="h-4 w-4" />
                                    )}

                                    Desvincular
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {!isLoading && !isError && !account ? (
                    <div className="rounded-lg border border-dashed border-border p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">
                                    Mercado Libre no está conectado
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Conectá una cuenta para publicar propiedades y
                                    responder preguntas desde LB Business.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => connectMutation.mutate()}
                                disabled={isProcessing}
                                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {connectMutation.isPending ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Link2 className="h-4 w-4" />
                                )}

                                Conectar Mercado Libre
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="settings-block-footer">
                <p className="text-xs text-muted-foreground">
                    Desvincular la cuenta no elimina las publicaciones
                    existentes en Mercado Libre.
                </p>
            </div>
        </div>
    );
}