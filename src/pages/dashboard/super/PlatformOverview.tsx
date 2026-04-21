import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LoadingState, ErrorState } from "@/components/dashboard/States";
import { Building2, Users, Activity, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessesService } from "@/services/businesses.service";
import { usersService } from "@/services/users.service";

export default function PlatformOverview() {
  const businesses = useQuery({
    queryKey: ["businesses"],
    queryFn: businessesService.getAll,
  });

  const users = useQuery({
    queryKey: ["all-users"],
    queryFn: usersService.getAllGlobal,
  });

  const isLoading = businesses.isLoading || users.isLoading;
  const isError = businesses.isError || users.isError;

  const businessList = Array.isArray(businesses.data) ? businesses.data : [];
  const usersList = Array.isArray(users.data) ? users.data : [];

  const activeBusinesses = businessList.filter(
    (b) => b.isActive === true
  ).length;

  return (
    <div>
      <DashboardTopbar
        title="Platform Overview"
        subtitle="Resumen general de la plataforma"
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            onRetry={() => {
              businesses.refetch();
              users.refetch();
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Negocios activos"
                value={activeBusinesses}
                icon={Building2}
              />
              <StatsCard
                title="Total negocios"
                value={businessList.length}
                icon={TrendingUp}
              />
              <StatsCard
                title="Usuarios totales"
                value={usersList.length}
                icon={Users}
              />
              <StatsCard
                title="Owners"
                value={usersList.filter((u) => u.role === "OWNER").length}
                icon={Activity}
              />
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  Últimos negocios
                </h2>
              </div>

              <div className="divide-y divide-border">
                {businessList.slice(0, 5).map((biz) => (
                  <div
                    key={biz.id ?? biz._id ?? biz.slug}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm text-foreground">{biz.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        /{biz.slug}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {biz.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}

                {businessList.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Sin negocios registrados
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}