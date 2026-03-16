import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, RotateCcw, DollarSign, FileText, Printer, Clock, Search, Plus, Filter, Download } from "lucide-react";
import { exportPedidoPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { differenceInDays, parseISO, format, isAfter, isBefore } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, XCircle, Package, Truck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;
type PedidoWithCliente = Pedido & {
  clientes: { nome: string; endereco: string | null; telefone: string | null; cidade: string | null; estado: string | null; cep: string | null } | null;
};

const actionButtons = (pedido: PedidoWithCliente) => [
  { icon: RotateCcw, label: "Reagendar", action: () => {} },
  { icon: DollarSign, label: "Pagamentos", action: () => {} },
  { icon: FileText, label: "Contrato", action: () => {} },
  { icon: Download, label: "PDF", action: () => { exportPedidoPDF(pedido); } },
];

const statusLabels: Record<string, string> = {
  pendente: "PENDENTE",
  em_producao: "EM PRODUÇÃO",
  pronto: "PRONTO",
  entregue: "ENTREGUE",
  cancelado: "CANCELADO",
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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
    } catch {}
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, values: { status: newStatus } });
      toast.success("Status atualizado!");
    } catch {}
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

  const getDaysInfo = (dataEntrega: string | null) => {
    if (!dataEntrega) return { label: "", overdue: false };
    const diff = differenceInDays(parseISO(dataEntrega), new Date());
    if (diff < 0) return { label: `Atrasado ${Math.abs(diff)} dias`, overdue: true };
    if (diff === 0) return { label: "Hoje", overdue: false };
    return { label: `Faltam ${diff} dias`, overdue: false };
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const activeFilters = (statusFilter !== "todos" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const stats = useMemo(() => {
    const total = pedidos.length;
    const pendentes = pedidos.filter((p) => p.status === "pendente").length;
    const emProducao = pedidos.filter((p) => p.status === "em_producao").length;
    const prontos = pedidos.filter((p) => p.status === "pronto").length;
    const entregues = pedidos.filter((p) => p.status === "entregue").length;
    const cancelados = pedidos.filter((p) => p.status === "cancelado").length;
    const valorTotal = pedidos.reduce((s: number, p) => s + (Number(p.valor_total) || 0), 0);
    const valorEntregue = pedidos.filter((p) => p.status === "entregue").reduce((s: number, p) => s + (Number(p.valor_total) || 0), 0);
    const taxaEntrega = total > 0 ? Math.round((entregues / total) * 100) : 0;
    const atrasados = pedidos.filter((p) => p.data_entrega && p.status !== "entregue" && p.status !== "cancelado" && differenceInDays(parseISO(p.data_entrega), new Date()) < 0).length;
    return { total, pendentes, emProducao, prontos, entregues, cancelados, valorTotal, valorEntregue, taxaEntrega, atrasados };
  }, [pedidos]);

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Pedidos</h1><p className="text-sm text-muted-foreground">{pedidos.length} pedidos</p></div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo pedido</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
            { label: "Pendentes", value: stats.pendentes, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Em Produção", value: stats.emProducao, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "Prontos", value: stats.prontos, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Entregues", value: stats.entregues, icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Cancelados", value: stats.cancelados, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Atrasados", value: stats.atrasados, icon: Clock, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Taxa entrega", value: `${stats.taxaEntrega}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Valor total", value: fmt(stats.valorTotal), icon: DollarSign, color: "text-primary", bg: "bg-primary/10", small: true },
            { label: "Valor entregue", value: fmt(stats.valorEntregue), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", small: true },
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
            <input type="text" placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-end gap-3 flex-wrap bg-card border border-border rounded-xl p-4">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_producao">Em Produção</SelectItem>
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
              <Label className="text-xs">Data até</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("todos"); setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filteredPedidos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum pedido encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPedidos.map((pedido) => {
              const days = getDaysInfo(pedido.data_entrega);
              const cliente = pedido.clientes;
              return (
                <div key={pedido.id} className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
                  <div className="p-4 pb-2 space-y-2">
                    <h3 className="text-base font-bold text-foreground">PEDIDO #{pedido.numero}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-start gap-1.5"><User className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span className="font-medium text-foreground">{cliente?.nome || "Sem cliente"}</span></div>
                      {cliente?.endereco && <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{cliente.endereco}{cliente.cidade ? `, ${cliente.cidade}` : ""}{cliente.estado ? ` - ${cliente.estado}` : ""}</span></div>}
                      {cliente?.telefone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{cliente.telefone}</span></div>}
                    </div>
                    <div className="text-xs space-y-0.5">
                      {pedido.vendedor && <p className="text-muted-foreground"><span className="font-medium text-foreground">Vendedor:</span> {pedido.vendedor}</p>}
                      <div className="flex items-center justify-between">
                        {pedido.data_entrega && <p className="text-muted-foreground"><span className="font-medium text-foreground">Previsão:</span> {format(parseISO(pedido.data_entrega), "dd/MM/yyyy")}</p>}
                        {days.label && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${days.overdue ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"}`}>{days.label}</span>}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={`text-lg font-bold ${days.overdue ? "text-destructive" : "text-primary"}`}>{fmt(Number(pedido.valor_total) || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">{format(parseISO(pedido.created_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>
                  {pedido.status && (
                    <div className="px-4 py-2 border-t border-border">
                      <p className="text-xs font-bold text-foreground">{statusLabels[pedido.status] || pedido.status}</p>
                      {pedido.observacoes && <p className="text-[10px] text-muted-foreground mt-0.5">{pedido.observacoes}</p>}
                    </div>
                  )}
                  <div className="px-4 py-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      {actionButtons(pedido).map((btn) => (
                        <button key={btn.label} onClick={btn.action} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                          <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><btn.icon className="h-4 w-4" /></div>
                          <span className="text-[10px]">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 p-4 pt-0 mt-auto">
                    {pedido.status !== "cancelado" && <button onClick={() => handleStatusChange(pedido.id, "cancelado")} className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>}
                    {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                      <button onClick={() => handleStatusChange(pedido.id, pedido.status === "pendente" ? "em_producao" : pedido.status === "em_producao" ? "pronto" : "entregue")}
                        className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        {pedido.status === "pendente" ? "Iniciar produção" : pedido.status === "em_producao" ? "Marcar pronto" : "Concluir pedido"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" /></div>
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
