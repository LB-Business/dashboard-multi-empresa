import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsBlock } from "@/components/dashboard/SettingsBlock";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function GlobalSettingsPage() {
  const [platformName, setPlatformName] = useState("Mi Plataforma SaaS");
  const [supportEmail, setSupportEmail] = useState("soporte@plataforma.com");
  const [trialDays, setTrialDays] = useState("14");

  // These would connect to a global settings API endpoint
  const handleSave = (field: string) => {
    toast.success(`${field} guardado`);
  };

  return (
    <div>
      <DashboardTopbar title="Global Settings" subtitle="Configuración general de la plataforma" />
      <div className="p-6 max-w-3xl space-y-6">
        <SettingsBlock
          title="Platform Name"
          description="Nombre público de la plataforma SaaS."
          footerNote="Máximo 32 caracteres."
          onSave={() => handleSave("Platform Name")}
        >
          <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Support Email"
          description="Email de soporte que recibirán los usuarios de la plataforma."
          onSave={() => handleSave("Support Email")}
        >
          <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Default Trial Days"
          description="Cantidad de días de prueba gratuita para negocios nuevos."
          footerNote="Valor numérico."
          onSave={() => handleSave("Trial Days")}
        >
          <Input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="bg-secondary border-border max-w-[120px]" />
        </SettingsBlock>
      </div>
    </div>
  );
}
