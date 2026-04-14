import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1500);
  };

  if (done) {
    return (
      <AuthLayout title="Contraseña actualizada" subtitle="Ya podés iniciar sesión con tu nueva contraseña.">
        <Link to="/login">
          <Button className="w-full">Ir al login</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elegí una nueva contraseña para tu cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" placeholder="••••••••" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input id="confirm" type="password" placeholder="••••••••" className="bg-secondary border-border" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </AuthLayout>
  );
}
