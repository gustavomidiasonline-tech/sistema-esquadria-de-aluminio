import { AppLayout } from "@/components/AppLayout";
import { Package, Plus, Search } from "lucide-react";

const mockProducts = [
  { id: 1, name: "Vidro 6mm Comum Incolor", category: "Vidros", price: "R$ 105,00/m²", stock: 45 },
  { id: 2, name: "Perfil SU-001 Amadeirado", category: "Perfis", price: "R$ 288,20", stock: 120 },
  { id: 3, name: "Perfil SU-002 Amadeirado", category: "Perfis", price: "R$ 276,36", stock: 85 },
  { id: 4, name: "Ferragem Cromada Kit", category: "Ferragens", price: "R$ 189,90", stock: 32 },
  { id: 5, name: "Contramarco Alumínio", category: "Acessórios", price: "R$ 45,00/m", stock: 200 },
];

const Produtos = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">{mockProducts.length} produtos cadastrados</p>
        </div>
        <button className="glass-button-primary gap-2 flex items-center">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar produto..." className="glass-input-field pl-10 pr-4 py-2.5 text-sm w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((product) => (
          <div key={product.id} className="glass-card-premium cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-foreground">{product.price}</p>
              <span className="glass-badge-neon text-xs">
                Estoque: {product.stock}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Produtos;
