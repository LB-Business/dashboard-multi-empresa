import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const mockUsers = [
  { id: "1", name: "Yamil Batte", email: "yamil@negocio.com", role: "OWNER", business: "Mi Negocio", status: "active" },
  { id: "2", name: "Laura González", email: "laura@cafe.com", role: "OWNER", business: "Café Central", status: "active" },
  { id: "3", name: "Martín López", email: "martin@negocio.com", role: "ADMIN", business: "Mi Negocio", status: "active" },
  { id: "4", name: "Sofía Ramírez", email: "sofia@tech.com", role: "OWNER", business: "Tech Store", status: "active" },
  { id: "5", name: "Carlos Méndez", email: "carlos@ropa.com", role: "EDITOR", business: "Ropa Express", status: "invited" },
  { id: "6", name: "Ana Torres", email: "ana@cafe.com", role: "EDITOR", business: "Café Central", status: "active" },
];

export default function AllUsersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.business.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <DashboardTopbar title="All Users" subtitle="Usuarios de toda la plataforma" />
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar usuarios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 bg-secondary border-border text-sm" />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Negocio</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-foreground font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{user.business}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] font-mono">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {user.status === "active" ? "Activo" : "Invitado"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-accent transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
