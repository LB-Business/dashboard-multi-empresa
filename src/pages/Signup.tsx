import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", businessName: "", businessSlug: "" });
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.registerOwner(form);
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        if (res.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);
      }
      toast.success("Cuenta creada exitosamente");
      navigate("/login");
    } catch (err: any) {
      setError(err?.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registrá tu negocio y empezá a administrarlo">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2.5 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" placeholder="Tu nombre" value={form.name} onChange={set("name")} className="bg-secondary border-border" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={set("email")} className="bg-secondary border-border" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={set("password")} className="bg-secondary border-border pr-10" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del negocio</Label>
            <Input id="businessName" placeholder="Mi Negocio" value={form.businessName} onChange={set("businessName")} className="bg-secondary border-border" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug del negocio</Label>
            <div className="flex items-center rounded-md border border-border bg-secondary">
              <span className="px-3 text-xs text-muted-foreground border-r border-border">app.com/</span>
              <Input id="slug" placeholder="mi-negocio" value={form.businessSlug} onChange={set("businessSlug")} className="border-0 bg-transparent" required />
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-foreground hover:underline">Iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
