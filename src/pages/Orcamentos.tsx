import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, Filter, Eye, ChevronDown, ChevronUp, FileText, Printer, DollarSign, TrendingUp, CheckCircle2, Clock, XCircle, Download, Calculator, ShoppingCart } from "lucide-react";
import { exportOrcamentoPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { OrcamentoDetail } from "@/components/orcamentos/OrcamentoDetail";
import { ItemConfigurator, type ConfiguredItem } from "@/components/orcamentos/ItemConfigurator";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  aprovado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-primary/10 text-primary border-primary/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
  expirado: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};
const statusLabel: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", rejeitado: "Rejeitado", expirado: "Expirado",
};

const Orcamentos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: orcamentos = [], isLoading } = useSupabaseQuery("orcamentos", {
    select: "*, clientes(nome, telefone, email, cidade, estado)", orderBy: { column: "created_at", ascending: false },
  });
  const { data: allItens = [] } = useSupabaseQuery("orcamento_itens");
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const { data: produtos = [] } = useSupabaseQuery("produtos");
  const insertMutation = useSupabaseInsert("orcamentos");
  const updateMutation = useSupabaseUpdate("orcamentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrc, setExpandedOrc] = useState<string | null>(null);
  const [form, setForm] = useState({ cliente_id: "", descricao: "", valor_total: "", validade: "", observacoes: "" });

  // Smart configurator
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configOrcId, setConfigOrcId] = useState("");

  // Legacy simple item form
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemOrcId, setItemOrcId] = useState("");
  const [itemForm, setItemForm] = useState({ descricao: "", quantidade: "1", valor_unitario: "", largura: "", altura: "", produto_id: "" });

  const handleSave = async () => {
    if (!form.cliente_id) { toast.error("Selecione um cliente"); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id, descricao: form.descricao,
        valor_total: Number(form.valor_total) || 0, validade: form.validade || null,
        observacoes: form.observacoes, created_by: user?.id,
      });
      toast.success("Orçamento criado!");
      setDialogOpen(false);
      setForm({ cliente_id: "", descricao: "", valor_total: "", validade: "", observacoes: "" });
    } catch {}
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateMutation.mutateAsync({ id, values: { status } }); toast.success("Status atualizado!"); } catch {}
  };

  const handleAddItem = async () => {
    if (!itemForm.descricao || !itemForm.valor_unitario) { toast.error("Preencha descrição e valor"); return; }
    const qty = Number(itemForm.quantidade) || 1;
    const unit = Number(itemForm.valor_unitario) || 0;
    try {
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: itemOrcId,
        descricao: itemForm.descricao,
        quantidade: qty,
        valor_unitario: unit,
        valor_total: qty * unit,
        largura: Number(itemForm.largura) || null,
        altura: Number(itemForm.altura) || null,
        produto_id: itemForm.produto_id || null,
      });
      if (error) throw error;

      // Recalculate total
      const orcItens = [...allItens.filter((i: any) => i.orcamento_id === itemOrcId), { valor_total: qty * unit }];
      const newTotal = orcItens.reduce((s: number, i: any) => s + Number(i.valor_total), 0);
      await supabase.from("orcamentos").update({ valor_total: newTotal }).eq("id", itemOrcId);

      queryClient.invalidateQueries({ queryKey: ["orcamento_itens"] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Item adicionado!");
      setItemDialogOpen(false);
      setItemForm({ descricao: "", quantidade: "1", valor_unitario: "", largura: "", altura: "", produto_id: "" });
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const item = allItens.find((i: any) => i.id === itemId);
      const { error } = await supabase.from("orcamento_itens").delete().eq("id", itemId);
      if (error) throw error;

      if (item) {
        const remaining = allItens.filter((i: any) => i.orcamento_id === item.orcamento_id && i.id !== itemId);
        const newTotal = remaining.reduce((s: number, i: any) => s + Number(i.valor_total), 0);
        await supabase.from("orcamentos").update({ valor_total: newTotal }).eq("id", item.orcamento_id);
      }

      queryClient.invalidateQueries({ queryKey: ["orcamento_itens"] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Item removido!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  const handleProdutoSelect = (produtoId: string) => {
    const prod = produtos.find((p: any) => p.id === produtoId);
    if (prod) {
      setItemForm({
        ...itemForm,
        produto_id: produtoId,
        descricao: prod.nome,
        largura: String(prod.largura_padrao || ""),
        altura: String(prod.altura_padrao || ""),
        valor_unitario: String(prod.preco || ""),
      });
    }
  };

  const filtered = orcamentos.filter((o: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || o.clientes?.nome?.toLowerCase().includes(term) || String(o.numero).includes(term) || o.descricao?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "todos" || o.status === statusFilter;
    const createdDate = parseISO(o.created_at);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + "T23:59:59"));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const activeFilters = (statusFilter !== "todos" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  // KPIs
  const stats = useMemo(() => {
    const total = orcamentos.length;
    const aprovados = orcamentos.filter((o: any) => o.status === "aprovado").length;
    const enviados = orcamentos.filter((o: any) => o.status === "enviado").length;
    const rascunhos = orcamentos.filter((o: any) => o.status === "rascunho").length;
    const rejeitados = orcamentos.filter((o: any) => o.status === "rejeitado").length;
    const valorTotal = orcamentos.reduce((s: number, o: any) => s + (Number(o.valor_total) || 0), 0);
    const valorAprovado = orcamentos.filter((o: any) => o.status === "aprovado").reduce((s: number, o: any) => s + (Number(o.valor_total) || 0), 0);
    const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 0;
    return { total, aprovados, enviados, rascunhos, rejeitados, valorTotal, valorAprovado, taxaAprovacao };
  }, [orcamentos]);

  const handleExportPDF = (orc: any) => {
    const itensOrc = allItens.filter((i: any) => i.orcamento_id === orc.id);
    exportOrcamentoPDF(orc, itensOrc);
    toast.success("PDF gerado com sucesso!");
  };

  // Smart configurator handler
  const handleSmartAdd = async (item: ConfiguredItem) => {
    if (!configOrcId) return;
    try {
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: configOrcId,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        largura: item.largura,
        altura: item.altura,
        produto_id: item.produto_id,
        custo_aluminio: item.custo_aluminio,
        custo_vidro: item.custo_vidro,
        custo_ferragem: item.custo_ferragem,
        custo_acessorios: item.custo_acessorios,
        custo_mao_obra: item.custo_mao_obra,
        custo_total: item.custo_total,
        markup_percentual: item.markup_percentual,
        lucro: item.lucro,
        tipo_vidro: item.tipo_vidro,
        peso_total_kg: item.peso_total_kg,
        area_vidro_m2: item.area_vidro_m2,
      } as any);
      if (error) throw error;

      // Recalculate total
      const orcItens = [...allItens.filter((i: any) => i.orcamento_id === configOrcId), { valor_total: item.valor_total }];
      const newTotal = orcItens.reduce((s: number, i: any) => s + Number(i.valor_total), 0);
      await supabase.from("orcamentos").update({ valor_total: newTotal }).eq("id", configOrcId);

      queryClient.invalidateQueries({ queryKey: ["orcamento_itens"] });
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Item calculado e adicionado ao orçamento!");
      setConfigDialogOpen(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  // Converter to pedido
  const handleConverterPedido = async (orc: any) => {
    try {
      const { error } = await supabase.from("pedidos").insert({
        cliente_id: orc.cliente_id,
        orcamento_id: orc.id,
        valor_total: Number(orc.valor_total) || 0,
        observacoes: `Convertido do orçamento ORC-${String(orc.numero).padStart(3, "0")}`,
        created_by: user?.id,
      });
      if (error) throw error;
      await handleStatusChange(orc.id, "aprovado");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Orçamento convertido em pedido com sucesso!");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Orçamentos</h1><p className="text-sm text-muted-foreground">{orcamentos.length} orçamentos</p></div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo orçamento</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
            { label: "Rascunhos", value: stats.rascunhos, icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
            { label: "Enviados", value: stats.enviados, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "Aprovados", value: stats.aprovados, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Rejeitados", value: stats.rejeitados, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Taxa aprov.", value: `${stats.taxaAprovacao}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Valor total", value: fmt(stats.valorTotal), icon: DollarSign, color: "text-primary", bg: "bg-primary/10", small: true },
            { label: "Valor aprov.", value: fmt(stats.valorAprovado), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", small: true },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{kpi.label}</span>
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", kpi.bg)}>
                    <Icon className={cn("h-3 w-3", kpi.color)} />
                  </div>
                </div>
                <p className={cn("font-bold text-foreground", kpi.small ? "text-xs" : "text-lg")}>{kpi.value}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar orçamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-end gap-3 flex-wrap bg-card border border-border rounded-xl p-4">
            <div><Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem><SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem><SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent></Select></div>
            <div><Label className="text-xs">Data de</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <div><Label className="text-xs">Data até</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("todos"); setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum orçamento encontrado.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((orc: any) => {
              const isExpanded = expandedOrc === orc.id;
              const itensOrc = allItens.filter((i: any) => i.orcamento_id === orc.id);
              const totalM2 = itensOrc.reduce((s: number, i: any) => {
                if (i.largura && i.altura) return s + ((i.largura / 1000) * (i.altura / 1000) * i.quantidade);
                return s;
              }, 0);

              return (
                <div key={orc.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrc(isExpanded ? null : orc.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-bold text-primary">ORC-{String(orc.numero).padStart(3, "0")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{orc.clientes?.nome || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(orc.created_at), "dd/MM/yyyy")}
                          {orc.descricao && ` · ${orc.descricao}`}
                          {itensOrc.length > 0 && ` · ${itensOrc.length} itens`}
                          {totalM2 > 0 && ` · ${totalM2.toFixed(2)} m²`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">{fmt(Number(orc.valor_total) || 0)}</span>
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border", statusColor[orc.status] || statusColor.rascunho)}>
                        {statusLabel[orc.status] || orc.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Actions bar */}
                      <div className="flex items-center gap-2 px-5 py-3 bg-muted/20 border-b border-border flex-wrap">
                        <Select value={orc.status} onValueChange={(v) => handleStatusChange(orc.id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="enviado">Enviado</SelectItem>
                            <SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem>
                            <SelectItem value="expirado">Expirado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setConfigOrcId(orc.id); setConfigDialogOpen(true); }}>
                          <Calculator className="h-3 w-3" /> Calcular item
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { setItemOrcId(orc.id); setItemDialogOpen(true); }}>
                          <Plus className="h-3 w-3" /> Item manual
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => handleExportPDF(orc)}>
                          <Download className="h-3 w-3" /> PDF
                        </Button>
                        {orc.status !== "aprovado" && itensOrc.length > 0 && (
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleConverterPedido(orc)}>
                            <ShoppingCart className="h-3 w-3" /> Converter em pedido
                          </Button>
                        )}
                        {orc.clientes && (
                          <div className="ml-auto text-[10px] text-muted-foreground">
                            {orc.clientes.telefone && <span>{orc.clientes.telefone}</span>}
                            {orc.clientes.cidade && <span> · {orc.clientes.cidade}/{orc.clientes.estado}</span>}
                          </div>
                        )}
                      </div>

                      {/* Items detail */}
                      <div className="p-5">
                        {itensOrc.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">Nenhum item adicionado</p>
                            <Button size="sm" className="mt-3 gap-1.5"
                              onClick={() => { setConfigOrcId(orc.id); setConfigDialogOpen(true); }}>
                              <Calculator className="h-3.5 w-3.5" /> Calcular primeiro item
                            </Button>
                          </div>
                        ) : (
                          <OrcamentoDetail orcamento={orc} itens={itensOrc} onDeleteItem={handleDeleteItem} />
                        )}
                      </div>

                      {/* Observações */}
                      {orc.observacoes && (
                        <div className="px-5 pb-4">
                          <p className="text-[10px] text-muted-foreground"><strong>Observações:</strong> {orc.observacoes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Novo Orçamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle><DialogDescription>Crie um novo orçamento para um cliente.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" placeholder="Ex: Janela de correr 2 folhas" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Total</Label><Input type="number" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} className="mt-1" placeholder="0,00" /></div>
              <div><Label>Validade</Label><Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Criar orçamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Item */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Item ao Orçamento</DialogTitle><DialogDescription>Adicione um produto ou item personalizado.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Produto (opcional)</Label>
              <Select value={itemForm.produto_id} onValueChange={handleProdutoSelect}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.filter((p: any) => p.ativo !== false).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {p.tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição <span className="text-destructive">*</span></Label>
              <Input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} className="mt-1" placeholder="Ex: Janela de correr 2 folhas Suprema" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Largura (mm)</Label>
                <Input type="number" value={itemForm.largura} onChange={(e) => setItemForm({ ...itemForm, largura: e.target.value })} className="mt-1" placeholder="1200" />
              </div>
              <div>
                <Label>Altura (mm)</Label>
                <Input type="number" value={itemForm.altura} onChange={(e) => setItemForm({ ...itemForm, altura: e.target.value })} className="mt-1" placeholder="1000" />
              </div>
            </div>
            {itemForm.largura && itemForm.altura && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs">
                <span className="text-muted-foreground">Área do vidro: </span>
                <span className="font-semibold text-blue-600">
                  {((Number(itemForm.largura) / 1000) * (Number(itemForm.altura) / 1000)).toFixed(3)} m²
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input type="number" value={itemForm.quantidade} onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })} className="mt-1" min="1" />
              </div>
              <div>
                <Label>Valor unitário (R$) <span className="text-destructive">*</span></Label>
                <Input type="number" value={itemForm.valor_unitario} onChange={(e) => setItemForm({ ...itemForm, valor_unitario: e.target.value })} className="mt-1" placeholder="0,00" />
              </div>
            </div>
            {itemForm.quantidade && itemForm.valor_unitario && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
                <span className="text-muted-foreground">Subtotal: </span>
                <span className="font-bold text-primary">
                  {fmt(Number(itemForm.quantidade) * Number(itemForm.valor_unitario))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddItem}>Adicionar item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Configurator */}
      <ItemConfigurator
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onConfirm={handleSmartAdd}
      />
    </AppLayout>
  );
};

export default Orcamentos;
