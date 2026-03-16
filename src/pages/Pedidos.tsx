import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, DollarSign, Search, Plus, Filter, Download, Clock, Eye, ChevronRight, LayoutGrid, List } from "lucide-react";
import { exportPedidoPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { differenceInDays, parseISO, format, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, XCircle, Package, Truck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;
type PedidoWithCliente = Pedido & {
  clientes: { nome: string; endereco: string | null; telefone: string | null; cidade: string | null; estado: string | null; cep: string | null } | null;
};

const KANBAN_COLUMNS = [
  { key: "pendente", label: "Novo", color: "bg-amber-500", lightBg: "bg-amber-500/15 border-amber-500/30" },
  { key: "em_producao", label: "Producao", color: "bg-blue-500", lightBg: "bg-blue-500/15 border-blue-500/30" },
  { key: "pronto", label: "Pronto", color: "bg-emerald-500", lightBg: "bg-emerald-500/15 border-emerald-500/30" },
  { key: "entregue", label: "Entregue", color: "bg-green-600", lightBg: "bg-green-500/15 border-green-500/30" },
  { key: "cancelado", label: "Cancelado", color: "bg-red-500", lightBg: "bg-red-500/15 border-red-500/30" },
];

const nextStatus: Record<string, string | null> = {
  pendente: "em_producao",
  em_producao: "pronto",
  pronto: "entregue",
  entregue: null,
  cancelado: null,
};

const Pedidos = () => {
  const { user } = useAuth();
  const { data: pedidos = [], isLoading } = useSupabaseQuery("pedidos", {
    select: "*, clientes(nome, endereco, telefone, cidade, estado, cep)",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("pedidos");
  const updateMutation = useSupabaseUpdate("pedidos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPedido, setDetailPedido] = useState<PedidoWithCliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [form, setForm] = useState({ cliente_id: "", vendedor: "", data_entrega: "", observacoes: "", valor_total: "" });

  const handleSave = async () => {
    if (!form.cliente_id) { toast.error("Selecione um cliente"); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id, vendedor: form.vendedor,
        data_entrega: form.data_entrega || null, observacoes: form.observacoes,
        valor_total: Number(form.valor_total) || 0, created_by: user?.id,
      });
      toast.success("Pedido criado!");
      setDialogOpen(false);
      setForm({ cliente_id: "", vendedor: "", data_entrega: "", observacoes: "", valor_total: "" });
    } catch { /* handled by mutation */ }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, values: { status: newStatus } });
      toast.success("Status atualizado!");
    } catch { /* handled by mutation */ }
  };

  const filteredPedidos = (pedidos as PedidoWithCliente[]).filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || p.clientes?.nome?.toLowerCase().includes(term) || String(p.numero).includes(term) || p.vendedor?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "todos" || p.status === statusFilter;
    const createdDate = parseISO(p.created_at);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + "T23:59:59"));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const getDaysInfo = (dataEntrega: string | null, status: string | null) => {
    if (!dataEntrega || status === "entregue" || status === "cancelado") return { label: "", overdue: false };
    const diff = differenceInDays(parseISO(dataEntrega), new Date());
    if (diff < 0) return { label: `${Math.abs(diff)}d atrasado`, overdue: true };
    if (diff === 0) return { label: "Hoje", overdue: false };
    return { label: `${diff}d restantes`, overdue: false };
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const activeFilters = (statusFilter !== "todos" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const stats = useMemo(() => {
    const total = pedidos.length;
    const emProducao = pedidos.filter((p) => p.status === "em_producao").length;
    const entreguesMes = pedidos.filter((p) => {
      if (p.status !== "entregue") return false;
      const d = new Date();
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      return p.created_at >= inicio;
    }).length;
    const valorTotal = pedidos.reduce((s: number, p) => s + (Number(p.valor_total) || 0), 0);
    return { total, emProducao, entreguesMes, valorTotal };
  }, [pedidos]);

  const pedidosByStatus = useMemo(() => {
    const map: Record<string, PedidoWithCliente[]> = {};
    KANBAN_COLUMNS.forEach((col) => { map[col.key] = []; });
    filteredPedidos.forEach((p) => {
      const s = p.status ?? "pendente";
      if (map[s]) map[s].push(p);
    });
    return map;
  }, [filteredPedidos]);

  return (
    <AppLayout>
      <div className="space-y-4 max-w-[1400px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">{pedidos.length} pedidos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center glass-card-premium rounded-lg p-0.5">
              <button onClick={() => setViewMode("kanban")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo pedido</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pedidos", value: String(stats.total), icon: Package, color: "text-primary", bg: "bg-primary/10" },
            { label: "Em Producao", value: String(stats.emProducao), icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Entregues este mes", value: String(stats.entreguesMes), icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Valor Total", value: fmt(stats.valorTotal), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="glass-card-premium p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{kpi.label}</span>
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", kpi.bg)}>
                    <Icon className={cn("h-3 w-3", kpi.color)} />
                  </div>
                </div>
                <p className="font-bold text-foreground text-lg">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm glass-card-premium rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-end gap-3 flex-wrap glass-card-premium p-4">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_producao">Em Producao</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data de</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 w-40" />
            </div>
            <div>
              <Label className="text-xs">Data ate</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("todos"); setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : viewMode === "kanban" ? (
          /* KANBAN VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {KANBAN_COLUMNS.map((col) => {
              const items = pedidosByStatus[col.key] || [];
              return (
                <div key={col.key} className="space-y-2">
                  <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border", col.lightBg)}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", col.color)} />
                      <span className="text-xs font-bold text-foreground">{col.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {items.map((pedido) => {
                      const days = getDaysInfo(pedido.data_entrega, pedido.status);
                      const next = nextStatus[pedido.status ?? "pendente"];
                      return (
                        <div key={pedido.id} className="glass-card-premium rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-bold text-primary">#{pedido.numero}</span>
                            {days.label && (
                              <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", days.overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                                {days.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{pedido.clientes?.nome || "Sem cliente"}</p>
                          <p className="text-xs font-bold text-foreground mt-1">{fmt(Number(pedido.valor_total) || 0)}</p>
                          {pedido.data_entrega && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {format(parseISO(pedido.data_entrega), "dd/MM/yyyy")}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                            <button onClick={() => setDetailPedido(pedido)} className="flex-1 py-1 text-[10px] font-medium rounded border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1">
                              <Eye className="h-3 w-3" /> Detalhes
                            </button>
                            {next && (
                              <button onClick={() => handleStatusChange(pedido.id, next)} className="flex-1 py-1 text-[10px] font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
                                <ChevronRight className="h-3 w-3" /> Avancar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="glass-card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Entrega</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPedidos.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
                  ) : (
                    filteredPedidos.map((pedido) => {
                      const days = getDaysInfo(pedido.data_entrega, pedido.status);
                      const colDef = KANBAN_COLUMNS.find((c) => c.key === pedido.status);
                      const next = nextStatus[pedido.status ?? "pendente"];
                      return (
                        <tr key={pedido.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-primary">#{pedido.numero}</td>
                          <td className="p-3 text-foreground">{pedido.clientes?.nome || "Sem cliente"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full", colDef?.color || "bg-gray-400")} />
                              <span className="text-xs font-medium">{colDef?.label || pedido.status}</span>
                              {days.overdue && <span className="text-[9px] text-destructive font-bold">ATRASADO</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold">{fmt(Number(pedido.valor_total) || 0)}</td>
                          <td className="p-3 text-muted-foreground text-xs">{pedido.data_entrega ? format(parseISO(pedido.data_entrega), "dd/MM/yyyy") : "-"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setDetailPedido(pedido)} className="p-1.5 rounded hover:bg-muted transition-colors"><Eye className="h-3.5 w-3.5 text-muted-foreground" /></button>
                              <button onClick={() => exportPedidoPDF(pedido)} className="p-1.5 rounded hover:bg-muted transition-colors"><Download className="h-3.5 w-3.5 text-muted-foreground" /></button>
                              {next && (
                                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleStatusChange(pedido.id, next)}>
                                  Avancar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailPedido} onOpenChange={(open) => { if (!open) setDetailPedido(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{detailPedido?.numero}</DialogTitle>
            <DialogDescription>Detalhes completos do pedido</DialogDescription>
          </DialogHeader>
          {detailPedido && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Cliente</p>
                  <p className="text-sm font-bold text-foreground">{detailPedido.clientes?.nome || "Sem cliente"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Valor</p>
                  <p className="text-sm font-bold text-primary">{fmt(Number(detailPedido.valor_total) || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Status</p>
                  <Badge variant="outline" className="text-xs mt-0.5">{detailPedido.status}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Vendedor</p>
                  <p className="text-sm text-foreground">{detailPedido.vendedor || "-"}</p>
                </div>
              </div>
              {detailPedido.clientes?.endereco && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{detailPedido.clientes.endereco}{detailPedido.clientes.cidade ? `, ${detailPedido.clientes.cidade}` : ""}{detailPedido.clientes.estado ? ` - ${detailPedido.clientes.estado}` : ""}</span>
                </div>
              )}
              {detailPedido.clientes?.telefone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" /><span>{detailPedido.clientes.telefone}</span>
                </div>
              )}
              {detailPedido.observacoes && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Observacoes</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{detailPedido.observacoes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">Criado em</p>
                  <p>{format(parseISO(detailPedido.created_at), "dd/MM/yyyy HH:mm")}</p>
                </div>
                {detailPedido.data_entrega && (
                  <div>
                    <p className="font-medium">Previsao de entrega</p>
                    <p>{format(parseISO(detailPedido.data_entrega), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => exportPedidoPDF(detailPedido)}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
                {detailPedido.status !== "cancelado" && detailPedido.status !== "entregue" && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { handleStatusChange(detailPedido.id, "cancelado"); setDetailPedido(null); }}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                    {nextStatus[detailPedido.status ?? "pendente"] && (
                      <Button size="sm" className="flex-1" onClick={() => { handleStatusChange(detailPedido.id, nextStatus[detailPedido.status ?? "pendente"]!); setDetailPedido(null); }}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Avancar
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pedido</DialogTitle><DialogDescription>Crie um novo pedido vinculado a um cliente.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>{(clientes as Tables<"clientes">[]).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Vendedor</Label><Input value={form.vendedor} onChange={(e) => setForm({ ...form, vendedor: e.target.value })} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data de Entrega</Label><Input type="date" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} className="mt-1" /></div>
              <div><Label>Valor Total</Label><Input type="number" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} className="mt-1" placeholder="0,00" /></div>
            </div>
            <div><Label>Observacoes</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Criar pedido"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Pedidos;
