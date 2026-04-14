import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Credenciales inválidas. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresá a tu panel de administración">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      {/* Demo credentials */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Demo credentials</p>
        <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-muted-foreground">
          <button type="button" onClick={() => { setEmail("super@platform.com"); setPassword("admin123"); }} className="text-left hover:text-foreground transition-colors">
            super@platform.com / admin123 → SUPER_ADMIN
          </button>
          <button type="button" onClick={() => { setEmail("owner@negocio.com"); setPassword("owner123"); }} className="text-left hover:text-foreground transition-colors">
            owner@negocio.com / owner123 → OWNER
          </button>
          <button type="button" onClick={() => { setEmail("admin@negocio.com"); setPassword("admin123"); }} className="text-left hover:text-foreground transition-colors">
            admin@negocio.com / admin123 → ADMIN
          </button>
          <button type="button" onClick={() => { setEmail("editor@negocio.com"); setPassword("editor123"); }} className="text-left hover:text-foreground transition-colors">
            editor@negocio.com / editor123 → EDITOR
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link to="/signup" className="text-foreground hover:underline">Crear cuenta</Link>
      </p>
    </AuthLayout>
  );
}
