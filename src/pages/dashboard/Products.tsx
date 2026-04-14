import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockProducts = [
  { id: "1", name: "Remera Oversize Negra", category: "Remeras", price: 15000, stock: 42, status: "active", image: "" },
  { id: "2", name: "Pantalón Cargo Beige", category: "Pantalones", price: 28000, stock: 18, status: "active", image: "" },
  { id: "3", name: "Buzo Hoodie Gris", category: "Buzos", price: 32000, stock: 0, status: "draft", image: "" },
  { id: "4", name: "Campera Puffer Negra", category: "Abrigos", price: 55000, stock: 7, status: "active", image: "" },
  { id: "5", name: "Bermuda Jean Clásica", category: "Shorts", price: 22000, stock: 31, status: "active", image: "" },
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <DashboardTopbar
        title="Products"
        subtitle="Administrá tus productos"
        actions={
          <Button size="sm" onClick={() => navigate("/dashboard/products/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo producto
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-secondary border-border text-sm"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/products/${product.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-foreground font-medium truncate">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{product.category}</td>
                  <td className="px-4 py-3 text-foreground font-mono text-xs">${product.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{product.stock}</td>
                  <td className="px-4 py-3">
                    <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {product.status === "active" ? "Activo" : "Borrador"}
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
