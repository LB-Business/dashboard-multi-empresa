import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { MessageCircle } from "lucide-react";

export default function MercadoLibreQuestionsPage() {
  return (
    <div>
      <DashboardTopbar
        title="Preguntas Mercado Libre"
        subtitle="Consultas recibidas desde publicaciones de Mercado Libre"
      />

      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">
            Preguntas de Mercado Libre
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Acá vamos a mostrar preguntas pendientes, propiedad/vehículo asociado
            y respuesta desde el CRM.
          </p>
        </div>
      </div>
    </div>
  );
}