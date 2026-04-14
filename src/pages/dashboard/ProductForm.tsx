import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate("/dashboard/products");
    }, 1500);
  };

  return (
    <div>
      <DashboardTopbar
        title="Nuevo producto"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/products")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        }
      />
      <div className="p-6 max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Nombre del producto" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="nombre-del-producto" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción del producto..." className="bg-secondary border-border min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" placeholder="0" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" placeholder="0" className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input placeholder="Ej: Remeras" className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input placeholder="Separados por coma" className="bg-secondary border-border" />
          </div>
        </div>

        {/* Images */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Imágenes</h2>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Arrastrá imágenes acá o hacé click para subir</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-lg bg-secondary aspect-square flex items-center justify-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <button className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
