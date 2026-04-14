import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsBlock } from "@/components/dashboard/SettingsBlock";
import { LoadingState, ErrorState } from "@/components/dashboard/States";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService, UpdateBusinessPayload } from "@/services/businesses.service";
import { uploadsService } from "@/services/uploads.service";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: business, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-business"],
    queryFn: businessesService.getMyBusiness,
  });

  const [form, setForm] = useState<UpdateBusinessPayload>({});
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        slug: business.slug,
        logo: business.logo,
        whatsapp: business.whatsapp || "",
        email: business.email || "",
        address: business.address || "",
        primaryColor: business.primaryColor || "#FFFFFF",
        secondaryColor: business.secondaryColor || "#1A1A1A",
      });
    }
  }, [business]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateBusinessPayload) => businessesService.updateMyBusiness(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
      toast.success("Configuración guardada");
      setSavingField(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar");
      setSavingField(null);
    },
  });

  const saveField = (field: string, value: unknown) => {
    setSavingField(field);
    mutation.mutate({ [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingField("logo");
    try {
      const res = await uploadsService.uploadImage(file);
      mutation.mutate({ logo: res.url });
      setForm((f) => ({ ...f, logo: res.url }));
    } catch (err: any) {
      toast.error(err.message || "Error al subir logo");
      setSavingField(null);
    }
  };

  if (isLoading) return <><DashboardTopbar title="Settings" /><LoadingState /></>;
  if (isError) return <><DashboardTopbar title="Settings" /><ErrorState onRetry={() => refetch()} /></>;

  return (
    <div>
      <DashboardTopbar title="Settings" subtitle="Configuración de tu negocio" />
      <div className="p-6 max-w-3xl space-y-6">
        <SettingsBlock
          title="Business Name"
          description="Este es el nombre visible de tu negocio. Por ejemplo, el nombre de tu empresa o tienda."
          footerNote="Usá máximo 32 caracteres."
          onSave={() => saveField("name", form.name)}
          saving={savingField === "name"}
        >
          <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Business URL"
          description="Este es el slug de tu negocio. Los clientes accederán a tu tienda desde esta URL."
          footerNote="Usá máximo 48 caracteres."
          onSave={() => saveField("slug", form.slug)}
          saving={savingField === "slug"}
        >
          <div className="flex items-center rounded-md border border-border bg-secondary max-w-md">
            <span className="px-3 text-sm text-muted-foreground border-r border-border whitespace-nowrap">app.com/</span>
            <Input value={form.slug || ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="border-0 bg-transparent" />
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Business Logo"
          description="Subí el logo de tu negocio. Se mostrará en tu storefront y en el dashboard."
          footerNote="PNG o JPG, máximo 2MB."
          onSave={() => fileInputRef.current?.click()}
          saving={savingField === "logo"}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors overflow-hidden"
            >
              {form.logo ? (
                <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
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
          onSave={() => saveField("whatsapp", form.whatsapp)}
          saving={savingField === "whatsapp"}
        >
          <Input value={form.whatsapp || ""} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Public Email"
          description="Email de contacto público que se mostrará en tu storefront."
          onSave={() => saveField("email", form.email)}
          saving={savingField === "email"}
        >
          <Input value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Address"
          description="Dirección física de tu negocio."
          onSave={() => saveField("address", form.address)}
          saving={savingField === "address"}
        >
          <Input value={form.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="bg-secondary border-border max-w-md" />
        </SettingsBlock>

        <SettingsBlock
          title="Primary Color"
          description="Color principal de tu marca. Se usará en botones, links y acentos."
          footerNote="Formato hexadecimal."
          onSave={() => saveField("primaryColor", form.primaryColor)}
          saving={savingField === "primaryColor"}
        >
          <div className="flex items-center gap-3 max-w-md">
            <div className="h-10 w-10 rounded-md border border-border shrink-0" style={{ backgroundColor: form.primaryColor || "#FFFFFF" }} />
            <Input value={form.primaryColor || ""} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} className="bg-secondary border-border font-mono text-sm" />
          </div>
        </SettingsBlock>

        <SettingsBlock
          title="Secondary Color"
          description="Color secundario de tu marca para fondos y elementos complementarios."
          footerNote="Formato hexadecimal."
          onSave={() => saveField("secondaryColor", form.secondaryColor)}
          saving={savingField === "secondaryColor"}
        >
          <div className="flex items-center gap-3 max-w-md">
            <div className="h-10 w-10 rounded-md border border-border shrink-0" style={{ backgroundColor: form.secondaryColor || "#1A1A1A" }} />
            <Input value={form.secondaryColor || ""} onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))} className="bg-secondary border-border font-mono text-sm" />
          </div>
        </SettingsBlock>
      </div>
    </div>
  );
}
