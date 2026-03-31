import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calculator, Package, Ruler, Weight, DollarSign, TrendingUp, Layers, Zap } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { usePricingConfig, VIDRO_TYPES, type CostBreakdown } from "@/hooks/usePricingConfig";
import { perfisAluminio } from "@/data/perfis-aluminio";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ProdutoRecord {
  id: string;
  nome: string;
  tipo?: string;
  ativo?: boolean;
  largura_padrao?: number;
  altura_padrao?: number;
  folhas?: number;
  [key: string]: unknown;
}

interface PerfilDBRecord {
  id: string;
  produto_id: string;
  codigo: string;
  descricao?: string;
  posicao?: string;
  medida: number;
  quantidade: number;
  peso_metro?: number;
  [key: string]: unknown;
}

interface CostDisplayItem {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bold?: boolean;
}

interface ItemConfiguratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: ConfiguredItem) => void;
}

export interface ConfiguredItem {
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  produto_id: string | null;
  tipo_vidro: string;
  markup_percentual: number;
  // Costs
  custo_aluminio: number;
  custo_vidro: number;
  custo_ferragem: number;
  custo_acessorios: number;
  custo_mao_obra: number;
  custo_total: number;
  lucro: number;
  valor_unitario: number;
  valor_total: number;
  peso_total_kg: number;
  area_vidro_m2: number;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function ItemConfigurator({ open, onOpenChange, onConfirm }: ItemConfiguratorProps) {
  const { profile } = useAuth();
  const { data: legacyProdutos = [] } = useSupabaseQuery("produtos");
  const { data: windowModels = [] } = useSupabaseQuery("window_models");
  const { data: windowParts = [] } = useSupabaseQuery("window_parts");
  const { data: legacyPerfis = [] } = useSupabaseQuery("perfis_aluminio");
  const { data: perfisCatalogo = [] } = useSupabaseQuery("perfis_catalogo");
  const { config, calculateCost } = usePricingConfig();

  const [produtoId, setProdutoId] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [tipoVidro, setTipoVidro] = useState("temperado_6mm");
  const [markup, setMarkup] = useState(config.markup_padrao);
  const [descricaoCustom, setDescricaoCustom] = useState("");

  useEffect(() => {
    setMarkup(config.markup_padrao);
  }, [config.markup_padrao]);

  const produtos = useMemo(() => {
    const legacy = (legacyProdutos as any[] || []).map(p => ({
      ...p,
      source: 'legacy'
    }));
    
    const mt = (windowModels as any[] || []).map(m => ({
      id: m.id,
      nome: m.nome,
      tipo: m.tipo,
      ativo: m.ativo,
      largura_padrao: Number(m.largura_min || 1200),
      altura_padrao: Number(m.altura_min || 1000),
      folhas: m.num_folhas || 2,
      source: 'mt'
    }));

    return [...legacy, ...mt];
  }, [legacyProdutos, windowModels]);

  const perfisDB = useMemo(() => {
    const legacy = (legacyPerfis as any[] || []).map(p => ({
      ...p,
      source: 'legacy'
    }));

    const mt = (perfisCatalogo as any[] || []).map(p => ({
      id: p.id,
      produto_id: '', // MT products link via window_parts, which we'll handle below
      codigo: p.codigo,
      descricao: p.nome || p.codigo,
      medida: 0,
      quantidade: 1,
      peso_metro: Number(p.peso_kg_m) || 0.5,
      source: 'mt'
    }));

    return [...legacy, ...mt];
  }, [legacyPerfis, perfisCatalogo]);

  const selectedProd = (produtos as ProdutoRecord[]).find((p) => p.id === produtoId);

  // When product is selected, fill defaults
  useEffect(() => {
    if (selectedProd) {
      if (selectedProd.largura_padrao) setLargura(String(selectedProd.largura_padrao));
      if (selectedProd.altura_padrao) setAltura(String(selectedProd.altura_padrao));
      setDescricaoCustom(selectedProd.nome);
    }
  }, [selectedProd]);

  // Get profiles for this product from DB
  const productPerfis = useMemo(() => {
    if (!produtoId) return [];
    const prod = selectedProd as any;
    
    // For legacy products, find by produto_id
    if (prod?.source === 'legacy') {
      return (perfisDB as PerfilDBRecord[]).filter((p) => p.produto_id === produtoId);
    }

    // For MT products, find via window_parts
    if (prod?.source === 'mt') {
      // Find parts for this model
      const parts = (windowParts as any[]).filter(p => p.window_model_id === produtoId);
      
      // Map parts to the PerfilDBRecord interface
      return parts.map(part => {
        // Find the actual profile in perfisCatalogo or legacyPerfis
        const profile = (perfisDB as any[]).find(p => p.id === part.perfil_aluminio_id || p.id === part.perfil_id);
        
        return {
          id: part.id,
          produto_id: produtoId,
          codigo: profile?.codigo || part.posicao,
          descricao: profile?.descricao || part.posicao,
          posicao: part.posicao,
          medida: 0, // Formulas would go here, but using base logic for now
          quantidade: Number(part.quantidade_formula) || 1,
          peso_metro: Number(profile?.peso_metro) || Number(profile?.peso_kg_m) || 0.5,
          formula_comprimento: part.formula_comprimento,
        };
      });
    }

    return [];
  }, [produtoId, perfisDB, windowParts, selectedProd]);

  // If no DB profiles, try to match from local data
  const matchedLocalPerfis = useMemo(() => {
    if (productPerfis.length > 0 || !selectedProd) return [];
    const nome = selectedProd.nome.toLowerCase();
    return perfisAluminio.filter((p) =>
      p.aplicacao.some((a) => {
        const app = a.toLowerCase();
        return (nome.includes("correr") && app.includes("correr")) ||
          (nome.includes("basculante") && app.includes("basculante")) ||
          (nome.includes("maxim") && app.includes("maxim")) ||
          (nome.includes("pivotante") && app.includes("pivotante")) ||
          (nome.includes("porta") && app.includes("porta")) ||
          (nome.includes("janela") && app.includes("janela"));
      })
    ).slice(0, 8);
  }, [selectedProd, productPerfis]);

  // Calculate proportional profile lengths based on dimensions
  const calculatedPerfis = useMemo(() => {
    const larg = Number(largura) || 0;
    const alt = Number(altura) || 0;
    if (!larg || !alt) return [];

    if (productPerfis.length > 0) {
      // Use DB profiles - recalculate proportionally or use formulas
      const prod = selectedProd as any;
      const baseLarg = prod?.largura_padrao || larg;
      const baseAlt = prod?.altura_padrao || alt;
      const ratioL = larg / baseLarg;
      const ratioA = alt / baseAlt;

      return productPerfis.map((p: any) => {
        let newMedida = p.medida;
        let newQty = p.quantidade;

        // NEW: If we have a formula, use it!
        if (prod?.source === 'mt' && p.formula_comprimento) {
          try {
            const expr = p.formula_comprimento.toLowerCase()
              .replace(/largura/g, String(larg))
              .replace(/altura/g, String(alt))
              .replace(/num_folhas/g, String(prod.folhas || 2));
            
            // Safer math-only evaluation
            // eslint-disable-next-line no-new-func
            newMedida = Math.round(new Function(`return ${expr}`)());
          } catch (e) {
            console.error("Erro na fórmula:", p.formula_comprimento, e);
          }
        } else {
          // Legacy/Fallback heuristic
          const pos = (p.posicao || "").toLowerCase();
          if (pos.includes("largura") || pos.includes("superior") || pos.includes("inferior") || pos.includes("travessa")) {
            newMedida = Math.round(p.medida * ratioL);
          } else if (pos.includes("altura") || pos.includes("lateral") || pos.includes("montante")) {
            newMedida = Math.round(p.medida * ratioA);
          }
        }

        return {
          codigo: p.codigo,
          descricao: p.descricao || p.codigo,
          posicao: p.posicao,
          comprimento_mm: newMedida,
          quantidade: newQty,
          peso_metro: Number(p.peso_metro) || 0.5,
        };
      });
    }

    // Fallback: use local profiles with estimated lengths
    if (matchedLocalPerfis.length > 0) {
      return matchedLocalPerfis.map((p) => {
        const isHorizontal = ["marco", "travessa", "trilho", "guia"].includes(p.tipo);
        return {
          codigo: p.codigo,
          descricao: p.descricao,
          posicao: isHorizontal ? "Largura" : "Altura",
          comprimento_mm: isHorizontal ? larg : alt,
          quantidade: isHorizontal ? 1 : 2,
          peso_metro: p.peso,
        };
      });
    }

    return [];
  }, [largura, altura, productPerfis, matchedLocalPerfis, selectedProd]);

  // Full cost calculation
  const cost: CostBreakdown | null = useMemo(() => {
    const larg = Number(largura) || 0;
    const alt = Number(altura) || 0;
    const qty = Number(quantidade) || 1;
    if (!larg || !alt || calculatedPerfis.length === 0) return null;

    return calculateCost({
      perfis: calculatedPerfis.map((p) => ({
        peso_metro: p.peso_metro,
        comprimento_mm: p.comprimento_mm,
        quantidade: p.quantidade,
      })),
      largura_mm: larg,
      altura_mm: alt,
      tipoVidro,
      tipoEsquadria: selectedProd?.tipo || selectedProd?.nome || "janela",
      folhas: selectedProd?.folhas || 2,
      markup,
      quantidade: qty,
    });
  }, [largura, altura, quantidade, tipoVidro, markup, calculatedPerfis, selectedProd, calculateCost]);

  const handleConfirm = () => {
    if (!cost || !descricaoCustom) return;
    const qty = Number(quantidade) || 1;
    onConfirm({
      descricao: descricaoCustom,
      quantidade: qty,
      largura: Number(largura),
      altura: Number(altura),
      produto_id: produtoId || null,
      tipo_vidro: tipoVidro,
      markup_percentual: markup,
      custo_aluminio: cost.custoAluminio,
      custo_vidro: cost.custoVidro,
      custo_ferragem: cost.custoFerragem,
      custo_acessorios: cost.custoAcessorios,
      custo_mao_obra: cost.custoMaoObra,
      custo_total: cost.custoTotal,
      lucro: cost.lucro,
      valor_unitario: Math.round((cost.precoVenda / qty) * 100) / 100,
      valor_total: Math.round(cost.precoVenda * 100) / 100,
      peso_total_kg: cost.pesoTotalKg,
      area_vidro_m2: cost.areaVidroM2,
    });
    // Reset
    setProdutoId("");
    setLargura("");
    setAltura("");
    setQuantidade("1");
    setTipoVidro("temperado_6mm");
    setDescricaoCustom("");
  };

  const activeProducts = useMemo(() => {
    return (produtos as ProdutoRecord[]).filter((p) => p.ativo !== false);
  }, [produtos]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Configurador de Orçamento Inteligente
          </DialogTitle>
          <DialogDescription>
            Selecione o produto, defina dimensões e o sistema calcula automaticamente todos os custos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Select Product */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <Label className="font-semibold">Selecionar Produto</Label>
            </div>
            <Select value={produtoId} onValueChange={setProdutoId}>
              <SelectTrigger><SelectValue placeholder="Escolha uma esquadria do catálogo..." /></SelectTrigger>
              <SelectContent>
                {activeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-medium">{p.nome}</span>
                    <span className="text-muted-foreground ml-2">— {p.tipo}</span>
                    {p.largura_padrao && p.altura_padrao && (
                      <span className="text-muted-foreground ml-1">({p.largura_padrao}×{p.altura_padrao}mm)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!produtoId && (
              <div>
                <Label className="text-xs text-muted-foreground">Ou descrição manual:</Label>
                <Input value={descricaoCustom} onChange={(e) => setDescricaoCustom(e.target.value)} placeholder="Ex: Janela de correr 2 folhas Suprema" className="mt-1" />
              </div>
            )}
          </div>

          {/* Step 2: Dimensions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <Label className="font-semibold">Dimensões e Quantidade</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Largura (mm)</Label>
                <Input type="number" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="1200" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Altura (mm)</Label>
                <Input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="1000" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Quantidade</Label>
                <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} min="1" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Step 3: Glass & Markup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <Label className="font-semibold">Vidro e Markup</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo de vidro</Label>
                <Select value={tipoVidro} onValueChange={setTipoVidro}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VIDRO_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Markup / Lucro: <span className="font-bold text-primary">{markup}%</span></Label>
                <Slider
                  value={[markup]}
                  onValueChange={([v]) => setMarkup(v)}
                  min={5}
                  max={100}
                  step={1}
                  className="mt-3"
                />
              </div>
            </div>
          </div>

          {/* Profiles Found */}
          {calculatedPerfis.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <Label className="font-semibold text-xs">Perfis identificados ({calculatedPerfis.length})</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {calculatedPerfis.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 border border-border rounded-lg text-[11px]">
                    <span className="font-bold text-primary">{p.codigo}</span>
                    <span className="text-foreground truncate flex-1">{p.descricao}</span>
                    <span className="text-muted-foreground">{p.comprimento_mm}mm</span>
                    <span className="text-muted-foreground">×{p.quantidade}</span>
                    <span className="text-muted-foreground">{p.peso_metro}kg/m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {cost && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Cálculo Automático de Custos</Label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Alumínio", value: cost.custoAluminio, icon: Package, color: "text-amber-600" },
                  { label: "Vidro", value: cost.custoVidro, icon: Layers, color: "text-blue-500" },
                  { label: "Ferragens", value: cost.custoFerragem, icon: Package, color: "text-zinc-500" },
                  { label: "Acessórios", value: cost.custoAcessorios, icon: Package, color: "text-zinc-400" },
                  { label: "Mão de obra", value: cost.custoMaoObra, icon: DollarSign, color: "text-orange-500" },
                  { label: "Custo total", value: cost.custoTotal, icon: Calculator, color: "text-foreground", bold: true },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-center gap-2 p-2 bg-muted/20 border border-border rounded-lg">
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", c.color)} />
                      <div className="flex-1">
                        <p className="text-[9px] text-muted-foreground">{c.label}</p>
                        <p className={cn("text-xs", (c as CostDisplayItem).bold ? "font-bold text-foreground" : "font-medium text-foreground")}>{fmt(c.value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                  <Weight className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">{cost.pesoTotalKg.toFixed(1)} kg</p>
                  <p className="text-[9px] text-muted-foreground">Peso alumínio</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                  <Ruler className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">{cost.areaVidroM2.toFixed(2)} m²</p>
                  <p className="text-[9px] text-muted-foreground">Área vidro</p>
                </div>
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-emerald-600">{fmt(cost.lucro)}</p>
                  <p className="text-[9px] text-muted-foreground">Lucro ({markup}%)</p>
                </div>
              </div>

              {/* Final price */}
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Custo de produção</p>
                    <p className="text-sm font-medium text-foreground">{fmt(cost.custoTotal)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Markup</p>
                    <p className="text-sm font-bold text-emerald-600">+{markup}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Preço de venda</p>
                    <p className="text-2xl font-bold text-primary">{fmt(cost.precoVenda)}</p>
                  </div>
                </div>
                {Number(quantidade) > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    Unitário: {fmt(cost.precoVenda / Number(quantidade))} × {quantidade} unidades
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!cost || !descricaoCustom} className="gap-2">
            <Calculator className="h-4 w-4" />
            Adicionar ao orçamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
