import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registrá tu negocio y empezá a administrarlo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" placeholder="Tu nombre" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" placeholder="••••••••" className="bg-secondary border-border" />
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del negocio</Label>
            <Input id="businessName" placeholder="Mi Negocio" className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug del negocio</Label>
            <div className="flex items-center rounded-md border border-border bg-secondary">
              <span className="px-3 text-xs text-muted-foreground border-r border-border">app.com/</span>
              <Input id="slug" placeholder="mi-negocio" className="border-0 bg-transparent" />
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
