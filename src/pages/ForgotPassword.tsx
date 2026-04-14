import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  if (sent) {
    return (
      <AuthLayout title="Revisá tu email" subtitle="Te enviamos un link para restablecer tu contraseña.">
        <Link to="/login">
          <Button variant="outline" className="w-full">Volver al login</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Ingresá tu email y te enviaremos un link de recuperación">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="tu@email.com" className="bg-secondary border-border" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-foreground hover:underline">Volver al login</Link>
      </p>
    </AuthLayout>
  );
}
