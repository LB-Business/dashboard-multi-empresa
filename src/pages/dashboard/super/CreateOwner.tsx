import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function CreateOwnerPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate("/dashboard/all-users");
    }, 1500);
  };

  return (
    <div>
      <DashboardTopbar
        title="Crear Owner"
        subtitle="Registrar un nuevo owner para un negocio existente"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />Volver
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Creando..." : "Crear owner"}
            </Button>
          </div>
        }
      />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Datos del owner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input placeholder="Nombre del owner" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="owner@email.com" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contraseña temporal</Label>
            <Input type="password" placeholder="••••••••" className="bg-secondary border-border max-w-sm" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Asignar a negocio</h2>
          <div className="space-y-2">
            <Label>Negocio</Label>
            <Input placeholder="Buscar negocio..." className="bg-secondary border-border max-w-md" />
            <p className="text-xs text-muted-foreground">Seleccioná el negocio al que se asignará este owner.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
