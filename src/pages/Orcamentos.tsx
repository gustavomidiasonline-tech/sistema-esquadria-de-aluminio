import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, ChevronLeft, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Mock perfis data
const mockPerfis = [
  { id: "SU-001", material: "Amadeirado", desc: "Largura do vão (2000) - 26", weight: "2.9 Kg", size: "1974.0 mm", price: "R$ 288,20", qty: 2, dims: { w: 71, h: 33 } },
  { id: "SU-002", material: "Amadeirado", desc: "Largura do vão (2000) - 26", weight: "2.8 Kg", size: "1974.0 mm", price: "R$ 276,36", qty: 2, dims: { w: 38, h: 47 } },
  { id: "SU-003", material: "Amadeirado", desc: "Altura do vão (1000)", weight: "2.1 Kg", size: "1000.0 mm", price: "R$ 208,00", qty: 4, dims: { w: 26, h: 71 } },
  { id: "SU-039", material: "Amadeirado", desc: "Altura do vão (1000) - 50", weight: "1.9 Kg", size: "950.0 mm", price: "R$ 190,00", qty: 4, dims: { w: 52.6, h: 25 } },
  { id: "SU-012", material: "Amadeirado", desc: "Travessa inferior", weight: "1.2 Kg", size: "974.0 mm", price: "R$ 134,50", qty: 2, dims: { w: 60, h: 20 } },
];

const mockFerragens = [
  { id: "FE-001", name: "Roldana concava 25mm", qty: 4, price: "R$ 28,00" },
  { id: "FE-002", name: "Fecho concha cromado", qty: 2, price: "R$ 18,50" },
  { id: "FE-003", name: "Kit vedação 2000mm", qty: 1, price: "R$ 45,00" },
];

const mockProdutosOrcamento = [
  {
    id: 1,
    name: "JANELA 2 FOLHAS",
    desc: "teste",
    largura: 2000,
    altura: 1000,
    qty: 2,
    custo: "R$ 2.345,06",
    lucro: "R$ 4.100,00",
    total: "R$ 6.845,06",
    vidro: { tipo: "VIDRO 6MM COMUM", cor: "Incolor", area: "3.25 M²", total: "R$ 345,32" },
  },
  {
    id: 2,
    name: "JANELA 4 FOLHAS",
    desc: "",
    largura: 3000,
    altura: 1200,
    qty: 1,
    custo: "R$ 890,00",
    lucro: "R$ 1.560,00",
    total: "R$ 1.890,00",
    vidro: { tipo: "VIDRO 8MM TEMPERADO", cor: "Fumê", area: "5.40 M²", total: "R$ 612,00" },
  },
];

const mockOrcamentos = [
  { id: "ORC-001", client: "Igor Soares", product: "Janela 2 Folhas", value: "R$ 2.733,53", date: "06/05/2022", status: "Aprovado" },
  { id: "ORC-002", client: "Maria Oliveira", product: "Porta de Correr", value: "R$ 4.100,30", date: "12/05/2022", status: "Pendente" },
  { id: "ORC-003", client: "Carlos Santos", product: "Box Banheiro", value: "R$ 1.890,00", date: "18/05/2022", status: "Aprovado" },
  { id: "ORC-004", client: "Ana Costa", product: "Janela Maxim-Ar", value: "R$ 659,57", date: "25/05/2022", status: "Recusado" },
];

const statusColor: Record<string, string> = {
  Aprovado: "bg-success/10 text-success",
  Pendente: "bg-warning/10 text-warning",
  Recusado: "bg-destructive/10 text-destructive",
};

const materialColors: Record<string, string> = {
  Amadeirado: "bg-amber-500",
  Preto: "bg-gray-800",
  Branco: "bg-gray-200",
  Natural: "bg-gray-400",
};

// Simple profile SVG illustrations
const ProfileSVG = ({ dims, qty }: { dims: { w: number; h: number }; qty: number }) => (
  <div className="relative w-24 h-20 flex items-center justify-center">
    <svg viewBox="0 0 100 80" className="w-full h-full text-muted-foreground">
      {/* Main profile shape */}
      <rect x="10" y="15" width={dims.w} height="4" fill="currentColor" rx="1" />
      <rect x="10" y="15" width="4" height={dims.h} fill="currentColor" rx="1" />
      <rect x={10 + dims.w - 4} y="15" width="4" height={dims.h * 0.6} fill="currentColor" rx="1" />
      <line x1="10" y1="20" x2={10 + dims.w} y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
      {/* Dimension labels */}
      <text x={10 + dims.w / 2} y="12" textAnchor="middle" fontSize="8" fill="currentColor">{dims.w}</text>
      <text x={14 + dims.w} y={15 + dims.h / 2} textAnchor="start" fontSize="8" fill="currentColor">{dims.h}</text>
    </svg>
    {/* Quantity badge */}
    <span className="absolute bottom-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
      {qty}
    </span>
  </div>
);

const Orcamentos = () => {
  const [selectedOrcamento, setSelectedOrcamento] = useState<string | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<typeof mockProdutosOrcamento[0] | null>(null);

  // List view
  if (!selectedOrcamento) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
              <p className="text-sm text-muted-foreground">{mockOrcamentos.length} orçamentos</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo orçamento
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar orçamento..." className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Produto</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Valor</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockOrcamentos.map((orc) => (
                  <tr
                    key={orc.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrcamento(orc.id)}
                  >
                    <td className="px-5 py-4 font-bold text-primary">{orc.id}</td>
                    <td className="px-5 py-4 text-foreground">{orc.client}</td>
                    <td className="px-5 py-4 text-foreground">{orc.product}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{orc.value}</td>
                    <td className="px-5 py-4 text-muted-foreground">{orc.date}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[orc.status]}`}>
                        {orc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentOrc = mockOrcamentos.find((o) => o.id === selectedOrcamento);

  // Detail view — products list + detail modal
  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedOrcamento(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Orçamentos</h1>
              <p className="text-sm text-muted-foreground">{currentOrc?.client} · {currentOrc?.id}</p>
            </div>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Limpar</button>
        </div>

        {/* Products list */}
        <div className="space-y-4">
          {mockProdutosOrcamento.map((produto) => (
            <div
              key={produto.id}
              className="bg-card border border-border rounded-xl p-4 flex gap-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setSelectedProduto(produto)}
            >
              {/* Product image placeholder */}
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 border border-border">
                <svg viewBox="0 0 80 80" className="w-14 h-14 text-primary/60">
                  <rect x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="2" rx="2" />
                  <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="12" y="12" width="26" height="56" fill="currentColor" opacity="0.1" rx="1" />
                  <rect x="42" y="12" width="26" height="56" fill="currentColor" opacity="0.1" rx="1" />
                  {/* arrows */}
                  <line x1="15" y1="40" x2="25" y2="40" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrowR)" />
                  <line x1="65" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="1" markerEnd="url(#arrowL)" />
                </svg>
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm">{produto.name}</h3>
                {produto.desc && <p className="text-xs text-muted-foreground">{produto.desc}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Largura: {produto.largura} × Altura: {produto.altura}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {produto.qty}
                  </span>
                  <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Edit2 className="h-3 w-3" /> Editar produto
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-right text-xs space-y-1 flex-shrink-0">
                <p className="text-muted-foreground">Custo: <span className="font-semibold text-foreground">{produto.custo}</span></p>
                <p className="text-muted-foreground">Lucro: <span className="font-semibold text-success">{produto.lucro}</span></p>
                <p className="text-muted-foreground">Total: <span className="font-bold text-primary text-sm">{produto.total}</span></p>
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Detail Modal — Metros Quadrados + Perfis */}
      <Dialog open={!!selectedProduto} onOpenChange={() => setSelectedProduto(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <div className="p-6 space-y-6">
            {/* Metros Quadrados */}
            <div>
              <h2 className="text-xl font-bold text-primary italic mb-4">Metros Quadrados</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{selectedProduto?.vidro.tipo}</span>
                  <span className="text-sm font-semibold text-foreground">{selectedProduto?.vidro.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <span className="w-3 h-3 rounded-full bg-gray-200 border border-border" />
                    {selectedProduto?.vidro.cor}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border mt-3">
                  <span className="font-bold text-foreground">TOTAL</span>
                  <span className="font-bold text-foreground text-lg">{selectedProduto?.vidro.total}</span>
                </div>
              </div>
            </div>

            {/* Perfis */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary italic">Perfis</h2>
                <Button size="sm" className="gap-1.5 rounded-full">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </Button>
              </div>

              <div className="space-y-4">
                {mockPerfis.map((perfil) => (
                  <div key={perfil.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    {/* Profile illustration */}
                    <ProfileSVG dims={perfil.dims} qty={perfil.qty} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{perfil.id}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`w-2.5 h-2.5 rounded-full ${materialColors[perfil.material] || "bg-gray-400"}`} />
                          <span className="text-muted-foreground">{perfil.material}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{perfil.desc}</span>
                      </div>
                    </div>

                    {/* Weight, size, price */}
                    <div className="text-right text-xs space-y-0.5 flex-shrink-0">
                      <p className="text-muted-foreground">{perfil.weight}</p>
                      <p className="text-muted-foreground">{perfil.size}</p>
                      <p className="font-bold text-foreground text-sm mt-1">{perfil.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ferragens */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary italic">Ferragens</h2>
                <Button size="sm" className="gap-1.5 rounded-full">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </Button>
              </div>

              <div className="space-y-3">
                {mockFerragens.map((ferragem) => (
                  <div key={ferragem.id} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ferragem.name}</p>
                      <p className="text-xs text-muted-foreground">{ferragem.id} · Qtd: {ferragem.qty}</p>
                    </div>
                    <p className="font-bold text-foreground text-sm">{ferragem.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedProduto(null)}>
              Voltar
            </Button>
            <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Alterar valores
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Orcamentos;
