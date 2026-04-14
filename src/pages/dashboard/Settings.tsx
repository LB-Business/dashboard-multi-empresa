import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsBlock } from "@/components/dashboard/SettingsBlock";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <DashboardTopbar title="Settings" subtitle="Configuración de tu negocio" />
      <div className="p-6 max-w-3xl space-y-6">
        <SettingsBlock
          title="Business Name"
          description="Este es el nombre visible de tu negocio. Por ejemplo, el nombre de tu empresa o tienda."
          footerNote="Usá máximo 32 caracteres."
          onSave={() => {}}
        >
          <Input defaultValue="Mi Negocio" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Business URL"
          description="Este es el slug de tu negocio. Los clientes accederán a tu tienda desde esta URL."
          footerNote="Usá máximo 48 caracteres."
          onSave={() => {}}
        >
          <div className="flex items-center rounded-md border border-border bg-secondary max-w-md">
            <span className="px-3 text-sm text-muted-foreground border-r border-border whitespace-nowrap">app.com/</span>
            <Input defaultValue="mi-negocio" className="border-0 bg-transparent" />
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Business Logo"
          description="Subí el logo de tu negocio. Se mostrará en tu storefront y en el dashboard."
          footerNote="PNG o JPG, máximo 2MB."
          onSave={() => {}}
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hacé click para subir un logo</p>
              <p className="text-xs text-muted-foreground">Tamaño recomendado: 256x256px</p>
            </div>
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Contact WhatsApp"
          description="Número de WhatsApp para que tus clientes puedan contactarte."
          footerNote="Incluí el código de país."
          onSave={() => {}}
        >
          <Input defaultValue="+54 9 11 1234-5678" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Public Email"
          description="Email de contacto público que se mostrará en tu storefront."
          onSave={() => {}}
        >
          <Input defaultValue="contacto@minegocio.com" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Address"
          description="Dirección física de tu negocio."
          onSave={() => {}}
        >
          <Input defaultValue="Av. Corrientes 1234, CABA" className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Primary Color"
          description="Color principal de tu marca. Se usará en botones, links y acentos."
          footerNote="Formato hexadecimal."
          onSave={() => {}}
        >
          <div className="flex items-center gap-3 max-w-md">
            <div className="h-10 w-10 rounded-md border border-border bg-foreground shrink-0 cursor-pointer" />
            <Input defaultValue="#FFFFFF" className="bg-secondary border-border font-mono text-sm" />
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Secondary Color"
          description="Color secundario de tu marca para fondos y elementos complementarios."
          footerNote="Formato hexadecimal."
          onSave={() => {}}
        >
          <div className="flex items-center gap-3 max-w-md">
            <div className="h-10 w-10 rounded-md border border-border bg-muted shrink-0 cursor-pointer" />
            <Input defaultValue="#1A1A1A" className="bg-secondary border-border font-mono text-sm" />
          </div>
        </SettingsBlock>
      </div>
    </div>
  );
}
