import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, UserCircle } from "lucide-react";
import { useState } from "react";

const mockUsers = [
  { id: "1", name: "Yamil Batte", email: "yamil@negocio.com", role: "owner", status: "active" },
  { id: "2", name: "Laura González", email: "laura@negocio.com", role: "admin", status: "active" },
  { id: "3", name: "Martín López", email: "martin@negocio.com", role: "editor", status: "active" },
  { id: "4", name: "Sofía Ramírez", email: "sofia@negocio.com", role: "viewer", status: "invited" },
];

const roleColors: Record<string, string> = {
  owner: "default",
  admin: "default",
  editor: "secondary",
  viewer: "secondary",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <DashboardTopbar
        title="Users"
        subtitle="Administrá los usuarios de tu negocio"
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Invitar usuario</Button>}
      />
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
                  <td className="px-4 py-3">
                    <Badge variant={roleColors[user.role] as any} className="text-[10px] capitalize">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{user.status === "active" ? "Activo" : "Invitado"}</Badge>
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
