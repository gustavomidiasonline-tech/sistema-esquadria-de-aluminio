import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, Package, Layers, Wrench, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BOMService } from "@/services/bom.service";
import type { BOMResult } from "@/services/bom.service";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const categoriaBadge: Record<string, string> = {
  aluminio: "bg-amber-100 text-amber-800 border-amber-200",
  vidro: "bg-blue-100 text-blue-800 border-blue-200",
  ferragem: "bg-orange-100 text-orange-800 border-orange-200",
  acessorio: "bg-purple-100 text-purple-800 border-purple-200",
  borracha: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const BOM = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orcamentoId = searchParams.get("orcamento_id");
  const [manualId, setManualId] = useState("");

  const { data: orcamento } = useQuery({
    queryKey: ["bom-orcamento", orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return null;
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*, clientes(nome)")
        .eq("id", orcamentoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orcamentoId,
  });

  const { data: itens = [] } = useQuery({
    queryKey: ["bom-itens", orcamentoId],
    queryFn: async () => {
      if (!orcamentoId) return [];
      const { data, error } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamentoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orcamentoId,
  });

  const { data: orcamentosList = [] } = useQuery({
    queryKey: ["bom-orcamentos-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, descricao, status, valor_total, clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orcamentoId,
  });

  const boms: BOMResult[] = useMemo(() => {
    return itens.map((item) =>
      BOMService.calcularBOM({
        id: item.id,
        descricao: item.descricao,
        largura: item.largura,
        altura: item.altura,
        quantidade: item.quantidade,
      })
    );
  }, [itens]);

  const agregados = useMemo(() => {
    const mapa = BOMService.agregarMateriais(boms);
    return Array.from(mapa.values());
  }, [boms]);

  const kpis = useMemo(() => {
    const totalPerfis = agregados
      .filter((m) => m.categoria === "aluminio")
      .reduce((s, m) => s + m.quantidade, 0);
    const totalVidro = agregados
      .filter((m) => m.categoria === "vidro")
      .reduce((s, m) => s + m.quantidade, 0);
    const totalFerragens = agregados
      .filter((m) => m.categoria === "ferragem")
      .reduce((s, m) => s + m.quantidade, 0);
    const totalBorracha = agregados
      .filter((m) => m.categoria === "borracha")
      .reduce((s, m) => s + m.quantidade, 0);
    return { totalPerfis, totalVidro, totalFerragens, totalBorracha };
  }, [agregados]);

  const handleGoToOrcamento = () => {
    const id = manualId.trim();
    if (id) navigate(`/bom?orcamento_id=${id}`);
  };

  // No orcamento_id — show selection
  if (!orcamentoId) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lista de Materiais (BOM)</h1>
            <p className="text-sm text-muted-foreground">Selecione um orcamento para gerar a lista de materiais</p>
          </div>

          <div className="glass-card-premium p-6 space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-xs">ID do Orcamento</Label>
                <Input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Cole o ID do orcamento..."
                  className="mt-1"
                />
              </div>
              <Button onClick={handleGoToOrcamento} disabled={!manualId.trim()}>
                <Search className="h-4 w-4 mr-2" /> Buscar
              </Button>
            </div>
          </div>

          <div className="glass-card-premium">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Orcamentos recentes</h3>
            </div>
            <div className="divide-y divide-border">
              {orcamentosList.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum orcamento encontrado.</div>
              ) : (
                orcamentosList.map((orc) => (
                  <button
                    key={orc.id}
                    onClick={() => navigate(`/bom?orcamento_id=${orc.id}`)}
                    className="flex items-center justify-between px-5 py-4 w-full text-left hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Orcamento #{orc.numero}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(orc.clientes as { nome: string } | null)?.nome || "Sem cliente"} - {orc.descricao || "Sem descricao"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">{orc.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        R$ {(orc.valor_total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const clienteNome = (orcamento as { clientes?: { nome: string } | null })?.clientes?.nome ?? "Sem cliente";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Button variant="ghost" size="icon" onClick={() => navigate("/bom")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                BOM - Orcamento #{orcamento?.numero ?? "..."}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground ml-12">
              {clienteNome} - {itens.length} itens
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Perfis Aluminio", value: `${kpis.totalPerfis.toFixed(2)} m`, icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Vidro", value: `${kpis.totalVidro.toFixed(3)} m2`, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Ferragens", value: `${kpis.totalFerragens} un`, icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Borrachas", value: `${kpis.totalBorracha.toFixed(2)} m`, icon: ClipboardList, color: "text-cyan-500", bg: "bg-cyan-500/10" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="glass-card-premium p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{kpi.label}</span>
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", kpi.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        <Tabs defaultValue="agregado">
          <TabsList>
            <TabsTrigger value="agregado">Materiais Agregados</TabsTrigger>
            <TabsTrigger value="por-item">Por Item</TabsTrigger>
          </TabsList>

          <TabsContent value="agregado">
            <div className="glass-card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Material</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Quantidade</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Unidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agregados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum material calculado.</td>
                      </tr>
                    ) : (
                      agregados.map((mat, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium text-foreground">{mat.nome}</td>
                          <td className="p-3">
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", categoriaBadge[mat.categoria] || "bg-gray-100 text-gray-800 border-gray-200")}>
                              {mat.categoria}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-foreground">{mat.quantidade}</td>
                          <td className="p-3 text-muted-foreground">{mat.unidade}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="por-item" className="space-y-4">
            {boms.length === 0 ? (
              <div className="glass-card-premium p-8 text-center text-muted-foreground">Nenhum item no orcamento.</div>
            ) : (
              boms.map((bom) => (
                <div key={bom.orcamento_item_id} className="glass-card-premium overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <h4 className="text-sm font-bold text-foreground">{bom.descricao}</h4>
                    <p className="text-xs text-muted-foreground">
                      {bom.largura}mm x {bom.altura}mm - Qtd: {bom.quantidade}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-muted-foreground text-xs">Material</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-xs">Categoria</th>
                          <th className="text-right p-3 font-medium text-muted-foreground text-xs">Qtd</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-xs">Un</th>
                          <th className="text-left p-3 font-medium text-muted-foreground text-xs">Formula</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bom.materiais.map((mat, i) => (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-foreground">{mat.nome}</td>
                            <td className="p-3">
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", categoriaBadge[mat.categoria] || "bg-gray-100 text-gray-800 border-gray-200")}>
                                {mat.categoria}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-foreground">{mat.quantidade}</td>
                            <td className="p-3 text-muted-foreground">{mat.unidade}</td>
                            <td className="p-3 text-xs text-muted-foreground font-mono">{mat.formula}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default BOM;
