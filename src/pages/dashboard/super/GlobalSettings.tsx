import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsBlock } from "@/components/dashboard/SettingsBlock";
import { Input } from "@/components/ui/input";

export default function GlobalSettingsPage() {
  return (
    <div>
      <DashboardTopbar title="Global Settings" subtitle="Configuración general de la plataforma" />
      <div className="p-6 max-w-3xl space-y-6">
        <SettingsBlock
          title="Platform Name"
          description="Nombre público de la plataforma SaaS."
          footerNote="Máximo 32 caracteres."
          onSave={() => {}}
        >
          <Input defaultValue="Mi Plataforma SaaS" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Support Email"
          description="Email de soporte que recibirán los usuarios de la plataforma."
          onSave={() => {}}
        >
          <Input defaultValue="soporte@plataforma.com" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Default Trial Days"
          description="Cantidad de días de prueba gratuita para negocios nuevos."
          footerNote="Valor numérico."
          onSave={() => {}}
        >
          <Input type="number" defaultValue="14" className="bg-secondary border-border max-w-[120px]" />
        </SettingsBlock>

        <SettingsBlock
          title="Maintenance Mode"
          description="Activar modo mantenimiento deshabilitará el acceso para todos los usuarios excepto SUPER_ADMIN."
          footerNote="Usar con precaución."
          onSave={() => {}}
        >
          <div className="flex items-center gap-3">
            <div className="h-5 w-9 rounded-full bg-secondary border border-border relative cursor-pointer">
              <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-muted-foreground transition-transform" />
            </div>
            <span className="text-sm text-muted-foreground">Desactivado</span>
          </div>
        </SettingsBlock>
      </div>
    </div>
  );
}
