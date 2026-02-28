import { AppLayout } from "@/components/AppLayout";
import { useState, Suspense } from "react";
import { Scissors, Plus, Search, CheckCircle, Clock, AlertTriangle, Maximize2, Box, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CuttingDiagram, COLORS, type Plano } from "@/components/plano-de-corte/CuttingDiagram";
import { CuttingDiagram3D } from "@/components/plano-de-corte/CuttingDiagram3D";

const planos: Plano[] = [
  {
    id: 1, nome: "Pedido #1042 - Box Banheiro", data: "27/02/2026", status: "concluido",
    chapa: { largura: 2200, altura: 1100 },
    pecas: [
      { id: 1, largura: 800, altura: 1900, qtd: 2, material: "Temperado 8mm Incolor" },
      { id: 2, largura: 400, altura: 1900, qtd: 1, material: "Temperado 8mm Incolor" },
    ],
    aproveitamento: 87.3,
  },
  {
    id: 2, nome: "Pedido #1038 - Janela 4 folhas", data: "26/02/2026", status: "andamento",
    chapa: { largura: 2500, altura: 1300 },
    pecas: [
      { id: 1, largura: 600, altura: 1200, qtd: 4, material: "Temperado 6mm Incolor" },
      { id: 2, largura: 300, altura: 200, qtd: 2, material: "Temperado 6mm Incolor" },
    ],
    aproveitamento: 72.8,
  },
  {
    id: 3, nome: "Pedido #1035 - Porta Pivotante", data: "25/02/2026", status: "pendente",
    chapa: { largura: 2200, altura: 1100 },
    pecas: [
      { id: 1, largura: 1000, altura: 2100, qtd: 1, material: "Laminado 10mm Incolor" },
      { id: 2, largura: 200, altura: 2100, qtd: 2, material: "Laminado 10mm Incolor" },
    ],
    aproveitamento: 64.1,
  },
  {
    id: 4, nome: "Pedido #1030 - Fachada Loja", data: "24/02/2026", status: "concluido",
    chapa: { largura: 3210, altura: 2200 },
    pecas: [
      { id: 1, largura: 1500, altura: 2100, qtd: 2, material: "Laminado 8mm Verde" },
      { id: 2, largura: 1000, altura: 500, qtd: 3, material: "Laminado 8mm Verde" },
    ],
    aproveitamento: 91.5,
  },
];

const statusConfig = {
  concluido: { label: "Concluído", icon: CheckCircle, cls: "bg-[hsl(142,72%,42%)] text-white" },
  andamento: { label: "Em andamento", icon: Clock, cls: "bg-[hsl(38,92%,50%)] text-white" },
  pendente: { label: "Pendente", icon: AlertTriangle, cls: "bg-muted text-muted-foreground" },
};

const PlanoDeCorte = () => {
  const [search, setSearch] = useState("");
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);

  const filtered = planos.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plano de Corte</h1>
            <p className="text-sm text-muted-foreground">Otimize o corte dos vidros e perfis com planos automatizados</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Novo plano</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar plano..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{planos.length}</p>
            <p className="text-xs text-muted-foreground">Planos criados</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{planos.filter(p => p.status === "concluido").length}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{(planos.reduce((a, p) => a + p.aproveitamento, 0) / planos.length).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Aproveitamento médio</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{planos.reduce((a, p) => a + p.pecas.reduce((b, pc) => b + pc.qtd, 0), 0)}</p>
            <p className="text-xs text-muted-foreground">Peças totais</p>
          </div>
        </div>

        {selectedPlano ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedPlano(null)} className="gap-2 text-muted-foreground">
              ← Voltar para lista
            </Button>
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedPlano.nome}</h2>
                  <p className="text-xs text-muted-foreground">{selectedPlano.data} • Chapa {selectedPlano.chapa.largura}x{selectedPlano.chapa.altura}mm</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary">{selectedPlano.aproveitamento}% aproveitamento</span>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusConfig[selectedPlano.status].cls}`}>
                    {statusConfig[selectedPlano.status].label}
                  </span>
                </div>
              </div>

              <Tabs defaultValue="3d">
                <TabsList>
                  <TabsTrigger value="2d" className="gap-1.5"><Grid2X2 className="h-3.5 w-3.5" /> Diagrama 2D</TabsTrigger>
                  <TabsTrigger value="3d" className="gap-1.5"><Box className="h-3.5 w-3.5" /> Modelo CAD 3D</TabsTrigger>
                </TabsList>
                <TabsContent value="2d">
                  <CuttingDiagram plano={selectedPlano} />
                </TabsContent>
                <TabsContent value="3d">
                  <Suspense fallback={
                    <div className="w-full h-[400px] bg-muted/30 rounded-xl border border-border flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Box className="h-8 w-8 text-muted-foreground animate-pulse mx-auto" />
                        <p className="text-sm text-muted-foreground">Carregando modelo 3D...</p>
                      </div>
                    </div>
                  }>
                    <CuttingDiagram3D plano={selectedPlano} />
                  </Suspense>
                </TabsContent>
              </Tabs>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Peças</h3>
                <div className="space-y-2">
                  {selectedPlano.pecas.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.largura} x {p.altura} mm</p>
                          <p className="text-xs text-muted-foreground">{p.material}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">x{p.qtd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((plano) => {
              const St = statusConfig[plano.status];
              return (
                <button
                  key={plano.id}
                  onClick={() => setSelectedPlano(plano)}
                  className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{plano.nome}</span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${St.cls}`}>{St.label}</span>
                  </div>
                  <CuttingDiagram plano={plano} />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{plano.data}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Maximize2 className="h-3 w-3" /> {plano.chapa.largura}x{plano.chapa.altura}mm
                      </span>
                      <span className="text-xs font-semibold text-primary">{plano.aproveitamento}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PlanoDeCorte;
