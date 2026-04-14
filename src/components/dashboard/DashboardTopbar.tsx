import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardTopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardTopbar({ title, subtitle, actions }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="h-8 w-56 bg-secondary border-border pl-8 text-xs"
          />
        </div>
        {actions}
      </div>
    </header>
  );
}
