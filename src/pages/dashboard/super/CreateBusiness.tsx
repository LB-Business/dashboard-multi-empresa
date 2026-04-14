import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate("/dashboard/businesses");
    }, 1500);
  };

  return (
    <div>
      <DashboardTopbar
        title="Nuevo negocio"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/businesses")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />Volver
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Creando..." : "Crear negocio"}
            </Button>
          </div>
        }
      />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input placeholder="Ej: Café Central" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <div className="flex items-center rounded-md border border-border bg-secondary">
                <span className="px-3 text-xs text-muted-foreground border-r border-border">app.com/</span>
                <Input placeholder="cafe-central" className="border-0 bg-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Owner del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del owner</Label>
              <Input placeholder="Nombre completo" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email del owner</Label>
              <Input type="email" placeholder="owner@email.com" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contraseña temporal</Label>
            <Input type="password" placeholder="••••••••" className="bg-secondary border-border max-w-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
