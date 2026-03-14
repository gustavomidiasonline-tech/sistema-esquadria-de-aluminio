import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Search, ChevronRight, ArrowLeft, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface CatalogProfile {
  id: string;
  code: string;
  description: string | null;
}

interface CutRule {
  id: string;
  product_id: string;
  profile_id: string;
  formula: string;
  quantity: number;
  angle: string;
  axis: string;
  profile?: CatalogProfile;
}

const ConfiguracaoModelos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [profiles, setProfiles] = useState<CatalogProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Product dialog
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");

  // Detail view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cutRules, setCutRules] = useState<CutRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Rule dialog
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<CutRule | null>(null);
  const [ruleProfileId, setRuleProfileId] = useState("");
  const [ruleFormula, setRuleFormula] = useState("");
  const [ruleQty, setRuleQty] = useState("1");
  const [ruleAngle, setRuleAngle] = useState("90°");
  const [ruleAxis, setRuleAxis] = useState("L");

  // Preview
  const [previewL, setPreviewL] = useState("2000");
  const [previewH, setPreviewH] = useState("1000");

  useEffect(() => { loadProducts(); loadProfiles(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("mt_products").select("*").order("name");
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("catalog_profiles").select("*").order("code");
    setProfiles((data as CatalogProfile[]) || []);
  };

  const loadCutRules = async (productId: string) => {
    setLoadingRules(true);
    const { data } = await supabase
      .from("cut_rules")
      .select("*, profile:catalog_profiles(id, code, description)")
      .eq("product_id", productId)
      .order("created_at");
    setCutRules((data as any[]) || []);
    setLoadingRules(false);
  };

  // Product CRUD
  const openNewProduct = () => {
    setEditingProduct(null);
    setProdName(""); setProdDesc(""); setProdImage("");
    setProductDialog(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name); setProdDesc(p.description || ""); setProdImage(p.image_url || "");
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim()) { toast.error("Nome obrigatório"); return; }
    const payload = { name: prodName.trim(), description: prodDesc || null, image_url: prodImage || null };

    if (editingProduct) {
      await supabase.from("mt_products").update(payload).eq("id", editingProduct.id);
      toast.success("Produto atualizado!");
    } else {
      // Get company_id from user profile
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", (await supabase.auth.getUser()).data.user?.id || "").single();
      await supabase.from("mt_products").insert({ ...payload, company_id: profile?.company_id });
      toast.success("Produto criado!");
    }
    setProductDialog(false);
    loadProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("mt_products").delete().eq("id", id);
    toast.success("Produto removido");
    loadProducts();
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };

  // Rule CRUD
  const openNewRule = () => {
    setEditingRule(null);
    setRuleProfileId(""); setRuleFormula(""); setRuleQty("1"); setRuleAngle("90°"); setRuleAxis("L");
    setRuleDialog(true);
  };

  const openEditRule = (r: CutRule) => {
    setEditingRule(r);
    setRuleProfileId(r.profile_id); setRuleFormula(r.formula); setRuleQty(String(r.quantity));
    setRuleAngle(r.angle); setRuleAxis(r.axis);
    setRuleDialog(true);
  };

  const saveRule = async () => {
    if (!ruleProfileId || !ruleFormula.trim()) { toast.error("Perfil e fórmula obrigatórios"); return; }
    const payload = {
      product_id: selectedProduct!.id,
      profile_id: ruleProfileId,
      formula: ruleFormula.trim(),
      quantity: parseInt(ruleQty) || 1,
      angle: ruleAngle,
      axis: ruleAxis,
    };

    if (editingRule) {
      await supabase.from("cut_rules").update(payload).eq("id", editingRule.id);
      toast.success("Regra atualizada!");
    } else {
      await supabase.from("cut_rules").insert(payload);
      toast.success("Regra adicionada!");
    }
    setRuleDialog(false);
    loadCutRules(selectedProduct!.id);
  };

  const deleteRule = async (id: string) => {
    await supabase.from("cut_rules").delete().eq("id", id);
    toast.success("Regra removida");
    loadCutRules(selectedProduct!.id);
  };

  // Formula eval
  const evalFormula = (formula: string, L: number, H: number): string => {
    try {
      const expr = formula.replace(/L/g, String(L)).replace(/H/g, String(H));
      if (!/^[\d\s+\-*/().]+$/.test(expr)) return "—";
      const result = Function(`"use strict"; return (${expr})`)();
      return `${Math.round(Number(result))} mm`;
    } catch {
      return "Erro";
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ======= DETAIL VIEW =======
  if (selectedProduct) {
    const L = parseInt(previewL) || 0;
    const H = parseInt(previewH) || 0;

    return (
      <AppLayout>
        <div className="max-w-5xl space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{selectedProduct.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedProduct.description || "Configuração de fórmulas de corte"}</p>
            </div>
            <Button onClick={() => openEditProduct(selectedProduct)} variant="outline" size="sm">Editar Produto</Button>
          </div>

          {/* Preview calculator */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Simulador de Corte</h3>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Largura (L)</Label>
                <Input type="number" value={previewL} onChange={e => setPreviewL(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Altura (H)</Label>
                <Input type="number" value={previewH} onChange={e => setPreviewH(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Cut rules table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Regras de Corte ({cutRules.length})</h3>
              <Button size="sm" onClick={openNewRule} className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Adicionar Regra
              </Button>
            </div>

            {loadingRules ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
            ) : cutRules.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma regra de corte cadastrada</p>
                <Button size="sm" variant="outline" onClick={openNewRule} className="mt-3 gap-2">
                  <Plus className="h-3.5 w-3.5" /> Primeira Regra
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Perfil</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Eixo</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Fórmula</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Qtd</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Ângulo</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">Resultado</th>
                      <th className="p-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{(rule as any).profile?.code || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">{(rule as any).profile?.description || ""}</p>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            rule.axis === "L" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                          )}>
                            {rule.axis === "L" ? "Largura" : "Altura"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-foreground">{rule.formula}</td>
                        <td className="p-3 text-foreground">{rule.quantity}</td>
                        <td className="p-3 text-foreground">{rule.angle}</td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-primary">
                            {evalFormula(rule.formula, L, H)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditRule(rule)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteRule(rule.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Rule Dialog */}
        <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Corte"}</DialogTitle>
              <DialogDescription>Associe um perfil e defina a fórmula de cálculo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm font-semibold">Perfil de Alumínio</Label>
                <Select value={ruleProfileId} onValueChange={setRuleProfileId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.code} — {p.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Fórmula</Label>
                <Input
                  placeholder="Ex: L - 45 ou (H / 2) + 10"
                  value={ruleFormula}
                  onChange={e => setRuleFormula(e.target.value)}
                  className="mt-1 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Use L para largura e H para altura</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Quantidade</Label>
                  <Input type="number" value={ruleQty} onChange={e => setRuleQty(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Ângulo</Label>
                  <Select value={ruleAngle} onValueChange={setRuleAngle}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90°">90°</SelectItem>
                      <SelectItem value="45°">45°</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Eixo</Label>
                  <Select value={ruleAxis} onValueChange={setRuleAxis}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Largura (L)</SelectItem>
                      <SelectItem value="H">Altura (H)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {ruleFormula && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Preview (L={previewL}, H={previewH})</p>
                  <p className="text-lg font-bold text-primary">{evalFormula(ruleFormula, parseInt(previewL) || 0, parseInt(previewH) || 0)}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRuleDialog(false)}>Cancelar</Button>
              <Button onClick={saveRule}>{editingRule ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Dialog (reuse) */}
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>Altere os dados do modelo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>Nome</Label><Input value={prodName} onChange={e => setProdName(e.target.value)} className="mt-1" /></div>
              <div><Label>Descrição</Label><Textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="mt-1" /></div>
              <div><Label>URL da Imagem</Label><Input value={prodImage} onChange={e => setProdImage(e.target.value)} className="mt-1" placeholder="https://..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialog(false)}>Cancelar</Button>
              <Button onClick={saveProduct}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  // ======= LIST VIEW =======
  return (
    <AppLayout>
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuração de Modelos</h1>
            <p className="text-sm text-muted-foreground">Cadastre produtos, associe perfis e defina fórmulas de corte</p>
          </div>
          <Button onClick={openNewProduct} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-3">Nenhum produto cadastrado</p>
            <Button onClick={openNewProduct} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar Primeiro Produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => (
              <button
                key={product.id}
                onClick={() => { setSelectedProduct(product); loadCutRules(product.id); }}
                className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description || "Sem descrição"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>Defina o modelo de esquadria.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nome <span className="text-destructive">*</span></Label><Input value={prodName} onChange={e => setProdName(e.target.value)} className="mt-1" placeholder="Ex: Janela 2 Folhas de Vidro" /></div>
            <div><Label>Descrição</Label><Textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="mt-1" placeholder="Descrição do modelo..." /></div>
            <div><Label>URL da Imagem</Label><Input value={prodImage} onChange={e => setProdImage(e.target.value)} className="mt-1" placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>Cancelar</Button>
            <Button onClick={saveProduct}>{editingProduct ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ConfiguracaoModelos;
