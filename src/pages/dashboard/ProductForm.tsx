import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { LoadingState } from "@/components/dashboard/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService, CreateProductPayload } from "@/services/products.service";
import { uploadsService } from "@/services/uploads.service";
import { toast } from "sonner";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && id !== "new";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateProductPayload>({
    name: "", slug: "", description: "", price: 0, stock: 0, category: "", tags: [], images: [], status: "active",
  });
  const [uploading, setUploading] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsService.getById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        description: existing.description || "",
        price: existing.price,
        stock: existing.stock,
        category: existing.category || "",
        tags: existing.tags || [],
        images: existing.images || [],
        status: existing.status,
      });
    }
  }, [existing]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => isEditing ? productsService.update(id!, form) : productsService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      navigate("/dashboard/products");
    },
    onError: (err: any) => toast.error(err.message || "Error al guardar"),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadsService.uploadImage(file);
        urls.push(res.url);
      }
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
      toast.success(`${urls.length} imagen(es) subida(s)`);
    } catch (err: any) {
      toast.error(err.message || "Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== index) }));
  };

  if (isEditing && isLoading) return <LoadingState />;

  return (
    <div>
      <DashboardTopbar
        title={isEditing ? "Editar producto" : "Nuevo producto"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/products")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />Volver
            </Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        }
      />
      <div className="p-6 max-w-3xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Nombre del producto" value={form.name} onChange={set("name")} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="nombre-del-producto" value={form.slug} onChange={set("slug")} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción del producto..." value={form.description} onChange={set("description")} className="bg-secondary border-border min-h-[100px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" placeholder="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" placeholder="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input placeholder="Ej: Remeras" value={form.category} onChange={set("category")} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input placeholder="Separados por coma" value={(form.tags || []).join(", ")} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))} className="bg-secondary border-border" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Imágenes</h2>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground">{uploading ? "Subiendo..." : "Arrastrá imágenes acá o hacé click para subir"}</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
          </div>
          {(form.images?.length ?? 0) > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {form.images!.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
